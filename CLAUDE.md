# AutoCoreFix - Contexto del Proyecto

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (DB + Auth) + lucide-react (iconos)
- Vercel (deploy) + GitHub (repo)
- Carpeta local: `D:\autocorefix`

## Cuentas y URLs
- GitHub: https://github.com/Autocorefix/autocorefix
- Supabase: https://syrksjucfnioapduqvwl.supabase.co
- Vercel: conectado al repo, deploy automático en push a `main`

## Producto
SaaS multi-tenant interno para talleres mecánicos. Solo acceden el dueño (admin) y la asistente (recepcionista). Sin portal de clientes. Interfaz simple y rápida — la asistente tiene poca experiencia técnica.

## Diseño
- Color primario: `#2563EB` (azul eléctrico)
- Fondo siempre blanco (`#FFFFFF`), sin colores oscuros
- Tipografía limpia, bordes sutiles, esquinas redondeadas

## Tablas en Supabase (todas con tenant_id para multi-tenancy)
- `tenants` — cada taller registrado
- `usuarios` — roles: `admin` (dueño) | `asistente` (recepcionista)
- `catalogo_servicios` — servicios con precio base configurable por el dueño
- `clientes` — nombre, teléfono, email
- `vehiculos` — placa, marca, modelo, año (vinculado a cliente)
- `ordenes` — estado: recibido | en_proceso | listo | entregado. Calcula automáticamente `descuento` y `pct_descuento`
- `orden_servicios` — detalle de servicios por orden con precio_base y precio_cobrado

## Catálogo de servicios (7 categorías)
1. Cambio de Aceite → sintético, mineral, semisintético
2. Suspensión y Balanceo → balanceo de llantas, alineación computarizada
3. Motor y Scanner → scanner y diagnóstico, revisión general de motor
4. Reparación de Clima → carga de gas refrigerante, revisión de sistema
5. Frenos y Balatas → cambio de balatas, rectificado de discos, revisión general
6. Dirección → corrección de dirección, cambio de terminales
7. Tracción General

## Flujo principal (recepcionista)
1. Llega cliente → buscar por nombre/teléfono o registrar nuevo (nombre, teléfono, email)
2. Registrar vehículo (placa, marca, modelo, año)
3. Seleccionar servicios por categoría → sub-servicios como botones
4. Precio base se carga automático, editable en la orden
5. Sistema calcula descuento en $ y % automáticamente
6. Guardar orden → estado inicial: recibido

## Reglas de negocio
- Precio base: definido por el dueño en el catálogo
- Precio cobrado: editable directamente por la asistente (sin calcular porcentajes)
- Sistema calcula: descuento = precio_base - precio_cobrado, % = (descuento / precio_base) × 100
- Los servicios del día salen el mismo día (no hay estadía de vehículos)

## Arquitectura de carpetas
```
src/
  app/
    page.tsx                    → redirect según sesión
    login/page.tsx              → login con email + contraseña
    dashboard/
      layout.tsx                → layout con Sidebar
      page.tsx                  → dashboard con métricas y tabla de órdenes
      catalogo/page.tsx         → catálogo de servicios
      nueva-orden/page.tsx      → crear orden de servicio
  components/
    Sidebar.tsx                 → navegación fija izquierda
  lib/
    supabase.ts                 → re-exporta browser client
    supabase-browser.ts         → cliente para componentes client
    supabase-server.ts          → cliente para server components
  middleware.ts                 → protección de rutas
```

## Estado actual
- [x] Auth con Supabase (email + contraseña)
- [x] Middleware protección de rutas
- [x] Layout + Sidebar con navegación
- [x] Dashboard con métricas y tabla de órdenes del día
- [x] Catálogo de servicios (datos hardcodeados)
- [x] Nueva Orden (datos hardcodeados)
- [ ] Conectar todas las páginas a Supabase (datos reales)
- [ ] CRUD real del catálogo (agregar/editar/desactivar servicios)
- [ ] Historial de clientes y vehículos
- [ ] Reportes de ventas y descuentos
- [ ] Diseño del login (mejorar UI)
- [ ] Fidelización (recordatorios WhatsApp/SMS)

## Convenciones
- Nombres de tablas en español (catalogo_servicios, ordenes, etc.)
- Código en inglés (componentes, variables, funciones)
- No crear ni modificar archivos sin confirmación explícita del usuario