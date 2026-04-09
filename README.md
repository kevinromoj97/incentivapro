# IncentivaPro — Plataforma DOR 2026

Plataforma web interna para el seguimiento de incentivos, puntos DOR y ranking de la Red Empresas e Instituciones (BEI). Reemplaza el proceso manual en Excel/Google Sheets.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **Recharts** (gráficas)
- **Supabase** (Auth + Postgres + RLS)
- **xlsx** (importación de Excel)
- **Vercel** (deploy)

---

## Instalación local

### Pre-requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis para deploy)

### 1. Instalar dependencias

```bash
cd incentivapro
npm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En el panel de Supabase, ve a **SQL Editor** y ejecuta en orden:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/seeds/001_demo.sql`

3. En **Authentication > Users**, crea los usuarios:
   - `admin@incentivapro.mx` / `Admin2026!`
   - `ana.garcia@bbva.com` / `Ejecutivo2026!`
   - `carlos.lopez@bbva.com` / `Ejecutivo2026!`

4. En **SQL Editor**, asigna roles:
```sql
-- Hacer admin
UPDATE profiles SET role='admin' WHERE email='admin@incentivapro.mx';

-- Asignar puestos a ejecutivos
UPDATE profiles SET
  position_id = (SELECT id FROM positions WHERE code = 'EE_ME'),
  league_id   = (SELECT id FROM leagues WHERE code = 'MEDIANA_EMP'),
  full_name   = 'Ana García López',
  employee_code = 'EMP-001'
WHERE email = 'ana.garcia@bbva.com';

UPDATE profiles SET
  position_id = (SELECT id FROM positions WHERE code = 'EE_EMP'),
  league_id   = (SELECT id FROM leagues WHERE code = 'EMPRESARIAL'),
  full_name   = 'Carlos López Martínez',
  employee_code = 'EMP-002'
WHERE email = 'carlos.lopez@bbva.com';
```

5. Obtén tus credenciales en **Settings > API**:
   - Project URL
   - anon public key
   - service_role key (privada)

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 4. Correr localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "feat: IncentivaPro MVP"
git branch -M main
git remote add origin https://github.com/tu-usuario/incentivapro.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. **New Project** → importa tu repositorio de GitHub
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Haz clic en **Deploy**
5. Vercel genera un URL tipo `https://incentivapro.vercel.app`

### 3. URL estable

- Puedes configurar un dominio personalizado en Vercel Settings
- Comparte el URL con tu equipo
- El acceso está protegido por login — nadie puede ver nada sin credenciales

---

## Archivos clave para personalizar

### Cambiar colores / paleta visual

```
/config/theme/tokens.ts    ← Edita aquí los colores BBVA
/tailwind.config.ts        ← Extiende los tokens a Tailwind
/app/globals.css           ← Variables CSS root (compatible con shadcn)
```

### Cambiar fórmulas de puntos (Anexo A)

```
/config/scoringRules.ts    ← Umbrales de consecución (90%→50%, 100%→100%, 110%→150%)
/lib/calculations/index.ts ← Función calcConsecucion() — lógica principal
```

### Cambiar pesos por indicador/puesto

```
/config/indicators.ts      ← WEIGHTS_EE_ME, WEIGHTS_EE_EMP, WEIGHTS_BC, WEIGHTS_BE_GE
```

Los pesos también se guardan en la base de datos (`scoring_rules`) y son editables desde el panel de admin en `/admin/reglas`.

### Agregar nuevos puestos

1. Agrega el puesto en `config/positions.ts`
2. Define sus pesos en `config/indicators.ts`
3. Inserta en la BD: `INSERT INTO positions (code, name) VALUES (...)`
4. Inserta las reglas de scoring correspondientes en `scoring_rules`

### Cambiar indicadores

```
/config/indicators.ts      ← INDICATORS (catálogo maestro)
supabase/seeds/001_demo.sql ← Seeds de indicadores en BD
```

---

## Cómo queda guardada la información

Cada ejecutivo tiene un registro en `profiles` vinculado a su cuenta de Supabase Auth.

- Sus capturas mensuales → tabla `monthly_inputs` (filtrada por `user_id`)
- Sus ingresos no recurrentes → tabla `non_recurring_income_entries` (filtrada por `user_id`)
- Sus simulaciones → tabla `simulations` (filtrada por `user_id`)

Las políticas **Row Level Security (RLS)** en Supabase garantizan que:
- Un ejecutivo **nunca puede ver datos de otro** ejecutivo
- Solo el **admin puede ver todo** y gestionar catálogos
- Solo el **admin puede cargar rankings**

---

## Módulos disponibles

| Ruta | Quién | Descripción |
|---|---|---|
| `/` | Público | Landing page corporativa |
| `/login` | Público | Inicio de sesión |
| `/dashboard` | Ejecutivo/Admin | KPIs, gráficas, semáforos |
| `/captura` | Ejecutivo/Admin | Captura mensual ppto+logro |
| `/ingresos-no-recurrentes` | Ejecutivo/Admin | Registro INF NR |
| `/simulador` | Ejecutivo/Admin | Simulación de escenarios |
| `/ranking` | Ejecutivo/Admin | Ranking nacional |
| `/admin/usuarios` | Solo Admin | Crear/editar usuarios |
| `/admin/ranking` | Solo Admin | Cargar Excel de ranking |
| `/admin/reglas` | Solo Admin | Editar reglas de scoring |

---

## Lógica DOR 2026

### Fórmula de consecución (Anexo A del manual)

```
Logro = Realizado / Presupuesto

Si Logro < 90%:    Consecución = (Logro / 90%) × 50%
Si 90% ≤ Logro ≤ 100%: Consecución = 50% + ((Logro - 90%) / 10%) × 50%
Si 100% < Logro ≤ 110%: Consecución = 100% + ((Logro - 100%) / 10%) × 50%
Si Logro > 110%:   Consecución = 150% (tope)

Puntos indicador = Consecución × Peso del indicador
Puntos totales   = Σ Puntos de todos los indicadores
```

### Proyección anual

```
Proyectado = Promedio(puntos meses con datos) × 12
Ecualizados = (Puntos acumulados / Meses capturados) × 12
```

### Pesos por puesto (principales)

| Indicador | EE Mediana Empresa | EE Empresas |
|---|---|---|
| INF Recurrentes | 17 | 10 |
| INF No Recurrentes | 18 | 7 |
| Vista MN | 7 | 15 |
| Resto Captación | 16 | 7 |
| Cartera por Segmentos | 7 | 16 |
| Colocación Sostenible | 12 | 7 |
| RORC/CNN | — | 7 |
| Nuevos Grupos Acred. | 7 | 10 |
| Stock Nómina | 9 | 7 |
| Clientes Target | — | 7 |
| One Team | 7 | 7 |
| **Total** | **100** | **100** |

---

## Nota sobre el URL

> Claude Code genera el código completo del proyecto, pero el URL estable y permanente
> se obtiene al hacer deploy en Vercel. El URL de Vercel es permanente y accesible
> desde cualquier dispositivo con internet.

---

## Soporte

Contacto: soporte@incentivapro.mx
