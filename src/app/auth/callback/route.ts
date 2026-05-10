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

  let redirectTo = '/dashboard'
  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    // Intentar aceptar invitación pendiente
    const { data: invitacionAceptada } = await (supabase as any).rpc('accept_invitation')

    if (invitacionAceptada === true) {
      // Enviar notificación al admin en background (sin bloquear el redirect)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          // Obtener tenant_id y nombre de la asistente recién vinculada
          const { data: asistente } = await adminClient
            .from('usuarios')
            .select('tenant_id, nombre')
            .eq('id', user.id)
            .maybeSingle()

          if (asistente?.tenant_id) {
            // Obtener datos del taller y del admin
            const [{ data: taller }, { data: adminUsuario }] = await Promise.all([
              adminClient
                .from('tenants')
                .select('nombre')
                .eq('id', asistente.tenant_id)
                .maybeSingle(),
              adminClient
                .from('usuarios')
                .select('id')
                .eq('tenant_id', asistente.tenant_id)
                .eq('rol', 'admin')
                .maybeSingle(),
            ])

            if (adminUsuario?.id) {
              // Obtener email del admin desde auth.users (requiere service role)
              const { data: adminAuthUser } = await adminClient.auth.admin.getUserById(adminUsuario.id)

              if (adminAuthUser?.user?.email) {
                await notifyAdminInvitationAccepted({
                  adminEmail: adminAuthUser.user.email,
                  assistantName: asistente.nombre ?? '',
                  assistantEmail: user.email ?? '',
                  tallerName: taller?.nombre ?? 'tu taller',
                })
              }
            }
          }
        }
      } catch (emailErr) {
        // No interrumpir el flujo si la notificación falla
        console.error('Error en notificación de invitación:', emailErr)
      }

      return NextResponse.redirect(new URL('/bienvenida', request.url))
    }
  }

  return response
}
