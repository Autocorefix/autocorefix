import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { userId, invitacionId, email } = await request.json()

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

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Caso 1: revocar asistente activo por userId
  if (userId) {
    // Verificar que el usuario pertenece al mismo tenant
    const { data: target } = await adminClient
      .from('usuarios')
      .select('tenant_id, rol')
      .eq('id', userId)
      .single()

    if (target?.tenant_id !== admin?.tenant_id || target?.rol !== 'asistente') {
      return NextResponse.json({ error: 'Sin permisos sobre este usuario' }, { status: 403 })
    }

    // Quitar tenant y rol — pierde acceso inmediatamente
    await adminClient
      .from('usuarios')
      .update({ tenant_id: null, rol: null })
      .eq('id', userId)

    // Archivar sus invitaciones aceptadas en este tenant
    await adminClient
      .from('invitaciones')
      .update({ estado: 'revocada' })
      .eq('tenant_id', admin.tenant_id)
      .in('estado', ['aceptada', 'pendiente'])
      .eq('invitado_por', user.id) // seguridad: solo las de este admin (se reemplaza abajo)

    // Buscar el email del usuario revocado para limpiar sus invitaciones
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const revokedUser = authUsers?.users?.find((u: { id: string }) => u.id === userId)
    if (revokedUser?.email) {
      await adminClient
        .from('invitaciones')
        .update({ estado: 'revocada' })
        .eq('email', revokedUser.email)
        .eq('tenant_id', admin.tenant_id)
        .in('estado', ['aceptada'])
    }

    return NextResponse.json({ ok: true })
  }

  // Caso 2: cancelar invitación pendiente por invitacionId
  if (invitacionId) {
    // Marcar invitación como cancelada
    await adminClient
      .from('invitaciones')
      .update({ estado: 'cancelada' })
      .eq('id', invitacionId)
      .eq('tenant_id', admin.tenant_id)

    // Si hay email y el usuario existe en Auth, quitarle el tenant también
    if (email) {
      const { data: authUsers } = await adminClient.auth.admin.listUsers()
      const authUser = authUsers?.users?.find((u: { email?: string }) => u.email === email)
      if (authUser) {
        await adminClient
          .from('usuarios')
          .update({ tenant_id: null, rol: null })
          .eq('id', authUser.id)
      }
    }

    return NextResponse.json({ ok: true })
  }

  // Caso 3: revocar acceso por email (para invitaciones aceptadas)
  // Útil cuando el admin quiere revocar desde la vista de historial
  if (email) {
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((u: { email?: string }) => u.email === email)

    if (authUser) {
      // Verificar que pertenece a este tenant antes de revocar
      const { data: targetUser } = await adminClient
        .from('usuarios')
        .select('tenant_id')
        .eq('id', authUser.id)
        .single()

      if (targetUser?.tenant_id === admin.tenant_id) {
        await adminClient
          .from('usuarios')
          .update({ tenant_id: null, rol: null })
          .eq('id', authUser.id)
      }
    }

    // Archivar todas las invitaciones de este email en este tenant
    await adminClient
      .from('invitaciones')
      .update({ estado: 'revocada' })
      .eq('email', email)
      .eq('tenant_id', admin.tenant_id)
      .in('estado', ['aceptada', 'pendiente'])

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
}
