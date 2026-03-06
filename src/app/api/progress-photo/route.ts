import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const client_id = formData.get('client_id') as string

    const { data: client } = await supabaseAdmin.from('clients').select('id').eq('id', client_id).eq('user_id', user.id).single()
    if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    const semana = parseInt(formData.get('semana') as string)
    const notas = (formData.get('notas') as string) || ''
    const peso_kg = formData.get('peso_kg') ? parseFloat(formData.get('peso_kg') as string) : null

    if (!file || !client_id || !semana) {
      return NextResponse.json({ error: 'file, client_id y semana requeridos' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${client_id}/${semana}-${Date.now()}.${ext}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('progress-photos')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage.from('progress-photos').getPublicUrl(uploadData.path)
    const foto_url = urlData.publicUrl

    const { data: photo, error } = await supabaseAdmin
      .from('progress_photos')
      .insert({ client_id, semana, foto_url, notas, peso_kg })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(photo, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id requerido' }, { status: 400 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('clients').select('user_id').eq('id', clientId).single(),
    supabaseAdmin.from('profiles').select('role').eq('id', user.id).single(),
  ])
  const isOwner = client?.user_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('progress_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('semana', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
