import { createClient } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { getMyProfile, getAllPeriods } from '@/lib/db/queries'
import { Header } from '@/components/layout/Header'

export default async function AdminPeriodosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: periods }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getAllPeriods(supabase),
  ])
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Períodos" subtitle="Gestión de ejercicios fiscales" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Año</th>
                <th className="text-left">Nombre</th>
                <th className="text-center">Activo</th>
              </tr>
            </thead>
            <tbody>
              {(periods ?? []).map(p => (
                <tr key={p.id}>
                  <td className="font-bold text-text-primary">{p.year}</td>
                  <td className="text-sm text-text-secondary">{p.name}</td>
                  <td className="text-center">
                    <span className={`w-2 h-2 rounded-full inline-block ${p.is_active ? 'bg-success' : 'bg-border'}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
