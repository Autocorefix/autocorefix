import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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

  // Service role client para bypassear RLS en subscriptions
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar suscripción activa (skip en /dashboard/billing para evitar loop)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (!pathname.startsWith('/dashboard/billing')) {
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()

    if (!sub && usuario.rol === 'admin') {
      // Primera vez: crear trial automáticamente
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      await adminClient.from('subscriptions').insert({
        tenant_id: usuario.tenant_id,
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
      })
    } else {
      const now = new Date()
      const isActive = sub && (
        (sub.status === 'trialing' && sub.trial_end && new Date(sub.trial_end) > now) ||
        (sub.status === 'active' && sub.current_period_end && new Date(sub.current_period_end) > now) ||
        sub.status === 'past_due'
      )
      if (!isActive) redirect('/dashboard/billing')
    }
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
