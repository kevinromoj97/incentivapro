-- ═══════════════════════════════════════════════════════════════════════════
-- IncentivaPro — Migración 003: Reglas personales de usuario
-- Permite que cada ejecutivo tenga sus propios overrides de scoring_rules.
-- Ejecutar DESPUÉS de 002_rls.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Agregar user_id a scoring_rules ──────────────────────────────────────
ALTER TABLE scoring_rules
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- ─── 2. Reemplazar el UNIQUE (indicator_id, position_id) con índices parciales
--        para soportar reglas globales (user_id IS NULL) y personales por separado
ALTER TABLE scoring_rules
  DROP CONSTRAINT IF EXISTS scoring_rules_indicator_id_position_id_key;

-- Una sola regla global por (indicador, puesto)
CREATE UNIQUE INDEX IF NOT EXISTS scoring_rules_global_unique
  ON scoring_rules (indicator_id, position_id)
  WHERE user_id IS NULL;

-- Una sola regla personal por (indicador, puesto, usuario)
CREATE UNIQUE INDEX IF NOT EXISTS scoring_rules_user_unique
  ON scoring_rules (indicator_id, position_id, user_id)
  WHERE user_id IS NOT NULL;

-- ─── 3. Actualizar políticas RLS de scoring_rules ─────────────────────────────
DROP POLICY IF EXISTS "scoring_rules_select" ON scoring_rules;
DROP POLICY IF EXISTS "scoring_rules_write"  ON scoring_rules;

-- SELECT: todos ven las reglas globales; cada quien ve las suyas propias
CREATE POLICY "scoring_rules_select" ON scoring_rules FOR SELECT
  USING (
    user_id IS NULL
    OR get_my_role() = 'admin'
    OR user_id = get_my_profile_id()
  );

-- INSERT: admin crea reglas globales (user_id IS NULL); ejecutivos crean las suyas
CREATE POLICY "scoring_rules_insert" ON scoring_rules FOR INSERT
  WITH CHECK (
    (user_id IS NULL AND get_my_role() = 'admin')
    OR (user_id IS NOT NULL AND user_id = get_my_profile_id())
  );

-- UPDATE: admin actualiza cualquiera; ejecutivos solo las suyas
CREATE POLICY "scoring_rules_update" ON scoring_rules FOR UPDATE
  USING (
    get_my_role() = 'admin'
    OR user_id = get_my_profile_id()
  );

-- DELETE: admin borra cualquiera; ejecutivos solo las suyas
CREATE POLICY "scoring_rules_delete" ON scoring_rules FOR DELETE
  USING (
    get_my_role() = 'admin'
    OR user_id = get_my_profile_id()
  );

-- ─── 4. Permitir que cualquier usuario autenticado cargue rankings ─────────────
DROP POLICY IF EXISTS "rankings_insert"       ON rankings;
DROP POLICY IF EXISTS "ranking_entries_insert" ON ranking_entries;

CREATE POLICY "rankings_insert" ON rankings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ranking_entries_insert" ON ranking_entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
