import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES   = ['/login', '/register']
const CALLBACK_PREFIX = '/auth/callback'
const ONBOARDING      = '/onboarding'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // OAuth callback — nunca interrumpir
  if (pathname.startsWith(CALLBACK_PREFIX)) {
    return supabaseResponse
  }

  // Sin sesion — solo puede estar en rutas publicas
  if (!user) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Con sesion — redirigir desde login/register al dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Onboarding — permitir paso libre (usuario sin tenant completando alta)
  if (pathname.startsWith(ONBOARDING)) {
    return supabaseResponse
  }

  // El check de tenant se hace en dashboard/layout.tsx (server component)
  // para evitar queries pesadas en Edge Runtime
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
