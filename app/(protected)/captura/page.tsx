import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getMonthlyInputs, getScoringRules, getIndicators, getActivePeriod } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { CaptureTable } from '@/features/capture/CaptureTable'

export default async function CapturaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: period }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getActivePeriod(supabase),
  ])
  if (!profile) redirect('/login')

  const year = period?.year ?? new Date().getFullYear()

  const [{ data: inputs }, { data: rules }, { data: indicators }] = await Promise.all([
    getMonthlyInputs(supabase, profile.id, year),
    profile.position_id ? getScoringRules(supabase, profile.position_id) : Promise.resolve({ data: [] }),
    getIndicators(supabase),
  ])

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Captura Mensual"
        subtitle={`Presupuesto y logro por indicador — ${year}`}
      />
      <div className="flex-1 p-6">
        <CaptureTable
          profile={profile}
          period={period}
          inputs={inputs ?? []}
          rules={rules ?? []}
          indicators={indicators ?? []}
          year={year}
        />
      </div>
    </div>
  )
}
