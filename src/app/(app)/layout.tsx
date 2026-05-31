import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase-admin'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
import { SubscriptionProvider } from '@/components/SubscriptionContext'

function isSuperadminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const superadmin = process.env.SUPERADMIN_EMAIL ?? ''
  return email.toLowerCase().trim() === superadmin.toLowerCase().trim()
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Paralelizar: validar sesión y leer pathname al mismo tiempo
  const [{ data: { user } }, headersList] = await Promise.all([
    supabase.auth.getUser(),
    headers(),
  ])

  if (!user) redirect('/login')

  const pathname = headersList.get('x-pathname') ?? ''
  const superadmin = isSuperadminEmail(user.email)

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

  if (usuario.rol === 'asistente' && !usuario.nombre) {
    redirect('/bienvenida')
  }

  let isBlocked = false

  if (!superadmin) {
    const adminClient = getAdminClient()
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()

    if (!sub) {
      if (usuario.rol === 'admin') {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)
        await adminClient.from('subscriptions').insert({
          tenant_id: usuario.tenant_id,
          status: 'trialing',
          trial_end: trialEnd.toISOString(),
        })
      }
    } else {
      const now = new Date()
      const isActive =
        (sub.status === 'trialing' && sub.trial_end && new Date(sub.trial_end) > now) ||
        (sub.status === 'active' && sub.current_period_end && new Date(sub.current_period_end) > now)
      isBlocked = !isActive
    }

    if (isBlocked && !pathname.startsWith('/billing')) {
      redirect('/billing')
    }
  }

  return (
    <SubscriptionProvider initialBlocked={isBlocked}>
      <div className="min-h-screen bg-zinc-50">
        <Sidebar rol={usuario.rol ?? 'asistente'} />
        <main className="lg:ml-60 min-h-screen p-4 pt-16 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </SubscriptionProvider>
  )
}
