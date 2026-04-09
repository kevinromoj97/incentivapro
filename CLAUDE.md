# IncentivaPro — Contexto para Claude

Plataforma interna de incentivos DOR 2026 para la Red BEI de BBVA México.
Reemplaza el proceso manual en Excel. La lógica del Manual DOR 2026 v3 está programada en el código.

---

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Supabase Auth + Postgres + RLS
- **Utilidades:** xlsx (parseo de Excel), Vercel (deploy)
- **Node:** ~/.nvm/versions/node/v20.20.2

## Comandos

```bash
# Dev server
~/.nvm/versions/node/v20.20.2/bin/npm --prefix ~/Desktop/incentivapro run dev

# Type check
~/.nvm/versions/node/v20.20.2/bin/node node_modules/.bin/tsc --noEmit --project tsconfig.json
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

---

## Arquitectura de roles

| Rol | Acceso |
|-----|--------|
| `admin` | Todo, incluyendo `/admin/*` |
| `ejecutivo` | Dashboard, captura, ranking, simulador, cargar ranking, mis reglas |

### Protección de rutas

1. **`middleware.ts`** — rutas públicas: `/`, `/login`, `/register`; redirige `/admin/*` si no es admin
2. **Server Components** — validan `profile.role` y redirigen si no cumple
3. **Supabase RLS** — enforce a nivel BD independientemente del cliente

---

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@incentivapro.mx | Admin2026 | admin |
| ana.garcia@bbva.com | (ver Supabase) | ejecutivo |
| carlos.lopez@bbva.com | (ver Supabase) | ejecutivo |
| diana.torres@bbva.com | (ver Supabase) | ejecutivo |

---

## Estructura de carpetas clave

```
app/
├── (auth)/
│   ├── login/page.tsx          — pública
│   └── register/page.tsx       — pública (auto-registro activado)
├── (marketing)/
│   └── page.tsx                — landing page
└── (protected)/                — requiere auth
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── captura/page.tsx
    ├── ranking/page.tsx         — solo visualización
    ├── simulador/page.tsx
    ├── ingresos-no-recurrentes/
    ├── cargar-ranking/page.tsx  — upload para ejecutivos
    ├── mis-reglas/page.tsx      — reglas personales para ejecutivos
    └── admin/                   — solo admin
        ├── ranking/page.tsx
        ├── usuarios/page.tsx
        ├── reglas/page.tsx
        └── periodos/page.tsx

features/
├── admin/         — RulesEditor, UsersAdmin, actions.ts
├── auth/          — LoginForm, RegisterForm
├── capture/       — CaptureForm
├── dashboard/     — DashboardView, métricas
├── ranking/       — RankingView, RankingUploader
├── simulation/    — SimulatorView
├── nonRecurring/  — NRIForm
└── user/          — UserRulesEditor ← nuevo

lib/
├── auth/          — client.ts, server.ts (createAdminClient para service role)
├── calculations/  — calcConsecucion(), calcTotalPoints()
└── db/queries.ts  — todas las queries tipadas

config/
├── indicators.ts  — catálogo de indicadores y pesos por puesto
└── scoringRules.ts — DEFAULT_SCORING thresholds

supabase/migrations/
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
min_cons, ppto_cons, max_cons, config_json
```
- Índice parcial global: `(indicator_id, position_id) WHERE user_id IS NULL`
- Índice parcial personal: `(indicator_id, position_id, user_id) WHERE user_id IS NOT NULL`

### `rankings` / `ranking_entries`
- Cualquier usuario autenticado puede hacer INSERT (RLS actualizado en 003)
- UPDATE/DELETE solo admin

---

## Fórmula DOR 2026 (Anexo A)

```
logro = resultado / presupuesto

if logro < 90%   → consecución = interpolación lineal 0% → 50%
if logro 90-100% → consecución = interpolación lineal 50% → 100%
if logro 100-110%→ consecución = interpolación lineal 100% → 150%
if logro > 110%  → consecución = 150% (CAP)

puntos_indicador = consecución × peso
```

Implementado en: `lib/calculations/index.ts` → `calcConsecucion()`

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
3. Agregar a `NAV_ITEMS` en `Sidebar.tsx` (sin flags o con `hideForAdmin: true`)

### Agregar una página solo para admin
1. Crear en `app/(protected)/admin/nueva-ruta/page.tsx`
2. Agregar check: `if (!profile || profile.role !== 'admin') redirect('/dashboard')`
3. Agregar a `NAV_ITEMS` con `adminOnly: true`

### Cambiar RLS / Schema
1. Crear `supabase/migrations/00N_descripcion.sql`
2. Pegar en Supabase → SQL Editor → Run
3. Actualizar tipos en `types/index.ts` si aplica
4. Actualizar queries en `lib/db/queries.ts`

### Queries con user-scoped data
Usar siempre `get_my_profile_id()` en RLS (función auxiliar definida en `002_rls.sql`).
En queries TS, pasar `profile.id` (no `user.id` de auth — son distintos).
