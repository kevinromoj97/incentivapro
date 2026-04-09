import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getMonthlyInputs, getMergedScoringRules, getLatestRanking, getRankingEntries, getNonRecurringIncome, getAdditionalPoints, getActivePeriod } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { DashboardView } from '@/features/dashboard/DashboardView'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: period },
  ] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
  ])

  if (!profile) redirect('/login')

  const year = period?.year ?? new Date().getFullYear()

  const [
    { data: inputs },
    { data: nriEntries },
    { data: rules },
    { data: latestRanking },
    { data: additionalPoints },
  ] = await Promise.all([
    getMonthlyInputs(supabase, profile.id, year),
    getNonRecurringIncome(supabase, profile.id, year),
    profile.position_id ? getMergedScoringRules(supabase, profile.position_id, profile.id).then(r => ({ data: r })) : Promise.resolve({ data: [] }),
    getLatestRanking(supabase, year),
    getAdditionalPoints(supabase, profile.id, year),
  ])

  const rankingEntries = latestRanking
    ? (await getRankingEntries(supabase, latestRanking.id)).data ?? []
    : []

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={`Hola, ${profile.full_name?.split(' ')[0] ?? 'Ejecutivo'}`}
        subtitle={`${profile.position?.name ?? 'Ejecutivo'} · Liga ${profile.league?.name ?? 'N/A'} · ${year}`}
      />
      <div className="flex-1 p-6">
        <DashboardView
          profile={profile}
          inputs={inputs ?? []}
          nriEntries={nriEntries ?? []}
          rules={rules ?? []}
          rankingEntries={rankingEntries}
          additionalPoints={additionalPoints ?? []}
          year={year}
        />
      </div>
    </div>
  )
}
