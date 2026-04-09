import { redirect } from 'next/navigation'
import { createClient } from '@/lib/auth/server'
import { getMyProfile } from '@/lib/db/queries'
import { AppShell } from '@/components/layout/AppShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await getMyProfile(supabase, user.id)

  return <AppShell profile={profile}>{children}</AppShell>
}
