import { createClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: ordenes } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      total_cobrado,
      created_at,
      clientes ( nombre ),
      vehiculos ( marca, modelo, anio ),
      orden_servicios ( id )
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return <DashboardClient ordenes={ordenes ?? []} todayLabel={todayLabel} />
}