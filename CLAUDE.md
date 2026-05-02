# AutoCoreFix - Contexto del Proyecto

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (DB + Auth)
- Vercel (deploy) + GitHub (repo)
- Carpeta local: `D:\autocorefix`

## Cuentas y URLs
- GitHub: https://github.com/Autocorefix/autocorefix
- Supabase: https://syrksjucfnioapduqvwl.supabase.co
- Vercel: conectado al repo, deploy automático en push a `main`

## Producto
SaaS multi-tenant para talleres mecánicos. Cada taller es un `tenant` aislado. La interfaz la usa una recepcionista con poca experiencia técnica — debe ser simple y rápida.

## Tablas en Supabase (todas con tenant_id para multi-tenancy)
- `tenants` — cada taller registrado
- `usuarios` — roles: `admin` (dueño) | `asistente` (recepcionista)
- `catalogo_servicios` — servicios con precio base configurable por el dueño
- `clientes` — nombre, teléfono, email
- `vehiculos` — placa, marca, modelo, año (vinculado a cliente)
- `ordenes` — estado: recibido | en_proceso | listo | entregado. Calcula automáticamente `descuento` y `pct_descuento`
- `orden_servicios` — detalle de servicios por orden con precio_base y precio_cobrado

## Flujo principal (recepcionista)
1. Llega cliente → registrar cliente + vehículo (si es nuevo)
2. Abrir orden de servicio
3. Seleccionar servicios del catálogo (botones por categoría)
4. Precio base se carga automático, editable en la orden
5. Cerrar orden → registra total_cobrado, calcula descuento y % descuento

## Catálogo inicial de servicios (7 categorías)
1. Cambio de aceite (sub-servicios: sintético, mineral, semisintético)
2. Suspensión y Balanceo
3. Reparación de Motor y Scanner
4. Reparación de Clima
5. Frenos y Balatas (sub-servicios: cambio de balatas, rectificado de discos, revisión general)
6. Dirección
7. Tracción General

## Reglas de negocio
- Precio base: lo define el dueño en el catálogo
- Precio cobrado: editable por la asistente en cada orden (campo directo, sin calcular porcentajes)
- El sistema calcula automáticamente: descuento en $ y % descuento
- Servicios del día salen el mismo día (no hay estadía de vehículos)

## Pendiente por construir
- [ ] Auth (login con Supabase Auth)
- [ ] Layout principal con navegación
- [ ] Pantalla de crear orden (flujo principal)
- [ ] Catálogo de servicios (CRUD para el admin)
- [ ] Historial de clientes y vehículos
- [ ] Reportes de descuentos y ventas
- [ ] Fidelización (recordatorios por WhatsApp/SMS)

## Arquitectura de carpetas (src/)
```
src/
  app/          → páginas (App Router)
  lib/
    supabase.ts → cliente Supabase (ya creado)
  components/   → componentes reutilizables
  types/        → tipos TypeScript
```

## Convenciones
- Nombres de tablas en español (catalogo_servicios, ordenes, etc.)
- Código en inglés (componentes, variables, funciones)
- No crear código sin confirmación explícita del usuario

## Diseño
- Color primario: #0EA5E9
- Fondo siempre blanco, sin colores oscuros
- Sistema interno: no hay portal de clientes