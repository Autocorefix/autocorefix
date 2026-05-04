import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code       = new URL(request.url).searchParams.get('code')
  const errorParam = new URL(request.url).searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url))
  }

  // Destino por defecto
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
    // La RPC retorna true si procesó una invitación → ir a /bienvenida para configurar cuenta
    const { data: invitacionAceptada } = await (supabase as any).rpc('accept_invitation')

    if (invitacionAceptada === true) {
      return NextResponse.redirect(new URL('/bienvenida', request.url))
    }
  }

  return response
}
