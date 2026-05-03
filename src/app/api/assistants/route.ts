import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: admin } = await supabase
    .from('usuarios')
    .select('rol, tenant_id')
    .eq('id', user.id)
    .single()

  if (admin?.rol !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Service role para leer todos los asistentes del tenant sin restricción de RLS
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: asistentes } = await adminClient
    .from('usuarios')
    .select('id, nombre, email')
    .eq('tenant_id', admin.tenant_id)
    .eq('rol', 'asistente')
    .order('nombre', { ascending: true })

  return NextResponse.json({ asistentes: asistentes ?? [] })
}
