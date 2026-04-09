-- ═══════════════════════════════════════════════════════════════════════════
-- IncentivaPro — Migración 004: INF combinado para Mediana Empresa
-- + Clientes Target para Mediana Empresa
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Eliminar reglas separadas de INF para Mediana Empresa ────────────────
DELETE FROM scoring_rules
WHERE position_id = '35a82a70-1a66-4168-90c3-cf145ab07877'
  AND indicator_id IN (
    'ac9436e1-bde4-4833-bd0f-113040c85d8f',  -- INF_RECURRENTES
    '0d7e2e04-d11e-4b6d-aade-de4dc24daa96'   -- INF_NO_RECURRENTES
  )
  AND user_id IS NULL;

-- ─── 2. Agregar regla INF_TOTAL combinada para Mediana Empresa (peso 17) ────
INSERT INTO scoring_rules
  (indicator_id, position_id, weight, min_logro, ppto_logro, max_logro, min_cons, ppto_cons, max_cons, config_json)
VALUES (
  '2f7b11ee-5e98-4c50-9198-1ec00815f530',   -- INF_TOTAL
  '35a82a70-1a66-4168-90c3-cf145ab07877',   -- Ejecutivo Empresarial (Mediana Empresa)
  17, 0.90, 1.00, 1.10, 0.50, 1.00, 1.50,
  '{"combines": ["INF_RECURRENTES", "INF_NO_RECURRENTES"]}'
);

-- ─── 3. Agregar Clientes Target para Mediana Empresa (peso 9) ────────────────
INSERT INTO scoring_rules
  (indicator_id, position_id, weight, min_logro, ppto_logro, max_logro, min_cons, ppto_cons, max_cons)
VALUES (
  'b0679a71-2a88-44f4-b8f7-d7377f750b95',   -- CLIENTES_TARGET
  '35a82a70-1a66-4168-90c3-cf145ab07877',   -- Ejecutivo Empresarial (Mediana Empresa)
  9, 0.90, 1.00, 1.10, 0.50, 1.00, 1.50
);
