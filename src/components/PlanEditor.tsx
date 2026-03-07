'use client'

import { useState, useCallback } from 'react'
import type { TrainingPlan, WorkoutDay, Exercise } from '@/types'
import { DIA_ABBREV, DIA_LABEL } from '@/lib/utils'

interface PlanEditorProps {
  plan: TrainingPlan
  onSave: (updatedPlan: TrainingPlan) => Promise<void>
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function PlanEditor({ plan, onSave }: PlanEditorProps) {
  const [semanas, setSemanas] = useState(() => deepClone(plan.semanas))
  const [activeWeek, setActiveWeek] = useState(1)
  const [expandedDay, setExpandedDay] = useState<string | null>('0-0')  // Primer día expandido por defecto
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const markDirty = () => { setDirty(true); setSaved(false) }

  // ── Actualizar ejercicio ─────────────────────────────────────────────────
  const updateExercise = useCallback((
    weekIdx: number, dayIdx: number, exIdx: number,
    field: keyof Exercise, value: string | number
  ) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      const ex = next[weekIdx].dias[dayIdx].ejercicios[exIdx]
      ;(ex as any)[field] = value
      return next
    })
    markDirty()
  }, [])

  // ── Eliminar ejercicio ───────────────────────────────────────────────────
  const removeExercise = useCallback((weekIdx: number, dayIdx: number, exIdx: number) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      next[weekIdx].dias[dayIdx].ejercicios.splice(exIdx, 1)
      return next
    })
    markDirty()
  }, [])

  // ── Añadir ejercicio ────────────────────────────────────────────────────
  const addExercise = useCallback((weekIdx: number, dayIdx: number) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      next[weekIdx].dias[dayIdx].ejercicios.push({
        nombre: 'Nuevo ejercicio',
        series: 3,
        repeticiones: '10',
        descanso_seg: 60,
        notas: '',
      })
      return next
    })
    markDirty()
  }, [])

  // ── Mover ejercicio arriba/abajo ────────────────────────────────────────
  const moveExercise = useCallback((
    weekIdx: number, dayIdx: number, exIdx: number, direction: 'up' | 'down'
  ) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      const exs = next[weekIdx].dias[dayIdx].ejercicios
      const target = direction === 'up' ? exIdx - 1 : exIdx + 1
      if (target < 0 || target >= exs.length) return prev
      ;[exs[exIdx], exs[target]] = [exs[target], exs[exIdx]]
      return next
    })
    markDirty()
  }, [])

  // ── Actualizar campo del día ─────────────────────────────────────────────
  const updateDay = useCallback((
    weekIdx: number, dayIdx: number,
    field: keyof WorkoutDay, value: string | number
  ) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      ;(next[weekIdx].dias[dayIdx] as any)[field] = value
      return next
    })
    markDirty()
  }, [])

  // ── Eliminar día ─────────────────────────────────────────────────────────
  const removeDay = useCallback((weekIdx: number, dayIdx: number) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      next[weekIdx].dias.splice(dayIdx, 1)
      return next
    })
    markDirty()
  }, [])

  // ── Añadir día ───────────────────────────────────────────────────────────
  const addDay = useCallback((weekIdx: number) => {
    setSemanas(prev => {
      const next = deepClone(prev)
      next[weekIdx].dias.push({
        dia: 'lunes',
        tipo: 'Fuerza',
        duracion_min: 45,
        ejercicios: [
          { nombre: 'Nuevo ejercicio', series: 3, repeticiones: '10', descanso_seg: 60 }
        ],
      })
      return next
    })
    markDirty()
  }, [])

  // ── Guardar ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ ...plan, semanas })
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Error al guardar el plan')
    }
    setSaving(false)
  }

  const weekIdx = semanas.findIndex(s => s.semana === activeWeek)
  const currentWeek = semanas[weekIdx]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-wider">✏️ Editor de plan</p>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-400 animate-pulse">● Cambios sin guardar</span>
          )}
          {saved && (
            <span className="text-xs text-brand-400">✓ Guardado</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              dirty
                ? 'bg-brand-500 hover:bg-brand-400 text-black'
                : 'glass text-slate-600 cursor-not-allowed'
            }`}
          >
            {saving ? '💾 Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {semanas.map(s => (
          <button
            key={s.semana}
            onClick={() => setActiveWeek(s.semana)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeWeek === s.semana
                ? 'bg-brand-500 text-black font-bold'
                : 'glass text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/10'
            }`}
          >
            Sem {s.semana}
          </button>
        ))}
      </div>

      {/* Objetivo semana editable */}
      {currentWeek && (
        <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-brand-400 text-sm">🎯</span>
          <input
            type="text"
            value={currentWeek.objetivo_semana || ''}
            onChange={e => {
              setSemanas(prev => {
                const next = deepClone(prev)
                next[weekIdx].objetivo_semana = e.target.value
                return next
              })
              markDirty()
            }}
            placeholder="Objetivo de la semana..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-500 dark:placeholder-slate-600 outline-none"
          />
        </div>
      )}

      {/* Días */}
      {currentWeek && (
        <div className="space-y-3">
          {currentWeek.dias.map((day, dayIdx) => (
            <DayEditor
              key={dayIdx}
              day={day}
              dayIdx={dayIdx}
              weekIdx={weekIdx}
              expanded={expandedDay === `${weekIdx}-${dayIdx}`}
              onToggle={() =>
                setExpandedDay(
                  expandedDay === `${weekIdx}-${dayIdx}` ? null : `${weekIdx}-${dayIdx}`
                )
              }
              onUpdateDay={(field, value) => updateDay(weekIdx, dayIdx, field, value)}
              onRemoveDay={() => removeDay(weekIdx, dayIdx)}
              onUpdateExercise={(exIdx, field, value) =>
                updateExercise(weekIdx, dayIdx, exIdx, field, value)
              }
              onRemoveExercise={exIdx => removeExercise(weekIdx, dayIdx, exIdx)}
              onMoveExercise={(exIdx, dir) => moveExercise(weekIdx, dayIdx, exIdx, dir)}
              onAddExercise={() => addExercise(weekIdx, dayIdx)}
            />
          ))}

          {/* Añadir día */}
          <button
            onClick={() => addDay(weekIdx)}
            className="w-full py-3 glass border border-dashed border-white/20 hover:border-brand-500/40 hover:bg-brand-500/5 rounded-2xl text-sm text-slate-500 hover:text-brand-400 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Añadir día de entrenamiento
          </button>
        </div>
      )}
    </div>
  )
}

// ─── DayEditor ────────────────────────────────────────────────────────────────
interface DayEditorProps {
  day: WorkoutDay
  dayIdx: number
  weekIdx: number
  expanded: boolean
  onToggle: () => void
  onUpdateDay: (field: keyof WorkoutDay, value: string | number) => void
  onRemoveDay: () => void
  onUpdateExercise: (exIdx: number, field: keyof Exercise, value: string | number) => void
  onRemoveExercise: (exIdx: number) => void
  onMoveExercise: (exIdx: number, dir: 'up' | 'down') => void
  onAddExercise: () => void
}

const DIAS_OPTIONS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const TIPO_OPTIONS = ['Fuerza','Cardio','Hipertrofia','Movilidad','HIIT','Full Body','Tren superior','Tren inferior','Core','Descanso activo']

function DayEditor({
  day, expanded, onToggle,
  onUpdateDay, onRemoveDay,
  onUpdateExercise, onRemoveExercise, onMoveExercise, onAddExercise,
}: DayEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header del día */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="min-w-[2.5rem] px-1.5 py-1 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {DIA_ABBREV[day.dia] ?? day.dia.slice(0,3)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-white">{DIA_LABEL[day.dia] ?? day.dia}</p>
            <p className="text-xs text-slate-600 dark:text-slate-500">{day.tipo} · {day.duracion_min}min · {day.ejercicios.length} ejercicios</p>
          </div>
          <span className="text-slate-600 text-sm">{expanded ? '▲' : '▼'}</span>
        </button>

        {/* Borrar día */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-shrink-0 w-7 h-7 rounded-lg glass hover:bg-red-500/20 hover:text-red-400 text-slate-600 flex items-center justify-center text-xs transition-all"
            title="Eliminar día"
          >
            🗑
          </button>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-red-400">¿Seguro?</span>
            <button onClick={onRemoveDay}
              className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/40">
              Sí
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 glass text-slate-400 rounded-lg text-xs">
              No
            </button>
          </div>
        )}
      </div>

      {/* Contenido expandible */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          {/* Campos del día */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Día</label>
              <select
                value={day.dia}
                onChange={e => onUpdateDay('dia', e.target.value)}
                className="input-field text-sm w-full"
              >
                {DIAS_OPTIONS.map(d => (
                  <option key={d} value={d} className="bg-slate-900 capitalize">{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo</label>
              <select
                value={day.tipo}
                onChange={e => onUpdateDay('tipo', e.target.value)}
                className="input-field text-sm w-full"
              >
                {TIPO_OPTIONS.map(t => (
                  <option key={t} value={t} className="bg-slate-900">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Duración (min)</label>
              <input
                type="number"
                min={10} max={180} step={5}
                value={day.duracion_min}
                onChange={e => onUpdateDay('duracion_min', +e.target.value)}
                className="input-field text-sm w-full"
              />
            </div>
          </div>

          {/* Nota del día */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">💡 Nota del día (opcional)</label>
            <input
              type="text"
              value={day.notas || ''}
              onChange={e => onUpdateDay('notas', e.target.value)}
              placeholder="Ej: Calentar bien antes. Día de mucho volumen."
              className="input-field text-sm w-full"
            />
          </div>

          {/* Ejercicios */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Ejercicios</p>
            <div className="space-y-2">
              {day.ejercicios.map((ex, exIdx) => (
                <ExerciseRow
                  key={exIdx}
                  exercise={ex}
                  exIdx={exIdx}
                  total={day.ejercicios.length}
                  onChange={(field, value) => onUpdateExercise(exIdx, field, value)}
                  onRemove={() => onRemoveExercise(exIdx)}
                  onMove={dir => onMoveExercise(exIdx, dir)}
                />
              ))}
            </div>

            <button
              onClick={onAddExercise}
              className="mt-3 w-full py-2 glass border border-dashed border-white/15 hover:border-brand-500/30 hover:bg-brand-500/5 rounded-xl text-xs text-slate-500 hover:text-brand-400 transition-all flex items-center justify-center gap-1.5"
            >
              <span>+</span> Añadir ejercicio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ExerciseRow ──────────────────────────────────────────────────────────────
interface ExerciseRowProps {
  exercise: Exercise
  exIdx: number
  total: number
  onChange: (field: keyof Exercise, value: string | number) => void
  onRemove: () => void
  onMove: (dir: 'up' | 'down') => void
}

function ExerciseRow({ exercise, exIdx, total, onChange, onRemove, onMove }: ExerciseRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass border border-white/10 rounded-xl overflow-hidden">
      {/* Fila principal */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Orden */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => onMove('up')}
            disabled={exIdx === 0}
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 text-xs leading-none rounded hover:bg-slate-200/50 dark:hover:bg-white/10"
          >▲</button>
          <button
            onClick={() => onMove('down')}
            disabled={exIdx === total - 1}
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 text-xs leading-none rounded hover:bg-slate-200/50 dark:hover:bg-white/10"
          >▼</button>
        </div>

        <span className="text-xs text-slate-500 font-mono w-5 flex-shrink-0">{exIdx + 1}.</span>

        {/* Nombre — campo principal editable */}
        <input
          type="text"
          value={exercise.nombre}
          onChange={e => onChange('nombre', e.target.value)}
          className="input-field flex-1 min-w-[140px] text-sm font-medium"
          placeholder="Nombre del ejercicio"
        />

        {/* Series */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <label className="text-[10px] text-slate-500 uppercase">Series</label>
          <input
            type="number"
            min={1} max={20}
            value={exercise.series}
            onChange={e => onChange('series', +e.target.value)}
            className="input-field w-12 text-center text-sm font-bold py-1.5"
          />
        </div>

        {/* Reps o Segundos — selector + input */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={exercise.repeticiones?.toLowerCase().includes('seg') ? 'seg' : 'reps'}
            onChange={e => {
              const isSeg = e.target.value === 'seg'
              if (isSeg) {
                const num = parseInt((exercise.repeticiones || '').replace(/\D/g, ''), 10) || 30
                onChange('repeticiones', `${num} seg`)
              } else {
                const val = (exercise.repeticiones || '').replace(/\s*seg/i, '').trim()
                onChange('repeticiones', val || '10')
              }
            }}
            className="input-field w-14 text-center text-xs font-bold py-1.5"
          >
            <option value="reps">Reps</option>
            <option value="seg">Seg</option>
          </select>
          {exercise.repeticiones?.toLowerCase().includes('seg') ? (
            <input
              type="number"
              min={5} max={300} step={5}
              value={parseInt((exercise.repeticiones || '30').replace(/\D/g, ''), 10) || 30}
              onChange={e => onChange('repeticiones', `${e.target.value || 30} seg`)}
              className="input-field w-12 text-center text-sm font-bold py-1.5"
            />
          ) : (
            <input
              type="text"
              value={(exercise.repeticiones || '').replace(/\s*seg/i, '').trim()}
              onChange={e => onChange('repeticiones', e.target.value)}
              className="input-field w-14 text-center text-sm font-bold py-1.5"
              placeholder="10"
              title='Ej: 10, 8-12'
            />
          )}
        </div>

        {/* Descanso */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <label className="text-[10px] text-slate-500 uppercase">Desc.</label>
          <input
            type="number"
            min={10} max={300} step={5}
            value={exercise.descanso_seg}
            onChange={e => onChange('descanso_seg', +e.target.value)}
            className="input-field w-12 text-center text-sm py-1.5"
            title="Segundos"
          />
          <span className="text-slate-500 text-xs">s</span>
        </div>

        {/* Notas */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
            expanded || exercise.notas ? 'bg-amber-500/20 text-amber-400' : 'glass text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
          }`}
          title="Notas del ejercicio"
        >
          💬
        </button>

        {/* Eliminar */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Eliminar ejercicio"
        >
          ✕
        </button>
      </div>

      {/* Nota expandible */}
      {expanded && (
        <div className="px-4 pb-3 pt-2 border-t border-white/5">
          <input
            type="text"
            value={exercise.notas || ''}
            onChange={e => onChange('notas', e.target.value)}
            placeholder="Notas para el cliente (ej: Mantén la espalda recta, ve lento en la bajada...)"
            className="input-field w-full text-sm"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
