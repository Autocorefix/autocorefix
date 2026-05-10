import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import BillingClient from './BillingClient'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!usuario?.tenant_id) redirect('/onboarding')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_end, current_period_end, plan_type, stripe_customer_id')
    .eq('tenant_id', usuario.tenant_id)
    .maybeSingle()

  return (
    <BillingClient
      subscription={sub ?? null}
      isAdmin={usuario.rol === 'admin'}
      success={params.success === 'true'}
    />
  )
}
