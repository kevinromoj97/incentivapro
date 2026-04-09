import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getAllScoringRules, getPositions } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { RulesEditor } from '@/features/admin/RulesEditor'

export default async function AdminReglasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rules }, { data: positions }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getAllScoringRules(supabase),
    getPositions(supabase),
  ])
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Reglas de Cálculo" subtitle="Pesos y umbrales de consecución por puesto e indicador" />
      <div className="flex-1 p-6">
        <RulesEditor rules={rules ?? []} positions={positions ?? []} />
      </div>
    </div>
  )
}
