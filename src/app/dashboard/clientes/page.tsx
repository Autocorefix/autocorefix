import { createClient } from '@/lib/supabase-server'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: usuario }] = await Promise.all([
    supabase
      .from('clientes')
      .select(`
        id,
        cliente_id,
        nombre,
        telefono,
        email,
        created_at,
        activo,
        vehiculos (
          id,
          marca,
          modelo,
          anio,
          descripcion
        ),
        ordenes (
          id,
          estado,
          total_cobrado,
          created_at,
          vehiculo_id,
          orden_servicios (
            id,
            nombre_servicio,
            precio_cobrado
          )
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('usuarios')
      .select('tenant_id, rol, tenants(id, nombre, logo_url)')
      .single(),
  ])

  const tenants      = usuario?.tenants as { id: string; nombre: string; logo_url: string | null } | null
  const prefijo      = 'ACF'
  const tenantId     = usuario?.tenant_id ?? ''
  const nombreTaller = tenants?.nombre ?? 'Mi Taller'
  const logoUrl      = (tenants as any)?.logo_url ?? null

  return (
    <ClientesClient
      clientes={(clientes ?? []) as any}
      prefijo={prefijo}
      tenantId={tenantId}
      nombreTaller={nombreTaller}
      logoUrl={logoUrl}
    />
  )
}
