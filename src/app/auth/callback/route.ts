import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code       = new URL(request.url).searchParams.get('code')
  const errorParam = new URL(request.url).searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url))
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url))

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

    // Vincular asistente invitado a su tenant
    // Esta RPC detecta si existe una invitación pendiente para el email
    // del usuario recién autenticado y asigna tenant_id + rol 'asistente'
    await (supabase as any).rpc('accept_invitation')
  }

  return response
}
