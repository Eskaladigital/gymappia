'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientProfile, ClientGoal, TrainingLocation, FitnessLevel, DayOfWeek } from '@/types'

const STEPS = [
  { id: 1, label: 'Datos personales', icon: '👤' },
  { id: 2, label: 'Salud', icon: '❤️' },
  { id: 3, label: 'Objetivo', icon: '🎯' },
  { id: 4, label: 'Disponibilidad', icon: '📅' },
  { id: 5, label: 'Entrenamiento', icon: '🏋️' },
  { id: 6, label: 'Estilo de vida', icon: '🧘' },
]

const DIAS: DayOfWeek[] = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const DIAS_LABELS: Record<DayOfWeek, string> = {
  lunes: 'L', martes: 'M', miercoles: 'X', jueves: 'J',
  viernes: 'V', sabado: 'S', domingo: 'D'
}

const defaultProfile: Partial<ClientProfile> = {
  sexo: 'hombre',
  objetivo: 'bienestar_general',
  nivel: 'principiante',
  lugar: 'casa',
  horario_preferido: 'mañana',
  sesiones_semana: 3,
  minutos_sesion: 45,
  dias_preferidos: ['lunes', 'miercoles', 'viernes'],
  horas_sueno: 7,
  nivel_estres: 5,
  lesiones: '', enfermedades: '', medicacion: '',
  equipamiento: '', deportes_gusta: '', deportes_odia: '',
  tipo_trabajo: '', obstaculos_pasados: '', seguimiento_preferido: '',
  objetivo_detalle: '',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<Partial<ClientProfile>>(defaultProfile)

  const update = (field: keyof ClientProfile, value: any) =>
    setProfile(prev => ({ ...prev, [field]: value }))

  const toggleDia = (dia: DayOfWeek) => {
    const current = profile.dias_preferidos || []
    const next = current.includes(dia)
      ? current.filter(d => d !== dia)
      : [...current, dia]
    update('dias_preferidos', next)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error generando el plan')
      }
      const data = await res.json()
      router.push(`/clientes/${data.client.id}`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-sm mb-4 flex items-center gap-2">
          ← Volver
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          Nuevo cliente
        </h1>
        <p className="text-slate-600 dark:text-slate-500 text-sm">Rellena los datos para generar el plan con IA</p>
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              s.id === step ? 'step-active' :
              s.id < step ? 'step-done cursor-pointer' : 'step-pending'
            }`}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.id}</span>
          </button>
        ))}
      </div>

      {/* Form steps */}
      <div className="glass rounded-2xl p-6 animate-fadeInUp">

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">👤 Datos personales</h2>
            <Field label="Nombre completo *">
              <input type="text" value={profile.nombre || ''} onChange={e => update('nombre', e.target.value)}
                className="input-field" placeholder="Ana García" />
            </Field>
            <Field label="Email *">
              <input type="email" value={profile.email || ''} onChange={e => update('email', e.target.value)}
                className="input-field" placeholder="ana@email.com" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Edad">
                <input type="number" value={profile.edad || ''} onChange={e => update('edad', +e.target.value)}
                  className="input-field" placeholder="30" />
              </Field>
              <Field label="Peso (kg)">
                <input type="number" value={profile.peso || ''} onChange={e => update('peso', +e.target.value)}
                  className="input-field" placeholder="70" />
              </Field>
              <Field label="Altura (cm)">
                <input type="number" value={profile.altura || ''} onChange={e => update('altura', +e.target.value)}
                  className="input-field" placeholder="170" />
              </Field>
            </div>
            <Field label="Sexo">
              <div className="flex gap-2">
                {(['hombre', 'mujer', 'otro'] as const).map(s => (
                  <button key={s} onClick={() => update('sexo', s)}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize transition-all ${
                      profile.sexo === s ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">❤️ Salud y limitaciones</h2>
            <Field label="¿Tienes lesiones o molestias físicas?">
              <textarea value={profile.lesiones || ''} onChange={e => update('lesiones', e.target.value)}
                className="input-field resize-none" rows={3}
                placeholder="Ej: Rodilla derecha, hernia lumbar L4-L5... (deja vacío si ninguna)" />
            </Field>
            <Field label="¿Enfermedades crónicas o condiciones médicas?">
              <textarea value={profile.enfermedades || ''} onChange={e => update('enfermedades', e.target.value)}
                className="input-field resize-none" rows={2}
                placeholder="Ej: Hipertensión, diabetes tipo 2... (deja vacío si ninguna)" />
            </Field>
            <Field label="¿Tomas alguna medicación relevante?">
              <input type="text" value={profile.medicacion || ''} onChange={e => update('medicacion', e.target.value)}
                className="input-field" placeholder="Deja vacío si ninguna" />
            </Field>
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-sm text-brand-700 dark:text-brand-300">
              💡 Esta información es confidencial y solo se usa para adaptar los ejercicios a tu seguridad.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">🎯 Objetivo</h2>
            <Field label="¿Cuál es tu objetivo principal? *">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['perder_grasa', '🔥 Perder grasa'],
                  ['ganar_musculo', '💪 Ganar músculo'],
                  ['tonificar', '✨ Tonificar'],
                  ['mejorar_resistencia', '🏃 Resistencia'],
                  ['rendimiento_deportivo', '🏆 Rendimiento'],
                  ['bienestar_general', '🧘 Bienestar'],
                ] as [ClientGoal, string][]).map(([val, label]) => (
                  <button key={val} onClick={() => update('objetivo', val)}
                    className={`p-3 rounded-xl text-sm font-medium text-left transition-all ${
                      profile.objetivo === val ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-white/10'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Cuéntame más sobre tu objetivo">
              <textarea value={profile.objetivo_detalle || ''} onChange={e => update('objetivo_detalle', e.target.value)}
                className="input-field resize-none" rows={3}
                placeholder="Ej: Quiero perder 8kg antes del verano, empezando desde cero..." />
            </Field>
            <Field label="¿Fecha objetivo? (opcional)">
              <input type="date" value={profile.fecha_objetivo || ''} onChange={e => update('fecha_objetivo', e.target.value)}
                className="input-field" />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">📅 Disponibilidad</h2>
            <Field label={`Sesiones por semana: ${profile.sesiones_semana}`}>
              <input type="range" min={1} max={7} value={profile.sesiones_semana || 3}
                onChange={e => update('sesiones_semana', +e.target.value)}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-500 mt-1">
                <span>1 día</span><span>4 días</span><span>7 días</span>
              </div>
            </Field>
            <Field label={`Minutos por sesión: ${profile.minutos_sesion} min`}>
              <input type="range" min={20} max={120} step={5} value={profile.minutos_sesion || 45}
                onChange={e => update('minutos_sesion', +e.target.value)}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-500 mt-1">
                <span>20 min</span><span>60 min</span><span>120 min</span>
              </div>
            </Field>
            <Field label="Días preferidos">
              <div className="flex gap-2">
                {DIAS.map(dia => (
                  <button key={dia} onClick={() => toggleDia(dia)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      profile.dias_preferidos?.includes(dia)
                        ? 'bg-brand-500 text-black' : 'glass hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}>
                    {DIAS_LABELS[dia]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Horario preferido">
              <div className="flex gap-2">
                {(['mañana', 'tarde', 'noche'] as const).map(h => (
                  <button key={h} onClick={() => update('horario_preferido', h)}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize transition-all ${
                      profile.horario_preferido === h ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}>
                    {h === 'mañana' ? '🌅' : h === 'tarde' ? '🌤️' : '🌙'} {h}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">🏋️ Entrenamiento</h2>
            <Field label="¿Dónde entrenas? *">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['casa', '🏠 Casa'],
                  ['gimnasio', '🏋️ Gimnasio'],
                  ['exterior', '🌿 Exterior'],
                  ['mixto', '🔄 Mixto'],
                ] as [TrainingLocation, string][]).map(([val, label]) => (
                  <button key={val} onClick={() => update('lugar', val)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      profile.lugar === val ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Equipamiento disponible">
              <input type="text" value={profile.equipamiento || ''} onChange={e => update('equipamiento', e.target.value)}
                className="input-field" placeholder="Ej: Mancuernas, banda elástica, esterilla..." />
            </Field>
            <Field label="Nivel de experiencia *">
              <div className="flex gap-2">
                {([
                  ['principiante', '🌱 Principiante'],
                  ['intermedio', '⚡ Intermedio'],
                  ['avanzado', '🔥 Avanzado'],
                ] as [FitnessLevel, string][]).map(([val, label]) => (
                  <button key={val} onClick={() => update('nivel', val)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      profile.nivel === val ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="¿Qué actividades/deportes te gustan?">
              <input type="text" value={profile.deportes_gusta || ''} onChange={e => update('deportes_gusta', e.target.value)}
                className="input-field" placeholder="Ej: Caminar, ciclismo, natación..." />
            </Field>
            <Field label="¿Qué no te gusta o quieres evitar?">
              <input type="text" value={profile.deportes_odia || ''} onChange={e => update('deportes_odia', e.target.value)}
                className="input-field" placeholder="Ej: Running, burpees, saltos..." />
            </Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">🧘 Estilo de vida</h2>
            <Field label="¿A qué te dedicas? (tipo de trabajo)">
              <input type="text" value={profile.tipo_trabajo || ''} onChange={e => update('tipo_trabajo', e.target.value)}
                className="input-field" placeholder="Ej: Trabajo de oficina, trabajo físico, autónomo..." />
            </Field>
            <Field label={`Horas de sueño habitual: ${profile.horas_sueno}h`}>
              <input type="range" min={4} max={10} value={profile.horas_sueno || 7}
                onChange={e => update('horas_sueno', +e.target.value)}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-500 mt-1">
                <span>4h</span><span>7h</span><span>10h</span>
              </div>
            </Field>
            <Field label={`Nivel de estrés habitual: ${profile.nivel_estres}/10`}>
              <input type="range" min={1} max={10} value={profile.nivel_estres || 5}
                onChange={e => update('nivel_estres', +e.target.value)}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-500 mt-1">
                <span>Muy bajo</span><span>Moderado</span><span>Muy alto</span>
              </div>
            </Field>
            <Field label="¿Qué te ha impedido mantener el hábito antes?">
              <textarea value={profile.obstaculos_pasados || ''} onChange={e => update('obstaculos_pasados', e.target.value)}
                className="input-field resize-none" rows={2}
                placeholder="Ej: Falta de tiempo, no ver resultados, aburrimiento..." />
            </Field>
            <Field label="¿Cómo prefieres el seguimiento?">
              <input type="text" value={profile.seguimiento_preferido || ''} onChange={e => update('seguimiento_preferido', e.target.value)}
                className="input-field" placeholder="Ej: Check-in semanal por WhatsApp, vídeos de progreso..." />
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 glass hover:bg-slate-100/50 dark:hover:bg-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-all">
            ← Anterior
          </button>
        )}
        {step < STEPS.length ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-sm transition-all">
            Siguiente →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition-all">
            {loading ? '🤖 Generando plan con IA...' : '✨ Generar plan de entrenamiento'}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-600 dark:text-slate-500 mt-4">
        Paso {step} de {STEPS.length}
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">{label}</label>
      {children}
    </div>
  )
}
