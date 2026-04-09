# TuTableroDOR — Contexto para Claude

Plataforma interna de incentivos DOR 2026 para la Red BEI de BBVA México.
Reemplaza el proceso manual en Excel. La lógica del Manual DOR 2026 v3 está programada en el código.

**URLs:**
- Producción: https://tutablerodor.vercel.app (también: https://incentivapro.vercel.app)
- GitHub: https://github.com/kevinromoj97/incentivapro

---

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Supabase Auth + Postgres + RLS
- **Deploy:** Vercel (deploy manual con `npx vercel --prod --token ...` — el auto-deploy de GitHub está roto)
- **Node:** ~/.nvm/versions/node/v20.20.2

## Comandos

```bash
# Dev server
~/.nvm/versions/node/v20.20.2/bin/npm --prefix ~/Desktop/incentivapro run dev

# Deploy manual a producción (SIEMPRE usar esto — GitHub auto-deploy no funciona)
cd ~/Desktop/incentivapro && npx vercel --prod --token TU_VERCEL_TOKEN_AQUI --yes
```

---

## Supabase

- **URL:** https://jeygpytixmthidwphvkm.supabase.co
- **Anon key y service role:** en `.env.local`
- **SQL Editor:** para ejecutar migraciones manualmente (no hay CLI configurado)

### Migraciones ejecutadas

| Archivo | Descripción |
|---------|-------------|
| `001_schema.sql` | Schema completo: tablas, triggers, índices |
| `002_rls.sql` | Políticas RLS base |
| `003_user_rules.sql` | Reglas personales por ejecutivo + ranking upload abierto |
| `004_mediana_empresa_inf.sql` | INF Total combinado (INF_Rec + INF_NoRec, peso 17) + Clientes Target (peso 9) para Mediana Empresa |
| `005_additional_points.sql` | Tabla `additional_point_entries` para puntos adicionales (sostenibilidad, etc.) |

### SQL pendiente de ejecutar (si no está hecho)

```sql
-- Tabla puntos adicionales (005)
CREATE TABLE IF NOT EXISTS additional_point_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_id    uuid NOT NULL REFERENCES periods(id),
  year         int  NOT NULL,
  month        int  NOT NULL CHECK (month BETWEEN 1 AND 12),
  points       numeric(8,2) NOT NULL DEFAULT 0,
  description  text NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE additional_point_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_additional_points" ON additional_point_entries
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "admin_all_additional_points" ON additional_point_entries
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'admin'));
```

---

## Arquitectura de roles

| Rol | Acceso |
|-----|--------|
| `admin` | Todo, incluyendo `/admin/*` |
| `ejecutivo` | Dashboard, captura, ranking, simulador, cargar ranking, mis reglas, puntos adicionales |

### Protección de rutas

1. **`middleware.ts`** — rutas públicas: `/`, `/login`, `/register`; redirige `/admin/*` si no es admin
2. **Server Components** — validan `profile.role` y redirigen si no cumple
3. **Supabase RLS** — enforce a nivel BD independientemente del cliente

---

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@incentivapro.mx | Admin2026 | admin |
| kevin.romo@bbva.com | (ver Supabase) | ejecutivo — Mediana Empresa |

---

## Estructura de carpetas clave

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx       — auto-registro activado
├── (marketing)/
│   └── page.tsx                — landing page
└── (protected)/
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── captura/page.tsx
    ├── ranking/page.tsx
    ├── simulador/page.tsx
    ├── ingresos-no-recurrentes/
    ├── cargar-ranking/page.tsx  — ejecutivos
    ├── puntos-adicionales/page.tsx — sostenibilidad y bonos de oficina
    ├── mis-reglas/page.tsx      — reglas personales para ejecutivos
    └── admin/
        ├── ranking/page.tsx
        ├── usuarios/page.tsx
        ├── reglas/page.tsx
        └── periodos/page.tsx

features/
├── admin/         — RulesEditor, UsersAdmin
├── auth/          — LoginForm, RegisterForm
├── capture/       — CaptureTable
├── dashboard/     — DashboardView, DashboardCharts, IndicatorMatrix
├── additionalPoints/ — AdditionalPointsView
├── ranking/       — RankingView, RankingUploader
├── simulation/    — SimulatorView
├── nonRecurring/  — NRIView
└── user/          — UserRulesEditor

lib/
├── auth/          — client.ts, server.ts
├── calculations/  — calcConsecucion(), calcTotalPoints()
├── ranking/       — findCurrentRank(), calcProjectedRank()
└── db/queries.ts  — todas las queries tipadas

config/
├── indicators.ts
└── scoringRules.ts — DEFAULT_SCORING thresholds

components/layout/  — AppShell, Sidebar, Header
types/index.ts      — todos los tipos del dominio
```

---

## Schema DB relevante

### `scoring_rules`
```sql
id, indicator_id, position_id,
user_id uuid NULL,   -- NULL=global, uuid=override personal del ejecutivo
weight, min_logro, ppto_logro, max_logro,
min_cons, ppto_cons, max_cons,
config_json jsonb    -- campos extra: combines[], frequency, is_additional
```
- `config_json.combines`: array de códigos de indicadores que se suman (ej. INF Total)
- `config_json.frequency`: override de periodicidad personal del ejecutivo
- `config_json.is_additional`: true = aparece en sección "Indicadores Adicionales" del dashboard

### `additional_point_entries`
```sql
id, user_id, period_id, year, month, points, description, created_at, updated_at
```
- Puntos adicionales por oficina (ej. Sostenibilidad +2 pts/mes)
- Se suman al total del mes específico antes de calcular el promedio

### `rankings` / `ranking_entries`
- Cualquier usuario autenticado puede hacer INSERT
- UPDATE/DELETE solo admin

---

## Fórmula DOR 2026 (Anexo A) — CORREGIDA

```
logro = resultado / presupuesto

if logro < minLogro  → consecución = 0   ← IMPORTANTE: cero, NO interpolación
if logro minLogro–ppto → interpolación lineal minCons → pptoCons
if logro ppto–maxLogro → interpolación lineal pptoCons → maxCons
if logro > maxLogro  → consecución = maxCons (CAP 150%)

puntos_indicador = consecución × peso
```

Implementado en: `lib/calculations/index.ts` → `calcConsecucion()`

**Error anterior corregido:** la versión original interpolaba de 0 → minCons por debajo del mínimo, dando puntos incorrectos.

---

## Cálculo del promedio mensual (Dashboard)

```
promedio_mensual = Σ(puntos_indicadores_mes + puntos_adicionales_mes) / meses_con_puntos_>_0
```

- Solo cuentan meses donde `totalPoints > 0` (excluye meses con registros residuales en cero)
- Los puntos adicionales (`additional_point_entries`) se suman al mes correspondiente ANTES de dividir
- El promedio mensual (ej. 100.07) es el número principal del dashboard — es con el que se mide en el ranking

### Indicadores combinados (Mediana Empresa)
Para indicadores con `config_json.combines` (ej. INF Total = INF_Rec + INF_NoRec):
- Los sub-indicadores se capturan individualmente en Captura Mensual
- El dashboard hace dos pasadas: primero indicadores individuales, luego los combinados
- Los sub-indicadores absorbidos NO se calculan por separado

---

## Periodicidad

- Ejecutivos pueden sobreescribir la periodicidad de sus indicadores en **Mis Reglas**
- Se guarda en `scoring_rules.config_json.frequency`
- `getMergedScoringRules()` aplica los overrides personales sobre las reglas globales
- En Captura Mensual los meses que no aplican (según frecuencia) aparecen en gris/deshabilitados
- Botón 🗑 en cada fila de mes con datos para limpiar ese mes directamente

---

## Sidebar (components/layout/Sidebar.tsx)

Flags en `NavItem`:
- `adminOnly: true` — solo visible para admin
- `hideForAdmin: true` — solo visible para ejecutivos

---

## Patrones importantes

### Agregar una página para ejecutivos
1. Crear en `app/(protected)/nueva-ruta/page.tsx`
2. Sin check de `profile.role !== 'admin'`
3. Agregar a `NAV_ITEMS` en `Sidebar.tsx` con `hideForAdmin: true`

### Agregar una página solo para admin
1. Crear en `app/(protected)/admin/nueva-ruta/page.tsx`
2. Agregar check: `if (!profile || profile.role !== 'admin') redirect('/dashboard')`
3. Agregar a `NAV_ITEMS` con `adminOnly: true`

### Cambiar RLS / Schema
1. Crear `supabase/migrations/00N_descripcion.sql`
2. Pegar en Supabase → SQL Editor → Run
3. Actualizar tipos en `types/index.ts`
4. Actualizar queries en `lib/db/queries.ts`

### Deploy
```bash
# SIEMPRE deploy manual — GitHub auto-deploy está roto
cd ~/Desktop/incentivapro && npx vercel --prod --token TU_VERCEL_TOKEN_AQUI --yes
```

### Queries con user-scoped data
- Usar `profile.id` (no `user.id` de auth — son distintos UUIDs)
- Para bypass de RLS usar service role en `/api/` routes

---

## Cambios realizados en sesión 2 (abril 2026)

1. **Periodicidad editable en Mis Reglas** — select dropdown por indicador, se guarda en `config_json.frequency`
2. **Captura Mensual** — meses N/A según frecuencia aparecen en gris y deshabilitados; botón limpiar mes
3. **Dashboard rediseñado** — promedio mensual como métrica principal (estilo DOR real), tabla matriz indicador×mes con colores, sección Indicadores Base vs Adicionales
4. **Fix fórmula DOR** — `logro < minLogro` ahora da 0 puntos (antes interpolaba incorrectamente)
5. **Puntos adicionales** — nueva tabla y sección `/puntos-adicionales` para registrar sostenibilidad, bonos de oficina, etc. por mes
6. **Fix conteo de meses** — solo cuenta meses con `totalPoints > 0`, ignora registros residuales
7. **Rename** — IncentivaPro → TuTableroDOR; nueva URL: https://tutablerodor.vercel.app

---

## Cambios realizados en sesión 3 (abril 2026)

1. **Simulador rediseñado** (`features/simulation/SimulatorView.tsx`):
   - Muestra **todos los indicadores** como filas editables (no solo los con datos capturados)
   - **INF Total** como fila combinada (reemplaza INF No Recurrentes); se pre-llena sumando los sub-indicadores capturados (INF_Rec + INF_NoRec)
   - Los sub-indicadores absorbidos no se muestran como filas separadas
   - Usa `getMergedScoringRules` para respetar overrides personales de periodicidad
   - Nueva fila **Puntos Adicionales (sim)** al final de la tabla — pre-llena con el real del mes actual, editable
   - KPI principal: **promedio mensual** (igual que dashboard), incluye puntos adicionales por mes

2. **Fix proyección de ranking** (`lib/ranking/index.ts`):
   - `calcProjectedRank` ahora compara **promedios mensuales** en lugar de `total_points` anuales (unidades distintas)
   - Nueva función `competitorMonthlyAvg()`: calcula promedio de un competidor desde sus columnas `jan_pts`, `feb_pts`, etc. (solo meses con pts > 0)
   - **Fix crítico null===null**: cuando `employee_code` es null en el ranking (caso real), antes todos los competidores hacían match con el usuario. Ahora usa `full_name` como fallback
   - `calcProjectedRank` acepta 4º parámetro `employeeName` para el fallback por nombre
   - Dashboard y Simulador pasan `profile.full_name` al llamar la función

3. **Dashboard — card Proyección Cierre Mes**:
   - Card inferior derecho reemplazado: antes mostraba INF No Recurrentes, ahora muestra **posición proyectada si cierras el mes en curso con tu promedio actual**
   - Muestra cuántas posiciones subirías o bajarías respecto a tu posición actual en el ranking
   - Usa datos reales capturados (independiente del simulador)

4. **Header — PLAY THE GAME** (`components/layout/Header.tsx`):
   - Frase "PLAY THE GAME" en la esquina superior derecha de todas las páginas

5. **Frase motivacional en Dashboard**:
   - Card entre el hero y la gráfica con una frase aleatoria de 15 disponibles
   - Se elige al azar cada vez que el ejecutivo carga el dashboard
   - Frases orientadas a ventas, constancia y ranking

### Lógica de proyección de ranking (resumen)
- Los `employee_code` en el archivo de ranking subido son `null` para todos
- El match se hace por nombre (`employee_name.includes(full_name)`)
- La comparación es promedio mensual del usuario simulado vs promedio mensual de cada competidor
- Competidores con `mar_pts = 0` solo promedian enero+febrero — automáticamente "justo" sin necesidad de proyectar marzo manualmente
