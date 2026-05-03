import { createClient } from '@/lib/supabase-server'
import ReportesClient from './ReportesClient'

export default async function ReportesPage() {
  const supabase = await createClient()

  const now  = new Date()
  const y    = now.getFullYear()
  const m    = now.getMonth()

  const inicioMesActual   = new Date(y, m, 1).toISOString()
  const inicioMesAnterior = new Date(y, m - 1, 1).toISOString()
  const finMesAnterior    = new Date(y, m, 1).toISOString()
  const inicio90dias      = new Date(y, m - 2, 1).toISOString()

  const [
    { data: ordenesMes },
    { data: ordenesAnt },
    { data: ordenes90 },
    { data: topServicios },
    { data: porCategoria },
    { data: topClientes },
  ] = await Promise.all([
    // Órdenes mes actual — incluye cliente_id para contar únicos
    supabase
      .from('ordenes')
      .select('id, total_cobrado, total_base, descuento, created_at, estado, cliente_id')
      .gte('created_at', inicioMesActual)
      .order('created_at', { ascending: true }),

    // Órdenes mes anterior — incluye cliente_id para comparar únicos
    supabase
      .from('ordenes')
      .select('id, total_cobrado, descuento, cliente_id')
      .gte('created_at', inicioMesAnterior)
      .lt('created_at', finMesAnterior),

    // Órdenes últimos 3 meses
    supabase
      .from('ordenes')
      .select('id, total_cobrado, created_at')
      .gte('created_at', inicio90dias)
      .order('created_at', { ascending: true }),

    // Top servicios — incluye categoría para colorear barras
    supabase
      .from('orden_servicios')
      .select('nombre_servicio, precio_cobrado, catalogo_servicios(categoria_id, categorias(nombre)), ordenes!inner(created_at)')
      .gte('ordenes.created_at', inicioMesActual),

    // Distribución por categoría
    supabase
      .from('orden_servicios')
      .select('precio_cobrado, catalogo_servicios(categoria_id, categorias(nombre)), ordenes!inner(created_at)')
      .gte('ordenes.created_at', inicioMesActual),

    // Top 5 clientes del mes por ingreso
    supabase
      .from('ordenes')
      .select('total_cobrado, cliente_id, clientes(nombre, cliente_id)')
      .gte('created_at', inicioMesActual),
  ])

  return (
    <ReportesClient
      ordenesMes={ordenesMes ?? []}
      ordenesAnt={ordenesAnt ?? []}
      ordenes90={ordenes90 ?? []}
      topServicios={topServicios ?? []}
      porCategoria={porCategoria ?? []}
      topClientesRaw={topClientes ?? []}
      mesLabel={now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
      mesAntLabel={new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
    />
  )
}
