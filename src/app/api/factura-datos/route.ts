import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!usuario?.tenant_id || usuario.rol !== 'admin')
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { rfc, razon_social, codigo_postal, regimen_fiscal, uso_cfdi, email_facturacion } = body

  if (!rfc || !razon_social || !codigo_postal || !regimen_fiscal || !uso_cfdi || !email_facturacion)
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('tenants')
    .update({ rfc, razon_social, codigo_postal, regimen_fiscal, uso_cfdi, email_facturacion })
    .eq('id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
