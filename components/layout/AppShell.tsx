'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import { Sidebar } from './Sidebar'
import type { Profile } from '@/types'

interface AppShellProps {
  profile: Profile | null
  children: React.ReactNode
}

export function AppShell({ profile, children }: AppShellProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar profile={profile} onSignOut={handleSignOut} />
      <main className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
