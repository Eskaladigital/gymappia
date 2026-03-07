'use client'

import { useState, useEffect } from 'react'

const FRASES = [
  'illo... entrena un poquillo...',
  '¡vamos, que tú puedes!',
  'un poquito cada día 💪',
]

export default function MotivatingPhrase() {
  const [frase, setFrase] = useState(FRASES[0])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = () => {
      setFrase(FRASES[Math.floor(Math.random() * FRASES.length)])
      setVisible(true)
      setTimeout(() => setVisible(false), 3500)
    }
    const first = setTimeout(show, 5000) // primera aparición a los 5 seg
    const interval = setInterval(show, 18000) // luego cada ~18 segundos
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] flex items-center justify-center px-4"
      aria-hidden
    >
      <p
        className={`text-xl md:text-2xl font-light italic text-slate-500 dark:text-slate-400 transition-opacity duration-1000 ${
          visible ? 'opacity-50' : 'opacity-0'
        }`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {frase}
      </p>
    </div>
  )
}
