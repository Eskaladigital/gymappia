import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, user_id } = await req.json()

    // Vincular el lead (pending) con el user_id
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ user_id, status: 'active' })
      .eq('email', email)
      .is('user_id', null)

    if (error) throw error

    // Crear perfil de usuario con rol 'client'
    await supabaseAdmin.from('profiles').upsert({
      id: user_id,
      email,
      role: 'client',
    })

    // Crear stats de gamificación iniciales
    await supabaseAdmin.from('user_stats').upsert({
      user_id,
      puntos_totales: 0,
      racha_actual: 0,
      racha_maxima: 0,
      sesiones_completadas: 0,
      logros: [],
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
