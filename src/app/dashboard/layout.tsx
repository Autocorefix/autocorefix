import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que el usuario tiene tenant asignado
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!usuario?.tenant_id) {
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
