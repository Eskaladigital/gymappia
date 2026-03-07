'use client'

import { useState, useEffect, useRef } from 'react'

const FRASES = [
  'illo... entrena un poquillo 🥱',
  '¡vamos, que tú puedes! 💪',
  'un poquito cada día cambia todo',
  'el sofá no te va a poner bueno...',
  '¡dale, crack! hoy es el día',
  'tu versión futura te lo agradecerá',
  'menos excusas, más sudor 🔥',
  '¿a qué esperas, campeón?',
  'el dolor de hoy es la fuerza de mañana',
  'cada rep cuenta. cada día suma.',
  '¡arriba esos ánimos! 🙌',
  'nadie dijo que fuera fácil...',
  'el único mal entreno es el que no haces',
  'hoy puede ser el día que todo cambie',
  'tu cuerpo puede. tu mente decide.',
]

// Zonas disponibles en PC — fuera del contenido central (max-w-sm = 384px centrado)
// El contenido ocupa ~384-512px centrado, así que tenemos ~(50vw - 280px) a cada lado
// Definimos zonas: esquinas, laterales arriba/abajo, zona superior, zona inferior
const PC_ZONES = [
  // Izquierda
  { x: '2%',  y: '12%' },
  { x: '1%',  y: '38%' },
  { x: '2%',  y: '62%' },
  { x: '1%',  y: '82%' },
  // Derecha
  { x: '68%', y: '18%' },
  { x: '70%', y: '44%' },
  { x: '68%', y: '70%' },
  { x: '69%', y: '88%' },
  // Superior centro-izq y centro-der (por encima del contenido)
  { x: '15%', y: '6%'  },
  { x: '55%', y: '6%'  },
  // Inferior
  { x: '12%', y: '90%' },
  { x: '58%', y: '91%' },
]

interface ActivePhrase {
  id: number
  text: string
  zone: typeof PC_ZONES[number]
  opacity: number   // 0 → 1 → 0
  phase: 'in' | 'hold' | 'out'
}

let globalId = 0

export default function MotivatingPhrase() {
  // ── PC: hasta 2 frases activas simultáneas ──────────────────────────────
  const [pcPhrases, setPcPhrases] = useState<ActivePhrase[]>([])
  const usedZonesRef = useRef<Set<number>>(new Set())
  const phraseQueueRef = useRef<number>(Math.floor(Math.random() * FRASES.length))

  useEffect(() => {
    // Cada ~4-7s intenta añadir una frase si hay menos de 2 activas
    const trySpawn = () => {
      setPcPhrases(prev => {
        if (prev.length >= 2) return prev

        // Elegir zona no ocupada
        const available = PC_ZONES
          .map((z, i) => i)
          .filter(i => !usedZonesRef.current.has(i))
        if (available.length === 0) return prev

        const zoneIdx = available[Math.floor(Math.random() * available.length)]
        usedZonesRef.current.add(zoneIdx)

        const phraseIdx = phraseQueueRef.current % FRASES.length
        phraseQueueRef.current++

        const phrase: ActivePhrase = {
          id: globalId++,
          text: FRASES[phraseIdx],
          zone: PC_ZONES[zoneIdx],
          opacity: 0,
          phase: 'in',
        }

        // Fade in después de un frame
        setTimeout(() => {
          setPcPhrases(p => p.map(ph => ph.id === phrase.id ? { ...ph, opacity: 1, phase: 'hold' } : ph))
        }, 50)

        // Hold durante 5-8s luego fade out
        const holdMs = 5000 + Math.random() * 3000
        setTimeout(() => {
          setPcPhrases(p => p.map(ph => ph.id === phrase.id ? { ...ph, opacity: 0, phase: 'out' } : ph))
          // Quitar del DOM y liberar zona
          setTimeout(() => {
            setPcPhrases(p => p.filter(ph => ph.id !== phrase.id))
            usedZonesRef.current.delete(zoneIdx)
          }, 900)
        }, holdMs)

        return [...prev, phrase]
      })
    }

    // Spawn inicial con pequeño delay
    const t1 = setTimeout(trySpawn, 800)
    const t2 = setTimeout(trySpawn, 2400)

    // Spawn periódico
    const interval = setInterval(() => {
      trySpawn()
    }, 3500 + Math.random() * 2000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      {/* ── PC: frases flotantes horizontales ── */}
      {pcPhrases.map(ph => (
        <p
          key={ph.id}
          aria-hidden
          className="text-neon italic hidden lg:block"
          style={{
            position: 'fixed',
            left: ph.zone.x,
            top: ph.zone.y,
            opacity: ph.opacity,
            transition: 'opacity 0.85s ease',
            pointerEvents: 'none',
            zIndex: 5,
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            maxWidth: '220px',
            fontFamily: 'var(--font-body)',
          }}
        >
          {ph.text}
        </p>
      ))}

      {/* ── Móvil: 2 frases discretas en esquinas superiores ── */}
      <MobilePhrase side="left"  offset={0} />
      <MobilePhrase side="right" offset={1} />
    </>
  )
}

// ── Móvil ────────────────────────────────────────────────────────────────────
function MobilePhrase({ side, offset }: { side: 'left' | 'right'; offset: number }) {
  const [idx, setIdx] = useState(offset * 4 % FRASES.length)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const ms = 9000 + offset * 2500
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % FRASES.length)
        setVisible(true)
      }, 600)
    }, ms)
    return () => clearInterval(t)
  }, [offset])

  return (
    <p
      aria-hidden
      className="text-neon italic block lg:hidden"
      style={{
        position: 'fixed',
        top: '72px',
        [side]: '8px',
        maxWidth: '110px',
        opacity: visible ? 0.6 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
        zIndex: 5,
        fontSize: '0.6rem',
        lineHeight: '1.4',
        textAlign: side === 'right' ? 'right' : 'left',
      }}
    >
      {FRASES[idx]}
    </p>
  )
}
