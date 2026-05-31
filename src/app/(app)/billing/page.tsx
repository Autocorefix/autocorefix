import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import BillingClient from './BillingClient'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params  = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!usuario?.tenant_id) redirect('/onboarding')

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: sub }, { data: tenant }, { data: solicitudes }] = await Promise.all([
    adminClient
      .from('subscriptions')
      .select('status, trial_end, current_period_end, plan_type, stripe_customer_id')
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle(),
    adminClient
      .from('tenants')
      .select('nombre, rfc, razon_social, codigo_postal, regimen_fiscal, uso_cfdi, email_facturacion')
      .eq('id', usuario.tenant_id)
      .maybeSingle(),
    adminClient
      .from('factura_solicitudes')
      .select('id, periodo, monto, estado, created_at, emitida_at')
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <BillingClient
      subscription={sub ?? null}
      isAdmin={usuario.rol === 'admin'}
      success={params.success === 'true'}
      tallerName={tenant?.nombre ?? ''}
      datosFiscales={{
        rfc:               tenant?.rfc               ?? '',
        razon_social:      tenant?.razon_social      ?? '',
        codigo_postal:     tenant?.codigo_postal     ?? '',
        regimen_fiscal:    tenant?.regimen_fiscal    ?? '',
        uso_cfdi:          tenant?.uso_cfdi          ?? 'G03',
        email_facturacion: tenant?.email_facturacion ?? '',
      }}
      solicitudes={solicitudes ?? []}
    />
  )
}
