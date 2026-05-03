import { createClient } from '@/lib/supabase-server'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select(`
      id,
      cliente_id,
      nombre,
      telefono,
      email,
      created_at,
      vehiculos (
        id,
        marca,
        modelo,
        anio
      ),
      ordenes (
        id,
        estado,
        total_cobrado,
        created_at,
        orden_servicios (
          id,
          nombre_servicio,
          precio_cobrado
        )
      )
    `)
    .order('created_at', { ascending: false })

  return <ClientesClient clientes={clientes ?? []} />
}
