import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getLatestRanking, getRankingEntries, getActivePeriod } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { RankingView } from '@/features/ranking/RankingView'

export default async function RankingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: period }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
  ])
  if (!profile) redirect('/login')

  const year = period?.year ?? new Date().getFullYear()
  const { data: ranking } = await getLatestRanking(supabase, year)
  const entries = ranking ? (await getRankingEntries(supabase, ranking.id)).data ?? [] : []

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Ranking Nacional" subtitle={ranking?.period_name ?? `Período ${year}`} />
      <div className="flex-1 p-6">
        <RankingView profile={profile} ranking={ranking} entries={entries} />
      </div>
    </div>
  )
}
