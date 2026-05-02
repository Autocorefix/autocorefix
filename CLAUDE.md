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
- `categorias` — categorías de servicio. `is_system_default=true` → imborrables (sistema). `tenant_id=NULL` para sistema, uuid para personalizadas
- `catalogo_servicios` — servicios con precio base. FK `categoria_id → categorias.id`
- `clientes` — nombre, teléfono, email
- `vehiculos` — marca, modelo, año (vinculado a cliente)
- `ordenes` — estado: recibido | en_proceso | listo | entregado. Calcula automáticamente `descuento` y `pct_descuento`
- `orden_servicios` — detalle de servicios por orden con precio_base y precio_cobrado

## Catálogo de servicios (13 categorías del sistema + personalizadas por tenant)
Categorías del sistema (`is_system_default = true`, imborrables):
1. Cambio de Aceite y Filtros
2. Sistema de Frenos
3. Suspensión y Dirección
4. Alineación y Balanceo
5. Sistema Eléctrico y Batería
6. Sistema de Enfriamiento
7. Afinación de Motor
8. Transmisión y Embrague
9. Diagnóstico por Escáner
10. Aire Acondicionado
11. Sistema de Escape
12. Luces y Visibilidad
13. Reparación Mayor de Motor

Los sub-servicios (registros en `catalogo_servicios`) son creados, editados y eliminados por el dueño.
Eliminar servicio con historial en `orden_servicios` → bloqueado, solo desactivar.
Eliminar categoría con servicios activos → bloqueado.

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
- Descuento: el usuario ingresa el precio final, el sistema calcula descuento en $ y %
- cliente_id: se genera automático con prefijo del tenant + 4 dígitos (ej. ACF-0001)
- Placa eliminada del modelo de vehículos (poco confiable en México)

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
- [x] RLS activo con políticas en las 7 tablas
- [x] Trigger auto-insert en usuarios al registrarse en Auth
- [x] Helper function get_my_tenant_id()
- [x] Tenant "AutoCoreFix" creado (e8cb863c-d745-46f1-875b-838c62c2caa4)
- [x] Usuario admin vinculado a Auth (d499fb64-37db-4377-b6ba-a2ff00f8d3d0)
- [x] Tipos TypeScript generados desde Supabase (src/types/database.types.ts)
- [x] Clientes Supabase tipados con Database (supabase-browser.ts y supabase-server.ts)
- [x] Dashboard conectado a Supabase (datos reales)
- [x] Catálogo conectado a Supabase con CRUD real (agregar, editar, toggle activo, eliminar con validación)
- [x] Categorías dinámicas desde Supabase (13 del sistema + personalizadas por tenant)
- [x] Gestión de categorías en catálogo: crear y eliminar personalizadas
- [x] Nueva Orden conectada a Supabase (cliente, vehículo, servicios, orden)
- [x] Búsqueda de clientes por nombre, teléfono, email o ID
- [x] Generación automática de cliente_id (prefijo + 4 dígitos)
- [x] Historial de vehículos por cliente
- [x] Descuento por precio final con cálculo automático de %
- [x] Página Clientes con historial de órdenes y vehículos por cliente
- [x] Búsqueda de clientes en tiempo real
- [x] Tipos TypeScript sincronizados con schema real (database.types.ts)
- [x] Catálogo y Nueva Orden completamente conectados a Supabase
- [x] CRUD real del catálogo (crear, editar, toggle, eliminar con validación)
- [x] Nueva Orden responsive (mobile/tablet/desktop)
- [x] Categorías compactas en grid 3 columnas con íconos
- [ ] Reportes de ventas y descuentos
- [ ] Diseño del login (mejorar UI)
- [ ] Fidelización (recordatorios WhatsApp/SMS)

## Convenciones
- Nombres de tablas en español (catalogo_servicios, ordenes, etc.)
- Código en inglés (componentes, variables, funciones)
- No crear ni modificar archivos sin confirmación explícita del usuario