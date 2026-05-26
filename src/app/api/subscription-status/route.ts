import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ blocked: true })

    // Superadmin nunca bloqueado
    if (user.email === process.env.SUPERADMIN_EMAIL) {
      return NextResponse.json({ blocked: false })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!usuario?.tenant_id) return NextResponse.json({ blocked: false })

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()

    if (!sub) return NextResponse.json({ blocked: false })

    const now = new Date()
    const isActive =
      (sub.status === 'trialing' && sub.trial_end && new Date(sub.trial_end) > now) ||
      (sub.status === 'active' && sub.current_period_end && new Date(sub.current_period_end) > now)

    return NextResponse.json({ blocked: !isActive })
  } catch {
    return NextResponse.json({ blocked: false })
  }
}
