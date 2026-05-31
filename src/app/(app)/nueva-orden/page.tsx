import { createClient } from '@/lib/supabase-server'
import NuevaOrdenClient, { type ServicioOrden } from './NuevaOrdenClient'

export type TrabajadorOption = { id: string; nombre: string; especialidad: string | null }

export default async function NuevaOrdenPage() {
  const supabase = await createClient()

  const [{ data: servicios }, { data: usuario }, { data: trabajadoresRaw }] = await Promise.all([
    supabase
      .from('catalogo_servicios')
      .select('id, nombre, precio_base, categoria_id, categorias(id, nombre, is_system_default, orden)')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('usuarios')
      .select('tenant_id, tenants(prefijo)')
      .single(),
    (supabase as any)
      .from('trabajadores')
      .select('id, nombre, especialidad')
      .eq('activo', true)
      .order('nombre'),
  ])

  const tenants     = usuario?.tenants as { prefijo: string } | null
  const prefijo     = tenants?.prefijo ?? 'ACF'
  const tenantId    = usuario?.tenant_id ?? ''
  const trabajadores: TrabajadorOption[] = trabajadoresRaw ?? []

  return (
    <NuevaOrdenClient
      servicios={(servicios ?? []) as ServicioOrden[]}
      tenantId={tenantId}
      prefijo={prefijo}
      trabajadores={trabajadores}
    />
  )
}
