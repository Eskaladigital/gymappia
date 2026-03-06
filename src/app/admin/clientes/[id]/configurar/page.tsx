'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BASE_MODULES, SYSTEM_PACKS, getCanonicalModulesForDisplay,
  type ClientProfile, type TrainingModule, type SessionParams,
  type AISuggestion, type TrainingPack, type PlanConfig
} from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initModules = (): TrainingModule[] =>
  BASE_MODULES.map(m => ({ ...m, value: 50, locked: false }))

const initSession = (): SessionParams => ({
  duracion_media_min: 45,
  descanso_entre_series_seg: 75,
  rpe_objetivo: 6,
  semanas_duracion: 4,
  dias_semana: 3,
  progresion: 'lineal',
  enfoque_tecnico: 70,
  variedad: 50,
})

const RPE_LABELS = ['', 'Muy fácil','Fácil','Moderado bajo','Moderado','Algo duro','Duro','Muy duro','Muy duro+','Extremo','Máximo']

// ─── Component ───────────────────────────────────────────────────────────────
export default function ConfigurarPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [modules, setModules] = useState<TrainingModule[]>(initModules())
  const [session, setSession] = useState<SessionParams>(initSession())
  const [notasCoach, setNotasCoach] = useState('')
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [packs, setPacks] = useState<TrainingPack[]>([])
  const [selectedPackNombre, setSelectedPackNombre] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeSection, setActiveSection] = useState<'modulos' | 'sesion' | 'packs'>('modulos')
  const [newPackNombre, setNewPackNombre] = useState('')
  const [savingPack, setSavingPack] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [clientRes, packsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      fetch('/api/packs').then(r => r.json()),
    ])
    if (clientRes.data) {
      setClient(clientRes.data)
      // Pre-rellenar session con datos del cliente
      setSession(s => ({
        ...s,
        dias_semana: clientRes.data.sesiones_semana,
        duracion_media_min: clientRes.data.minutos_sesion,
      }))
    }
    const allPacks = [
      ...(packsRes.system || []).map((p: TrainingPack) => ({ ...p, id: p.nombre })),
      ...(packsRes.custom || []),
    ]
    setPacks(allPacks)
  }

  // ── Pedir sugerencia a la IA ────────────────────────────────────────────
  const requestAISuggestion = async () => {
    if (!client) return
    setLoadingAI(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/suggest-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      })
      const data: AISuggestion = await res.json()
      setSuggestion(data)
    } catch (e) {
      console.error(e)
    }
    setLoadingAI(false)
  }

  // ── Aplicar sugerencia de la IA ─────────────────────────────────────────
  const applySuggestion = () => {
    if (!suggestion) return
    setModules(prev =>
      prev.map(m => {
        if (m.locked) return m
        const s = suggestion.modules.find(sm => sm.id === m.id)
        return s ? { ...m, value: s.value } : m
      })
    )
    setSession(suggestion.session)
    if (suggestion.pack_sugerido_nombre) setSelectedPackNombre(suggestion.pack_sugerido_nombre)
  }

  // ── Aplicar pack ────────────────────────────────────────────────────────
  const applyPack = (pack: TrainingPack) => {
    setModules(prev =>
      prev.map(m => {
        if (m.locked) return m
        const pm = pack.modules.find(pm => pm.id === m.id)
        return pm ? { ...m, value: pm.value } : { ...m, value: 0 }
      })
    )
    setSession(pack.session)
    setSelectedPackNombre(pack.nombre)
  }

  // ── Guardar config actual como pack ─────────────────────────────────────
  const saveAsPack = async () => {
    if (!newPackNombre.trim()) return
    setSavingPack(true)
    const pack: Omit<TrainingPack, 'id' | 'created_at'> = {
      nombre: newPackNombre,
      descripcion: `Pack personalizado creado desde el configurador`,
      icono: '⚙️',
      color: '#64748b',
      tags: ['personalizado'],
      modules: modules.map(m => ({ id: m.id, value: m.value })),
      session,
      es_publico: true,
    }
    await fetch('/api/packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pack),
    })
    setNewPackNombre('')
    await loadData()
    setSavingPack(false)
  }

  // ── Generar plan con la configuración actual ────────────────────────────
  const generatePlan = async () => {
    if (!client) return
    setGenerating(true)
    const config: PlanConfig = {
      modules,
      session,
      notas_coach: notasCoach || undefined,
    }
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: client, config }),
      })
      if (!res.ok) throw new Error('Error generando plan')
      router.push(`/admin/clientes/${id}?tab=plan`)
    } catch (e) {
      alert('Error al generar el plan')
    }
    setGenerating(false)
  }

  // ── Update helpers ──────────────────────────────────────────────────────
  const updateModule = (moduleId: string, value: number) =>
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, value } : m))

  const toggleLock = (moduleId: string) =>
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, locked: !m.locked } : m))

  const updateSession = (key: keyof SessionParams, value: any) =>
    setSession(prev => ({ ...prev, [key]: value }))

  if (!client) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Cargando...</p>
    </div>
  )

  // ─── Radar visual de módulos ─────────────────────────────────────────────
  const totalActive = modules.reduce((a, m) => a + m.value, 0)

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/admin/clientes/${id}`)}
            className="text-slate-500 hover:text-white text-sm mb-2 flex items-center gap-1">
            ← Ficha del cliente
          </button>
          <h1 className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
            🎛️ Configurador de entrenamiento
          </h1>
          <p className="text-slate-500 text-sm">{client.nombre} · {client.objetivo} · {client.nivel}</p>
        </div>

        {/* Generate button */}
        <button onClick={generatePlan} disabled={generating}
          className="px-5 py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-black rounded-xl text-sm transition-all flex items-center gap-2">
          {generating ? (
            <><span className="animate-spin">⚙️</span> Generando plan...</>
          ) : (
            <>🚀 Generar plan con IA</>
          )}
        </button>
      </div>

      {/* AI Suggestion banner */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-400 mb-1">🤖 Sugerencia de IA</p>
            {!suggestion && !loadingAI && (
              <p className="text-slate-500 text-sm">
                Pulsa "Analizar perfil" para que la IA sugiera la configuración óptima para {client.nombre.split(' ')[0]}.
                Luego puedes ajustar manualmente con los sliders.
              </p>
            )}
            {loadingAI && (
              <p className="text-slate-400 text-sm animate-pulse">Analizando perfil con IA...</p>
            )}
            {suggestion && (
              <div>
                <p className="text-sm text-slate-300 mb-2">{suggestion.razonamiento}</p>
                {suggestion.pack_sugerido_nombre && (
                  <p className="text-xs text-brand-400">
                    📦 Pack sugerido: <strong>{suggestion.pack_sugerido_nombre}</strong>
                  </p>
                )}
                {suggestion.alertas.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {suggestion.alertas.map((a, i) => (
                      <p key={i} className="text-xs text-amber-400 flex items-start gap-1">
                        <span>⚠️</span> {a}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={requestAISuggestion} disabled={loadingAI}
              className="px-4 py-2 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap">
              {loadingAI ? '⏳ Analizando...' : '🔍 Analizar perfil'}
            </button>
            {suggestion && (
              <button onClick={applySuggestion}
                className="px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400 rounded-xl text-sm font-medium transition-all whitespace-nowrap">
                ✅ Aplicar sugerencia
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-5">
        {([
          ['modulos', '🎛️ Módulos'],
          ['sesion', '⚙️ Sesión'],
          ['packs', '📦 Packs'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === key ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-400 hover:bg-white/10'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── MÓDULOS ── */}
      {activeSection === 'modulos' && (
        <div className="space-y-3">
          {/* Visualización circular simple */}
          <div className="glass rounded-2xl p-5 mb-2">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Distribución actual</p>
            <div className="flex gap-2 flex-wrap">
              {modules.map(m => (
                <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${m.color}20`, border: `1px solid ${m.color}40`, color: m.color }}>
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                  <span className="font-black">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {modules.map(m => (
            <ModuleSlider
              key={m.id}
              module={m}
              onChange={v => updateModule(m.id, v)}
              onLock={() => toggleLock(m.id)}
            />
          ))}

          {/* Notas del coach */}
          <div className="glass rounded-2xl p-5 mt-4">
            <label className="block text-sm text-slate-400 mb-2">
              💬 Instrucciones adicionales para la IA (opcional)
            </label>
            <textarea
              value={notasCoach}
              onChange={e => setNotasCoach(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Ej: Priorizar ejercicios de cadena posterior. Evitar press militar por hombro. Incluir trabajo unilateral..."
            />
          </div>
        </div>
      )}

      {/* ── SESIÓN ── */}
      {activeSection === 'sesion' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Estructura del plan</p>

            <div className="grid grid-cols-2 gap-5">
              <SliderField
                label={`Semanas de duración: ${session.semanas_duracion}`}
                min={1} max={12} value={session.semanas_duracion}
                onChange={v => updateSession('semanas_duracion', v)}
                marks={['1', '4', '8', '12']}
              />
              <SliderField
                label={`Días por semana: ${session.dias_semana}`}
                min={1} max={7} value={session.dias_semana}
                onChange={v => updateSession('dias_semana', v)}
                marks={['1', '3', '5', '7']}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-2">Tipo de progresión</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['lineal', '📈', 'Lineal', 'Carga constante semana a semana'],
                  ['ondulada', '〰️', 'Ondulada', 'Alta/baja intensidad alternada'],
                  ['bloque', '🧱', 'Bloques', 'Fases: volumen → intensidad → pico'],
                ] as const).map(([val, icon, label, desc]) => (
                  <button key={val} onClick={() => updateSession('progresion', val)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      session.progresion === val
                        ? 'bg-brand-500/20 border border-brand-500/40'
                        : 'glass hover:bg-white/5'
                    }`}>
                    <p className="text-sm font-bold">{icon} {label}</p>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Intensidad de cada sesión</p>

            <div className="grid grid-cols-2 gap-5">
              <SliderField
                label={`Duración media: ${session.duracion_media_min} min`}
                min={20} max={120} step={5} value={session.duracion_media_min}
                onChange={v => updateSession('duracion_media_min', v)}
                marks={['20', '60', '90', '120']}
              />
              <SliderField
                label={`Descanso entre series: ${session.descanso_entre_series_seg}s`}
                min={20} max={180} step={5} value={session.descanso_entre_series_seg}
                onChange={v => updateSession('descanso_entre_series_seg', v)}
                marks={['20s', '60s', '120s', '180s']}
              />
            </div>

            <div className="mt-5">
              <label className="block text-sm text-slate-400 mb-3">
                RPE objetivo: <span className="text-white font-bold">{session.rpe_objetivo}/10</span>
                <span className="text-slate-500 ml-2">({RPE_LABELS[session.rpe_objetivo]})</span>
              </label>
              <div className="relative">
                <input type="range" min={1} max={10} value={session.rpe_objetivo}
                  onChange={e => updateSession('rpe_objetivo', +e.target.value)}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #22c55e 0%, #22c55e ${(session.rpe_objetivo - 1) / 9 * 100}%, 
                      rgba(255,255,255,0.1) ${(session.rpe_objetivo - 1) / 9 * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  {Array.from({length: 10}, (_, i) => i + 1).map(n => (
                    <span key={n} className={session.rpe_objetivo === n ? 'text-brand-400 font-bold' : ''}>{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-4">Estilo de entrenamiento</p>
            <div className="grid grid-cols-2 gap-5">
              <SliderField
                label={`Enfoque técnico: ${session.enfoque_tecnico}%`}
                min={0} max={100} step={5} value={session.enfoque_tecnico}
                onChange={v => updateSession('enfoque_tecnico', v)}
                marks={['Rendimiento', '', '', 'Técnica']}
                hint={session.enfoque_tecnico >= 80 ? 'Perfección de movimiento ante todo' : session.enfoque_tecnico >= 50 ? 'Equilibrio técnica/carga' : 'Priorizar rendimiento y peso'}
              />
              <SliderField
                label={`Variedad de ejercicios: ${session.variedad}%`}
                min={0} max={100} step={5} value={session.variedad}
                onChange={v => updateSession('variedad', v)}
                marks={['Fijo', '', '', 'Variado']}
                hint={session.variedad >= 70 ? 'Mucha variedad, pocos repetidos' : session.variedad >= 40 ? 'Variedad moderada' : 'Ejercicios fijos para dominar patrón'}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PACKS ── */}
      {activeSection === 'packs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {packs.map((pack, idx) => (
              <button key={pack.id || idx} onClick={() => applyPack(pack)}
                className={`glass rounded-2xl p-4 text-left hover:bg-white/[0.07] transition-all ${
                  selectedPackNombre === pack.nombre ? 'border border-brand-500/50 bg-brand-500/5' : ''
                }`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{pack.icono}</span>
                  {selectedPackNombre === pack.nombre && (
                    <span className="text-xs text-brand-400 font-bold">✓ Activo</span>
                  )}
                </div>
                <p className="font-bold text-sm">{pack.nombre}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pack.descripcion}</p>

                {/* Mini módulos (siempre los 8 tipos en orden alfabético para comparar entre packs) */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {getCanonicalModulesForDisplay(pack.modules).map(pm => {
                    const base = BASE_MODULES.find(b => b.id === pm.id)
                    return base ? (
                      <span key={pm.id} className={`text-xs px-1.5 py-0.5 rounded ${pm.value === 0 ? 'opacity-40' : ''}`}
                        style={{ backgroundColor: `${base.color}20`, color: base.color }}>
                        {base.icon} {pm.value}
                      </span>
                    ) : null
                  })}
                </div>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {pack.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-xs text-slate-600">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Guardar configuración actual como pack */}
          <div className="glass rounded-2xl p-5">
            <p className="text-sm font-semibold mb-3">💾 Guardar configuración actual como nuevo pack</p>
            <div className="flex gap-3">
              <input type="text" value={newPackNombre}
                onChange={e => setNewPackNombre(e.target.value)}
                className="input-field flex-1"
                placeholder='Ej: "Mujeres 40+ cardio moderado"' />
              <button onClick={saveAsPack} disabled={savingPack || !newPackNombre.trim()}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-black font-bold rounded-xl text-sm transition-all whitespace-nowrap">
                {savingPack ? 'Guardando...' : 'Guardar pack'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sticky generate */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0f1e] to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <button onClick={generatePlan} disabled={generating}
            className="w-full py-4 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-black rounded-2xl text-base transition-all flex items-center justify-center gap-2">
            {generating ? (
              <><span className="animate-spin">⚙️</span> Generando plan personalizado...</>
            ) : (
              <>🚀 Generar plan con esta configuración</>
            )}
          </button>
        </div>
      </div>
      <div className="h-20" />
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ModuleSlider({
  module, onChange, onLock
}: {
  module: TrainingModule
  onChange: (v: number) => void
  onLock: () => void
}) {
  const isEmpty = module.value === 0
  const isHigh = module.value >= 75

  return (
    <div className={`glass rounded-2xl p-4 transition-all ${module.locked ? 'border border-amber-500/30' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{module.icon}</span>
          <div>
            <p className="font-semibold text-sm">{module.label}</p>
            <p className="text-xs text-slate-500">{module.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Valor numérico */}
          <span className="font-black text-lg" style={{ color: isEmpty ? '#475569' : module.color }}>
            {module.value}
          </span>
          {/* Lock button */}
          <button onClick={onLock}
            className={`text-sm px-2 py-1 rounded-lg transition-all ${
              module.locked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-600 hover:text-slate-400 glass'
            }`}
            title={module.locked ? 'Bloqueado (la IA no lo cambia)' : 'Bloquear para que la IA no lo cambie'}>
            {module.locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>

      {/* Slider custom */}
      <div className="relative">
        <input
          type="range" min={0} max={100} step={5}
          value={module.value}
          disabled={module.locked}
          onChange={e => onChange(+e.target.value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, 
              ${module.color} 0%, ${module.color} ${module.value}%, 
              rgba(255,255,255,0.08) ${module.value}%)`,
          }}
        />
        {/* Tick marks at 0, 25, 50, 75, 100 */}
        <div className="flex justify-between text-xs text-slate-700 mt-1 px-0.5">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>

      {/* Intensidad badge */}
      <div className="mt-2 flex gap-2">
        {isEmpty && <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">Sin incluir</span>}
        {!isEmpty && module.value < 30 && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500">Apoyo mínimo</span>}
        {module.value >= 30 && module.value < 60 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${module.color}15`, color: module.color }}>Presencia moderada</span>}
        {module.value >= 60 && module.value < 80 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${module.color}20`, color: module.color }}>Componente principal</span>}
        {module.value >= 80 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${module.color}25`, color: module.color }}>⭐ Foco prioritario</span>}
        {module.locked && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">🔒 Bloqueado</span>}
      </div>
    </div>
  )
}

function SliderField({
  label, min, max, step = 1, value, onChange, marks, hint
}: {
  label: string; min: number; max: number; step?: number
  value: number; onChange: (v: number) => void
  marks?: string[]; hint?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full accent-brand-500"
      />
      {marks && (
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          {marks.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      )}
      {hint && <p className="text-xs text-brand-400/70 mt-1">{hint}</p>}
    </div>
  )
}
