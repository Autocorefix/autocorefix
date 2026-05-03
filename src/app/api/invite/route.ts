import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  // Verificar que quien llama es admin
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

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, tenant_id')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Verificar que no existe ya una invitación pendiente para ese email
  const { data: existing } = await supabase
    .from('invitaciones')
    .select('id')
    .eq('email', email)
    .eq('estado', 'pendiente')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe una invitación pendiente para ese email' }, { status: 409 })
  }

  // Usar service role para enviar invitación
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') ?
      'https://autocorefix.vercel.app' : 'http://localhost:3000'}/auth/callback`,
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Registrar invitación en la tabla
  await supabase.from('invitaciones').insert({
    email,
    tenant_id: usuario.tenant_id,
    rol: 'asistente',
    invitado_por: user.id,
  })

  return NextResponse.json({ ok: true })
}
