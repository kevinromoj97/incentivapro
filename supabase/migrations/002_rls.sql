-- ═══════════════════════════════════════════════════════════════════════════
-- IncentivaPro — Row Level Security (RLS)
-- Ejecutar DESPUÉS de 001_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Función auxiliar: obtiene el rol del usuario actual desde profiles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función auxiliar: obtiene el profile_id del usuario actual
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── profiles ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin ve todo; ejecutivo solo su propio perfil
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (get_my_role() = 'admin' OR auth_user_id = auth.uid());

-- Solo admin puede insertar perfiles (via service role / admin client)
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Admin puede actualizar cualquier perfil; ejecutivo solo el suyo
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (get_my_role() = 'admin' OR auth_user_id = auth.uid());

-- Solo admin puede eliminar
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (get_my_role() = 'admin');

-- ─── positions, leagues (catálogos de solo lectura para todos) ────────────────
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "positions_select" ON positions FOR SELECT USING (true);
CREATE POLICY "positions_write"  ON positions FOR ALL USING (get_my_role() = 'admin');

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leagues_select" ON leagues FOR SELECT USING (true);
CREATE POLICY "leagues_write"  ON leagues FOR ALL USING (get_my_role() = 'admin');

-- ─── periods ──────────────────────────────────────────────────────────────────
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periods_select" ON periods FOR SELECT USING (true);
CREATE POLICY "periods_write"  ON periods FOR ALL USING (get_my_role() = 'admin');

-- ─── indicators ───────────────────────────────────────────────────────────────
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indicators_select" ON indicators FOR SELECT USING (true);
CREATE POLICY "indicators_write"  ON indicators FOR ALL USING (get_my_role() = 'admin');

-- ─── scoring_rules ────────────────────────────────────────────────────────────
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoring_rules_select" ON scoring_rules FOR SELECT USING (true);
CREATE POLICY "scoring_rules_write"  ON scoring_rules FOR ALL USING (get_my_role() = 'admin');

-- ─── monthly_inputs ───────────────────────────────────────────────────────────
ALTER TABLE monthly_inputs ENABLE ROW LEVEL SECURITY;

-- Ejecutivo solo ve/edita sus propios datos; admin ve todo
CREATE POLICY "monthly_inputs_select" ON monthly_inputs FOR SELECT
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "monthly_inputs_insert" ON monthly_inputs FOR INSERT
  WITH CHECK (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "monthly_inputs_update" ON monthly_inputs FOR UPDATE
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "monthly_inputs_delete" ON monthly_inputs FOR DELETE
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

-- ─── non_recurring_income_entries ─────────────────────────────────────────────
ALTER TABLE non_recurring_income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nri_select" ON non_recurring_income_entries FOR SELECT
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "nri_insert" ON non_recurring_income_entries FOR INSERT
  WITH CHECK (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "nri_update" ON non_recurring_income_entries FOR UPDATE
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "nri_delete" ON non_recurring_income_entries FOR DELETE
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

-- ─── rankings ─────────────────────────────────────────────────────────────────
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver; solo admin puede insertar
CREATE POLICY "rankings_select" ON rankings FOR SELECT USING (true);
CREATE POLICY "rankings_insert" ON rankings FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "rankings_update" ON rankings FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "rankings_delete" ON rankings FOR DELETE USING (get_my_role() = 'admin');

-- ─── ranking_entries ──────────────────────────────────────────────────────────
ALTER TABLE ranking_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_entries_select" ON ranking_entries FOR SELECT USING (true);
CREATE POLICY "ranking_entries_insert" ON ranking_entries FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "ranking_entries_delete" ON ranking_entries FOR DELETE USING (get_my_role() = 'admin');

-- ─── simulations ──────────────────────────────────────────────────────────────
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulations_select" ON simulations FOR SELECT
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "simulations_insert" ON simulations FOR INSERT
  WITH CHECK (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "simulations_update" ON simulations FOR UPDATE
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());

CREATE POLICY "simulations_delete" ON simulations FOR DELETE
  USING (get_my_role() = 'admin' OR user_id = get_my_profile_id());
