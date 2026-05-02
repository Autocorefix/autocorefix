import { createClient } from '@/lib/supabase-server'
import NuevaOrdenClient, { type ServicioOrden } from './NuevaOrdenClient'

export default async function NuevaOrdenPage() {
  const supabase = await createClient()

  const [{ data: servicios }, { data: usuario }] = await Promise.all([
    supabase
      .from('catalogo_servicios')
      .select('id, nombre, precio_base, categoria_id, categorias(id, nombre, is_system_default, orden)')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('usuarios')
      .select('tenant_id, tenants(prefijo)')
      .single(),
  ])

  const tenants = usuario?.tenants as { prefijo: string } | null
  const prefijo = tenants?.prefijo ?? 'ACF'
  const tenantId = usuario?.tenant_id ?? ''

  return (
    <NuevaOrdenClient
      servicios={(servicios ?? []) as ServicioOrden[]}
      tenantId={tenantId}
      prefijo={prefijo}
    />
  )
}
