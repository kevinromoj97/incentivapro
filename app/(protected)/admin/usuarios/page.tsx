import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getAllProfiles, getPositions, getLeagues } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'
import { UsersAdmin } from '@/features/admin/UsersAdmin'

export default async function AdminUsuariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profiles }, { data: positions }, { data: leagues }] = await Promise.all([
    getAllProfiles(supabase),
    getPositions(supabase),
    getLeagues(supabase),
  ])

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Administración de Usuarios" subtitle="Crear, editar y asignar puestos a los ejecutivos" />
      <div className="flex-1 p-6">
        <UsersAdmin profiles={profiles ?? []} positions={positions ?? []} leagues={leagues ?? []} />
      </div>
    </div>
  )
}
