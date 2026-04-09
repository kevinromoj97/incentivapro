// ─── Core domain types ───────────────────────────────────────────────────────

export type Role = 'admin' | 'ejecutivo'

export type Frequency = 'mensual' | 'trimestral' | 'semestral' | 'anual'

export interface Position {
  id: string
  name: string
  code: string
  created_at: string
}

export interface League {
  id: string
  name: string
  code: string
}

export interface Profile {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  role: Role
  position_id: string | null
  league_id: string | null
  employee_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  position?: Position
  league?: League
}

export interface Period {
  id: string
  year: number
  name: string
  is_active: boolean
}

export interface Indicator {
  id: string
  code: string
  name: string
  frequency: Frequency
  is_active: boolean
}

export interface ScoringRule {
  id: string
  indicator_id: string
  position_id: string
  user_id?: string | null   // null = regla global; uuid = override personal
  weight: number
  min_logro: number    // default 0.90
  ppto_logro: number   // default 1.00
  max_logro: number    // default 1.10
  min_cons: number     // default 0.50
  ppto_cons: number    // default 1.00
  max_cons: number     // default 1.50
  config_json: Record<string, unknown> | null
  // joined
  indicator?: Indicator
  position?: Position
}

export interface MonthlyInput {
  id: string
  user_id: string
  period_id: string
  indicator_id: string
  year: number
  month: number
  target_budget: number
  actual_result: number
  created_at: string
  updated_at: string
  // joined
  indicator?: Indicator
}

export interface NonRecurringIncomeEntry {
  id: string
  user_id: string
  period_id: string
  year: number
  month: number
  client_name: string
  concept: string
  amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Ranking {
  id: string
  period_id: string
  year: number
  period_name: string
  source_file_name: string
  uploaded_by: string
  uploaded_at: string
  created_at: string
}

export interface RankingEntry {
  id: string
  ranking_id: string
  rank_position: number
  employee_name: string
  employee_code: string | null
  position_name: string | null
  league: string | null
  total_points: number
  jan_pts: number | null
  feb_pts: number | null
  mar_pts: number | null
  apr_pts: number | null
  may_pts: number | null
  jun_pts: number | null
  jul_pts: number | null
  aug_pts: number | null
  sep_pts: number | null
  oct_pts: number | null
  nov_pts: number | null
  dec_pts: number | null
  created_at: string
}

export interface Simulation {
  id: string
  user_id: string
  name: string
  payload_json: SimulationPayload
  created_at: string
  updated_at: string
}

// ─── Calculation types ────────────────────────────────────────────────────────

export interface IndicatorResult {
  indicator_id: string
  indicator_code: string
  indicator_name: string
  frequency: Frequency
  weight: number
  target_budget: number
  actual_result: number
  logro_pct: number       // realizado/presupuesto
  consecucion_pct: number // 0-150%
  points: number
  status: 'danger' | 'warning' | 'success'
}

export interface MonthlyPointResult {
  month: number
  month_name: string
  total_points: number
  projected_points: number
  has_data: boolean
  indicators: IndicatorResult[]
}

export interface DashboardMetrics {
  current_total_points: number
  projected_annual_points: number
  equalized_points: number
  budget_achievement_pct: number
  current_rank: number | null
  projected_rank: number | null
  monthly_results: MonthlyPointResult[]
  indicator_results: IndicatorResult[]
  nri_total: number
  nri_by_month: Record<number, number>
}

export interface SimulationPayload {
  month: number
  year: number
  inputs: Array<{
    indicator_id: string
    target_budget: number
    actual_result: number
  }>
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const MONTH_KEYS: (keyof RankingEntry)[] = [
  'jan_pts','feb_pts','mar_pts','apr_pts','may_pts','jun_pts',
  'jul_pts','aug_pts','sep_pts','oct_pts','nov_pts','dec_pts',
]
