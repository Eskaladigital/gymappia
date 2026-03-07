'use client'

import { useState, useEffect, useRef } from 'react'

const FRASES = [
  'illo... entrena un poquillo... 🥱',
  '¡vamos, que tú puedes! 💪',
  'un poquito cada día cambia todo',
  'el sofá no te va a poner bueno...',
  '¡dale, crack! hoy es el día',
  'tu versión del futuro te lo agradecerá',
  'menos excusas, más sudor 🔥',
  '¿a qué esperas, campeón?',
  'el dolor de hoy es la fuerza de mañana',
  'cada rep cuenta. cada día suma.',
  '¡arriba esos ánimos! 🙌',
  'nadie dijo que fuera fácil... pero tú sí puedes',
]

// Zonas SEGURAS en PC: columnas laterales fuera del contenido central (max-w-lg = 512px)
// El contenido está centrado, así que los márgenes libres son las zonas < (50vw - 256px) y > (50vw + 256px)
// Ponemos las frases en vertical pegadas a los bordes
const PC_SLOTS = [
  { side: 'left' as const,  top: '18%' },
  { side: 'left' as const,  top: '42%' },
  { side: 'left' as const,  top: '68%' },
  { side: 'right' as const, top: '28%' },
  { side: 'right' as const, top: '54%' },
  { side: 'right' as const, top: '78%' },
]

// Zonas SEGURAS en móvil: esquina superior izquierda y derecha
// El top nav tiene ~56px, así que empezamos desde 64px
// Las frases son pequeñas (max 130px) y se pegan a los laterales
const MOBILE_SLOTS = [
  { side: 'left' as const,  top: 68 },
  { side: 'right' as const, top: 68 },
]

function useCyclingPhrase(intervalMs: number, offsetStart = 0) {
  const [idx, setIdx] = useState(offsetStart % FRASES.length)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % FRASES.length)
        setVisible(true)
      }, 700)
    }, intervalMs)
    return () => clearInterval(cycle)
  }, [intervalMs])

  return { text: FRASES[idx], visible }
}

// ── Frase vertical para PC ───────────────────────────────────────
function PCPhrase({ side, top, intervalMs, offset }: {
  side: 'left' | 'right'
  top: string
  intervalMs: number
  offset: number
}) {
  const { text, visible } = useCyclingPhrase(intervalMs, offset)

  const style: React.CSSProperties = {
    position: 'fixed',
    top,
    [side]: '6px',
    transform: `translateY(-50%) rotate(${side === 'left' ? '-90deg' : '90deg'})`,
    transformOrigin: 'center center',
    opacity: visible ? 0.82 : 0,
    transition: 'opacity 0.7s ease',
    pointerEvents: 'none',
    zIndex: 5,
    whiteSpace: 'nowrap',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-body)',
  }

  return <p aria-hidden className="text-neon italic hidden lg:block" style={style}>{text}</p>
}

// ── Frase horizontal para móvil ─────────────────────────────────
function MobilePhrase({ side, top, intervalMs, offset }: {
  side: 'left' | 'right'
  top: number
  intervalMs: number
  offset: number
}) {
  const { text, visible } = useCyclingPhrase(intervalMs, offset)

  const style: React.CSSProperties = {
    position: 'fixed',
    top: `${top}px`,
    [side]: '10px',
    maxWidth: '120px',
    opacity: visible ? 0.78 : 0,
    transition: 'opacity 0.7s ease',
    pointerEvents: 'none',
    zIndex: 5,
    fontSize: '0.65rem',
    lineHeight: '1.35',
    fontFamily: 'var(--font-body)',
    textAlign: side === 'right' ? 'right' : 'left',
  }

  return <p aria-hidden className="text-neon italic block lg:hidden" style={style}>{text}</p>
}

// ── Componente principal ────────────────────────────────────────
export default function MotivatingPhrase() {
  return (
    <>
      {/* PC: 6 frases en las columnas laterales, cada una con su propio ciclo */}
      {PC_SLOTS.map((slot, i) => (
        <PCPhrase
          key={`pc-${i}`}
          side={slot.side}
          top={slot.top}
          intervalMs={9000 + i * 1500}   // tiempos diferentes para no sincronizarse
          offset={i * 2}
        />
      ))}

      {/* Móvil: 2 frases en las esquinas superiores */}
      {MOBILE_SLOTS.map((slot, i) => (
        <MobilePhrase
          key={`mob-${i}`}
          side={slot.side}
          top={slot.top}
          intervalMs={8000 + i * 2000}
          offset={i * 3}
        />
      ))}
    </>
  )
}
