'use client'

import { useEffect, useState, useRef } from 'react'

const STEP_DURATION_MS = 2500
const STEPS = [
  { id: 'cuestionario', label: 'Recibiendo cuestionario del cliente', icon: '📋' },
  { id: 'config', label: 'Recibiendo configuración de entrenamiento', icon: '🎛️' },
  { id: 'procesar', label: 'Procesando con IA', icon: '🤖' },
  { id: 'semanas', label: 'Generando semanas del plan', icon: '📅' },
  { id: 'ejercicios', label: 'Alternando ejercicios entre semanas', icon: '🔄' },
]

export default function GeneratePlanModal({
  open,
  status = 'generating',
  onClose,
}: {
  open: boolean
  status?: 'generating' | 'success' | 'error'
  onClose?: () => void
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const stepStartRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  // Avanzar pasos cada STEP_DURATION_MS
  useEffect(() => {
    if (!open || status !== 'generating') {
      setCurrentStep(0)
      setStepProgress(0)
      return
    }
    setCurrentStep(0)
    setStepProgress(0)
    stepStartRef.current = Date.now()
    const intervals: NodeJS.Timeout[] = []
    for (let i = 1; i < STEPS.length; i++) {
      intervals.push(setTimeout(() => setCurrentStep(i), i * STEP_DURATION_MS))
    }
    return () => intervals.forEach(clearTimeout)
  }, [open, status])

  // Barra de progreso animada para el paso actual
  useEffect(() => {
    if (!open || status !== 'generating') return
    const animate = () => {
      const elapsed = Date.now() - stepStartRef.current
      const stepStartTime = currentStep * STEP_DURATION_MS
      const stepElapsed = Math.max(0, elapsed - stepStartTime)
      const isLastStep = currentStep === STEPS.length - 1
      const rawPct = (stepElapsed / STEP_DURATION_MS) * 100
      // Último paso: nunca mostrar 100% (la IA puede tardar mucho). Cap en 85% o barra indeterminada
      const pct = isLastStep
        ? stepElapsed > STEP_DURATION_MS
          ? 40 + (Math.sin(stepElapsed / 600) * 0.5 + 0.5) * 35  // oscila 40-75%
          : Math.min(85, rawPct)
        : Math.min(100, rawPct)
      setStepProgress(pct)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [open, status, currentStep])

  // Estado éxito: mostrar brevemente y cerrar
  useEffect(() => {
    if (!open || status !== 'success' || !onClose) return
    const t = setTimeout(onClose, 1500)
    return () => clearTimeout(t)
  }, [open, status, onClose])

  if (!open) return null

  // Pantalla de éxito
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="w-full max-w-md glass rounded-2xl p-8 text-center animate-fadeInUp">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="font-black text-xl text-brand-400 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Plan generado correctamente
          </h3>
          <p className="text-slate-600 dark:text-slate-500 text-sm">Cerrando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md glass rounded-2xl p-6 animate-fadeInUp">
        <h3 className="font-black text-lg mb-1 text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          🤖 Generando plan con IA
        </h3>
        <p className="text-slate-600 dark:text-slate-500 text-sm mb-6">Esto puede tardar unos segundos...</p>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isActive = idx === currentStep
            const progress = isCompleted ? 100 : isActive ? stepProgress : 0
            return (
              <div
                key={step.id}
                className={`flex flex-col gap-2 py-2.5 px-4 rounded-xl transition-all ${
                  isCompleted
                    ? 'bg-brand-500/20 border border-brand-500/30 text-brand-300'
                    : isActive
                    ? 'bg-brand-500/15 border border-brand-500/40 text-brand-400'
                    : 'glass text-slate-600 dark:text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-sm font-medium flex-1 text-slate-800 dark:text-white">{step.label}</span>
                  {isCompleted && <span className="text-brand-400">✓</span>}
                  {isActive && (
                    <span className="text-xs text-brand-400 font-medium">
                      {currentStep === STEPS.length - 1 ? '...' : `${Math.round(progress)}%`}
                    </span>
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
