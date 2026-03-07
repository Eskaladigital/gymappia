'use client'

import { useState, useEffect } from 'react'
import type { ClientProfile, PlanConfig, SessionParams } from '@/types'

const PROGRESION_LABELS: Record<string, string> = {
  lineal: '📈 Lineal',
  ondulada: '〰️ Ondulada',
  bloque: '🧱 Bloques',
}

interface ConfirmGenerateModalProps {
  open: boolean
  client: ClientProfile | null
  config: PlanConfig | null
  onClose: () => void
  onConfirm: (config: PlanConfig) => void
}

export default function ConfirmGenerateModal({
  open,
  client,
  config,
  onClose,
  onConfirm,
}: ConfirmGenerateModalProps) {
  const [semanas, setSemanas] = useState(4)
  const [dias, setDias] = useState(3)

  useEffect(() => {
    if (open && config?.session) {
      setSemanas(config.session.semanas_duracion)
      setDias(config.session.dias_semana)
    }
  }, [open, config])

  if (!open) return null

  const session = config?.session
  const handleConfirm = () => {
    if (!config) return
    const finalConfig: PlanConfig = {
      ...config,
      session: {
        ...config.session,
        semanas_duracion: semanas,
        dias_semana: dias,
      },
    }
    onConfirm(finalConfig)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md glass rounded-2xl p-6 animate-fadeInUp max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-5">
          <h3 className="font-black text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
            📋 Confirmar generación
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">
            ✕
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-5">
          Revisa el resumen y ajusta lo que necesites antes de generar el plan con IA.
        </p>

        {/* Cliente */}
        {client && (
          <div className="glass rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cliente</p>
            <p className="font-bold">{client.nombre}</p>
            <p className="text-sm text-slate-400">{client.objetivo} · {client.nivel}</p>
          </div>
        )}

        {/* Resumen */}
        <div className="glass rounded-xl p-4 mb-4 space-y-3">
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Resumen del plan</p>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Pack</span>
            <span className="font-medium">{config?.pack_nombre || 'Sin pack'}</span>
          </div>

          {/* Editable: Semanas */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Semanas del plan</label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={1}
                max={12}
                value={semanas}
                onChange={e => setSemanas(+e.target.value)}
                className="flex-1 accent-brand-500"
              />
              <span className="font-black text-brand-400 w-8 text-right">{semanas}</span>
            </div>
          </div>

          {/* Editable: Días */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Días por semana</label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={1}
                max={7}
                value={dias}
                onChange={e => setDias(+e.target.value)}
                className="flex-1 accent-brand-500"
              />
              <span className="font-black text-brand-400 w-8 text-right">{dias}</span>
            </div>
          </div>

          {session && (
            <>
              <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                <span className="text-slate-500">Progresión</span>
                <span>{PROGRESION_LABELS[session.progresion] || session.progresion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Duración sesión</span>
                <span>{session.duracion_media_min} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">RPE objetivo</span>
                <span>{session.rpe_objetivo}/10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Módulos activos</span>
                <span>{config?.modules?.filter(m => m.value > 0).length ?? 0}</span>
              </div>
            </>
          )}
        </div>

        {config?.notas_coach && (
          <div className="glass rounded-xl p-3 mb-4">
            <p className="text-xs text-slate-500 mb-1">Instrucciones adicionales</p>
            <p className="text-sm text-slate-300 line-clamp-2">{config.notas_coach}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 glass hover:bg-white/10 rounded-xl font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl transition-all"
          >
            ✓ Confirmar y generar
          </button>
        </div>
      </div>
    </div>
  )
}
