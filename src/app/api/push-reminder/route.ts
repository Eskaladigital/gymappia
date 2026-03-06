import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: 'VAPID keys no configuradas' }, { status: 500 })
  }

  webpush.setVapidDetails('mailto:info@pacgym.com', vapidPublic, vapidPrivate)

  const hoy = DIAS[new Date().getDay()]

  const { data: plans } = await supabase
    .from('training_plans')
    .select('id, client_id, semanas')
    .eq('activo', true)

  const clientesConEntrenoHoy = new Set<string>()
  for (const plan of plans || []) {
    for (const sem of plan.semanas || []) {
      const tieneHoy = sem.dias?.some((d: { dia: string }) => d.dia === hoy)
      if (tieneHoy) clientesConEntrenoHoy.add(plan.client_id)
    }
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, user_id, nombre')
    .in('id', Array.from(clientesConEntrenoHoy))
    .not('user_id', 'is', null)

  const userIds = (clients || []).map(c => c.user_id)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription')
    .in('user_id', userIds)

  const nombres = Object.fromEntries((clients || []).map(c => [c.user_id, c.nombre?.split(' ')[0] || 'Sport']))
  let enviados = 0

  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: 'PACGYM 💪',
          body: `¡Hola ${nombres[sub.user_id]}! Hoy toca entrenar. ¡A por ello!`,
        })
      )
      enviados++
    } catch (e) {
      console.error('Push error:', e)
    }
  }

  return NextResponse.json({ enviados, total: subs?.length || 0 })
}
