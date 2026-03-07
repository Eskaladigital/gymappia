'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TrainingPlan, ClientProfile, UserStats, WorkoutDay, SessionLog } from '@/types'
import MonthlyCalendar from '@/components/MonthlyCalendar'
import { DIA_ABBREV, DIA_LABEL } from '@/lib/utils'

const DIAS_ORDER = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']

function estKcal(pesoKg: number, duracionMin: number, sensacion: number): number {
  const MET = [0, 2.5, 3, 3.5, 4, 5][sensacion] || 4
  return Math.round(MET * pesoKg * (duracionMin / 60))
}

type DayStatus = 'done' | 'today' | 'upcoming' | 'rest'

function MiPlanContent() {
  const params = useSearchParams()
  const router = useRouter()
  const justRegistered = params.get('registered') === '1'
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false)
  const supabase = createClient()

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [logs, setLogs] = useState<SessionLog[]>([])
  const [activeWeek, setActiveWeek] = useState(1)
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingPlan, setPendingPlan] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [sensacion, setSensacion] = useState(4)
  const [showModal, setShowModal] = useState(false)
  const [videoModal, setVideoModal] = useState<{ nombre: string; videoId: string | null } | null>(null)
  const [sustituto, setSustituto] = useState<{ idx: number; alternativa: { nombre: string; series: number; repeticiones: number; descanso_seg: number; notas?: string }; loading: boolean } | null>(null)
  const [liveMode, setLiveMode] = useState(false)
  const [logroParaCompartir, setLogroParaCompartir] = useState<{ icon: string; label: string } | null>(null)
  const [notasCoach, setNotasCoach] = useState<string[]>([])
  const [pushEnabled, setPushEnabled] = useState(false)
  const [livePhase, setLivePhase] = useState<'work' | 'rest'>('work')
  const [liveExIdx, setLiveExIdx] = useState(0)
  const [liveSet, setLiveSet] = useState(1)
  const [restSeconds, setRestSeconds] = useState(0)
  // Vista del calendario: semanal o mensual
  const [calView, setCalView] = useState<'semanal' | 'mensual'>('semanal')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (justRegistered && !sessionStorage.getItem('pacgym_welcome_seen')) {
      setShowWelcomeOverlay(true)
    }
  }, [justRegistered])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setPushEnabled(true)
    }
  }, [])

  useEffect(() => {
    if (showModal && selectedDay && client) {
      fetch(`/api/coach-message?client_id=${client.id}`)
        .then(r => r.json())
        .then((msgs: { mensaje: string; session_ref_semana?: number; session_ref_dia?: string; remitente?: string }[]) => {
          const notas = (msgs || [])
            .filter(m => m.remitente === 'coach' && (
              (m.session_ref_semana === activeWeek && m.session_ref_dia === selectedDay.dia) ||
              (!m.session_ref_semana && !m.session_ref_dia)
            ))
            .map(m => m.mensaje)
          setNotasCoach(notas)
        })
    } else {
      setNotasCoach([])
    }
  }, [showModal, selectedDay, client, activeWeek])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientRes, statsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).single(),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
    ])

    if (clientRes.data) {
      setClient(clientRes.data)

      const planRes = await supabase
        .from('training_plans')
        .select('*')
        .eq('client_id', clientRes.data.id)
        .eq('activo', true)
        .single()

      if (planRes.data) {
        setPlan(planRes.data)
        const logsRes = await supabase
          .from('session_logs')
          .select('*')
          .eq('client_id', clientRes.data.id)
          .eq('plan_id', planRes.data.id)
        setLogs(logsRes.data || [])
      } else {
        setPendingPlan(true)
      }
    }

    if (statsRes.data) setStats(statsRes.data)
    setLoading(false)
  }

  const isLogCompleted = (semana: number, dia: string) =>
    logs.some(l => l.semana === semana && l.dia_nombre === dia && l.completado)

  const markAsCompleted = async (day: WorkoutDay, week: number) => {
    if (!client || !plan) return
    setMarkingDone(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const puntos = 50 + (sensacion * 10)

    await supabase.from('session_logs').insert({
      client_id: client.id,
      plan_id: plan.id,
      fecha: today,
      semana: week,
      dia_nombre: day.dia,
      completado: true,
      sensacion,
      puntos_ganados: puntos,
    })

    const newSesiones = (stats?.sesiones_completadas || 0) + 1
    const newRacha = (stats?.racha_actual || 0) + 1
    const newPuntos = (stats?.puntos_totales || 0) + puntos
    const newMax = Math.max(stats?.racha_maxima || 0, newRacha)

    const oldLogros = stats?.logros || []
    const newLogros = [...oldLogros]
    if (newSesiones === 1 && !newLogros.includes('primera_sesion')) newLogros.push('primera_sesion')
    if (newRacha >= 7 && !newLogros.includes('racha_7')) newLogros.push('racha_7')
    if (newSesiones >= 10 && !newLogros.includes('sesiones_10')) newLogros.push('sesiones_10')

    const logrosNuevos = newLogros.filter(l => !oldLogros.includes(l))
    const LOGRO_INFO: Record<string, { icon: string; label: string }> = {
      primera_sesion: { icon: '🎯', label: 'Primera sesión' },
      racha_7: { icon: '🔥', label: 'Semana perfecta' },
      sesiones_10: { icon: '⚡', label: 'En marcha' },
    }
    if (logrosNuevos.length > 0 && LOGRO_INFO[logrosNuevos[0]]) {
      setLogroParaCompartir(LOGRO_INFO[logrosNuevos[0]])
    }

    await supabase.from('user_stats').update({
      puntos_totales: newPuntos,
      racha_actual: newRacha,
      racha_maxima: newMax,
      sesiones_completadas: newSesiones,
      ultimo_entreno: today,
      logros: newLogros,
    }).eq('user_id', user.id)

    await loadData()
    setMarkingDone(false)
    setShowModal(false)
    setSelectedDay(null)
  }

  const openVideoDemo = async (nombre: string) => {
    setVideoModal({ nombre, videoId: null })
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(nombre)}`)
      const data = await res.json()
      if (data.videoId) {
        setVideoModal({ nombre, videoId: data.videoId })
      } else if (data.fallback) {
        window.open(data.fallback, '_blank')
        setVideoModal(null)
      } else {
        setVideoModal(null)
      }
    } catch {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(nombre + ' ejercicio')}`, '_blank')
      setVideoModal(null)
    }
  }

  const dismissWelcome = () => {
    sessionStorage.setItem('pacgym_welcome_seen', '1')
    setShowWelcomeOverlay(false)
    router.replace('/mi-plan')
  }

  const advanceLivePhase = useCallback(() => {
    if (!selectedDay) return
    const ej = selectedDay.ejercicios[liveExIdx]
    if (!ej) return
    const totalSets = typeof ej.series === 'number' ? ej.series : parseInt(String(ej.series)) || 3

    if (livePhase === 'work') {
      setLivePhase('rest')
      setRestSeconds(ej.descanso_seg)
    } else {
      if (liveSet >= totalSets) {
        if (liveExIdx >= selectedDay.ejercicios.length - 1) {
          setLiveMode(false)
          setShowModal(true)
          return
        }
        setLiveExIdx(i => i + 1)
        setLiveSet(1)
      } else {
        setLiveSet(s => s + 1)
      }
      setLivePhase('work')
    }
  }, [selectedDay, liveExIdx, liveSet, livePhase])

  useEffect(() => {
    if (!liveMode || livePhase !== 'rest' || restSeconds <= 0) return
    const t = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) { advanceLivePhase(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [liveMode, livePhase, restSeconds, advanceLivePhase])

  const startLiveMode = () => {
    setLiveExIdx(0)
    setLiveSet(1)
    setLivePhase('work')
    setRestSeconds(0)
    setLiveMode(true)
    setShowModal(false)
  }

  const pedirSustituto = async (ej: { nombre: string }, idx: number) => {
    if (!client || !selectedDay) return
    setSustituto({ idx, alternativa: { nombre: '', series: 0, repeticiones: 0, descanso_seg: 0 }, loading: true })
    try {
      const res = await fetch('/api/suggest-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ejercicio_original: ej.nombre,
          client: { lesiones: client.lesiones, equipamiento: client.equipamiento, lugar: client.lugar, nivel: client.nivel, objetivo: client.objetivo },
          dia_tipo: selectedDay.tipo,
          otros_ejercicios: selectedDay.ejercicios.filter((_, i) => i !== idx).map(e => e.nombre),
        }),
      })
      const data = await res.json()
      if (data.alternativa) {
        setSustituto({ idx, alternativa: data.alternativa, loading: false })
      } else {
        setSustituto(null)
      }
    } catch {
      setSustituto(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">💪</div>
        <p className="text-slate-600 dark:text-slate-500 text-sm">Cargando tu plan...</p>
      </div>
    </div>
  )

  if (pendingPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
        {showWelcomeOverlay && (
          <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center px-6 animate-fadeInUp">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-2xl font-black text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              ¡Bienvenido/a a PAC<span className="text-brand-400">GYM</span>!
            </h1>
            <p className="text-xl font-bold text-brand-400 mb-1">{client?.nombre?.split(' ')[0] || 'Sport'}</p>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 max-w-xs">
              Tu plan llegará en breve. Tu entrenador está personalizando los últimos detalles.
            </p>
            <div className="glass rounded-2xl px-6 py-4 mb-8 border border-brand-500/20">
              <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-1">Te avisaremos en</p>
              <p className="text-2xl font-black text-brand-400">menos de 24h</p>
            </div>
            <button onClick={dismissWelcome}
              className="w-full max-w-xs py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl transition-all text-lg">
              ¡Entendido, vamos! →
            </button>
          </div>
        )}
        <div className="max-w-sm w-full text-center glass rounded-2xl p-8 animate-fadeInUp">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-black mb-2 text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Tu plan está en revisión</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Tu entrenador está personalizando los últimos detalles. Recibirás una notificación en menos de 24h.</p>
          <div className="space-y-2 text-left mt-6">
            {['✅ Formulario recibido', '⏳ Revisión del entrenador', '🔒 Plan pendiente de activación'].map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${i < 1 ? 'text-brand-600 dark:text-brand-400' : i === 1 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-500'}`}>
                {step}
              </div>
            ))}
          </div>
          <Link href="/mi-plan/chat"
            className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-all">
            💬 Pregunta a tu coach
          </Link>
        </div>
      </div>
    )
  }

  const currentWeek = plan?.semanas.find(s => s.semana === activeWeek)
  const totalSesiones = plan?.semanas.reduce((a, s) => a + s.dias.length, 0) || 0
  const completadas = logs.filter(l => l.completado).length
  const progreso = totalSesiones > 0 ? Math.round((completadas / totalSesiones) * 100) : 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">

      {showWelcomeOverlay && (
        <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center px-6 animate-fadeInUp">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-2xl font-black text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            ¡Bienvenido/a a PAC<span className="text-brand-400">GYM</span>!
          </h1>
          <p className="text-xl font-bold text-brand-400 mb-1">{client?.nombre?.split(' ')[0] || 'Sport'}</p>
          <p className="text-slate-400 text-center text-sm mb-6 max-w-xs">
            Tu plan llegará en breve. Tu entrenador está personalizando los últimos detalles.
          </p>
          <div className="glass rounded-2xl px-6 py-4 mb-8 border border-brand-500/20">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Te avisaremos en</p>
            <p className="text-2xl font-black text-brand-400">menos de 24h</p>
          </div>
          <button onClick={dismissWelcome}
            className="w-full max-w-xs py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl transition-all text-lg">
            ¡Entendido, vamos! →
          </button>
        </div>
      )}

      {justRegistered && !showWelcomeOverlay && (
        <div className="bg-brand-500/20 border border-brand-500/30 rounded-2xl p-4 mb-6 animate-fadeInUp">
          <p className="text-brand-600 dark:text-brand-400 font-bold">🎉 ¡Bienvenido/a, {client?.nombre?.split(' ')[0]}!</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tu entrenador activará tu plan en breve. ¡A por ello!</p>
        </div>
      )}

      {/* Saludo y puntos */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-600 dark:text-slate-400">Hola, <span className="text-slate-800 dark:text-white font-semibold">{client?.nombre?.split(' ')[0] || 'Usuario'}</span> 👋</p>
        <div className="text-right">
          <p className="text-brand-600 dark:text-brand-400 font-black text-xl">{stats?.puntos_totales || 0}</p>
          <p className="text-xs text-slate-600 dark:text-slate-500">puntos</p>
        </div>
      </div>

      {/* ─── PLAN ─── */}
      {plan && (
        <>
          {/* Cabecera plan + progreso */}
          <div className="glass rounded-2xl p-4 mb-4">
            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider mb-1">📅 Tu plan de entrenamiento</p>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">{plan.titulo}</h2>
            <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 mt-3">
              <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">{completadas}/{totalSesiones} sesiones · {progreso}% completado</p>
          </div>

          {/* Toggle vista semanal / mensual */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCalView('semanal')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                calView === 'semanal' ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/10'
              }`}
            >
              📅 Semanal
            </button>
            <button
              onClick={() => setCalView('mensual')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                calView === 'mensual' ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/10'
              }`}
            >
              🗓️ Mensual
            </button>
          </div>

          {/* ── Vista semanal ── */}
          {calView === 'semanal' && (
            <>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {plan.semanas.map(s => (
                  <button key={s.semana} onClick={() => setActiveWeek(s.semana)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeWeek === s.semana ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/10'
                    }`}>
                    Sem {s.semana}
                  </button>
                ))}
              </div>

              {currentWeek?.objetivo_semana && (
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-2.5 mb-4 text-sm text-brand-700 dark:text-brand-300">
                  🎯 {currentWeek.objetivo_semana}
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-500 mb-2">Toca un día para ver los ejercicios</p>
              <div className="space-y-3 mb-6">
                {currentWeek?.dias.map((day, idx) => {
                  const done = isLogCompleted(activeWeek, day.dia)
                  return (
                    <button key={idx} onClick={() => { setSelectedDay(day); setShowModal(true) }}
                      className={`w-full glass rounded-2xl p-4 text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.06] transition-all ${done ? 'border border-brand-500/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`min-w-[2.5rem] px-1.5 py-1 rounded-xl flex items-center justify-center font-bold text-sm ${
                            done ? 'bg-brand-500 text-black' : 'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                          }`}>
                            {done ? '✓' : (DIA_ABBREV[day.dia] ?? day.dia.slice(0,3))}
                          </div>
                          <div>
                            <p className={`font-semibold ${done ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-white'}`}>{DIA_LABEL[day.dia] ?? day.dia}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-500">{day.tipo} · {day.duracion_min} min · {day.ejercicios.length} ejercicios</p>
                          </div>
                        </div>
                        {done
                          ? <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-1 rounded-full">✅ Hecho</span>
                          : <span className="text-slate-600 dark:text-slate-400 text-lg">›</span>
                        }
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Vista mensual ── */}
          {calView === 'mensual' && (
            <div className="mb-6">
              <MonthlyCalendar
                plan={plan}
                logs={logs}
                startDate={plan.created_at?.split('T')[0]}
                onDayClick={(day, semana) => {
                  setActiveWeek(semana)
                  setSelectedDay(day)
                  setShowModal(true)
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Stats gamificación */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon="🔥" value={stats?.racha_actual || 0} label="Racha" unit="días" highlight />
        <StatCard icon="✅" value={stats?.sesiones_completadas || 0} label="Sesiones" unit="total" />
        <StatCard icon="📈" value={progreso} label="Progreso" unit="%" />
      </div>

      <Link href="/mi-plan/progreso"
        className="flex items-center gap-3 glass rounded-2xl p-4 mb-4 border border-brand-500/20 hover:bg-brand-500/10 transition-all group">
        <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-2xl">📈</div>
        <div className="flex-1 text-left">
          <p className="font-bold text-brand-600 dark:text-brand-400">Ver mi progreso</p>
          <p className="text-xs text-slate-600 dark:text-slate-500">Gráficas, racha, sensaciones y logros</p>
        </div>
        <span className="text-slate-600 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400">→</span>
      </Link>

      {stats?.logros && stats.logros.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-600 dark:text-slate-500 mb-2 uppercase tracking-wider">Logros desbloqueados</p>
          <div className="flex gap-2 flex-wrap">
            {stats.logros.includes('primera_sesion') && <Badge icon="🎯" label="Primera sesión" />}
            {stats.logros.includes('racha_7') && <Badge icon="🔥" label="Semana perfecta" />}
            {stats.logros.includes('sesiones_10') && <Badge icon="⚡" label="En marcha" />}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4 mb-4 border border-brand-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-white">Recordatorio de entrenar</p>
              <p className="text-xs text-slate-600 dark:text-slate-500">Te avisamos el día que toca</p>
            </div>
          </div>
          <button onClick={async () => {
            if (pushEnabled) return
            const perm = await Notification.requestPermission()
            if (perm !== 'granted') return
            const reg = await navigator.serviceWorker?.ready
            const sub = await reg?.pushManager?.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            })
            if (sub) {
              await fetch('/api/push-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub.toJSON() }),
              })
              setPushEnabled(true)
            }
          }} disabled={pushEnabled}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pushEnabled ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400' : 'bg-brand-500 text-black hover:bg-brand-400'}`}>
            {pushEnabled ? '✓ Activado' : 'Activar'}
          </button>
        </div>
      </div>

      <Link href="/mi-plan/chat"
        className="flex items-center gap-3 glass rounded-2xl p-4 mb-6 border border-brand-500/20 hover:bg-brand-500/10 transition-all group">
        <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">💬</div>
        <div className="flex-1 text-left">
          <p className="font-bold text-brand-600 dark:text-brand-400">Pregunta a tu coach</p>
          <p className="text-xs text-slate-600 dark:text-slate-500">¿Sustituir ejercicio? ¿Dudas? Responde con tu plan</p>
        </div>
        <span className="text-slate-600 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400">→</span>
      </Link>

      {/* ── Modal de sesión ── */}
      {showModal && selectedDay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 px-4 pb-4">
          <div className="w-full max-w-lg glass rounded-3xl p-5 animate-fadeInUp max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{DIA_LABEL[selectedDay.dia] ?? selectedDay.dia}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedDay.tipo} · {selectedDay.duracion_min} min</p>
              </div>
              <button onClick={() => { setShowModal(false); setSustituto(null) }} className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-xl">✕</button>
            </div>

            {selectedDay.notas && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-sm text-amber-300">
                💡 {selectedDay.notas}
              </div>
            )}

            {notasCoach.length > 0 && (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mb-1">💬 Tu coach dice:</p>
                {notasCoach.map((n, i) => <p key={i} className="text-sm text-slate-600 dark:text-slate-300">{n}</p>)}
              </div>
            )}

            <div className="space-y-2 mb-5">
              {selectedDay.ejercicios.map((ej, i) => (
                <div key={i} className="py-2.5 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{ej.nombre}</p>
                      {ej.notas && <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">{ej.notas}</p>}
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold">{ej.series}×{ej.repeticiones}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-500">⏸ {ej.descanso_seg}s</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-3">
                    <button onClick={() => openVideoDemo(ej.nombre)}
                      className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      <span>▶</span> Ver demo
                    </button>
                    <button onClick={() => pedirSustituto(ej, i)} disabled={sustituto?.loading}
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50">
                      <span>🔄</span> No puedo hacer esto
                    </button>
                  </div>
                  {sustituto?.idx === i && (
                    <div className="mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      {sustituto.loading ? (
                        <p className="text-xs text-slate-600 dark:text-slate-500">Buscando alternativa...</p>
                      ) : (
                        <>
                          <p className="text-xs text-brand-400 font-semibold mb-1">Alternativa sugerida:</p>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{sustituto.alternativa.nombre}</p>
                          <p className="text-xs text-brand-400 mt-0.5">{sustituto.alternativa.series}×{sustituto.alternativa.repeticiones} · ⏸ {sustituto.alternativa.descanso_seg}s</p>
                          {sustituto.alternativa.notas && <p className="text-xs text-slate-500 mt-1">{sustituto.alternativa.notas}</p>}
                          <button onClick={() => setSustituto(null)} className="mt-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">Cerrar</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isLogCompleted(activeWeek, selectedDay.dia) && (
              <>
                <button onClick={startLiveMode}
                  className="w-full py-3 mb-4 glass border border-brand-500/30 hover:bg-brand-500/10 rounded-xl flex items-center justify-center gap-2 text-brand-400 font-bold transition-all">
                  <span>▶</span> Modo entrenamiento en vivo
                </button>
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">¿Cómo te has sentido? ({sensacion}/5)</p>
                  <div className="flex gap-2 justify-center text-2xl">
                    {['😓','😐','🙂','😊','🔥'].map((emoji, i) => (
                      <button key={i} onClick={() => setSensacion(i+1)}
                        className={`p-2 rounded-xl transition-all ${sensacion === i+1 ? 'bg-brand-500/20 scale-125' : 'opacity-40 hover:opacity-70'}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => markAsCompleted(selectedDay, activeWeek)} disabled={markingDone}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-black rounded-xl transition-all">
                  {markingDone ? '✅ Guardando...' : `✅ ¡Sesión completada! +${50 + sensacion * 10} pts · ~${client ? estKcal(client.peso, selectedDay.duracion_min, sensacion) : 0} kcal`}
                </button>
              </>
            )}

            {isLogCompleted(activeWeek, selectedDay.dia) && (
              <div className="text-center py-4">
                <p className="text-brand-600 dark:text-brand-400 font-bold text-lg">✅ ¡Ya completaste esta sesión!</p>
                <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">Sigue así, campeón 💪</p>
              </div>
            )}
          </div>
        </div>
      )}

      {logroParaCompartir && (
        <div className="fixed inset-0 z-[75] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass rounded-3xl p-6 text-center animate-fadeInUp border-2 border-brand-500/40">
            <p className="text-brand-400 text-sm font-bold mb-2">¡Logro desbloqueado!</p>
            <div className="text-6xl mb-3">{logroParaCompartir.icon}</div>
            <h3 className="text-xl font-black mb-4">{logroParaCompartir.label}</h3>
            <p className="text-slate-600 dark:text-slate-500 text-sm mb-5">Comparte tu progreso con el mundo 💪</p>
            <div className="flex gap-3">
              <a href={`https://wa.me/?text=${encodeURIComponent(`¡Acabo de desbloquear "${logroParaCompartir.label}" en PACGYM! 💪`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <span>📱</span> WhatsApp
              </a>
              <button onClick={() => {
                navigator.clipboard?.writeText(`¡Acabo de desbloquear "${logroParaCompartir.label}" en PACGYM! 💪`)
                setLogroParaCompartir(null)
              }} className="flex-1 py-3 glass hover:bg-white/10 font-bold rounded-xl">
                Copiar
              </button>
            </div>
              <button onClick={() => setLogroParaCompartir(null)} className="mt-4 text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-sm">Cerrar</button>
          </div>
        </div>
      )}

      {liveMode && selectedDay && (
        <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center px-6">
          <button onClick={() => { setLiveMode(false); setShowModal(true) }}
            className="absolute top-4 right-4 text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-2xl z-10">✕</button>

          {livePhase === 'work' ? (
            <>
              <p className="text-brand-400 text-sm font-semibold mb-2">
                Ejercicio {liveExIdx + 1}/{selectedDay.ejercicios.length} · Serie {liveSet}/{typeof selectedDay.ejercicios[liveExIdx]?.series === 'number' ? selectedDay.ejercicios[liveExIdx].series : 3}
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-4">{selectedDay.ejercicios[liveExIdx]?.nombre}</h2>
              <p className="text-2xl text-brand-400 font-bold mb-8">
                {selectedDay.ejercicios[liveExIdx]?.series}×{selectedDay.ejercicios[liveExIdx]?.repeticiones}
              </p>
              {selectedDay.ejercicios[liveExIdx]?.notas && (
                <p className="text-slate-600 dark:text-slate-500 text-sm mb-6 max-w-md text-center">{selectedDay.ejercicios[liveExIdx].notas}</p>
              )}
              <button onClick={advanceLivePhase}
                className="w-full max-w-xs py-5 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-2xl text-lg">
                ✓ Listo · Descanso
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-500 text-sm mb-2">Descanso</p>
              <p className="text-7xl font-black text-brand-400 mb-4">{restSeconds}</p>
              <p className="text-slate-500 text-sm">siguiente serie en...</p>
              <button onClick={advanceLivePhase} className="mt-6 text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-sm">Saltar descanso →</button>
            </>
          )}
        </div>
      )}

      {videoModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{videoModal.nombre}</p>
              <button onClick={() => setVideoModal(null)} className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-xl">✕</button>
            </div>
            {videoModal.videoId ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${videoModal.videoId}?autoplay=1`}
                  title={videoModal.nombre}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2 animate-pulse">▶</div>
                  <p className="text-slate-600 dark:text-slate-500 text-sm">Buscando vídeo...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MiPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">💪</div>
          <p className="text-slate-600 dark:text-slate-500 text-sm">Cargando tu plan...</p>
        </div>
      </div>
    }>
      <MiPlanContent />
    </Suspense>
  )
}

function StatCard({ icon, value, label, unit, highlight = false }: {
  icon: string; value: number; label: string; unit: string; highlight?: boolean
}) {
  return (
    <div className={`glass rounded-xl p-3 text-center ${highlight ? 'border border-brand-500/30' : ''}`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-black ${highlight ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-white'}`}>{value}</div>
      <div className="text-xs text-slate-600 dark:text-slate-500">{label}</div>
      <div className="text-xs text-slate-600 dark:text-slate-500">{unit}</div>
    </div>
  )
}

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-brand-700 dark:text-brand-300 font-medium">{label}</span>
    </div>
  )
}
