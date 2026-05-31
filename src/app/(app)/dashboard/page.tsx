import { createClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Midnight in Mexico City timezone (handles DST automatically)
  const now = new Date()
  const mexicoLocalTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
  const offset = now.getTime() - mexicoLocalTime.getTime()
  mexicoLocalTime.setHours(0, 0, 0, 0)
  const today = new Date(mexicoLocalTime.getTime() + offset)

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      total_cobrado,
      created_at,
      clientes ( nombre ),
      vehiculos ( marca, modelo, anio ),
      orden_servicios ( id, nombre_servicio, precio_cobrado )
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return <DashboardClient ordenes={ordenes ?? []} todayLabel={todayLabel} />
}