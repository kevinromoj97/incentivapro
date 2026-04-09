import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const { fullName, email, positionId, leagueId, employeeCode } = await req.json()

  // Verificar que el usuario está autenticado
  const supabaseUser = createServerClient()
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Usar service role para crear/actualizar el perfil (bypasa RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Upsert del perfil
  const { error } = await admin.from('profiles').upsert({
    auth_user_id: user.id,
    full_name:    fullName,
    email:        email,
    role:         'ejecutivo',
    position_id:  positionId,
    league_id:    leagueId,
    employee_code: employeeCode || null,
  }, { onConflict: 'auth_user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
