import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateTrainingPlan } from '@/lib/openai'
import type { ClientProfile, PlanConfig } from '@/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile, config }: { profile: ClientProfile; config?: PlanConfig } = body

    if (!profile?.id) {
      return NextResponse.json({ error: 'Se necesita profile.id' }, { status: 400 })
    }

    // Generar plan con OpenAI (con config si viene)
    const plan = await generateTrainingPlan(profile, config)

    // Desactivar planes anteriores
    await supabaseAdmin
      .from('training_plans')
      .update({ activo: false })
      .eq('client_id', profile.id)

    // Guardar nuevo plan con la config usada
    const { data: savedPlan, error: planError } = await supabaseAdmin
      .from('training_plans')
      .insert({
        ...plan,
        client_id: profile.id,
        activo: true,
        plan_config: config || null,  // guardar config usada para referencia
      })
      .select()
      .single()

    if (planError) throw planError

    // Activar cliente
    await supabaseAdmin
      .from('clients')
      .update({ status: 'active' })
      .eq('id', profile.id)

    return NextResponse.json({ plan: savedPlan }, { status: 201 })
  } catch (error: any) {
    console.error('Error generating plan:', error)
    return NextResponse.json({ error: error.message || 'Error generando el plan' }, { status: 500 })
  }
}
