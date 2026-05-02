import { createClient } from '@/lib/supabase-server'
import CatalogoClient, { type Servicio } from './CatalogoClient'

export default async function CatalogoPage() {
  const supabase = await createClient()

  const [{ data: servicios }, { data: categorias }] = await Promise.all([
    supabase
      .from('catalogo_servicios')
      .select('*, categorias(id, nombre, is_system_default, orden)')
      .order('nombre'),
    supabase
      .from('categorias')
      .select('*')
      .order('orden'),
  ])

  return (
    <CatalogoClient
      servicios={(servicios ?? []) as Servicio[]}
      categorias={categorias ?? []}
    />
  )
}
