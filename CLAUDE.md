# AutoCoreFix - Contexto del Proyecto

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (DB + Auth + RLS) + lucide-react (iconos) + Recharts (gráficas)
- Vercel (deploy) + GitHub (repo)
- Carpeta local: `D:\autocorefix`

## Cuentas y URLs
- GitHub: https://github.com/Autocorefix/autocorefix
- Supabase: https://syrksjucfnioapduqvwl.supabase.co
- Vercel: https://autocorefix.vercel.app — deploy automático en push a `main`

## Producto
SaaS multi-tenant para talleres mecánicos. Cada taller tiene su propia cuenta aislada.
Solo acceden el dueño (admin) y la asistente (recepcionista). Sin portal de clientes.
Interfaz simple y rápida — la asistente tiene poca experiencia técnica.
Modelo de negocio: ingresos recurrentes por suscripción, cada taller = un tenant.

## Diseño
- Color primario: `#2563EB` (azul eléctrico)
- Fondo siempre blanco (`#FFFFFF`), sin colores oscuros
- Tipografía limpia, bordes sutiles, esquinas redondeadas

## Tablas en Supabase (todas con tenant_id para multi-tenancy)
- `tenants` — cada taller registrado (id, nombre, prefijo, created_at)
- `usuarios` — roles: `admin` (dueño) | `asistente` (recepcionista)
- `categorias` — categorías de servicio. `is_system_default=true` → imborrables. `tenant_id=NULL` para sistema, uuid para personalizadas
- `catalogo_servicios` — servicios con precio base. FK `categoria_id → categorias.id`
- `clientes` — nombre, teléfono, email, cliente_id (prefijo+4 dígitos)
- `vehiculos` — marca, modelo, año (vinculado a cliente, sin placa)
- `ordenes` — estado: recibido | en_proceso | listo | entregado. Calcula descuento y pct_descuento
- `orden_servicios` — detalle de servicios por orden con precio_base y precio_cobrado

## Funciones en Supabase (SECURITY DEFINER)
- `get_my_tenant_id()` — devuelve el tenant_id del usuario autenticado
- `complete_onboarding(p_nombre_taller, p_nombre_propietario)` — crea tenant + vincula usuario admin. Usada en `/onboarding` para nuevos usuarios OAuth

## Flujo de registro multi-tenant
### Email + contraseña:
1. `/register` → `supabase.auth.signUp()` con metadata `{ nombre_taller, nombre }`
2. Trigger en Supabase crea el registro en `usuarios` automáticamente
3. Usuario confirma email → puede hacer login
4. Al entrar al dashboard, si no tiene `tenant_id` → redirige a `/onboarding`

### Google OAuth:
1. `/login` o `/register` → `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`
2. Google autentica → redirige a `https://syrksjucfnioapduqvwl.supabase.co/auth/v1/callback`
3. Supabase redirige a `/auth/callback?code=...`
4. Route handler `exchangeCodeForSession(code)` — las cookies se escriben en el response del redirect, NO en cookieStore
5. Redirect a `/dashboard`
6. `dashboard/layout.tsx` verifica user + tenant
7. Si no tiene tenant → `/onboarding` → llama RPC `complete_onboarding`

## Arquitectura de carpetas
```
src/
  app/
    page.tsx                         → redirect según sesión
    login/page.tsx                   → login email+password + Google OAuth (split panel)
    register/page.tsx                → registro email+password + Google OAuth (split panel)
    onboarding/page.tsx              → configurar taller (solo usuarios nuevos sin tenant)
    auth/callback/route.ts           → exchange OAuth code → escribe cookies en response
    dashboard/
      layout.tsx                     → verifica auth + tenant (server component)
      page.tsx                       → dashboard con métricas y tabla de órdenes
      catalogo/page.tsx              → catálogo de servicios con CRUD
      nueva-orden/page.tsx           → crear orden de servicio
      clientes/page.tsx              → listado + historial de clientes
      reportes/
        page.tsx                     → server component, fetch de datos
        ReportesClient.tsx           → gráficas con Recharts
  components/
    Sidebar.tsx                      → navegación fija izquierda
  lib/
    supabase.ts                      → re-exporta browser client
    supabase-browser.ts              → cliente para componentes 'use client'
    supabase-server.ts               → cliente para server components
  middleware.ts                      → protección de rutas (Edge Runtime, sin Supabase SDK)
  types/
    database.types.ts                → tipos generados desde Supabase CLI
```

## Middleware — reglas críticas
- **NO usar @supabase/ssr en middleware** — crashea en Edge Runtime de Vercel
- Detectar sesión leyendo cookies directamente: `cookies.some(c => c.name.startsWith('sb-') && !c.name.includes('code-verifier'))`
- Rutas que siempre pasan: `/auth/*`, `/onboarding`, `/_next`, `/favicon`
- Rutas públicas: `/login`, `/register`
- Sin sesión en ruta protegida → redirect `/login`
- Con sesión en ruta pública → redirect `/dashboard`

## Auth/Callback — patrón correcto
```typescript
// CORRECTO: cookies escritas en el response del redirect
const response = NextResponse.redirect(new URL('/dashboard', request.url))
const supabase = createServerClient(URL, KEY, {
  cookies: {
    getAll() { return request.cookies.getAll() },       // leer del REQUEST
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)      // escribir en RESPONSE
      )
    },
  },
})
await supabase.auth.exchangeCodeForSession(code)
return response
```

## TypeScript con Supabase
- Todos los campos numéricos de Supabase devuelven `number | null` — usar `?? 0` en cálculos
- Todos los campos string devuelven `string | null` — usar `?? ''` o guards
- Las RPCs no declaradas en `database.types.ts` requieren cast: `(supabase as any).rpc('nombre')`
- El archivo `database.types.ts` debe estar en UTF-8 (no UTF-16LE) — Windows puede guardarlo en UTF-16LE causando error de build en Vercel: "File is not a module"

## Estado actual
- [x] Auth email + contraseña
- [x] Auth Google OAuth
- [x] Registro multi-tenant (email y Google)
- [x] Onboarding para nuevos usuarios
- [x] Middleware protección de rutas (Edge-safe)
- [x] Layout + Sidebar con navegación
- [x] Dashboard con métricas reales
- [x] Catálogo de servicios CRUD completo
- [x] 13 categorías del sistema + categorías personalizadas por tenant
- [x] Nueva Orden (cliente, vehículo, servicios, descuento automático)
- [x] Búsqueda de clientes en tiempo real
- [x] Generación automática de cliente_id (prefijo + 4 dígitos)
- [x] Página Clientes con historial
- [x] Reportes con Recharts (KPIs, gráficas, top servicios, top clientes)
- [x] RLS activo en todas las tablas
- [x] Tipos TypeScript sincronizados con Supabase
- [x] Deploy en Vercel funcionando
- [ ] Reportes: filtro por rango de fechas
- [ ] Reportes: exportar / imprimir
- [ ] Fidelización (recordatorios WhatsApp/SMS)
- [ ] Panel de administración de planes/suscripciones

## Convenciones
- Nombres de tablas en español (catalogo_servicios, ordenes, etc.)
- Código en inglés (componentes, variables, funciones)
- No crear ni modificar archivos sin confirmación explícita del usuario
