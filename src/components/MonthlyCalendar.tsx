'use client'

import { useState } from 'react'
import type { TrainingPlan, WorkoutDay, SessionLog } from '@/types'

interface MonthlyCalendarProps {
  plan: TrainingPlan
  logs?: SessionLog[]
  startDate?: string        // ISO date "2025-03-01" — si no viene, usa hoy como semana 1
  onDayClick?: (day: WorkoutDay, semana: number) => void
  readOnly?: boolean
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const DAY_LABELS = ['L','M','X','J','V','S','D']

// Mapeo nombre del día a índice JS (getDay): lunes=1..domingo=0
const DIA_TO_JS: Record<string, number> = {
  lunes: 1, martes: 2, miercoles: 3, jueves: 4,
  viernes: 5, sabado: 6, domingo: 0,
}

function dayCol(jsDay: number) {
  return jsDay === 0 ? 6 : jsDay - 1
}

interface CalCell {
  date: Date
  workoutDay: WorkoutDay | null
  semana: number | null
  done: boolean
  isToday: boolean
  isPast: boolean
}

function buildCalendar(
  plan: TrainingPlan,
  logs: SessionLog[],
  viewYear: number,
  viewMonth: number,
  planStart: Date,
): CalCell[] {
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

    const msFromStart = date.getTime() - planStart.getTime()
    const daysFromStart = Math.floor(msFromStart / 86400000)
    const planWeek = daysFromStart >= 0 ? Math.floor(daysFromStart / 7) + 1 : null

    let workoutDay: WorkoutDay | null = null
    let semana: number | null = null

    if (planWeek !== null) {
      const week = plan.semanas.find(s => s.semana === planWeek)
      if (week) {
        const jsDay = date.getDay()
        const match = week.dias.find(d => DIA_TO_JS[d.dia] === jsDay)
        if (match) {
          workoutDay = match
          semana = planWeek
        }
      }
    }

    const done = logs.some(l =>
      l.completado &&
      l.semana === semana &&
      workoutDay !== null &&
      l.dia_nombre === workoutDay.dia
    )

    const isToday = date.getTime() === today.getTime()
    const isPast = date < today

    cells.push({ date, workoutDay, semana, done, isToday, isPast })
  }

  return cells
}

export default function MonthlyCalendar({
  plan,
  logs = [],
  startDate,
  onDayClick,
  readOnly = false,
}: MonthlyCalendarProps) {
  const planStart = startDate
    ? new Date(startDate)
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
    <div className="glass rounded-2xl p-4">
      {/* Header navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="w-8 h-8 rounded-lg glass hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-lg">
          ‹
        </button>
        <div className="text-center">
          <p className="font-bold text-base">{MONTH_NAMES[viewMonth]} {viewYear}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {monthDone}/{monthWorkouts} sesiones completadas
          </p>
        </div>
        <button onClick={nextMonth}
          className="w-8 h-8 rounded-lg glass hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-lg">
          ›
        </button>
      </div>

      {/* Barra de progreso del mes */}
      {monthWorkouts > 0 && (
        <div className="w-full bg-white/5 rounded-full h-1 mb-4">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${Math.round((monthDone / monthWorkouts) * 100)}%` }}
          />
        </div>
      )}

      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs text-slate-600 font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Grid días */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const isCurrentMonth = cell.date.getMonth() === viewMonth
          const hasWorkout = cell.workoutDay !== null
          const canClick = hasWorkout && !readOnly && !!onDayClick

          return (
            <button
              key={i}
              disabled={!canClick}
              onClick={() => canClick && onDayClick!(cell.workoutDay!, cell.semana!)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all
                ${!isCurrentMonth ? 'opacity-20' : ''}
                ${cell.isToday ? 'ring-2 ring-brand-500' : ''}
                ${hasWorkout && isCurrentMonth
                  ? cell.done
                    ? 'bg-brand-500/20 border border-brand-500/40'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer'
                  : 'cursor-default'
                }
              `}
            >
              <span className={`
                font-semibold text-xs leading-none
                ${cell.isToday ? 'text-brand-400' : isCurrentMonth ? 'text-white' : 'text-slate-600'}
              `}>
                {cell.date.getDate()}
              </span>

              {hasWorkout && isCurrentMonth && (
                <span className="mt-0.5 text-[9px] leading-none">
                  {cell.done ? '✅' : cell.isPast ? '⚠️' : '💪'}
                </span>
              )}

              {hasWorkout && isCurrentMonth && !cell.done && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500/70" />
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-4 justify-center flex-wrap">
        <LegendItem color="bg-brand-500/20 border border-brand-500/40" label="Completado" icon="✅" />
        <LegendItem color="bg-white/5 border border-white/10" label="Pendiente" icon="💪" />
        <LegendItem color="bg-transparent" label="Hoy" ring />
        <LegendItem color="" label="Descanso" />
      </div>

      {/* Lista sesiones del mes */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sesiones este mes</p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {monthCells
            .filter(c => c.workoutDay !== null)
            .map((c, i) => (
              <button
                key={i}
                disabled={readOnly || !onDayClick}
                onClick={() => onDayClick && onDayClick(c.workoutDay!, c.semana!)}
                className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-all
                  ${!readOnly ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.done ? 'bg-brand-500' : 'bg-white/20'}`} />
                  <span className="text-slate-400">{c.date.getDate()} {MONTH_NAMES[viewMonth].slice(0,3)}</span>
                  <span className="capitalize text-white font-medium">{c.workoutDay!.dia}</span>
                  <span className="text-slate-500">{c.workoutDay!.tipo}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span>{c.workoutDay!.duracion_min}min</span>
                  <span>S{c.semana}</span>
                  {c.done && <span className="text-brand-400 font-bold">✓</span>}
                </div>
              </button>
            ))
          }
          {monthCells.filter(c => c.workoutDay !== null).length === 0 && (
            <p className="text-slate-600 text-xs text-center py-2">Sin sesiones en este mes</p>
          )}
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, icon, ring }: { color: string; label: string; icon?: string; ring?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] ${color} ${ring ? 'ring-2 ring-brand-500' : ''}`}>
        {icon || ''}
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
