import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getUserScoringRules, getPositions } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { UserRulesEditor } from '@/features/user/UserRulesEditor'

export default async function MisReglasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: positions }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getPositions(supabase),
  ])
  if (!profile) redirect('/login')

  const positionId = profile.position_id ?? positions?.[0]?.id ?? null
  const { globalRules, userRules } = positionId
    ? await getUserScoringRules(supabase, positionId, profile.id)
    : { globalRules: [], userRules: [] }

  const positionName = profile.position?.name
    ?? positions?.find(p => p.id === positionId)?.name
    ?? 'tu puesto'

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Mis Reglas de Cálculo"
        subtitle={`Umbrales y pesos personalizados para ${positionName}`}
      />
      <div className="flex-1 p-6">
        <UserRulesEditor
          profile={profile}
          globalRules={globalRules}
          userRules={userRules}
        />
      </div>
    </div>
  )
}
