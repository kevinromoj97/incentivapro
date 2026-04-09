import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getAllRankings, getActivePeriod } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { RankingUploader } from '@/features/ranking/RankingUploader'

export default async function AdminRankingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: period }, { data: rankings }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
    getAllRankings(supabase),
  ])
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Cargar Ranking Nacional" subtitle="Importar archivo Excel o CSV con el ranking de la Red BEI" />
      <div className="flex-1 p-6">
        <RankingUploader profile={profile} period={period} rankings={rankings ?? []} />
      </div>
    </div>
  )
}
