import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getNonRecurringIncome, getActivePeriod } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { NRIView } from '@/features/nonRecurring/NRIView'

export default async function IngresosNRPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: period }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
  ])
  if (!profile) redirect('/login')

  const year = period?.year ?? new Date().getFullYear()
  const { data: entries } = await getNonRecurringIncome(supabase, profile.id, year)

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Ingresos No Recurrentes"
        subtitle={`INF NR — Registro por cliente y concepto · ${year}`}
      />
      <div className="flex-1 p-6">
        <NRIView profile={profile} period={period} entries={entries ?? []} year={year} />
      </div>
    </div>
  )
}
