import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usamos service role para insertar sin auth (formulario público)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({
        ...body,
        status: 'pending',
        user_id: null,  // no registrado aún
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error: any) {
    console.error('Lead insert error:', error)
    // No falla visible al usuario — la UX funciona igual
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
