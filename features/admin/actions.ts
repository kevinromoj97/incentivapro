'use server'

import { createAdminClient } from '@/lib/auth/server'
import type { Profile } from '@/types'

interface CreateUserParams {
  email: string
  password: string
  full_name: string
  employee_code: string
  role: string
  position_id: string
  league_id: string
}

export async function createUserAction(params: CreateUserParams): Promise<{
  error?: string
  profile?: Profile
}> {
  try {
    const supabase = createAdminClient()

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: { full_name: params.full_name },
    })

    if (authError) return { error: authError.message }
    if (!authData.user) return { error: 'No se pudo crear el usuario.' }

    // 2. Actualizar el perfil creado por el trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name:     params.full_name,
        role:          params.role,
        employee_code: params.employee_code || null,
        position_id:   params.position_id  || null,
        league_id:     params.league_id    || null,
      })
      .eq('auth_user_id', authData.user.id)
      .select('*, position:positions(*), league:leagues(*)')
      .single()

    if (profileError) return { error: profileError.message }

    return { profile: profile as Profile }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error desconocido.' }
  }
}

export async function updateProfileAction(
  profileId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role' | 'position_id' | 'league_id' | 'employee_code' | 'is_active'>>
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('profiles').update(updates).eq('id', profileId)
    if (error) return { error: error.message }
    return {}
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error desconocido.' }
  }
}
