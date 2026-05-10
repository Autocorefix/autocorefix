import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { sendInvitationEmail } from '@/lib/email'

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

  // Obtener nombre del taller para el email
  const { data: taller } = await adminClient
    .from('tenants')
    .select('nombre')
    .eq('id', usuario.tenant_id)
    .maybeSingle()
  const tallerName = taller?.nombre ?? 'el taller'

  if (existingAuthUser) {
    // Usuario ya existe en Auth: generar magic link fresco y enviarlo vía Resend
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'https://autocorefix.vercel.app/auth/callback' },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: 'No se pudo generar el enlace de acceso' }, { status: 500 })
    }

    try {
      await sendInvitationEmail({ to: email, magicLink: linkData.properties.action_link, tallerName })
    } catch {
      return NextResponse.json({ error: 'Error al enviar el correo de invitación' }, { status: 500 })
    }

    await adminClient.from('invitaciones').insert({
      email,
      tenant_id: usuario.tenant_id,
      rol: 'asistente',
      invitado_por: user.id,
    })

    return NextResponse.json({ ok: true })
  }

  // Usuario nuevo: enviar invitación por email (Supabase crea la cuenta)
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://autocorefix.vercel.app/auth/callback',
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Generar magic link para enviar por Resend con template propio
  const { data: linkData } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'https://autocorefix.vercel.app/auth/callback' },
  })

  if (linkData?.properties?.action_link) {
    try {
      await sendInvitationEmail({ to: email, magicLink: linkData.properties.action_link, tallerName })
    } catch {
      // Si falla Resend, Supabase ya envió su email por defecto — no bloqueamos
      console.error('Resend falló, se usó email de Supabase')
    }
  }

  await adminClient.from('invitaciones').insert({
    email,
    tenant_id: usuario.tenant_id,
    rol: 'asistente',
    invitado_por: user.id,
  })

  return NextResponse.json({ ok: true })
}
