import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { generateTrainingPlan } from '@/lib/openai'
import type { ClientProfile, PlanConfig } from '@/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-tu_')) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada en .env.local' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const { profile, config, clientId }: { profile?: ClientProfile; config?: PlanConfig; clientId?: string } = body

    // Aceptar body como { profile, config, clientId } o como cliente directo { id, nombre, ... }
    const effectiveBodyProfile = profile ?? (body?.id && body?.nombre ? (body as ClientProfile) : undefined)
    const profileId = effectiveBodyProfile?.id || clientId || body?.id
    if (!profileId) {
      return NextResponse.json(
        { error: 'Se necesita profile.id o clientId en el body' },
        { status: 400 }
      )
    }

    let effectiveProfile = effectiveBodyProfile
    if (!effectiveProfile) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', profileId)
        .single()
      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
      }
      effectiveProfile = client as ClientProfile
    }

    if (!effectiveProfile || !effectiveProfile.nombre) {
      return NextResponse.json(
        { error: 'Se necesita profile con datos del cliente (nombre, edad, peso, etc.)' },
        { status: 400 }
      )
    }

    // Si hay sesión de admin, asignar trainer_id al cliente
    let trainerId: string | null = null
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (user) {
      const { data: userProfile } = await supabaseServer.from('profiles').select('role').eq('id', user.id).single()
      if (userProfile?.role === 'admin') trainerId = user.id
    }

    // Generar plan con OpenAI (con config si viene)
    const plan = await generateTrainingPlan(effectiveProfile, config)

    // Desactivar planes anteriores
    await supabaseAdmin
      .from('training_plans')
      .update({ activo: false })
      .eq('client_id', profileId)

    // Guardar nuevo plan con la config usada
    const { data: savedPlan, error: planError } = await supabaseAdmin
      .from('training_plans')
      .insert({
        ...plan,
        client_id: profileId,
        activo: true,
        plan_config: config || null,  // guardar config usada para referencia
      })
      .select()
      .single()

    if (planError) throw planError

    // Activar cliente y asignar trainer si viene de admin
    await supabaseAdmin
      .from('clients')
      .update({
        status: 'active',
        ...(trainerId && { trainer_id: trainerId }),
      })
      .eq('id', profileId)

    return NextResponse.json({ plan: savedPlan }, { status: 201 })
  } catch (error: any) {
    console.error('Error generating plan:', error)
    return NextResponse.json({ error: error.message || 'Error generando el plan' }, { status: 500 })
  }
}
