import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/coach-message?client_id=xxx
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('coach_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/coach-message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { client_id, remitente, mensaje, session_ref_semana, session_ref_dia } = body

    const { data, error } = await supabaseAdmin
      .from('coach_messages')
      .insert({ client_id, remitente, mensaje, session_ref_semana, session_ref_dia })
      .select()
      .single()

    if (error) throw error

    // Marcar mensajes del otro lado como leídos
    const otroRemitente = remitente === 'coach' ? 'client' : 'coach'
    await supabaseAdmin
      .from('coach_messages')
      .update({ leido: true })
      .eq('client_id', client_id)
      .eq('remitente', otroRemitente)
      .eq('leido', false)

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
