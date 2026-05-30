-- Migración 003: Módulo de facturación
-- Ejecutar en el SQL Editor de Supabase

-- 1. Campos de datos fiscales en tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS rfc TEXT,
  ADD COLUMN IF NOT EXISTS razon_social TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5),
  ADD COLUMN IF NOT EXISTS regimen_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS uso_cfdi TEXT DEFAULT 'G03',
  ADD COLUMN IF NOT EXISTS email_facturacion TEXT;

-- 2. Tabla de solicitudes de factura
CREATE TABLE IF NOT EXISTS factura_solicitudes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  periodo         TEXT         NOT NULL,
  monto           NUMERIC(10,2) NOT NULL,
  rfc             TEXT         NOT NULL,
  razon_social    TEXT         NOT NULL,
  codigo_postal   TEXT         NOT NULL,
  regimen_fiscal  TEXT         NOT NULL,
  uso_cfdi        TEXT         NOT NULL,
  email_facturacion TEXT       NOT NULL,
  nombre_taller   TEXT,
  estado          TEXT         NOT NULL DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente', 'emitida')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  emitida_at      TIMESTAMPTZ
);

-- 3. RLS para factura_solicitudes
ALTER TABLE factura_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_solicitudes_select" ON factura_solicitudes
  FOR SELECT USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_solicitudes_insert" ON factura_solicitudes
  FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());
