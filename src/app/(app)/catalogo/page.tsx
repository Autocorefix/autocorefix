import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import CatalogoClient, { type Servicio } from './CatalogoClient'

export default async function CatalogoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario }  = await supabase.from('usuarios').select('rol').eq('id', user!.id).single()
  if (usuario?.rol !== 'admin') redirect('/dashboard')

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
