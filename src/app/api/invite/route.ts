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

  // Verificar invitación pendiente duplicada
  const { data: existingInv } = await (supabase as any)
    .from('invitaciones')
    .select('id')
    .eq('email', email)
    .eq('estado', 'pendiente')
    .maybeSingle()

  if (existingInv) {
    return NextResponse.json({ error: 'Ya existe una invitación pendiente para ese email' }, { status: 409 })
  }

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar si el usuario ya existe en Auth
  const { data: existingUsers } = await adminClient.auth.admin.listUsers()
  const existingAuthUser = existingUsers?.users?.find((u: { email?: string }) => u.email === email)

  if (existingAuthUser) {
    // Usuario ya tiene cuenta: asignar tenant directamente sin re-invitar
    await adminClient
      .from('usuarios')
      .update({ tenant_id: usuario.tenant_id, rol: 'asistente' })
      .eq('id', existingAuthUser.id)

    // Registrar invitación como aceptada directamente
    await (supabase as any).from('invitaciones').insert({
      email,
      tenant_id: usuario.tenant_id,
      rol: 'asistente',
      invitado_por: user.id,
      estado: 'aceptada',
    })

    return NextResponse.json({ ok: true, existing: true })
  }

  // Usuario nuevo: enviar invitación por email
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://autocorefix.vercel.app/auth/callback',
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  await (supabase as any).from('invitaciones').insert({
    email,
    tenant_id: usuario.tenant_id,
    rol: 'asistente',
    invitado_por: user.id,
  })

  return NextResponse.json({ ok: true })
}
