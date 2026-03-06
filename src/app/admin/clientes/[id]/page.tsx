'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GOAL_LABELS, LEVEL_LABELS, LOCATION_LABELS } from '@/lib/utils'
import type { ClientProfile, TrainingPlan, WorkoutDay, SessionLog } from '@/types'

export default function AdminClientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [logs, setLogs] = useState<SessionLog[]>([])
  const [generating, setGenerating] = useState(false)
  const [activeWeek, setActiveWeek] = useState(1)
  const [activeDay, setActiveDay] = useState<WorkoutDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ficha' | 'plan' | 'seguimiento'>('ficha')
  const [coachMessages, setCoachMessages] = useState<{ id: string; mensaje: string; remitente?: string; session_ref_semana?: number; session_ref_dia?: string; created_at: string }[]>([])
  const [progressPhotos, setProgressPhotos] = useState<{ id: string; semana: number; foto_url: string; notas?: string; peso_kg?: number }[]>([])
  const [notaSesion, setNotaSesion] = useState('')
  const [enviandoNota, setEnviandoNota] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [clientRes, planRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('training_plans').select('*').eq('client_id', id).eq('activo', true).maybeSingle(),
    ])
    if (clientRes.data) setClient(clientRes.data)
    if (planRes.data) {
      setPlan(planRes.data)
      const logsRes = await supabase.from('session_logs').select('*').eq('plan_id', planRes.data.id)
      setLogs(logsRes.data || [])
    }
    const [msgsRes, photosRes] = await Promise.all([
      fetch(`/api/coach-message?client_id=${id}`),
      fetch(`/api/progress-photo?client_id=${id}`),
    ])
    const msgsData = await msgsRes.json()
    const photosData = await photosRes.json()
    setCoachMessages(Array.isArray(msgsData) ? msgsData : [])
    setProgressPhotos(Array.isArray(photosData) ? photosData : [])
    setLoading(false)
  }

  const generatePlan = async () => {
    if (!client) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: client, clientId: id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }
      await loadData()
    } catch (e: any) {
      alert(e?.message || 'Error al generar el plan')
    }
    setGenerating(false)
  }

  const activateClient = async () => {
    await supabase.from('clients').update({ status: 'active' }).eq('id', id)
    await loadData()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Cargando ficha...</p>
    </div>
  )
  if (!client) return <div className="min-h-screen flex items-center justify-center"><p>Cliente no encontrado</p></div>

  const currentWeek = plan?.semanas.find(s => s.semana === activeWeek)
  const completadas = logs.filter(l => l.completado).length

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <button onClick={() => router.push('/admin')} className="text-slate-500 hover:text-white text-sm mb-5 flex items-center gap-2">
        ← Admin
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
            client.status === 'active' ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
          }`}>
            {client.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>{client.nombre}</h1>
            <p className="text-slate-500 text-sm">{client.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              client.status === 'active' ? 'bg-brand-500/20 text-brand-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {client.status === 'pending' ? '⏳ Pendiente de aprobación' : '✅ Cliente activo'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-col items-end">
          {client.status === 'pending' && (
            <button onClick={activateClient}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-xs transition-all">
              ✅ Activar cliente
            </button>
          )}
          {!plan && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/admin/clientes/${id}/configurar`)}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-xs transition-all">
                🎛️ Configurar y generar plan
              </button>
              <button onClick={generatePlan} disabled={generating}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-all disabled:opacity-50">
                {generating ? '🤖 Generando...' : '⚡ Generar rápido (sin config)'}
              </button>
            </div>
          )}
          {plan && (
            <button
              onClick={() => router.push(`/admin/clientes/${id}/configurar`)}
              className="px-4 py-2 glass hover:bg-white/10 text-slate-400 font-medium rounded-xl text-xs transition-all">
              🎛️ Reconfigurar plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['ficha', 'plan', 'seguimiento'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-400 hover:bg-white/10'
            }`}>
            {t === 'ficha' ? '👤 Ficha' : t === 'plan' ? '📋 Plan' : '📊 Seguimiento'}
          </button>
        ))}
      </div>

      {/* ── FICHA ── */}
      {tab === 'ficha' && (
        <div className="space-y-4">
          <Section title="Datos personales">
            <Grid>
              <Info label="Edad" value={`${client.edad} años`} />
              <Info label="Peso" value={`${client.peso} kg`} />
              <Info label="Altura" value={`${client.altura} cm`} />
              <Info label="Sexo" value={client.sexo} />
            </Grid>
          </Section>
          <Section title="Objetivo">
            <Grid>
              <Info label="Objetivo" value={GOAL_LABELS[client.objetivo as string] || client.objetivo} />
              <Info label="Nivel" value={LEVEL_LABELS[client.nivel]} />
              <Info label="Lugar" value={LOCATION_LABELS[client.lugar]} />
              <Info label="Sesiones/semana" value={`${client.sesiones_semana}x · ${client.minutos_sesion} min`} />
            </Grid>
            {client.objetivo_detalle && <Info label="Detalle" value={client.objetivo_detalle} full />}
          </Section>
          <Section title="Salud">
            <Info label="Lesiones" value={client.lesiones || 'Ninguna'} full />
            <Info label="Enfermedades" value={client.enfermedades || 'Ninguna'} full />
            <Info label="Medicación" value={client.medicacion || 'Ninguna'} full />
          </Section>
          <Section title="Equipamiento y preferencias">
            <Info label="Equipamiento" value={client.equipamiento || 'No especificado'} full />
            <Info label="Le gusta" value={client.deportes_gusta || 'No especificado'} full />
            <Info label="Evitar" value={client.deportes_odia || 'Nada'} full />
          </Section>
          <Section title="Estilo de vida">
            <Grid>
              <Info label="Trabajo" value={client.tipo_trabajo || 'No especificado'} />
              <Info label="Sueño" value={`${client.horas_sueno}h`} />
              <Info label="Estrés" value={`${client.nivel_estres}/10`} />
              <Info label="Horario" value={client.horario_preferido} />
            </Grid>
            <Info label="Obstáculos pasados" value={client.obstaculos_pasados || 'Ninguno'} full />
          </Section>
        </div>
      )}

      {/* ── PLAN ── */}
      {tab === 'plan' && (
        <>
          {!plan ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-bold mb-2">Sin plan generado</h3>
              <p className="text-slate-500 text-sm mb-5">Genera el plan con IA para este cliente</p>
              <button onClick={generatePlan} disabled={generating}
                className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                {generating ? '🤖 Generando plan con IA...' : '🤖 Generar plan ahora'}
              </button>
            </div>
          ) : (
            <>
              <div className="glass rounded-2xl p-5 mb-5">
                <h2 className="font-bold mb-1">{plan.titulo}</h2>
                <p className="text-slate-400 text-sm">{plan.descripcion}</p>
                {plan.notas_entrenador && (
                  <p className="text-sm text-brand-300 mt-3 pt-3 border-t border-white/5">
                    💬 {plan.notas_entrenador}
                  </p>
                )}
              </div>

              {/* Week tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {plan.semanas.map(s => (
                  <button key={s.semana} onClick={() => setActiveWeek(s.semana)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeWeek === s.semana ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-400 hover:bg-white/10'
                    }`}>
                    Sem {s.semana}
                  </button>
                ))}
              </div>

              {currentWeek?.objetivo_semana && (
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-2.5 mb-4 text-sm text-brand-300">
                  🎯 {currentWeek.objetivo_semana}
                </div>
              )}

              <div className="space-y-3">
                {currentWeek?.dias.map((day, idx) => (
                  <div key={idx} className="glass rounded-2xl overflow-hidden">
                    <button onClick={() => setActiveDay(activeDay?.dia === day.dia ? null : day)}
                      className="w-full p-4 text-left hover:bg-white/5 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold uppercase">
                            {day.dia.slice(0,2)}
                          </span>
                          <div>
                            <p className="font-semibold capitalize">{day.dia}</p>
                            <p className="text-xs text-slate-500">{day.tipo} · {day.duracion_min} min · {day.ejercicios.length} ejercicios</p>
                          </div>
                        </div>
                        <span className="text-slate-600">{activeDay?.dia === day.dia ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {activeDay?.dia === day.dia && (
                      <div className="px-4 pb-4 border-t border-white/5">
                        {day.notas && <p className="text-xs text-amber-400 py-2">💡 {day.notas}</p>}
                        {/* Nota coach para esta sesión */}
                        <div className="mb-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                          <p className="text-xs text-brand-400 font-semibold mb-2">💬 Nota para el cliente (esta sesión)</p>
                          <div className="flex gap-2">
                            <input type="text" value={notaSesion} onChange={e => setNotaSesion(e.target.value)}
                              placeholder="Ej: Esta semana aumenta el peso en sentadilla"
                              className="flex-1 input-field text-sm" />
                            <button onClick={async () => {
                              if (!notaSesion.trim()) return
                              setEnviandoNota(true)
                              await fetch('/api/coach-message', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  client_id: id,
                                  remitente: 'coach',
                                  mensaje: notaSesion.trim(),
                                  session_ref_semana: activeWeek,
                                  session_ref_dia: day.dia,
                                }),
                              })
                              setNotaSesion('')
                              await loadData()
                              setEnviandoNota(false)
                            }} disabled={enviandoNota || !notaSesion.trim()}
                              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-xs disabled:opacity-50">
                              Enviar
                            </button>
                          </div>
                          {coachMessages.filter(m => m.session_ref_semana === activeWeek && m.session_ref_dia === day.dia).map(m => (
                            <p key={m.id} className="text-xs text-slate-400 mt-2 pt-2 border-t border-white/5">✓ {m.mensaje}</p>
                          ))}
                        </div>
                        <div className="space-y-2 mt-2">
                          {day.ejercicios.map((ej, i) => (
                            <div key={i} className="flex justify-between items-start py-1.5 border-b border-white/5 last:border-0">
                              <div>
                                <p className="text-sm font-medium">{ej.nombre}</p>
                                {ej.notas && <p className="text-xs text-slate-500">{ej.notas}</p>}
                              </div>
                              <div className="ml-4 text-right text-xs text-slate-400">
                                <p className="text-brand-400 font-semibold">{ej.series}×{ej.repeticiones}</p>
                                <p>⏸ {ej.descanso_seg}s</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {plan.recomendaciones_nutricionales && (
                <div className="glass rounded-2xl p-5 mt-4">
                  <h3 className="font-bold mb-2">🥗 Nutrición</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{plan.recomendaciones_nutricionales}</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── SEGUIMIENTO ── */}
      {tab === 'seguimiento' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-brand-400">{completadas}</p>
              <p className="text-xs text-slate-500">Sesiones</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">
                {logs.length > 0 ? (logs.reduce((a, l) => a + (l.sensacion || 0), 0) / logs.length).toFixed(1) : '-'}
              </p>
              <p className="text-xs text-slate-500">Sensación media</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">
                {logs.reduce((a, l) => a + (l.puntos_ganados || 0), 0)}
              </p>
              <p className="text-xs text-slate-500">Puntos ganados</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 mb-4">
            <h3 className="font-bold mb-3">📸 Fotos de progreso</h3>
            {progressPhotos.length === 0 ? (
              <p className="text-slate-500 text-sm">El cliente aún no ha subido fotos</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {progressPhotos.map(p => (
                  <div key={p.id} className="rounded-xl overflow-hidden bg-white/5">
                    <img src={p.foto_url} alt={`Semana ${p.semana}`} className="w-full aspect-square object-cover" />
                    <p className="text-xs text-slate-500 p-1">S{p.semana}{p.peso_kg ? ` · ${p.peso_kg}kg` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5 mb-4">
            <h3 className="font-bold mb-3">💬 Mensajes al cliente</h3>
            {coachMessages.filter(m => m.remitente === 'coach').length === 0 ? (
              <p className="text-slate-500 text-sm">No hay mensajes enviados</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {coachMessages.filter(m => m.remitente === 'coach').map(m => (
                  <div key={m.id} className="text-sm py-2 border-b border-white/5 last:border-0">
                    <p>{m.mensaje}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.session_ref_semana ? `Sem ${m.session_ref_semana} · ${m.session_ref_dia}` : 'General'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-bold mb-3">Historial de sesiones</h3>
            {logs.length === 0 ? (
              <p className="text-slate-500 text-sm">Aún no hay sesiones completadas</p>
            ) : (
              <div className="space-y-2">
                {[...logs].sort((a,b) => b.fecha.localeCompare(a.fecha)).map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{log.dia_nombre} – Sem {log.semana}</p>
                      <p className="text-xs text-slate-500">{log.fecha}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {log.sensacion && (
                        <span>{['😓','😐','🙂','😊','🔥'][log.sensacion - 1]}</span>
                      )}
                      <span className="text-brand-400 font-semibold">+{log.puntos_ganados} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── UI helpers ──────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Info({ label, value, full = false }: { label: string; value: string | number; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}
