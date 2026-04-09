-- ═══════════════════════════════════════════════════════════════════════════
-- IncentivaPro — Schema completo DOR 2026
-- Ejecutar en: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Puestos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS positions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       text UNIQUE NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── Ligas ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leagues (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       text UNIQUE NOT NULL,
  name       text NOT NULL
);

-- ─── Perfiles (1:1 con auth.users) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'ejecutivo'
                  CHECK (role IN ('admin','ejecutivo')),
  position_id   uuid REFERENCES positions(id),
  league_id     uuid REFERENCES leagues(id),
  employee_code text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── Periodos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS periods (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  year      int NOT NULL,
  name      text NOT NULL,
  is_active boolean NOT NULL DEFAULT false
);

-- ─── Indicadores ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS indicators (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code      text UNIQUE NOT NULL,
  name      text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('mensual','trimestral','semestral','anual')),
  is_active boolean NOT NULL DEFAULT true
);

-- ─── Reglas de scoring por puesto ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scoring_rules (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id uuid NOT NULL REFERENCES indicators(id),
  position_id  uuid NOT NULL REFERENCES positions(id),
  weight       numeric NOT NULL DEFAULT 0,
  min_logro    numeric NOT NULL DEFAULT 0.90,
  ppto_logro   numeric NOT NULL DEFAULT 1.00,
  max_logro    numeric NOT NULL DEFAULT 1.10,
  min_cons     numeric NOT NULL DEFAULT 0.50,
  ppto_cons    numeric NOT NULL DEFAULT 1.00,
  max_cons     numeric NOT NULL DEFAULT 1.50,
  config_json  jsonb,
  UNIQUE (indicator_id, position_id)
);

-- ─── Capturas mensuales ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_inputs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_id     uuid NOT NULL REFERENCES periods(id),
  indicator_id  uuid NOT NULL REFERENCES indicators(id),
  year          int NOT NULL,
  month         int NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_budget numeric NOT NULL DEFAULT 0,
  actual_result numeric NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, indicator_id, year, month)
);

-- ─── Ingresos no recurrentes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS non_recurring_income_entries (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_id   uuid NOT NULL REFERENCES periods(id),
  year        int NOT NULL,
  month       int NOT NULL CHECK (month BETWEEN 1 AND 12),
  client_name text NOT NULL,
  concept     text NOT NULL,
  amount      numeric NOT NULL DEFAULT 0,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ─── Cabecera de ranking nacional ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rankings (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id        uuid REFERENCES periods(id),
  year             int NOT NULL,
  period_name      text NOT NULL,
  source_file_name text,
  uploaded_by      uuid REFERENCES profiles(id),
  uploaded_at      timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- ─── Entradas del ranking nacional ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ranking_entries (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ranking_id    uuid NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
  rank_position int NOT NULL,
  employee_name text NOT NULL,
  employee_code text,
  position_name text,
  league        text,
  total_points  numeric NOT NULL DEFAULT 0,
  jan_pts       numeric,
  feb_pts       numeric,
  mar_pts       numeric,
  apr_pts       numeric,
  may_pts       numeric,
  jun_pts       numeric,
  jul_pts       numeric,
  aug_pts       numeric,
  sep_pts       numeric,
  oct_pts       numeric,
  nov_pts       numeric,
  dec_pts       numeric,
  created_at    timestamptz DEFAULT now()
);

-- ─── Simulaciones guardadas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulations (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  payload_json jsonb NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ─── Trigger: updated_at automático ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER monthly_inputs_updated_at
  BEFORE UPDATE ON monthly_inputs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER nri_updated_at
  BEFORE UPDATE ON non_recurring_income_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER simulations_updated_at
  BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: crear perfil al registrar usuario ───────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (auth_user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_monthly_inputs_user_year ON monthly_inputs(user_id, year);
CREATE INDEX IF NOT EXISTS idx_nri_user_year ON non_recurring_income_entries(user_id, year);
CREATE INDEX IF NOT EXISTS idx_ranking_entries_ranking ON ranking_entries(ranking_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_position ON scoring_rules(position_id);
