import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol, nombre')
    .eq('id', user.id)
    .maybeSingle()

  if (!usuario?.tenant_id) {
    if (usuario?.rol === 'asistente') {
      redirect('/login?error=Tu+invitacion+no+pudo+procesarse.+Contacta+al+administrador.')
    }
    redirect('/onboarding')
  }

  // Asistente que aceptó invitación pero aún no configuró su cuenta
  if (usuario.rol === 'asistente' && !usuario.nombre) {
    redirect('/bienvenida')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar rol={usuario.rol ?? 'asistente'} />
      <main className="ml-60 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
