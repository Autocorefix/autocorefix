import { createClient } from '@/lib/supabase-server'
import ReportesClient from './ReportesClient'

export default async function ReportesPage() {
  const supabase = await createClient()

  const now   = new Date()
  const y     = now.getFullYear()
  const m     = now.getMonth()

  const inicioMesActual  = new Date(y, m, 1).toISOString()
  const inicioMesAnterior = new Date(y, m - 1, 1).toISOString()
  const finMesAnterior   = new Date(y, m, 1).toISOString()
  const inicio90dias     = new Date(y, m - 2, 1).toISOString()

  const [
    { data: ordenesMes },
    { data: ordenesAnt },
    { data: ordenes90 },
    { data: topServicios },
    { data: porCategoria },
  ] = await Promise.all([
    // Órdenes del mes actual (con fecha diaria para gráfica)
    supabase
      .from('ordenes')
      .select('id, total_cobrado, total_base, descuento, created_at, estado')
      .gte('created_at', inicioMesActual)
      .order('created_at', { ascending: true }),

    // Órdenes del mes anterior (para comparativa)
    supabase
      .from('ordenes')
      .select('id, total_cobrado, descuento')
      .gte('created_at', inicioMesAnterior)
      .lt('created_at', finMesAnterior),

    // Órdenes últimos 3 meses (para gráfica de tendencia)
    supabase
      .from('ordenes')
      .select('id, total_cobrado, created_at')
      .gte('created_at', inicio90dias)
      .order('created_at', { ascending: true }),

    // Top servicios del mes actual
    supabase
      .from('orden_servicios')
      .select('nombre_servicio, precio_cobrado, ordenes!inner(created_at)')
      .gte('ordenes.created_at', inicioMesActual),

    // Distribución por categoría del mes actual
    supabase
      .from('orden_servicios')
      .select('precio_cobrado, catalogo_servicios(categoria_id, categorias(nombre)), ordenes!inner(created_at)')
      .gte('ordenes.created_at', inicioMesActual),
  ])

  return (
    <ReportesClient
      ordenesMes={ordenesMes ?? []}
      ordenesAnt={ordenesAnt ?? []}
      ordenes90={ordenes90 ?? []}
      topServicios={topServicios ?? []}
      porCategoria={porCategoria ?? []}
      mesLabel={now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
      mesAntLabel={new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
    />
  )
}
