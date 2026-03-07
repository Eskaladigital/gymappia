'use client'

import { useState, useEffect } from 'react'

const FRASES = [
  'illo... entrena un poquillo...',
  '¡vamos, que tú puedes!',
  'un poquito cada día 💪',
]

const POSICIONES = [
  { pos: 'left', className: 'left-6 top-1/2 -translate-y-1/2 text-left' },
  { pos: 'right', className: 'right-6 top-1/2 -translate-y-1/2 text-right' },
  { pos: 'top', className: 'left-1/2 top-12 -translate-x-1/2 text-center' },
  { pos: 'bottom', className: 'left-1/2 bottom-24 -translate-x-1/2 text-center' },
]

export default function MotivatingPhrase() {
  const [frase, setFrase] = useState(FRASES[0])
  const [visible, setVisible] = useState(false)
  const [posIndex, setPosIndex] = useState(0)

  useEffect(() => {
    const show = () => {
      setFrase(FRASES[Math.floor(Math.random() * FRASES.length)])
      setPosIndex(i => (i + 1) % POSICIONES.length)
      setVisible(true)
      setTimeout(() => setVisible(false), 3500)
    }
    const first = setTimeout(show, 5000)
    const interval = setInterval(show, 18000)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [])

  const pos = POSICIONES[posIndex]

  return (
    <div
      className={`fixed pointer-events-none z-[5] px-4 transition-opacity duration-1000 ${pos.className} ${
        visible ? 'opacity-95' : 'opacity-0'
      }`}
      aria-hidden
    >
      <p
        className="text-neon text-lg md:text-2xl italic max-w-[200px] md:max-w-none"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {frase}
      </p>
    </div>
  )
}
