import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  try {
    const { plan_id, semanas } = await req.json()
    if (!plan_id || !semanas) {
      return NextResponse.json({ error: 'plan_id y semanas son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('training_plans')
      .update({ semanas })
      .eq('id', plan_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ plan: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
