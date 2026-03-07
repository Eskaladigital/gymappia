'use client'

import { useState } from 'react'
import type { TrainingPlan, WorkoutDay, SessionLog } from '@/types'
import { DIA_LABEL } from '@/lib/utils'

interface MonthlyCalendarProps {
  plan: TrainingPlan
  logs?: SessionLog[]
  startDate?: string
  onDayClick?: (day: WorkoutDay, semana: number) => void
  readOnly?: boolean
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const DAY_LABELS = ['L','M','X','J','V','S','D']

const DIA_TO_JS: Record<string, number> = {
  lunes: 1, martes: 2, miercoles: 3, jueves: 4,
  viernes: 5, sabado: 6, domingo: 0,
}

// Normaliza "miércoles" → "miercoles" por si la IA devuelve tildes
function normalizeDia(dia: string): string {
  return (dia || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Columna del grid (lunes=0 .. domingo=6)
function dayCol(jsDay: number) {
  return jsDay === 0 ? 6 : jsDay - 1
}

// Devuelve el lunes de la semana a la que pertenece una fecha
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const col = dayCol(d.getDay()) // 0=lun..6=dom
  d.setDate(d.getDate() - col)
  return d
}

interface CalCell {
  date: Date
  workoutDay: WorkoutDay | null
  semana: number | null
  done: boolean
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}

function buildCalendar(
  plan: TrainingPlan,
  logs: SessionLog[],
  viewYear: number,
  viewMonth: number,
  planStart: Date,
): CalCell[] {
  // Anclar el inicio del plan al lunes de esa semana
  const weekAnchor = getMondayOf(planStart)

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const startCol = dayCol(firstOfMonth.getDay())
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - startCol)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: CalCell[] = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    date.setHours(0, 0, 0, 0)

    // Días desde el lunes-ancla (puede ser negativo si date es anterior al plan)
    const msFromAnchor = date.getTime() - weekAnchor.getTime()
    const daysFromAnchor = Math.floor(msFromAnchor / 86400000)

    // Número de semana del plan (1-based). Negativo = antes del plan.
    const planWeek = daysFromAnchor >= 0 ? Math.floor(daysFromAnchor / 7) + 1 : null

    let workoutDay: WorkoutDay | null = null
    let semana: number | null = null

    if (planWeek !== null) {
      const week = plan.semanas.find(s => s.semana === planWeek)
      if (week) {
        const jsDay = date.getDay()
        const match = week.dias.find(d => DIA_TO_JS[normalizeDia(d.dia)] === jsDay)
        if (match) {
          workoutDay = match
          semana = planWeek
        }
      }
    }

    // ¿Está completado? Comparar por semana + nombre de día (normalizado por tildes)
    const done = workoutDay !== null && logs.some(l =>
      l.completado &&
      l.semana === semana &&
      normalizeDia(l.dia_nombre) === normalizeDia(workoutDay!.dia)
    )

    const isToday = date.getTime() === today.getTime()
    const isPast = date < today
    const isFuture = date > today

    cells.push({ date, workoutDay, semana, done, isToday, isPast, isFuture })
  }

  return cells
}

// Colores por tipo de entreno
function getTipoColor(tipo: string): { bg: string; border: string; text: string; dot: string } {
  const t = tipo.toLowerCase()
  if (t.includes('fuerza') || t.includes('muscu') || t.includes('hipertrofia'))
    return { bg: 'bg-blue-500/25', border: 'border-blue-400/50', text: 'text-blue-300', dot: 'bg-blue-400' }
  if (t.includes('cardio') || t.includes('hiit') || t.includes('metab'))
    return { bg: 'bg-orange-500/25', border: 'border-orange-400/50', text: 'text-orange-300', dot: 'bg-orange-400' }
  if (t.includes('movilidad') || t.includes('flexib') || t.includes('core'))
    return { bg: 'bg-purple-500/25', border: 'border-purple-400/50', text: 'text-purple-300', dot: 'bg-purple-400' }
  if (t.includes('full') || t.includes('completo'))
    return { bg: 'bg-cyan-500/25', border: 'border-cyan-400/50', text: 'text-cyan-300', dot: 'bg-cyan-400' }
  // default — verde brand
  return { bg: 'bg-brand-500/25', border: 'border-brand-400/50', text: 'text-brand-300', dot: 'bg-brand-400' }
}

export default function MonthlyCalendar({
  plan,
  logs = [],
  startDate,
  onDayClick,
  readOnly = false,
}: MonthlyCalendarProps) {
  const planStart = startDate
    ? (() => { const d = new Date(startDate); d.setHours(0,0,0,0); return d })()
    : (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()

  const [viewYear, setViewYear] = useState(() => planStart.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => planStart.getMonth())

  const cells = buildCalendar(plan, logs, viewYear, viewMonth, planStart)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const monthCells = cells.filter(c => c.date.getMonth() === viewMonth)
  const monthWorkouts = monthCells.filter(c => c.workoutDay !== null).length
  const monthDone = monthCells.filter(c => c.done).length

  return (
    <div className="glass rounded-2xl overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={prevMonth}
          className="w-9 h-9 rounded-xl glass hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-xl font-light">
          ‹
        </button>
        <div className="text-center">
          <p className="font-black text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {monthDone} de {monthWorkouts} sesiones completadas
          </p>
        </div>
        <button onClick={nextMonth}
          className="w-9 h-9 rounded-xl glass hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-xl font-light">
          ›
        </button>
      </div>

      {/* Barra progreso */}
      {monthWorkouts > 0 && (
        <div className="mx-5 mb-4">
          <div className="w-full bg-white/8 rounded-full h-1.5">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((monthDone / monthWorkouts) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Cabecera días */}
      <div className="grid grid-cols-7 px-3 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[11px] text-slate-600 font-bold py-1 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {cells.map((cell, i) => {
          const isCurrentMonth = cell.date.getMonth() === viewMonth
          const hasWorkout = cell.workoutDay !== null
          const canClick = hasWorkout && isCurrentMonth && !readOnly && !!onDayClick
          const colors = hasWorkout ? getTipoColor(cell.workoutDay!.tipo) : null

          return (
            <button
              key={i}
              disabled={!canClick}
              onClick={() => canClick && onDayClick!(cell.workoutDay!, cell.semana!)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all
                ${!isCurrentMonth ? 'opacity-15 cursor-default' : ''}
                ${cell.isToday ? 'ring-2 ring-brand-500 ring-offset-1 ring-offset-transparent' : ''}
                ${hasWorkout && isCurrentMonth
                  ? cell.done
                    // Completado: verde sólido
                    ? 'bg-brand-500/30 border-2 border-brand-400/70 cursor-pointer hover:bg-brand-500/40'
                    : cell.isPast
                      // Pasado sin hacer: naranja aviso
                      ? `${colors!.bg} border-2 ${colors!.border} cursor-pointer hover:opacity-80 opacity-70`
                      // Futuro pendiente: color por tipo, destacado
                      : `${colors!.bg} border-2 ${colors!.border} cursor-pointer hover:opacity-90`
                  : 'cursor-default border border-transparent'
                }
              `}
            >
              {/* Número del día */}
              <span className={`
                font-bold leading-none
                ${hasWorkout && isCurrentMonth
                  ? cell.done ? 'text-brand-300 text-xs' : `${colors!.text} text-xs`
                  : cell.isToday ? 'text-brand-400 text-xs' : 'text-slate-500 text-xs'
                }
              `}>
                {cell.date.getDate()}
              </span>

              {/* Indicador de tipo de entreno */}
              {hasWorkout && isCurrentMonth && (
                <span className={`
                  mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                  ${cell.done ? 'bg-brand-400' : colors!.dot}
                  ${cell.isPast && !cell.done ? 'opacity-60' : ''}
                `} />
              )}

              {/* Check de completado */}
              {cell.done && isCurrentMonth && (
                <span className="absolute top-0.5 right-0.5 text-[8px] text-brand-400 font-black">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Leyenda ── */}
      <div className="flex gap-3 px-5 pb-4 flex-wrap justify-center">
        <LegendDot color="bg-brand-500/30 border-2 border-brand-400/70" label="Hecho" />
        <LegendDot color="bg-blue-500/25 border-2 border-blue-400/50" label="Fuerza" />
        <LegendDot color="bg-orange-500/25 border-2 border-orange-400/50" label="Cardio/HIIT" />
        <LegendDot color="bg-purple-500/25 border-2 border-purple-400/50" label="Movilidad" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded ring-2 ring-brand-500" />
          <span className="text-[11px] text-slate-500">Hoy</span>
        </div>
      </div>

      {/* ── Lista sesiones del mes ── */}
      <div className="border-t border-white/8 px-5 py-4">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-3">
          Sesiones este mes
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {monthCells
            .filter(c => c.workoutDay !== null && c.date.getMonth() === viewMonth)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((c, i) => {
              const colors = getTipoColor(c.workoutDay!.tipo)
              return (
                <button
                  key={i}
                  disabled={readOnly || !onDayClick}
                  onClick={() => onDayClick && onDayClick(c.workoutDay!, c.semana!)}
                  className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-all text-left
                    ${c.done
                      ? 'bg-brand-500/10 border border-brand-500/20'
                      : 'bg-white/3 border border-white/8 hover:bg-white/8'
                    }
                    ${!readOnly && onDayClick ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {/* Fecha */}
                  <div className="w-10 flex-shrink-0 text-center">
                    <p className="text-[10px] text-slate-500 uppercase leading-none">
                      {MONTH_NAMES[viewMonth].slice(0,3)}
                    </p>
                    <p className={`text-sm font-black leading-tight ${c.done ? 'text-brand-400' : 'text-white'}`}>
                      {c.date.getDate()}
                    </p>
                  </div>

                  {/* Dot tipo */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.done ? 'bg-brand-400' : colors.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold capitalize truncate ${c.done ? 'text-brand-300' : 'text-white'}`}>
                      {c.workoutDay!.tipo}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {DIA_LABEL[c.workoutDay!.dia] ?? c.workoutDay!.dia} · {c.workoutDay!.duracion_min}min · {c.workoutDay!.ejercicios.length} ej · Sem {c.semana}
                    </p>
                  </div>

                  {/* Estado */}
                  {c.done
                    ? <span className="text-brand-400 text-xs font-black flex-shrink-0">✓</span>
                    : c.isPast
                      ? <span className="text-orange-400 text-[10px] flex-shrink-0">⚠️</span>
                      : <span className="text-slate-600 text-xs flex-shrink-0">›</span>
                  }
                </button>
              )
            })
          }
          {monthCells.filter(c => c.workoutDay !== null).length === 0 && (
            <p className="text-slate-600 text-xs text-center py-3">Sin sesiones en este mes</p>
          )}
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-4 h-4 rounded ${color}`} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}
