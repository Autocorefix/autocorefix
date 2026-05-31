import { createClient } from '@/lib/supabase-server'
import DiagnosticoClient from './DiagnosticoClient'

export default async function DiagnosticoPage() {
  const supabase = await createClient()

  const [{ data: servicios }, { data: usuario }] = await Promise.all([
    supabase
      .from('catalogo_servicios')
      .select('id, nombre, precio_base, categoria_id, categorias(id, nombre, is_system_default, orden)')
      .eq('activo', true)
      .order('nombre'),
    supabase.from('usuarios').select('tenant_id, tenants(prefijo, nombre, logo_url)').single(),
  ])

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: diagnosticos } = await (supabase as any)
    .from('diagnosticos')
    .select('id, hallazgos, servicios, piezas, total_estimado, estado, created_at, clientes(nombre, telefono), vehiculos(marca, modelo, anio)')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  const tenants = usuario?.tenants as { prefijo: string; nombre: string; logo_url: string | null } | null

  return (
    <DiagnosticoClient
      serviciosIniciales={(servicios ?? []) as any}
      diagnosticosIniciales={(diagnosticos ?? []) as any}
      tenantId={usuario?.tenant_id ?? ''}
      prefijo={tenants?.prefijo ?? 'ACF'}
      nombreTaller={tenants?.nombre ?? 'AutoCoreFix'}
      logoUrl={tenants?.logo_url ?? null}
    />
  )
}
