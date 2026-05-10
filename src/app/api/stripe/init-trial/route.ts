import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .single()

  if (!usuario?.tenant_id || usuario.rol !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 14)

  const { error } = await adminClient
    .from('subscriptions')
    .insert({ tenant_id: usuario.tenant_id, status: 'trialing', trial_end: trialEnd.toISOString() })

  if (error && error.code !== '23505') {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear trial' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
