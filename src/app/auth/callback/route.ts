import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notifyAdminInvitationAccepted } from '@/lib/email'

export async function GET(request: NextRequest) {
  const code       = new URL(request.url).searchParams.get('code')
  const errorParam = new URL(request.url).searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Recolectar cookies para aplicarlas a la respuesta final
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          // Guardamos las cookies para aplicarlas al response final
          toSet.forEach(c => cookiesToSet.push(c))
        },
      },
    }
  )

  const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  const sessionUser = exchangeData?.session?.user
  let destination = '/dashboard'

  if (sessionUser?.email) {
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar invitación pendiente para este usuario
    const { data: invitation } = await adminClient
      .from('invitaciones')
      .select('id, tenant_id, rol, email')
      .eq('email', sessionUser.email)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (invitation) {
      // Aceptar invitación
      await adminClient
        .from('invitaciones')
        .update({ estado: 'aceptada' })
        .eq('id', invitation.id)

      // Cancelar otras pendientes del mismo email
      await adminClient
        .from('invitaciones')
        .update({ estado: 'cancelada' })
        .eq('email', sessionUser.email)
        .eq('estado', 'pendiente')
        .neq('id', invitation.id)

      // Crear o actualizar fila en usuarios
      await adminClient
        .from('usuarios')
        .upsert({
          id: sessionUser.id,
          email: sessionUser.email,
          tenant_id: invitation.tenant_id,
          rol: invitation.rol ?? 'asistente',
        }, { onConflict: 'id' })

      // Enviar notificación al admin (sin bloquear el flujo)
      try {
        const [{ data: taller }, { data: adminUsuario }] = await Promise.all([
          adminClient.from('tenants').select('nombre').eq('id', invitation.tenant_id).maybeSingle(),
          adminClient.from('usuarios').select('id').eq('tenant_id', invitation.tenant_id).eq('rol', 'admin').maybeSingle(),
        ])

        if (adminUsuario?.id) {
          const { data: adminAuthUser } = await adminClient.auth.admin.getUserById(adminUsuario.id)
          if (adminAuthUser?.user?.email) {
            await notifyAdminInvitationAccepted({
              adminEmail: adminAuthUser.user.email,
              assistantName: sessionUser.user_metadata?.full_name ?? '',
              assistantEmail: sessionUser.email,
              tallerName: taller?.nombre ?? 'tu taller',
            })
          }
        }
      } catch (emailErr) {
        console.error('Error en notificación de invitación:', emailErr)
      }

      destination = '/bienvenida'
    }
  }

  // Crear respuesta con el destino correcto y aplicar cookies de sesión
  const response = NextResponse.redirect(new URL(destination, request.url))
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  return response
}
