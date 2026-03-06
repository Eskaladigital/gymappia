'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientProfile, ClientGoal, TrainingLocation, FitnessLevel, DayOfWeek } from '@/types'

// ─── Steps config ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Tú', icon: '👤' },
  { id: 2, label: 'Salud', icon: '❤️' },
  { id: 3, label: 'Objetivo', icon: '🎯' },
  { id: 4, label: 'Horario', icon: '📅' },
  { id: 5, label: 'Entreno', icon: '🏋️' },
  { id: 6, label: 'Vida', icon: '🧘' },
]

const DIAS: DayOfWeek[] = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const DIAS_LABELS: Record<DayOfWeek, string> = {
  lunes:'L', martes:'M', miercoles:'X', jueves:'J', viernes:'V', sabado:'S', domingo:'D'
}

// Mensajes del "pensamiento IA" — puramente cosméticos
const AI_THOUGHTS = [
  '🧠 Analizando tu perfil físico...',
  '📊 Calculando tu metabolismo basal...',
  '🎯 Definiendo objetivos progresivos...',
  '💪 Seleccionando ejercicios óptimos...',
  '📅 Estructurando semanas de entrenamiento...',
  '🥗 Añadiendo recomendaciones nutricionales...',
  '⚡ Ajustando intensidad y descansos...',
  '✨ Personalizando tu plan final...',
]

const defaultProfile: Partial<ClientProfile> = {
  sexo: 'hombre', objetivo: 'bienestar_general', nivel: 'principiante',
  lugar: 'casa', horario_preferido: 'mañana', sesiones_semana: 3,
  minutos_sesion: 45, dias_preferidos: ['lunes', 'miercoles', 'viernes'],
  horas_sueno: 7, nivel_estres: 5, lesiones: '', enfermedades: '',
  medicacion: '', equipamiento: '', deportes_gusta: '', deportes_odia: '',
  tipo_trabajo: '', obstaculos_pasados: '', seguimiento_preferido: '', objetivo_detalle: '',
}

type Phase = 'form' | 'loading' | 'done'

export default function StartPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [phase, setPhase] = useState<Phase>('form')
  const [aiThought, setAiThought] = useState(0)
  const [profile, setProfile] = useState<Partial<ClientProfile>>(defaultProfile)
  const [error, setError] = useState('')

  const update = (field: keyof ClientProfile, value: any) =>
    setProfile(prev => ({ ...prev, [field]: value }))

  const toggleDia = (dia: DayOfWeek) => {
    const current = profile.dias_preferidos || []
    update('dias_preferidos', current.includes(dia)
      ? current.filter(d => d !== dia)
      : [...current, dia])
  }

  const handleFinish = async () => {
    setPhase('loading')
    setError('')

    // Guardar lead en Supabase (sin generar plan aún)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, status: 'pending' }),
      })
    } catch (_) { /* silencioso – guardamos en background */ }

    // Simular pensamiento IA: ciclar mensajes cada 1.8s
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < AI_THOUGHTS.length) {
        setAiThought(i)
      } else {
        clearInterval(interval)
        setPhase('done')
      }
    }, 1800)
  }

  // ─── FASE: Loading / IA pensando ─────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Brain animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-brand-500/20 border-2 border-brand-500/50 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🤖</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-brand-500/20 animate-spin" style={{ animationDuration: '3s', borderTopColor: '#22c55e' }} />
            </div>
          </div>

          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Creando tu plan personalizado...
          </h2>
          <p className="text-slate-500 text-sm mb-8">Nuestra IA está analizando tu perfil</p>

          {/* Thought bubble */}
          <div className="glass rounded-2xl p-5 mb-6 min-h-[64px] flex items-center justify-center">
            <p className="text-brand-400 font-medium animate-fadeInUp" key={aiThought}>
              {AI_THOUGHTS[aiThought]}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-300 rounded-full transition-all duration-1000"
              style={{ width: `${((aiThought + 1) / AI_THOUGHTS.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {Math.round(((aiThought + 1) / AI_THOUGHTS.length) * 100)}% completado
          </p>
        </div>
      </div>
    )
  }

  // ─── FASE: Plan "listo" → CTA registro ───────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fadeInUp">
          {/* Success */}
          <div className="w-24 h-24 mx-auto rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center mb-6 animate-pulse-green">
            <span className="text-4xl">✅</span>
          </div>

          <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            ¡{profile.nombre?.split(' ')[0]}, tu plan está listo!
          </h2>
          <p className="text-slate-400 mb-2">
            Hemos creado un plan de entrenamiento personalizado de <strong className="text-white">4 semanas</strong> especialmente para ti.
          </p>

          {/* Plan preview teaser */}
          <div className="glass rounded-2xl p-5 my-6 text-left">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-3">Vista previa de tu plan</p>
            <div className="space-y-2">
              {[
                `📅 ${profile.sesiones_semana} sesiones/semana de ${profile.minutos_sesion} min`,
                `🎯 Objetivo: ${GOAL_LABELS[profile.objetivo as string]}`,
                `🏋️ Adaptado a: ${LOCATION_LABELS[profile.lugar as string]}`,
                `⚡ Nivel: ${LEVEL_LABELS[profile.nivel as string]}`,
                `📈 4 semanas con progresión integrada`,
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* Blur overlay on last item → tease */}
            <div className="mt-3 pt-3 border-t border-white/5 relative">
              <div className="blur-sm select-none text-sm text-slate-400 space-y-1">
                <p>Semana 1 · Día 1: Activación full body...</p>
                <p>Semana 1 · Día 2: Fuerza tren inferior...</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full border border-brand-500/30">
                  🔒 Regístrate para ver el plan completo
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/auth/register?email=${encodeURIComponent(profile.email || '')}`)}
            className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl text-base transition-all mb-3"
          >
            Acceder a mi plan →
          </button>
          <p className="text-xs text-slate-500">
            Ya tienes cuenta? <button onClick={() => router.push('/auth/login')} className="text-brand-400 hover:underline">Inicia sesión</button>
          </p>

          <p className="text-xs text-slate-600 mt-4">
            Tu entrenador revisará y activará tu plan en menos de 24h
          </p>
        </div>
      </div>
    )
  }

  // ─── FASE: Formulario ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      {/* Header PACGYM */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-2xl">💪</span>
          <span className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            PAC<span className="text-brand-400">GYM</span>
          </span>
        </div>
        <h1 className="text-xl font-bold">Crea tu plan de entrenamiento</h1>
        <p className="text-slate-500 text-sm mt-1">Personalizado con IA · Sin compromiso</p>
      </div>

      {/* Progress steps */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map(s => (
          <div key={s.id} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${
              s.id <= step ? 'bg-brand-500' : 'bg-white/10'
            }`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-600 mb-6 -mt-4">
        <span>{STEPS[step-1]?.icon} {STEPS[step-1]?.label}</span>
        <span>Paso {step}/{STEPS.length}</span>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-6 animate-fadeInUp">

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">👤 Cuéntanos sobre ti</h2>
            <Field label="Tu nombre *">
              <input type="text" value={profile.nombre || ''} onChange={e => update('nombre', e.target.value)}
                className="input-field" placeholder="Ej: María García" />
            </Field>
            <Field label="Email *">
              <input type="email" value={profile.email || ''} onChange={e => update('email', e.target.value)}
                className="input-field" placeholder="maria@email.com" />
            </Field>
            <Field label="Teléfono (opcional)">
              <input type="tel" value={profile.telefono || ''} onChange={e => update('telefono', e.target.value)}
                className="input-field" placeholder="+34 600 000 000" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Edad">
                <input type="number" value={profile.edad || ''} onChange={e => update('edad', +e.target.value)}
                  className="input-field" placeholder="30" />
              </Field>
              <Field label="Peso kg">
                <input type="number" value={profile.peso || ''} onChange={e => update('peso', +e.target.value)}
                  className="input-field" placeholder="70" />
              </Field>
              <Field label="Altura cm">
                <input type="number" value={profile.altura || ''} onChange={e => update('altura', +e.target.value)}
                  className="input-field" placeholder="170" />
              </Field>
            </div>
            <Field label="Sexo">
              <div className="flex gap-2">
                {(['hombre', 'mujer', 'otro'] as const).map(s => (
                  <button key={s} onClick={() => update('sexo', s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm capitalize transition-all font-medium ${
                      profile.sexo === s ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-white/10'
                    }`}>{s}</button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-1">❤️ Salud y limitaciones</h2>
            <p className="text-sm text-slate-500 mb-4">Esta información es confidencial y nos ayuda a adaptar tu plan de forma segura.</p>
            <Field label="¿Tienes lesiones o molestias físicas?">
              <textarea value={profile.lesiones || ''} onChange={e => update('lesiones', e.target.value)}
                className="input-field resize-none" rows={3}
                placeholder="Ej: Rodilla derecha, hernia lumbar... (vacío si ninguna)" />
            </Field>
            <Field label="¿Enfermedades crónicas o condiciones médicas?">
              <textarea value={profile.enfermedades || ''} onChange={e => update('enfermedades', e.target.value)}
                className="input-field resize-none" rows={2}
                placeholder="Ej: Hipertensión, diabetes... (vacío si ninguna)" />
            </Field>
            <Field label="¿Medicación relevante?">
              <input type="text" value={profile.medicacion || ''} onChange={e => update('medicacion', e.target.value)}
                className="input-field" placeholder="Vacío si ninguna" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">🎯 ¿Cuál es tu objetivo?</h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['perder_grasa', '🔥', 'Perder grasa'],
                ['ganar_musculo', '💪', 'Ganar músculo'],
                ['tonificar', '✨', 'Tonificar'],
                ['mejorar_resistencia', '🏃', 'Resistencia'],
                ['rendimiento_deportivo', '🏆', 'Rendimiento'],
                ['bienestar_general', '🧘', 'Bienestar'],
              ] as [ClientGoal, string, string][]).map(([val, icon, label]) => (
                <button key={val} onClick={() => update('objetivo', val)}
                  className={`p-4 rounded-xl text-sm font-medium text-left transition-all flex items-center gap-2 ${
                    profile.objetivo === val ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-white/10'
                  }`}>
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <Field label="Cuéntame más (opcional)">
              <textarea value={profile.objetivo_detalle || ''} onChange={e => update('objetivo_detalle', e.target.value)}
                className="input-field resize-none" rows={3}
                placeholder="Ej: Quiero perder 8kg antes del verano, empezando desde cero..." />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold mb-4">📅 Tu disponibilidad</h2>
            <Field label={`Días por semana: ${profile.sesiones_semana}`}>
              <input type="range" min={1} max={7} value={profile.sesiones_semana || 3}
                onChange={e => update('sesiones_semana', +e.target.value)}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 día</span><span>4 días</span><span>7 días</span>
              </div>
            </Field>
            <Field label={`Duración de cada sesión: ${profile.minutos_sesion} min`}>
              <input type="range" min={20} max={120} step={5} value={profile.minutos_sesion || 45}
                onChange={e => update('minutos_sesion', +e.target.value)}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>20 min</span><span>60 min</span><span>120 min</span>
              </div>
            </Field>
            <Field label="Días preferidos">
              <div className="flex gap-2">
                {DIAS.map(dia => (
                  <button key={dia} onClick={() => toggleDia(dia)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      profile.dias_preferidos?.includes(dia)
                        ? 'bg-brand-500 text-black' : 'glass text-slate-400 hover:bg-white/10'
                    }`}>{DIAS_LABELS[dia]}</button>
                ))}
              </div>
            </Field>
            <Field label="Horario preferido">
              <div className="flex gap-2">
                {(['mañana', 'tarde', 'noche'] as const).map(h => (
                  <button key={h} onClick={() => update('horario_preferido', h)}
                    className={`flex-1 py-2.5 rounded-xl text-sm capitalize transition-all ${
                      profile.horario_preferido === h ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-white/10'
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
            <h2 className="text-lg font-bold mb-4">🏋️ Tu entrenamiento</h2>
            <Field label="¿Dónde vas a entrenar?">
              <div className="grid grid-cols-2 gap-2">
                {([['casa','🏠','Casa'],['gimnasio','🏋️','Gimnasio'],['exterior','🌿','Exterior'],['mixto','🔄','Mixto']] as [TrainingLocation,string,string][])
                  .map(([val, icon, label]) => (
                    <button key={val} onClick={() => update('lugar', val)}
                      className={`p-3 rounded-xl text-sm flex items-center gap-2 transition-all font-medium ${
                        profile.lugar === val ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-white/10'
                      }`}>
                      <span>{icon}</span><span>{label}</span>
                    </button>
                  ))}
              </div>
            </Field>
            <Field label="Equipamiento disponible">
              <input type="text" value={profile.equipamiento || ''} onChange={e => update('equipamiento', e.target.value)}
                className="input-field" placeholder="Ej: Mancuernas, bandas, esterilla..." />
            </Field>
            <Field label="Nivel de experiencia">
              <div className="flex gap-2">
                {([['principiante','🌱'],['intermedio','⚡'],['avanzado','🔥']] as [FitnessLevel, string][])
                  .map(([val, icon]) => (
                    <button key={val} onClick={() => update('nivel', val)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                        profile.nivel === val ? 'bg-brand-500 text-black font-bold' : 'glass hover:bg-white/10'
                      }`}>
                      {icon} {val}
                    </button>
                  ))}
              </div>
            </Field>
            <Field label="¿Qué te gusta hacer?">
              <input type="text" value={profile.deportes_gusta || ''} onChange={e => update('deportes_gusta', e.target.value)}
                className="input-field" placeholder="Ej: Caminar, bici, yoga..." />
            </Field>
            <Field label="¿Qué no quieres hacer?">
              <input type="text" value={profile.deportes_odia || ''} onChange={e => update('deportes_odia', e.target.value)}
                className="input-field" placeholder="Ej: Running, burpees..." />
            </Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">🧘 Tu estilo de vida</h2>
            <Field label="¿A qué te dedicas?">
              <input type="text" value={profile.tipo_trabajo || ''} onChange={e => update('tipo_trabajo', e.target.value)}
                className="input-field" placeholder="Ej: Oficina, trabajo físico, autónomo..." />
            </Field>
            <Field label={`Horas de sueño: ${profile.horas_sueno}h`}>
              <input type="range" min={4} max={10} value={profile.horas_sueno || 7}
                onChange={e => update('horas_sueno', +e.target.value)} className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>4h</span><span>7h</span><span>10h</span></div>
            </Field>
            <Field label={`Nivel de estrés: ${profile.nivel_estres}/10`}>
              <input type="range" min={1} max={10} value={profile.nivel_estres || 5}
                onChange={e => update('nivel_estres', +e.target.value)} className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Muy bajo</span><span>Normal</span><span>Muy alto</span></div>
            </Field>
            <Field label="¿Qué te ha frenado antes?">
              <textarea value={profile.obstaculos_pasados || ''} onChange={e => update('obstaculos_pasados', e.target.value)}
                className="input-field resize-none" rows={2}
                placeholder="Ej: Falta de tiempo, no ver resultados..." />
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">⚠️ {error}</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-all">
            ← Atrás
          </button>
        )}
        {step < STEPS.length ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-sm transition-all">
            Siguiente →
          </button>
        ) : (
          <button onClick={handleFinish}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl text-sm transition-all">
            🚀 Crear mi plan con IA
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      {children}
    </div>
  )
}

// Labels helpers (duplicados aquí para evitar imports en client component)
const GOAL_LABELS: Record<string, string> = {
  perder_grasa: 'Perder grasa', ganar_musculo: 'Ganar músculo', tonificar: 'Tonificar',
  mejorar_resistencia: 'Mejorar resistencia', rendimiento_deportivo: 'Rendimiento deportivo', bienestar_general: 'Bienestar general',
}
const LEVEL_LABELS: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }
const LOCATION_LABELS: Record<string, string> = { casa: '🏠 Casa', gimnasio: '🏋️ Gimnasio', exterior: '🌿 Exterior', mixto: '🔄 Mixto' }
