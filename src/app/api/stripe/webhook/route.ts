import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenant_id
      console.log('checkout.session.completed — tenantId:', tenantId, 'subscription:', session.subscription)

      if (!tenantId || !session.customer || !session.subscription) {
        console.warn('Missing required fields, skipping')
        return NextResponse.json({ ok: true })
      }

      const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
      console.log('Subscription retrieved:', sub.id, 'status:', sub.status)

      const { error: upsertError } = await db.from('subscriptions').upsert({
        tenant_id: tenantId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
        plan_type: sub.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly',
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      }, { onConflict: 'tenant_id' })

      if (upsertError) console.error('Upsert error:', upsertError)
      else console.log('Subscription upserted successfully for tenant:', tenantId)
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any
      const tenantId = sub.metadata?.tenant_id
      console.log('subscription.updated — tenantId:', tenantId, 'status:', sub.status)
      if (!tenantId) return NextResponse.json({ ok: true })

      await db.from('subscriptions').update({
        status: sub.status,
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        plan_type: sub.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      }).eq('tenant_id', tenantId)
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata?.tenant_id
      if (tenantId) await db.from('subscriptions').update({ status: 'canceled' }).eq('tenant_id', tenantId)
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any
      if (!invoice.subscription) return NextResponse.json({ ok: true })
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
      const tenantId = sub.metadata?.tenant_id
      if (tenantId) await db.from('subscriptions').update({ status: 'past_due' }).eq('tenant_id', tenantId)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
