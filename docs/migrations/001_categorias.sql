-- ============================================================
-- MIGRACIÓN 001: Tabla categorias + migración de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Orden: 1. Crear tabla → 2. Insertar → 3. Migrar FK → 4. RLS
-- ============================================================

-- ── 1. CREAR TABLA categorias ────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        REFERENCES tenants(id) ON DELETE CASCADE,
  nombre           text        NOT NULL,
  is_system_default boolean    NOT NULL DEFAULT false,
  orden            int         NOT NULL DEFAULT 0,
  activo           boolean     NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- ── 2. INSERTAR 13 CATEGORÍAS DEL SISTEMA (tenant_id = NULL) ─
INSERT INTO categorias (nombre, is_system_default, orden) VALUES
  ('Cambio de Aceite y Filtros',   true,  1),
  ('Sistema de Frenos',            true,  2),
  ('Suspensión y Dirección',       true,  3),
  ('Alineación y Balanceo',        true,  4),
  ('Sistema Eléctrico y Batería',  true,  5),
  ('Sistema de Enfriamiento',      true,  6),
  ('Afinación de Motor',           true,  7),
  ('Transmisión y Embrague',       true,  8),
  ('Diagnóstico por Escáner',      true,  9),
  ('Aire Acondicionado',           true, 10),
  ('Sistema de Escape',            true, 11),
  ('Luces y Visibilidad',          true, 12),
  ('Reparación Mayor de Motor',    true, 13)
ON CONFLICT DO NOTHING;

-- ── 3. MIGRAR catalogo_servicios: texto → FK ─────────────────

-- 3a. Agregar columna (nullable durante migración)
ALTER TABLE catalogo_servicios
  ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES categorias(id);

-- 3b. Mapear categorías existentes a los nuevos IDs
UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Cambio de Aceite y Filtros' AND is_system_default = true
) WHERE categoria = 'Cambio de Aceite';

UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Suspensión y Dirección' AND is_system_default = true
) WHERE categoria IN ('Suspensión y Balanceo', 'Dirección');

UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Diagnóstico por Escáner' AND is_system_default = true
) WHERE categoria = 'Reparación de Motor y Scanner';

UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Aire Acondicionado' AND is_system_default = true
) WHERE categoria = 'Reparación de Clima';

UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Sistema de Frenos' AND is_system_default = true
) WHERE categoria = 'Frenos y Balatas';

UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Transmisión y Embrague' AND is_system_default = true
) WHERE categoria = 'Tracción General';

-- 3c. Catch-all: cualquier servicio sin mapear va a Reparación Mayor de Motor
UPDATE catalogo_servicios SET categoria_id = (
  SELECT id FROM categorias WHERE nombre = 'Reparación Mayor de Motor' AND is_system_default = true
) WHERE categoria_id IS NULL;

-- 3d. Hacer NOT NULL (todos los registros ya tienen categoria_id)
ALTER TABLE catalogo_servicios
  ALTER COLUMN categoria_id SET NOT NULL;

-- 3e. Eliminar columna de texto antigua
ALTER TABLE catalogo_servicios
  DROP COLUMN IF EXISTS categoria;

-- ── 4. RLS para categorias ───────────────────────────────────
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- SELECT: categorías del sistema (todas) + propias del tenant
CREATE POLICY "categorias_select" ON categorias
  FOR SELECT TO authenticated
  USING (is_system_default = true OR tenant_id = get_my_tenant_id());

-- INSERT: solo categorías propias del tenant, nunca del sistema
CREATE POLICY "categorias_insert" ON categorias
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_my_tenant_id() AND is_system_default = false);

-- UPDATE: solo categorías propias del tenant
CREATE POLICY "categorias_update" ON categorias
  FOR UPDATE TO authenticated
  USING (tenant_id = get_my_tenant_id() AND is_system_default = false);

-- DELETE: solo categorías propias del tenant
CREATE POLICY "categorias_delete" ON categorias
  FOR DELETE TO authenticated
  USING (tenant_id = get_my_tenant_id() AND is_system_default = false);

-- ── FIN DE MIGRACIÓN ─────────────────────────────────────────
-- Después de ejecutar este script:
-- 1. Regenerar tipos: npx supabase gen types typescript --project-id syrksjucfnioapduqvwl > src/types/database.types.ts
-- 2. Deploy: git add . && git commit -m "feat: categorias dinamicas" && git push
