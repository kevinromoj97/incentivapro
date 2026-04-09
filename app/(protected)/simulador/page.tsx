import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getMonthlyInputs, getScoringRules, getIndicators, getLatestRanking, getRankingEntries, getActivePeriod } from '@/lib/db/queries'
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

  const [{ data: inputs }, { data: rules }, { data: indicators }, { data: latestRanking }] = await Promise.all([
    getMonthlyInputs(supabase, profile.id, year),
    profile.position_id ? getScoringRules(supabase, profile.position_id) : Promise.resolve({ data: [] }),
    getIndicators(supabase),
    getLatestRanking(supabase, year),
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
          year={year}
        />
      </div>
    </div>
  )
}
