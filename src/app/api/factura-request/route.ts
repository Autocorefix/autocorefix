import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendFacturaSolicitudEmail } from '@/lib/email'

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
  const { periodo, monto, rfc, razon_social, codigo_postal, regimen_fiscal, uso_cfdi, email_facturacion, nombre_taller } = body

  if (!periodo || !monto || !rfc || !razon_social || !codigo_postal || !regimen_fiscal || !uso_cfdi || !email_facturacion)
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: solicitud, error } = await adminClient
    .from('factura_solicitudes')
    .insert({
      tenant_id: usuario.tenant_id,
      periodo, monto, rfc, razon_social, codigo_postal,
      regimen_fiscal, uso_cfdi, email_facturacion, nombre_taller,
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notificar al dueño de AutoCoreFix
  try {
    await sendFacturaSolicitudEmail({
      solicitudId: solicitud.id,
      tallerName:  nombre_taller ?? 'Sin nombre',
      periodo, monto, rfc, razon_social,
      codigoPostal: codigo_postal,
      regimenFiscal: regimen_fiscal,
      usoCfdi: uso_cfdi,
      emailCliente: email_facturacion,
    })
  } catch {
    // No interrumpir el flujo si el email falla
  }

  return NextResponse.json({ ok: true, id: solicitud.id })
}
