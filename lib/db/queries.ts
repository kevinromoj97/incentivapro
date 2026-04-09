/**
 * Queries tipadas a Supabase — capa de acceso a datos.
 * Importa createClient del contexto correcto (server o client).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Profile, MonthlyInput, NonRecurringIncomeEntry, AdditionalPointEntry,
  Ranking, RankingEntry, ScoringRule, Indicator, Period,
  Position, League, Simulation,
} from '@/types'

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getMyProfile(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('profiles')
    .select('*, position:positions(*), league:leagues(*)')
    .eq('auth_user_id', userId)
    .single<Profile & { position: Profile['position']; league: Profile['league'] }>()
}

export async function getAllProfiles(supabase: SupabaseClient) {
  return supabase
    .from('profiles')
    .select('*, position:positions(*), league:leagues(*)')
    .order('full_name')
}

export async function upsertProfile(supabase: SupabaseClient, data: Partial<Profile>) {
  return supabase.from('profiles').upsert(data).select().single()
}

// ─── Monthly Inputs ───────────────────────────────────────────────────────────

export async function getMonthlyInputs(
  supabase: SupabaseClient,
  userId: string,
  year: number
) {
  return supabase
    .from('monthly_inputs')
    .select('*, indicator:indicators(*)')
    .eq('user_id', userId)
    .eq('year', year)
    .order('month')
}

export async function upsertMonthlyInput(
  supabase: SupabaseClient,
  data: Omit<MonthlyInput, 'id' | 'created_at' | 'updated_at'>
) {
  return supabase
    .from('monthly_inputs')
    .upsert(data, { onConflict: 'user_id,indicator_id,year,month' })
    .select()
    .single()
}

export async function upsertManyMonthlyInputs(
  supabase: SupabaseClient,
  inputs: Array<Omit<MonthlyInput, 'id' | 'created_at' | 'updated_at'>>
) {
  return supabase
    .from('monthly_inputs')
    .upsert(inputs, { onConflict: 'user_id,indicator_id,year,month' })
    .select()
}

// ─── Non-Recurring Income ─────────────────────────────────────────────────────

export async function getNonRecurringIncome(
  supabase: SupabaseClient,
  userId: string,
  year: number
) {
  return supabase
    .from('non_recurring_income_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('month')
    .order('created_at')
}

export async function insertNRI(
  supabase: SupabaseClient,
  data: Omit<NonRecurringIncomeEntry, 'id' | 'created_at' | 'updated_at'>
) {
  return supabase.from('non_recurring_income_entries').insert(data).select().single()
}

export async function deleteNRI(supabase: SupabaseClient, id: string) {
  return supabase.from('non_recurring_income_entries').delete().eq('id', id)
}

// ─── Additional Point Entries ─────────────────────────────────────────────────

export async function getAdditionalPoints(
  supabase: SupabaseClient,
  userId: string,
  year: number
) {
  return supabase
    .from('additional_point_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('month')
    .order('created_at')
}

export async function insertAdditionalPoint(
  supabase: SupabaseClient,
  data: Omit<AdditionalPointEntry, 'id' | 'created_at' | 'updated_at'>
) {
  return supabase.from('additional_point_entries').insert(data).select().single()
}

export async function deleteAdditionalPoint(supabase: SupabaseClient, id: string) {
  return supabase.from('additional_point_entries').delete().eq('id', id)
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function getLatestRanking(supabase: SupabaseClient, year: number) {
  return supabase
    .from('rankings')
    .select('*')
    .eq('year', year)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .single<Ranking>()
}

export async function getRankingEntries(
  supabase: SupabaseClient,
  rankingId: string
) {
  return supabase
    .from('ranking_entries')
    .select('*')
    .eq('ranking_id', rankingId)
    .order('rank_position')
}

export async function getAllRankings(supabase: SupabaseClient) {
  return supabase
    .from('rankings')
    .select('*, uploader:profiles(full_name)')
    .order('uploaded_at', { ascending: false })
}

// ─── Scoring Rules ────────────────────────────────────────────────────────────

export async function getScoringRules(
  supabase: SupabaseClient,
  positionId: string
) {
  return supabase
    .from('scoring_rules')
    .select('*, indicator:indicators(*), position:positions(*)')
    .eq('position_id', positionId)
}

export async function getAllScoringRules(supabase: SupabaseClient) {
  return supabase
    .from('scoring_rules')
    .select('*, indicator:indicators(*), position:positions(*)')
    .order('position_id')
}

export async function upsertScoringRule(
  supabase: SupabaseClient,
  data: Partial<ScoringRule>
) {
  return supabase
    .from('scoring_rules')
    .upsert(data, { onConflict: 'indicator_id,position_id' })
    .select()
    .single()
}

// Obtiene las reglas efectivas para un usuario: overrides personales sobre base global
export async function getMergedScoringRules(
  supabase: SupabaseClient,
  positionId: string,
  profileId: string
): Promise<ScoringRule[]> {
  const { globalRules, userRules } = await getUserScoringRules(supabase, positionId, profileId)
  // Para cada regla global, si existe override personal lo usa; si no, usa la global
  return globalRules.map(global => {
    const override = userRules.find(u => u.indicator_id === global.indicator_id)
    return override ? { ...global, ...override, indicator: global.indicator, position: global.position } : global
  })
}

// Obtiene reglas globales + overrides personales del usuario para un puesto
export async function getUserScoringRules(
  supabase: SupabaseClient,
  positionId: string,
  profileId: string
) {
  const [{ data: globalRules }, { data: userRules }] = await Promise.all([
    supabase
      .from('scoring_rules')
      .select('*, indicator:indicators(*), position:positions(*)')
      .eq('position_id', positionId)
      .is('user_id', null)
      .order('indicator_id'),
    supabase
      .from('scoring_rules')
      .select('*, indicator:indicators(*), position:positions(*)')
      .eq('position_id', positionId)
      .eq('user_id', profileId)
      .order('indicator_id'),
  ])
  return { globalRules: globalRules ?? [], userRules: userRules ?? [] }
}

// Crea o actualiza un override personal del usuario
export async function upsertUserScoringRule(
  supabase: SupabaseClient,
  profileId: string,
  data: Partial<ScoringRule>
) {
  const { data: existing } = await supabase
    .from('scoring_rules')
    .select('id')
    .eq('indicator_id', data.indicator_id!)
    .eq('position_id', data.position_id!)
    .eq('user_id', profileId)
    .maybeSingle()

  if (existing) {
    return supabase
      .from('scoring_rules')
      .update({
        weight:      data.weight,
        min_logro:   data.min_logro,
        ppto_logro:  data.ppto_logro,
        max_logro:   data.max_logro,
        min_cons:    data.min_cons,
        ppto_cons:   data.ppto_cons,
        max_cons:    data.max_cons,
        config_json: data.config_json ?? null,
      })
      .eq('id', existing.id)
      .select('*, indicator:indicators(*), position:positions(*)')
      .single<ScoringRule>()
  }

  return supabase
    .from('scoring_rules')
    .insert({ ...data, user_id: profileId })
    .select('*, indicator:indicators(*), position:positions(*)')
    .single<ScoringRule>()
}

// Elimina un override personal (vuelve a usar la regla global)
export async function deleteUserScoringRule(supabase: SupabaseClient, id: string) {
  return supabase.from('scoring_rules').delete().eq('id', id)
}

// ─── Indicators ───────────────────────────────────────────────────────────────

export async function getIndicators(supabase: SupabaseClient) {
  return supabase
    .from('indicators')
    .select('*')
    .eq('is_active', true)
    .order('name')
}

// ─── Periods ──────────────────────────────────────────────────────────────────

export async function getActivePeriod(supabase: SupabaseClient) {
  return supabase
    .from('periods')
    .select('*')
    .eq('is_active', true)
    .single<Period>()
}

export async function getAllPeriods(supabase: SupabaseClient) {
  return supabase.from('periods').select('*').order('year', { ascending: false })
}

// ─── Positions & Leagues ──────────────────────────────────────────────────────

export async function getPositions(supabase: SupabaseClient) {
  return supabase.from('positions').select('*').order('name')
}

export async function getLeagues(supabase: SupabaseClient) {
  return supabase.from('leagues').select('*').order('name')
}

// ─── Simulations ──────────────────────────────────────────────────────────────

export async function getSimulations(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('simulations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
}

export async function upsertSimulation(
  supabase: SupabaseClient,
  data: Partial<Simulation>
) {
  return supabase.from('simulations').upsert(data).select().single()
}
