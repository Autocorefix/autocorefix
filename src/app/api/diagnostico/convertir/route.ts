import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { diagnosticoId } = await request.json()
  if (!diagnosticoId) return NextResponse.json({ error: 'Falta diagnosticoId' }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Leer el diagnóstico
  const { data: diag, error: e1 } = await (admin as any)
    .from('diagnosticos')
    .select('*')
    .eq('id', diagnosticoId)
    .single()

  if (e1 || !diag) return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })

  const totalBase = (diag.servicios ?? []).reduce((s: number, x: any) => s + x.precio, 0)
    + (diag.piezas ?? []).reduce((s: number, p: any) => s + p.cantidad * p.precioUnitario, 0)

  // Crear la orden
  const { data: orden, error: e2 } = await (admin as any)
    .from('ordenes')
    .insert({
      tenant_id:    diag.tenant_id,
      cliente_id:   diag.cliente_id,
      vehiculo_id:  diag.vehiculo_id,
      estado:       'recibido',
      total_base:   totalBase,
      total_cobrado: totalBase,
      descuento:    0,
      pct_descuento: 0,
    })
    .select('id')
    .single()

  if (e2 || !orden) return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 })

  // Insertar servicios
  if (diag.servicios?.length > 0) {
    await (admin as any).from('orden_servicios').insert(
      diag.servicios.map((s: any) => ({
        orden_id:        orden.id,
        servicio_id:     null,
        nombre_servicio: s.nombre,
        precio_base:     s.precio,
        precio_cobrado:  s.precio,
      }))
    )
  }

  // Insertar piezas
  if (diag.piezas?.length > 0) {
    await (admin as any).from('orden_piezas').insert(
      diag.piezas.map((p: any) => ({
        orden_id:        orden.id,
        tenant_id:       diag.tenant_id,
        descripcion:     p.descripcion,
        cantidad:        p.cantidad,
        precio_unitario: p.precioUnitario,
      }))
    )
  }

  return NextResponse.json({ ordenId: orden.id })
}
