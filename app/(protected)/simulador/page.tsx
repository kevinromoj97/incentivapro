import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getMonthlyInputs, getMergedScoringRules, getIndicators, getLatestRanking, getRankingEntries, getActivePeriod, getAdditionalPoints } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { SimulatorView } from '@/features/simulation/SimulatorView'

export default async function SimuladorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: period }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
  ])
  if (!profile) redirect('/login')

  const year = period?.year ?? new Date().getFullYear()

  const [{ data: inputs }, rules, { data: indicators }, { data: latestRanking }, { data: additionalPoints }] = await Promise.all([
    getMonthlyInputs(supabase, profile.id, year),
    profile.position_id ? getMergedScoringRules(supabase, profile.position_id, profile.id) : Promise.resolve([]),
    getIndicators(supabase),
    getLatestRanking(supabase, year),
    getAdditionalPoints(supabase, profile.id, year),
  ])

  const rankingEntries = latestRanking
    ? (await getRankingEntries(supabase, latestRanking.id)).data ?? []
    : []

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Simulador" subtitle="Simula escenarios sin afectar tus datos oficiales" />
      <div className="flex-1 p-6">
        <SimulatorView
          profile={profile}
          period={period}
          inputs={inputs ?? []}
          rules={rules ?? []}
          indicators={indicators ?? []}
          rankingEntries={rankingEntries}
          additionalPoints={additionalPoints ?? []}
          year={year}
        />
      </div>
    </div>
  )
}
