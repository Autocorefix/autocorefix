# Contexto: Setup de Stripe para AutoCoreFix

## Quién soy y qué necesito

Soy el dueño de AutoCoreFix, un SaaS para talleres mecánicos construido con Next.js 15, Supabase y Vercel. El código de suscripciones con Stripe **ya está escrito** — solo necesito configurar las cuentas externas y las variables de entorno. Necesito que me guíes paso a paso, como si no supiera nada de Stripe.

---

## Lo que el código ya hace (no hay que tocar el código)

- Cuando un taller se registra → se crea automáticamente un **trial de 14 días**
- Cuando el trial expira → el dashboard se **bloquea** y aparece la página de facturación
- La página de facturación muestra dos opciones: **$299 MXN/mes** o **$2,999 MXN/año**
- Al suscribirse → Stripe cobra y envía confirmación → acceso se restaura
- Hay un **portal de Stripe** para que el admin gestione su suscripción (cambiar tarjeta, cancelar, ver facturas)

## Archivos de código ya creados

- `src/app/api/stripe/checkout/route.ts` — crea sesión de pago
- `src/app/api/stripe/portal/route.ts` — abre portal de cliente
- `src/app/api/stripe/webhook/route.ts` — recibe eventos de Stripe
- `src/app/api/stripe/init-trial/route.ts` — crea el trial al registrarse
- `src/app/dashboard/billing/page.tsx` + `BillingClient.tsx` — página de facturación

---

## Las 4 cosas que necesito hacer (en orden)

### PASO 1 — Instalar el paquete de Stripe
En la terminal, dentro de la carpeta `D:\autocorefix`, ejecutar:
```
npm install stripe
```

### PASO 2 — Ejecutar SQL en Supabase
Entrar a https://supabase.com → mi proyecto → **SQL Editor** → ejecutar este SQL:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing',
  plan_type TEXT,
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read_own_sub" ON subscriptions
  FOR SELECT USING (tenant_id = get_my_tenant_id());
```

### PASO 3 — Crear cuenta y productos en Stripe
Necesito:
1. Crear cuenta en stripe.com (o usar la que ya tenga)
2. Crear un Producto llamado "AutoCoreFix Pro"
3. Crear 2 precios para ese producto:
   - Precio 1: $299 MXN, recurrente mensual
   - Precio 2: $2,999 MXN, recurrente anual
4. Crear un Webhook apuntando a mi app en Vercel

(Guíame en cada uno de estos sub-pasos)

### PASO 4 — Agregar variables de entorno
Necesito agregar estas variables en dos lugares:
- En el archivo `D:\autocorefix\.env.local` (para desarrollo local)
- En Vercel → Settings → Environment Variables (para producción)

Variables que necesito:
```
STRIPE_SECRET_KEY=          ← clave secreta de Stripe
STRIPE_WEBHOOK_SECRET=      ← secreto del webhook de Stripe
STRIPE_PRICE_ID_MONTHLY=    ← ID del precio mensual ($299 MXN)
STRIPE_PRICE_ID_ANNUAL=     ← ID del precio anual ($2,999 MXN)
SUPABASE_SERVICE_ROLE_KEY=  ← clave service role de Supabase (para .env.local)
```

---

## Dónde encontrar cada valor

| Variable | Dónde está |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → el webhook creado → Signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe Dashboard → Products → AutoCoreFix Pro → precio mensual → copiar ID (empieza con `price_`) |
| `STRIPE_PRICE_ID_ANNUAL` | Stripe Dashboard → Products → AutoCoreFix Pro → precio anual → copiar ID (empieza con `price_`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |

---

## Configuración del Webhook en Stripe

Al crear el webhook necesito usar:
- **URL del endpoint**: `https://autocorefix.vercel.app/api/stripe/webhook`
- **Eventos a escuchar** (seleccionar estos 4):
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

---

## URL de mis cuentas

- **Vercel**: https://autocorefix.vercel.app
- **Supabase**: https://supabase.com (proyecto: syrksjucfnioapduqvwl)
- **GitHub**: https://github.com/Autocorefix/autocorefix

---

## Modo de prueba vs producción

Stripe tiene modo **Test** y modo **Live**. Para empezar usaré **modo Test** (las claves empiezan con `sk_test_` y `pk_test_`). En Test puedo usar tarjetas de prueba como `4242 4242 4242 4242` para simular pagos sin cobrar dinero real.

Cuando esté listo para cobrar dinero real, cambiaré a modo Live.

---

## Al terminar todo esto, la app debería:
1. Permitir registro → 14 días de trial gratis → acceso completo
2. Al expirar el trial → bloquear y mostrar página de planes
3. Al suscribirse → pago por Stripe → acceso restaurado automáticamente
4. El admin puede gestionar su suscripción desde Facturación en el menú lateral
