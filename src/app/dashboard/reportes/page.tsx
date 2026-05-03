import { createClient } from '@/lib/supabase-server'
import ReportesClient from './ReportesClient'

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const supabase = await createClient()
  const params   = await searchParams

  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()

  // Rango seleccionado (default: mes actual)
  const desdeStr = params.desde ?? new Date(y, m, 1).toISOString().split('T')[0]
  const hastaStr = params.hasta ?? new Date(y, m + 1, 0).toISOString().split('T')[0]

  const inicioActual = new Date(desdeStr + 'T00:00:00').toISOString()
  const finActual    = new Date(hastaStr + 'T23:59:59').toISOString()

  // Período anterior equivalente (misma duración)
  const duracionMs = new Date(finActual).getTime() - new Date(inicioActual).getTime()
  const inicioAnt  = new Date(new Date(inicioActual).getTime() - duracionMs - 1000).toISOString()
  const finAnt     = new Date(new Date(inicioActual).getTime() - 1000).toISOString()

  // Tendencia: siempre 90 días hacia atrás desde hoy
  const inicio90dias = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: ordenesMes },
    { data: ordenesAnt },
    { data: ordenes90 },
    { data: topServicios },
    { data: porCategoria },
    { data: topClientes },
  ] = await Promise.all([
    supabase
      .from('ordenes')
      .select('id, total_cobrado, total_base, descuento, created_at, estado, cliente_id, clientes(nombre)')
      .gte('created_at', inicioActual)
      .lte('created_at', finActual)
      .order('created_at', { ascending: true }),

    supabase
      .from('ordenes')
      .select('id, total_cobrado, descuento, cliente_id')
      .gte('created_at', inicioAnt)
      .lte('created_at', finAnt),

    supabase
      .from('ordenes')
      .select('id, total_cobrado, created_at')
      .gte('created_at', inicio90dias)
      .order('created_at', { ascending: true }),

    supabase
      .from('orden_servicios')
      .select('nombre_servicio, precio_cobrado, catalogo_servicios(categoria_id, categorias(nombre)), ordenes!inner(created_at)')
      .gte('ordenes.created_at', inicioActual)
      .lte('ordenes.created_at', finActual),

    supabase
      .from('orden_servicios')
      .select('precio_cobrado, catalogo_servicios(categoria_id, categorias(nombre)), ordenes!inner(created_at)')
      .gte('ordenes.created_at', inicioActual)
      .lte('ordenes.created_at', finActual),

    supabase
      .from('ordenes')
      .select('total_cobrado, cliente_id, clientes(nombre, cliente_id)')
      .gte('created_at', inicioActual)
      .lte('created_at', finActual),
  ])

  // Labels
  const fmt = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const mesLabel    = desdeStr === hastaStr ? fmt(desdeStr) : `${fmt(desdeStr)} – ${fmt(hastaStr)}`
  const mesAntLabel = `${fmt(inicioAnt.split('T')[0])} – ${fmt(finAnt.split('T')[0])}`

  return (
    <ReportesClient
      ordenesMes={ordenesMes ?? []}
      ordenesAnt={ordenesAnt ?? []}
      ordenes90={ordenes90 ?? []}
      topServicios={topServicios ?? []}
      porCategoria={porCategoria ?? []}
      topClientesRaw={topClientes ?? []}
      mesLabel={mesLabel}
      mesAntLabel={mesAntLabel}
      desde={desdeStr}
      hasta={hastaStr}
    />
  )
}
