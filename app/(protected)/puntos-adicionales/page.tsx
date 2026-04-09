import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getAdditionalPoints, getActivePeriod } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { AdditionalPointsView } from '@/features/additionalPoints/AdditionalPointsView'

export default async function PuntosAdicionalesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: period }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
  ])
  if (!profile) redirect('/login')

  const year = period?.year ?? new Date().getFullYear()
  const { data: entries } = await getAdditionalPoints(supabase, profile.id, year)

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Puntos Adicionales"
        subtitle={`Sostenibilidad, bonos de oficina y otros — ${year}`}
      />
      <div className="flex-1 p-6">
        <AdditionalPointsView
          profile={profile}
          period={period}
          entries={entries ?? []}
          year={year}
        />
      </div>
    </div>
  )
}
