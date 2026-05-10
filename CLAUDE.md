# AutoCoreFix — Contexto del Proyecto

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (DB + Auth + RLS) + lucide-react (iconos) + Recharts (gráficas)
- Vercel (deploy) + GitHub (repo)
- Carpeta local: `D:\autocorefix`

## Cuentas y URLs
- GitHub: https://github.com/Autocorefix/autocorefix
- Supabase: https://syrksjucfnioapduqvwl.supabase.co
- Vercel: https://autocorefix.vercel.app — deploy automático en push a `main`
- Stripe: cuenta LubyMex en stripe.com (modo Test activo)

## Producto
SaaS multi-tenant para talleres mecánicos. Cada taller tiene su propia cuenta aislada.
Solo acceden el dueño (admin) y la asistente (recepcionista). Sin portal de clientes.
Interfaz simple y rápida — la asistente tiene poca experiencia técnica.
Modelo de negocio: ingresos recurrentes por suscripción, cada taller = un tenant.

---

## Diseño — Sistema Global

- Color primario: `#2563EB` (azul eléctrico)
- Fondo siempre blanco (`#FFFFFF`), sin colores oscuros
- Tipografía limpia, bordes sutiles, esquinas redondeadas

### Jerarquía de bordes izquierdos (acordeones y tarjetas)
- **Card contenedor** (nivel superior): `border-l-4 border-l-[#2563EB]`
- **Fila interna** (nivel secundario): `border-l-2 border-l-[#2563EB]`
- NUNCA `border-l-4` en ambos niveles — satura visualmente
- IMPORTANTE: `border-l-*` en `<tr>` no renderiza en tablas con `border-collapse`. Siempre aplicar al primer `<td>`.

### Chevron (botón expandir/colapsar)
- **Reposo**: `border border-[#2563EB] bg-white` + icon `text-[#2563EB]`
- **Hover**: requiere clase `group` en `<tr>` o contenedor → `group-hover:bg-[#2563EB]` + icon `group-hover:text-white`
- **Expandido**: `bg-[#2563EB] border-[#2563EB]` + icon `text-white`
- Tamaño card-level: `w-7 h-7 rounded-lg` / icono `w-4 h-4`
- Tamaño row-level: `w-6 h-6 rounded-md` / icono `w-3.5 h-3.5`

### Avatar de iniciales
- `w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0`
- Letra: `text-sm font-semibold text-white`
- NUNCA `bg-blue-50` — se pierde sobre fondos `#EFF6FF`

### Hover de filas de tabla
- `hover:bg-[#EFF6FF]` siempre, con `cursor-pointer`
- Añadir `group` al `<tr>` para activar group-hover del chevron

### Headers de tabla
- Celda: `text-[10px] font-bold text-zinc-500 uppercase tracking-widest`
- Fila header: `bg-zinc-50 border-b border-zinc-200`

### Labels de campo (micro-etiquetas)
- `text-[10px] font-semibold text-zinc-400 uppercase tracking-widest`
- Nunca solo `text-xs text-zinc-400` — no crea jerarquía visual

### Badge de ID de orden
- `font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md`
- Siempre incluir prefijo `#`

### Panel de servicios (detalle expandido)
- Header: `bg-blue-50 border-b border-blue-100` + `text-[10px] font-bold text-blue-700 uppercase tracking-widest`
- Body: `bg-white divide-y divide-zinc-50`
- Contenedor: `border border-blue-100 rounded-xl overflow-hidden shadow-sm`

### Mini-cards de info (teléfono, email, etc.)
- `bg-zinc-50 rounded-xl p-3 border border-zinc-100`
- Label: `text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1`
- Valor: `text-sm font-semibold text-zinc-800`

---

## Stripe — Configuración

### Producto y precios (modo Test)
- Producto: **AutoCoreFix Pro** (`prod_USqrLrDdTstO5v`)
- Precio mensual: **$399 MXN/mes** (`price_1TTvA1BoqUSKLe0qdZYRMGpB`) — `STRIPE_PRICE_ID_MONTHLY`
- Precio anual: **$3,499 MXN/año** (`price_1TTvO3BoqUSKLe0qg1Dwy66C`) — `STRIPE_PRICE_ID_ANNUAL`

### Webhook configurado
- Nombre: AutoCoreFix producción
- URL: `https://autocorefix.vercel.app/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Al cambiar dominio a `autocorefix.com`: editar el webhook en Stripe → Developers → Webhooks

### Variables de entorno (en `.env.local` y Vercel)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_1TTvA1BoqUSKLe0qdZYRMGpB
STRIPE_PRICE_ID_ANNUAL=price_1TTvO3BoqUSKLe0qg1Dwy66C
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Flujo de suscripción (código ya implementado)
1. Registro → trial 14 días automático (tabla `subscriptions`, status `trialing`)
2. Trial expirado → dashboard bloqueado → página `/dashboard/billing`
3. Usuario elige plan → Stripe Checkout → pago → webhook actualiza `subscriptions`
4. Acceso restaurado automáticamente
5. Admin gestiona suscripción desde `/dashboard/billing` (portal de Stripe)

### Archivos Stripe ya creados
- `src/app/api/stripe/checkout/route.ts` — crea sesión de pago
- `src/app/api/stripe/portal/route.ts` — abre portal de cliente
- `src/app/api/stripe/webhook/route.ts` — recibe eventos
- `src/app/api/stripe/init-trial/route.ts` — crea trial al registrarse
- `src/app/dashboard/billing/page.tsx` + `BillingClient.tsx` — página de facturación

### Pendiente en Stripe
- [ ] Prueba de pago con tarjeta `4242 4242 4242 4242` (fecha `12/34`, CVC `123`)
- [ ] Cambiar a modo Live cuando se lance a producción real
- [ ] Actualizar webhook URL cuando se conecte dominio `autocorefix.com`

---

## Tablas en Supabase (todas con tenant_id para multi-tenancy)
- `tenants` — cada taller (id, nombre, prefijo, created_at)
- `usuarios` — roles: `admin` (dueño) | `asistente` (recepcionista). Campos: id, tenant_id, rol, nombre, email
- `categorias` — `is_system_default=true` → imborrables. `tenant_id=NULL` para sistema, uuid para personalizadas
- `catalogo_servicios` — servicios con precio base. FK `categoria_id → categorias.id`
- `clientes` — nombre, teléfono, email, cliente_id (prefijo+4 dígitos)
- `vehiculos` — marca, modelo, año (vinculado a cliente, sin placa)
- `ordenes` — estado: recibido | en_proceso | listo | entregado. Campos: descuento, pct_descuento
- `orden_servicios` — servicios por orden con precio_base y precio_cobrado
- `invitaciones` — email, tenant_id, rol, invitado_por, estado (pendiente | aceptada | cancelada | revocada), created_at
- `subscriptions` — tenant_id, stripe_customer_id, stripe_subscription_id, status (trialing|active|past_due|canceled), plan_type, trial_end, current_period_end

## Funciones en Supabase (SECURITY DEFINER)
- `get_my_tenant_id()` — devuelve el tenant_id del usuario autenticado
- `complete_onboarding(p_nombre_taller, p_nombre_propietario)` — crea tenant + vincula usuario admin
- `accept_invitation()` — busca invitación pendiente para `auth.email()`, la marca como aceptada, y **actualiza `usuarios.tenant_id` y `usuarios.rol`**. Retorna `boolean`.

### SQL correcto de accept_invitation (referencia):
```sql
DROP FUNCTION IF EXISTS accept_invitation();
CREATE OR REPLACE FUNCTION accept_invitation()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_inv RECORD;
BEGIN
  SELECT * INTO v_inv FROM invitaciones
  WHERE email = auth.email() AND estado = 'pendiente'
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE invitaciones SET estado = 'aceptada' WHERE id = v_inv.id;
  UPDATE invitaciones SET estado = 'cancelada'
  WHERE email = auth.email() AND estado = 'pendiente' AND id != v_inv.id;
  UPDATE usuarios SET tenant_id = v_inv.tenant_id, rol = COALESCE(v_inv.rol, 'asistente')
  WHERE id = auth.uid();
  RETURN true;
END; $$;
```

---

## Flujo de invitación de asistentes

### Flujo completo (email nuevo):
1. Admin invita desde `/dashboard/settings` → POST `/api/invite` con email
2. API llama `adminClient.auth.admin.inviteUserByEmail(email, { redirectTo: '/auth/callback' })`
3. Inserta registro en `invitaciones` con `estado = 'pendiente'`
4. Asistente recibe email con magic link → clic → `/auth/callback`
5. `exchangeCodeForSession(code)` → llama RPC `accept_invitation()`
6. RPC actualiza `invitaciones.estado = 'aceptada'` + `usuarios.tenant_id` + `usuarios.rol = 'asistente'`
7. RPC retorna `true` → redirect a `/bienvenida`
8. En `/bienvenida`: asistente configura nombre y contraseña
9. Redirect a `/dashboard`

### Flujo para usuario que ya existe en Auth:
1. Admin invita el email → API detecta que ya existe en `auth.users`
2. Inserta `invitaciones` con `estado = 'pendiente'` (SIN dar acceso inmediato)
3. Asistente inicia sesión normalmente → `/auth/callback` llama `accept_invitation()`
4. RPC procesa la invitación pendiente → asigna tenant → retorna `true` → `/bienvenida`

### Estados de invitación:
- `pendiente` → enviada, no aceptada aún
- `aceptada` → magic link clickeado, RPC ejecutada, usuario tiene tenant
- `cancelada` → admin canceló antes de que aceptara
- `revocada` → admin quitó acceso después de aceptada

---

## API Routes de seguridad

### `/api/invite` (POST)
- Verifica rol admin, verifica duplicado pendiente
- Para email nuevo: `inviteUserByEmail` + insert `invitaciones`
- Para email existente en Auth: solo insert `invitaciones` (no da acceso inmediato)

### `/api/assistants` (GET)
- Solo admin. Usa service role para bypassear RLS
- Retorna `usuarios` donde `rol='asistente'` y `tenant_id = admin.tenant_id`

### `/api/revoke` (POST) — 3 casos:
1. `{ userId }` → quita `tenant_id` y `rol` del asistente activo + archiva sus invitaciones
2. `{ invitacionId }` → marca invitación como `cancelada`; si hay email quita tenant del usuario
3. `{ email }` → revocar por email: quita tenant del usuario + archiva todas sus invitaciones del tenant

---

## Arquitectura de carpetas
```
src/
  app/
    page.tsx                         → redirect según sesión
    login/page.tsx                   → login email+password + Google OAuth
    register/page.tsx                → registro email+password + Google OAuth
    onboarding/page.tsx              → configurar taller (nuevos usuarios sin tenant)
    bienvenida/page.tsx              → setup de asistentes invitadas (nombre + contraseña)
    auth/callback/route.ts           → exchange OAuth code + accept_invitation RPC
    dashboard/
      layout.tsx                     → verifica auth + tenant + redirect bienvenida si asistente sin nombre
      page.tsx                       → server component → DashboardClient
      DashboardClient.tsx            → métricas + tabla de órdenes del día
      catalogo/page.tsx              → catálogo de servicios CRUD
      nueva-orden/page.tsx           → crear orden de servicio
      clientes/page.tsx              → listado + historial de clientes
      ordenes/
        page.tsx                     → historial completo de órdenes
        [id]/page.tsx                → detalle de orden individual
      reportes/
        page.tsx                     → server component, fetch de datos
        ReportesClient.tsx           → gráficas con Recharts + filtro fechas + exportar
      settings/page.tsx              → gestión de acceso (invitar, revocar, reenviar)
      perfil/page.tsx                → cambiar nombre y contraseña (admin y asistente)
      billing/page.tsx + BillingClient.tsx → planes, suscripción activa, portal Stripe
  api/
    invite/route.ts                  → enviar invitación por email
    assistants/route.ts              → listar asistentes del tenant (service role)
    revoke/route.ts                  → revocar acceso (3 casos: userId, invitacionId, email)
    stripe/
      checkout/route.ts              → crea sesión de pago en Stripe
      portal/route.ts                → abre portal de cliente Stripe
      webhook/route.ts               → recibe y procesa eventos de Stripe
      init-trial/route.ts            → crea trial de 14 días al registrarse
  components/
    Sidebar.tsx                      → navegación fija. Admin ve todo. Asistente no ve Reportes ni Catálogo.
  lib/
    supabase.ts                      → re-exporta browser client
    supabase-browser.ts              → cliente para 'use client'
    supabase-server.ts               → cliente para server components
  middleware.ts                      → protección de rutas (Edge Runtime, sin Supabase SDK)
  types/
    database.types.ts                → tipos generados desde Supabase CLI (debe ser UTF-8)
```

---

## Middleware — reglas críticas
- **NO usar @supabase/ssr en middleware** — crashea en Edge Runtime de Vercel
- Detectar sesión: `cookies.some(c => c.name.startsWith('sb-') && !c.name.includes('code-verifier'))`
- Rutas que siempre pasan: `/auth/*`, `/onboarding`, `/bienvenida`, `/_next`, `/favicon`
- Rutas públicas: `/login`, `/register`
- Sin sesión en ruta protegida → redirect `/login`
- Con sesión en ruta pública → redirect `/dashboard`

## Auth/Callback — patrón correcto
```typescript
// Cookies escritas en el RESPONSE, no en cookieStore
const response = NextResponse.redirect(new URL('/dashboard', request.url))
const supabase = createServerClient(URL, KEY, {
  cookies: {
    getAll() { return request.cookies.getAll() },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      )
    },
  },
})
await supabase.auth.exchangeCodeForSession(code)
// Luego llamar accept_invitation() antes de retornar
return response
```

## TypeScript con Supabase
- Campos numéricos: `number | null` → usar `?? 0`
- Campos string: `string | null` → usar `?? ''` o guards
- RPCs no declaradas en `database.types.ts`: cast `(supabase as any).rpc('nombre')`
- `database.types.ts` debe estar en UTF-8 (no UTF-16LE) — Windows puede corromperse al guardar

---

## Errores conocidos y soluciones

### `cannot change return type of existing function` (Supabase)
Ejecutar `DROP FUNCTION IF EXISTS nombre_funcion();` antes de recrearla con `CREATE OR REPLACE`.

### `border-l-*` en `<tr>` no renderiza
Las tablas HTML con `border-collapse` ignoran bordes de fila. Mover la clase al primer `<td>`.

### `inviteUserByEmail` falla para usuarios existentes
Error: "A user with this email has already been registered". Para usuarios existentes: solo insertar en `invitaciones` y procesar en el próximo login con `accept_invitation()`.

### accept_invitation no asigna acceso
Si el asistente acepta pero no aparece en "Asistentes con acceso": verificar que la RPC ejecuta `UPDATE usuarios SET tenant_id = ... WHERE id = auth.uid()`. Sin ese UPDATE, la invitación se marca aceptada pero el usuario no tiene acceso real.

### Asistentes no visibles en Settings (RLS)
La política RLS impide que el admin lea registros de otros usuarios. Solución: API route con `createClient(SERVICE_ROLE_KEY)` que bypasea RLS.

### Write tool trunca archivos >~210 líneas
Usar Python vía bash: `python3 -c "open('ruta','w').write('''...''')"` o heredoc `cat > archivo << 'EOF'`. Verificar siempre con `tail -3` y `wc -l`.

### Duplicados en tabla invitaciones
Si se envían múltiples invitaciones al mismo email, la RPC `accept_invitation` debe cancelar las pendientes extras. Deduplicar en el frontend con `Set<email>` al mostrar historial.

---

## Estado actual del proyecto

### Completado ✅
- Auth email + contraseña
- Auth Google OAuth
- Registro multi-tenant (email y Google)
- Onboarding para nuevos usuarios (admin)
- Middleware protección de rutas (Edge-safe)
- Layout + Sidebar con navegación (restricciones por rol)
- Dashboard con métricas reales del día
- Catálogo de servicios CRUD completo (13 categorías sistema + personalizadas)
- Nueva Orden (cliente, vehículo, servicios, descuento automático)
- Búsqueda de clientes en tiempo real
- Generación automática de cliente_id (prefijo + 4 dígitos)
- Página Clientes con historial de órdenes expandible
- Historial completo de Órdenes con detalle por orden
- Reportes con Recharts (KPIs, gráficas, top servicios, top clientes)
- Reportes: filtro por rango de fechas + exportar CSV + imprimir
- RLS activo en todas las tablas
- Tipos TypeScript sincronizados con Supabase
- Deploy en Vercel funcionando
- Sistema de diseño consistente (acordeones, chevrons, avatares, headers)
- Flujo de invitación completo para asistentes (magic link → bienvenida → setup)
- Página Bienvenida para configurar nombre y contraseña al aceptar invitación
- Settings: invitar, reenviar, cancelar, revocar por userId y por email
- Página Perfil: cambiar nombre y contraseña
- API seguras: `/api/invite`, `/api/assistants`, `/api/revoke`
- Stripe configurado: producto, precios, webhook, variables de entorno en `.env.local` y Vercel
- Tabla `subscriptions` en Supabase con RLS
- APIs Stripe: `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`, `/api/stripe/init-trial`
- Página `/dashboard/billing` con BillingClient

### Pendiente 📋
- [ ] Prueba de pago end-to-end con tarjeta de prueba Stripe (`4242 4242 4242 4242`)
- [ ] Fidelización (recordatorios WhatsApp/SMS a clientes)
- [ ] Notificación al admin cuando asistente acepta invitación (requiere Resend u otro servicio email transaccional)
- [ ] Búsqueda global en órdenes y clientes
- [ ] Paginación en tablas con muchos registros
- [ ] PWA / modo offline básico
- [ ] Cambiar Stripe a modo Live cuando se lance a producción real
- [ ] Conectar dominio `autocorefix.com` y actualizar webhook URL en Stripe

---

## Convenciones
- Nombres de tablas en español (catalogo_servicios, ordenes, etc.)
- Código en inglés (componentes, variables, funciones)
- No crear ni modificar archivos sin confirmación explícita del usuario
- Git push siempre desde terminal Windows del usuario (el sandbox no tiene credenciales GitHub)
- Archivos largos (>100 líneas): escribir con bash heredoc `cat > archivo << 'ENDOFFILE'`
