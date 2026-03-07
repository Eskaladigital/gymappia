'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GOAL_LABELS, LEVEL_LABELS, LOCATION_LABELS, DIA_ABBREV, DIA_LABEL } from '@/lib/utils'
import type { ClientProfile, TrainingPlan, WorkoutDay } from '@/types'

export default function ClientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeWeek, setActiveWeek] = useState(1)
  const [activeDay, setActiveDay] = useState<WorkoutDay | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('training_plans').select('*').eq('client_id', id).eq('activo', true).single(),
    ]).then(([clientRes, planRes]) => {
      if (clientRes.data) setClient(clientRes.data)
      if (planRes.data) {
        setPlan(planRes.data)
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">💪</div>
        <p className="text-slate-600 dark:text-slate-500">Cargando...</p>
      </div>
    </div>
  )

  if (!client) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600 dark:text-slate-500">Cliente no encontrado</p>
    </div>
  )

  const currentWeekData = plan?.semanas.find(s => s.semana === activeWeek)

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-sm mb-4 flex items-center gap-2">
          ← Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black text-xl">
              {client.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{client.nombre}</h1>
              <p className="text-slate-600 dark:text-slate-500 text-sm">{client.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client tags */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Tag>{GOAL_LABELS[client.objetivo as string]}</Tag>
        <Tag>{LEVEL_LABELS[client.nivel]}</Tag>
        <Tag>{LOCATION_LABELS[client.lugar]}</Tag>
        <Tag>📅 {client.sesiones_semana}x semana · {client.minutos_sesion} min</Tag>
        {client.lesiones && <Tag>⚠️ {client.lesiones}</Tag>}
      </div>

      {/* Plan */}
      {plan ? (
        <>
          {/* Plan header */}
          <div className="glass rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{plan.titulo}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{plan.descripcion}</p>
              </div>
              <span className="text-xs bg-brand-500/20 text-brand-600 dark:text-brand-400 px-3 py-1 rounded-full">
                {plan.duracion_semanas} semanas
              </span>
            </div>
            {plan.notas_entrenador && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 text-sm text-slate-600 dark:text-slate-400">
                💬 {plan.notas_entrenador}
              </div>
            )}
          </div>

          {/* Week selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {plan.semanas.map(s => (
              <button
                key={s.semana}
                onClick={() => setActiveWeek(s.semana)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeWeek === s.semana
                    ? 'bg-brand-500 text-black font-bold'
                    : 'glass hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                Semana {s.semana}
              </button>
            ))}
          </div>

          {/* Week objective */}
          {currentWeekData && (
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-brand-700 dark:text-brand-300">
              🎯 <strong>Semana {activeWeek}:</strong> {currentWeekData.objetivo_semana}
            </div>
          )}

          {/* Training days */}
          <div className="grid gap-3 mb-6">
            {currentWeekData?.dias.map((dia, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDay(activeDay?.dia === dia.dia ? null : dia)}
                className="glass rounded-2xl p-4 text-left hover:bg-slate-100/50 dark:hover:bg-white/[0.06] transition-all w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="min-w-[2.5rem] px-1.5 py-1 rounded-lg bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">
                      {DIA_ABBREV[dia.dia] ?? dia.dia.slice(0,3)}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{DIA_LABEL[dia.dia] ?? dia.dia}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-500">{dia.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-500">⏱ {dia.duracion_min} min</span>
                    <span className="text-xs text-slate-600 dark:text-slate-500">{dia.ejercicios.length} ejercicios</span>
                    <span className="text-slate-600 dark:text-slate-400">{activeDay?.dia === dia.dia ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded exercises */}
                {activeDay?.dia === dia.dia && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 space-y-2" onClick={e => e.stopPropagation()}>
                    {dia.notas && (
                      <p className="text-xs text-amber-400 mb-3">💡 {dia.notas}</p>
                    )}
                    {dia.ejercicios.map((ej, i) => (
                      <div key={i} className="flex items-start justify-between py-2 border-b border-slate-200 dark:border-white/5 last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{ej.nombre}</p>
                          {ej.notas && <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">{ej.notas}</p>}
                        </div>
                        <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 ml-4 flex-shrink-0">
                          <span>{ej.series}x{ej.repeticiones}</span>
                          <span>⏸ {ej.descanso_seg}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Nutrition */}
          {plan.recomendaciones_nutricionales && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold mb-2 text-slate-800 dark:text-white">🥗 Recomendaciones nutricionales</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{plan.recomendaciones_nutricionales}</p>
            </div>
          )}
        </>
      ) : (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-bold mb-2 text-slate-800 dark:text-white">Sin plan activo</h3>
          <p className="text-slate-600 dark:text-slate-500 text-sm mb-4">Este cliente no tiene un plan generado todavía</p>
        </div>
      )}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-1 glass rounded-lg text-slate-600 dark:text-slate-400">{children}</span>
  )
}
