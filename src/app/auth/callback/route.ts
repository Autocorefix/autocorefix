import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code       = new URL(request.url).searchParams.get('code')
  const errorParam = new URL(request.url).searchParams.get('error')

  // Si Google devolvió error, redirigir a login con mensaje
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

    // Si falla el intercambio, redirigir a login con error visible
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    // Vincular asistent