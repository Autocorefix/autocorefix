-- ============================================================
-- DIAGNÓSTICO: ¿Cuántas categorías hay?
-- Ejecuta primero esto para ver el estado actual:
-- SELECT COUNT(*) FROM categorias;
-- ============================================================

-- Si el resultado es 0, ejecuta todo lo de abajo:

-- Insertar las 13 categorías del sistema (idempotente: no duplica si ya existen)
INSERT INTO categorias (nombre, is_system_default, orden, activo, tenant_id)
VALUES
  ('Cambio de Aceite y Filtros',   true,  1, true, NULL),
  ('Sistema de Frenos',            true,  2, true, NULL),
  ('Suspensión y Dirección',       true,  3, true, NULL),
  ('Alineación y Balanceo',        true,  4, true, NULL),
  ('Sistema Eléctrico y Batería',  true,  5, true, NULL),
  ('Sistema de Enfriamiento',      true,  6, true, NULL),
  ('Afinación de Motor',           true,  7, true, NULL),
  ('Transmisión y Embrague',       true,  8, true, NULL),
  ('Diagnóstico por Escáner',      true,  9, true, NULL),
  ('Aire Acondicionado',           true, 10, true, NULL),
  ('Sistema de Escape',            true, 11, true, NULL),
  ('Luces y Visibilidad',          true, 12, true, NULL),
  ('Reparación Mayor de Motor',    true, 13, true, NULL)
ON CONFLICT DO NOTHING;

-- Verificar que quedaron:
SELECT id, nombre, is_system_default, orden FROM categorias ORDER BY orden;
