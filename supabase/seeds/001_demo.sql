-- ═══════════════════════════════════════════════════════════════════════════
-- IncentivaPro — Datos demo (seed)
-- IMPORTANTE: Ejecutar DESPUÉS de crear los usuarios en Supabase Auth
-- Los UUIDs de auth_user_id deben reemplazarse con los IDs reales de tu proyecto.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Puestos ───────────────────────────────────────────────────────────────
INSERT INTO positions (code, name) VALUES
  ('EE_ME',  'Ejecutivo Empresarial (Mediana Empresa)'),
  ('EE_EMP', 'Ejecutivo Empresarial (Empresas)'),
  ('BC',     'Banquero Corporativo'),
  ('BE_GE',  'Banquero Empresarial Grandes Empresas'),
  ('BI',     'Banquero Institucional'),
  ('EG',     'Ejecutivo Gobierno'),
  ('DO',     'Director de Oficina'),
  ('DR',     'Director Regional')
ON CONFLICT (code) DO NOTHING;

-- ─── 2. Ligas ─────────────────────────────────────────────────────────────────
INSERT INTO leagues (code, name) VALUES
  ('CORPORATIVO',  'Corporativo'),
  ('GRANDES_EMP',  'Grandes Empresas'),
  ('EMPRESARIAL',  'Empresarial'),
  ('MEDIANA_EMP',  'Mediana Empresa'),
  ('GOBIERNO',     'Gobierno'),
  ('INSTITUCIONES','Instituciones')
ON CONFLICT (code) DO NOTHING;

-- ─── 3. Periodo activo ────────────────────────────────────────────────────────
INSERT INTO periods (year, name, is_active) VALUES
  (2026, 'Ejercicio 2026', true)
ON CONFLICT DO NOTHING;

-- ─── 4. Indicadores ───────────────────────────────────────────────────────────
INSERT INTO indicators (code, name, frequency) VALUES
  ('RORC_CNN',           'RORC / Compromisos CNN',          'semestral'),
  ('INF_RECURRENTES',    'INF Recurrentes',                 'mensual'),
  ('INF_NO_RECURRENTES', 'INF No Recurrentes',              'trimestral'),
  ('INF_TOTAL',          'INF Total',                       'trimestral'),
  ('VISTA_MN',           'Vista MN (sin Intereses)',        'mensual'),
  ('RESTO_CAPTACION',    'Resto de Captación',              'mensual'),
  ('CARTERA_SEGMENTOS',  'Cartera por Segmentos',           'trimestral'),
  ('COLOCACION_SOST',    'Colocación Sostenible',           'semestral'),
  ('NUEVOS_GRUPOS',      'Nuevos Grupos Acreditados',       'anual'),
  ('STOCK_NOMINA',       'Stock Nómina',                    'semestral'),
  ('CLIENTES_TARGET',    'Clientes Target',                 'semestral'),
  ('ONE_TEAM',           'One Team',                        'trimestral'),
  ('AACC',               'Acciones Comerciales',            'trimestral'),
  ('PROD_ESTRATEGICOS',  'Productos Estratégicos',          'semestral')
ON CONFLICT (code) DO NOTHING;

-- ─── 5. Reglas de scoring — EE Mediana Empresa ───────────────────────────────
-- Usando subquery para obtener IDs
DO $$
DECLARE
  pos_id uuid := (SELECT id FROM positions WHERE code = 'EE_ME');
BEGIN
  INSERT INTO scoring_rules (indicator_id, position_id, weight) VALUES
    ((SELECT id FROM indicators WHERE code = 'INF_RECURRENTES'),    pos_id, 17),
    ((SELECT id FROM indicators WHERE code = 'INF_NO_RECURRENTES'), pos_id, 18),
    ((SELECT id FROM indicators WHERE code = 'VISTA_MN'),           pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'RESTO_CAPTACION'),    pos_id, 16),
    ((SELECT id FROM indicators WHERE code = 'CARTERA_SEGMENTOS'),  pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'COLOCACION_SOST'),    pos_id, 12),
    ((SELECT id FROM indicators WHERE code = 'NUEVOS_GRUPOS'),      pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'STOCK_NOMINA'),       pos_id,  9),
    ((SELECT id FROM indicators WHERE code = 'ONE_TEAM'),           pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'AACC'),               pos_id, 10),
    ((SELECT id FROM indicators WHERE code = 'PROD_ESTRATEGICOS'),  pos_id,  7)
  ON CONFLICT (indicator_id, position_id) DO UPDATE SET weight = EXCLUDED.weight;
END $$;

-- ─── 6. Reglas de scoring — EE Empresas ──────────────────────────────────────
DO $$
DECLARE
  pos_id uuid := (SELECT id FROM positions WHERE code = 'EE_EMP');
BEGIN
  INSERT INTO scoring_rules (indicator_id, position_id, weight) VALUES
    ((SELECT id FROM indicators WHERE code = 'RORC_CNN'),           pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'INF_RECURRENTES'),    pos_id, 10),
    ((SELECT id FROM indicators WHERE code = 'INF_NO_RECURRENTES'), pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'VISTA_MN'),           pos_id, 15),
    ((SELECT id FROM indicators WHERE code = 'RESTO_CAPTACION'),    pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'CARTERA_SEGMENTOS'),  pos_id, 16),
    ((SELECT id FROM indicators WHERE code = 'COLOCACION_SOST'),    pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'NUEVOS_GRUPOS'),      pos_id, 10),
    ((SELECT id FROM indicators WHERE code = 'STOCK_NOMINA'),       pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'CLIENTES_TARGET'),    pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'ONE_TEAM'),           pos_id,  7),
    ((SELECT id FROM indicators WHERE code = 'AACC'),               pos_id, 10),
    ((SELECT id FROM indicators WHERE code = 'PROD_ESTRATEGICOS'),  pos_id,  7)
  ON CONFLICT (indicator_id, position_id) DO UPDATE SET weight = EXCLUDED.weight;
END $$;

-- ─── NOTA IMPORTANTE: Usuarios ────────────────────────────────────────────────
-- Los perfiles de usuario se crean automáticamente cuando creas usuarios en Supabase Auth.
-- Ve a Authentication > Users en el panel de Supabase y crea:
--
--   admin@incentivapro.mx   / Admin2026!  (luego actualiza role='admin')
--   ana.garcia@bbva.com     / Ejecutivo2026!
--   carlos.lopez@bbva.com   / Ejecutivo2026!
--   diana.torres@bbva.com   / Ejecutivo2026!
--
-- Después ejecuta esto para asignar roles y puestos (reemplaza los emails):
--
--   UPDATE profiles SET role='admin' WHERE email='admin@incentivapro.mx';
--
--   UPDATE profiles SET
--     position_id = (SELECT id FROM positions WHERE code = 'EE_ME'),
--     league_id   = (SELECT id FROM leagues WHERE code = 'MEDIANA_EMP'),
--     full_name   = 'Ana García López',
--     employee_code = 'EMP-001'
--   WHERE email = 'ana.garcia@bbva.com';
--
--   UPDATE profiles SET
--     position_id = (SELECT id FROM positions WHERE code = 'EE_EMP'),
--     league_id   = (SELECT id FROM leagues WHERE code = 'EMPRESARIAL'),
--     full_name   = 'Carlos López Martínez',
--     employee_code = 'EMP-002'
--   WHERE email = 'carlos.lopez@bbva.com';
