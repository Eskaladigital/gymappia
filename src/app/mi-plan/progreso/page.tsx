'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SessionLog, UserStats, ClientProfile, TrainingPlan } from '@/types'

interface WeekData {
  semana: number
  completadas: number
  total: number
  sensacionMedia: number
  puntosGanados: number
}

export default function ProgresoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [logs, setLogs] = useState<SessionLog[]>([])
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [photos, setPhotos] = useState<{ id: string; semana: number; foto_url: string; notas?: string; peso_kg?: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientRes, statsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).single(),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
    ])

    if (clientRes.data) {
      setClient(clientRes.data)
      const planRes = await supabase.from('training_plans').select('*').eq('client_id', clientRes.data.id).eq('activo', true).maybeSingle()
      if (planRes.data) {
        setPlan(planRes.data)
        const logsRes = await supabase.from('session_logs').select('*').eq('client_id', clientRes.data.id).order('fecha', { ascending: true })
        const logsData: SessionLog[] = logsRes.data || []
        setLogs(logsData)

        // Calcular datos por semana
        const weeks: WeekData[] = planRes.data.semanas.map((s: any) => {
          const weekLogs = logsData.filter(l => l.semana === s.semana)
          const completadas = weekLogs.filter(l => l.completado).length
          const total = s.dias.length
          const sensaciones = weekLogs.filter(l => l.sensacion).map(l => l.sensacion!)
          const sensacionMedia = sensaciones.length > 0
            ? sensaciones.reduce((a, b) => a + b, 0) / sensaciones.length
            : 0
          const puntosGanados = weekLogs.reduce((a, l) => a + (l.puntos_ganados || 0), 0)
          return { semana: s.semana, completadas, total, sensacionMedia, puntosGanados }
        })
        setWeekData(weeks)
      }
      const photosRes = await fetch(`/api/progress-photo?client_id=${clientRes.data.id}`)
      const photosData = await photosRes.json()
      setPhotos(Array.isArray(photosData) ? photosData : [])
    }
    if (statsRes.data) setStats(statsRes.data)
    setLoading(false)
  }

  if (loading) return <LoadingScreen />

  const totalSesiones = weekData.reduce((a, w) => a + w.total, 0)
  const totalCompletadas = weekData.reduce((a, w) => a + w.completadas, 0)
  const totalPuntos = weekData.reduce((a, w) => a + w.puntosGanados, 0)
  const progresoPct = totalSesiones > 0 ? Math.round((totalCompletadas / totalSesiones) * 100) : 0
  const maxCompletadas = Math.max(...weekData.map(w => w.completadas), 1)
  const sensaciones = logs.filter(l => l.sensacion).map(l => l.sensacion!)
  const sensacionGlobal = sensaciones.length > 0
    ? (sensaciones.reduce((a, b) => a + b, 0) / sensaciones.length).toFixed(1)
    : '—'

  const SENSACION_EMOJI = ['', '😓', '😐', '🙂', '😊', '🔥']
  const SENSACION_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e']

  const estKcal = (pesoKg: number, duracionMin: number, sensacion: number) => {
    const MET = [0, 2.5, 3, 3.5, 4, 5][sensacion] || 4
    return Math.round(MET * pesoKg * (duracionMin / 60))
  }
  const getDuracionForLog = (log: SessionLog) => {
    const semanaData = plan?.semanas?.find((s: any) => s.semana === log.semana)
    const diaData = semanaData?.dias?.find((d: any) => d.dia === log.dia_nombre)
    return diaData?.duracion_min || 45
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/mi-plan')} className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-sm mb-1 flex items-center gap-1">← Mi plan</button>
          <h1 className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>📈 Mi progreso</h1>
        </div>
        <div className="text-right">
          <p className="text-brand-400 font-black text-2xl">{progresoPct}%</p>
          <p className="text-xs text-slate-500">completado</p>
        </div>
      </div>

      {/* Racha visual */}
      {stats && stats.racha_actual > 0 && (
        <div className="glass rounded-2xl p-5 mb-4">
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-3">🔥 Tu racha</p>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-brand-400">{stats.racha_actual}</span>
            <span className="text-slate-600 dark:text-slate-500 text-sm">días consecutivos</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: Math.min(stats.racha_actual, 14) }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-lg bg-brand-500/40 border border-brand-500/50 flex items-center justify-center text-sm">✓</div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs top */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { icon: '✅', value: totalCompletadas, label: 'Sesiones', sub: `de ${totalSesiones}` },
          { icon: '🔥', value: stats?.racha_actual || 0, label: 'Racha', sub: 'días' },
          { icon: '⭐', value: totalPuntos, label: 'Puntos', sub: 'ganados' },
          { icon: '😊', value: sensacionGlobal, label: 'Bienestar', sub: 'medio' },
        ].map(k => (
          <div key={k.label} className="glass rounded-xl p-3 text-center">
            <div className="text-lg mb-0.5">{k.icon}</div>
            <div className="text-lg font-black text-brand-600 dark:text-brand-400">{k.value}</div>
            <div className="text-xs text-slate-600 dark:text-slate-500 leading-tight">{k.label}</div>
            <div className="text-xs text-slate-600 dark:text-slate-500">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfica de barras por semana — completadas */}
      <div className="glass rounded-2xl p-5 mb-4">
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Sesiones por semana</p>
        <div className="flex items-end gap-3 h-28">
          {weekData.map(w => {
            const pct = w.total > 0 ? (w.completadas / w.total) : 0
            const height = Math.max(pct * 100, 4)
            const color = pct === 0 ? '#1e293b' : pct < 0.5 ? '#f97316' : pct < 1 ? '#eab308' : '#22c55e'
            return (
              <div key={w.semana} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold" style={{ color }}>{w.completadas}/{w.total}</span>
                <div className="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden"
                  style={{ height: `${height}%`, backgroundColor: color, minHeight: 4 }}>
                  {pct === 1 && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  )}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-500">S{w.semana}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-600 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Completa</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Parcial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Iniciada</span>
        </div>
      </div>

      {/* Gráfica de sensación por semana */}
      <div className="glass rounded-2xl p-5 mb-4">
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Bienestar por semana</p>
        <div className="flex items-end gap-3 h-20">
          {weekData.map(w => {
            const s = w.sensacionMedia
            const height = s > 0 ? (s / 5) * 100 : 4
            const color = s === 0 ? '#1e293b' : SENSACION_COLOR[Math.round(s)]
            return (
              <div key={w.semana} className="flex-1 flex flex-col items-center gap-1">
                {s > 0 && <span className="text-sm">{SENSACION_EMOJI[Math.round(s)]}</span>}
                <div className="w-full rounded-t-lg transition-all duration-700"
                  style={{ height: `${height}%`, backgroundColor: color, minHeight: 4, opacity: s === 0 ? 0.2 : 1 }} />
                <span className="text-xs text-slate-600 dark:text-slate-500">S{w.semana}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Puntos por semana */}
      <div className="glass rounded-2xl p-5 mb-4">
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Puntos ganados por semana</p>
        <div className="flex items-end gap-3 h-20">
          {weekData.map(w => {
            const maxPts = Math.max(...weekData.map(ww => ww.puntosGanados), 1)
            const height = maxPts > 0 ? (w.puntosGanados / maxPts) * 100 : 4
            return (
              <div key={w.semana} className="flex-1 flex flex-col items-center gap-1">
                {w.puntosGanados > 0 && <span className="text-xs text-brand-400 font-bold">{w.puntosGanados}</span>}
                <div className="w-full rounded-t-lg transition-all duration-700 bg-brand-500/40"
                  style={{ height: `${Math.max(height, 4)}%` }} />
                <span className="text-xs text-slate-600 dark:text-slate-500">S{w.semana}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Foto de progreso semanal */}
      <div className="glass rounded-2xl p-5 mb-4">
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-3">📸 Fotos de progreso</p>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          fd.set('client_id', client!.id || '')
          setUploading(true)
          try {
            const res = await fetch('/api/progress-photo', { method: 'POST', body: fd })
            if (res.ok) {
              const newPhoto = await res.json()
              setPhotos(prev => [newPhoto, ...prev])
              ;(e.target as HTMLFormElement).reset()
            }
          } finally {
            setUploading(false)
          }
        }} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input type="number" name="semana" min={1} max={12} placeholder="Semana" required
              className="input-field w-24" />
            <input type="file" name="file" accept="image/*" capture="environment" required
              className="text-sm text-slate-600 dark:text-slate-400" />
            <input type="text" name="notas" placeholder="Notas (opcional)"
              className="input-field flex-1 min-w-0" />
            <input type="number" name="peso_kg" step="0.1" placeholder="Peso kg"
              className="input-field w-20" />
          </div>
          <button type="submit" disabled={uploading}
            className="py-2 px-4 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-sm disabled:opacity-50">
            {uploading ? 'Subiendo...' : '📤 Subir foto'}
          </button>
        </form>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {photos.map(p => (
              <div key={p.id} className="rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 aspect-square">
                <img src={p.foto_url} alt={`Semana ${p.semana}`} className="w-full h-full object-cover" />
                <p className="text-xs text-slate-600 dark:text-slate-500 p-1">S{p.semana}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de sesiones */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-3">Historial de sesiones</p>
        {logs.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-500 text-sm text-center py-4">Aún no has completado sesiones</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {[...logs].reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold">
                    S{log.semana}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white capitalize">{log.dia_nombre}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-500">{log.fecha}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {log.sensacion && <span>{SENSACION_EMOJI[log.sensacion]}</span>}
                  <span className="text-brand-400 font-bold">+{log.puntos_ganados}pts</span>
                  {client && log.sensacion && (
                    <span className="text-slate-600 dark:text-slate-500">~{estKcal(client.peso, getDuracionForLog(log), log.sensacion)} kcal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logros */}
      {stats?.logros && stats.logros.length > 0 && (
        <div className="glass rounded-2xl p-5 mt-4">
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-3">🏆 Logros desbloqueados</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'primera_sesion', icon: '🎯', label: 'Primera sesión', pts: 50 },
              { id: 'racha_7', icon: '🔥', label: 'Semana perfecta', pts: 100 },
              { id: 'racha_30', icon: '💎', label: 'Mes de hierro', pts: 500 },
              { id: 'sesiones_10', icon: '⚡', label: '10 sesiones', pts: 150 },
              { id: 'sesiones_50', icon: '🏆', label: '50 sesiones', pts: 500 },
            ].filter(a => stats.logros.includes(a.id)).map(a => (
              <div key={a.id} className="glass rounded-xl p-3 flex items-center gap-2 border border-brand-500/20">
                <span className="text-xl">{a.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{a.label}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400">+{a.pts} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">📈</div>
        <p className="text-slate-600 dark:text-slate-500 text-sm">Cargando progreso...</p>
      </div>
    </div>
  )
}
