import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol, nombre')
    .eq('id', user.id)
    .maybeSingle()

  // Asistentes invitados sin tenant aún: accept_invitation puede haber
  // tardado — redirigir a onboarding solo si es admin sin tenant.
  // Los asistentes sin tenant tienen un problema de invitación, no onboarding.
  if (!usuario?.tenant_id) {
    if (usuario?.rol === 'asistente') {
      // La RPC falló o aún no corrió — redirigir a login con mensaje
      redirect('/login?error=Tu+invitacion+no+pudo+procesarse.+Contacta+al+administrador.')
    }
    redirect('/onboarding')
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
