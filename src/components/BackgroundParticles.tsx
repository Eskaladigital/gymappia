'use client'

import { useEffect, useRef } from 'react'

type Behavior = 'run' | 'punch' | 'jump' | 'breathe' | 'spin' | 'throw'

interface IconDef {
  emoji: string
  behavior: Behavior
  baseSize: number
  // Dirección nativa del emoji: 1 = mira a la derecha, -1 = mira a la izquierda
  // Si el icono tiene que moverse en dirección contraria a su nativeDir → scaleX(-1)
  nativeDir: 1 | -1
}

const ICON_DEFS: IconDef[] = [
  // ── Corredores / ciclistas / nadadores → run
  // 🏃 mira a la derecha por defecto
  { emoji: '🏃', behavior: 'run',  baseSize: 2.2, nativeDir:  1 },
  // 🚴 mira a la izquierda
  { emoji: '🚴', behavior: 'run',  baseSize: 2.2, nativeDir: -1 },
  // 🏊 mira a la izquierda
  { emoji: '🏊', behavior: 'run',  baseSize: 2.0, nativeDir: -1 },
  // 🚶 mira a la derecha
  { emoji: '🚶', behavior: 'run',  baseSize: 2.0, nativeDir:  1 },
  // ⛷️ mira a la derecha
  { emoji: '⛷️', behavior: 'run', baseSize: 2.2, nativeDir:  1 },
  // 🏂 mira a la derecha
  { emoji: '🏂', behavior: 'run',  baseSize: 2.0, nativeDir:  1 },
  // 🛹 mira a la derecha
  { emoji: '🛹', behavior: 'run',  baseSize: 1.8, nativeDir:  1 },
  // 🏄 mira a la derecha
  { emoji: '🏄', behavior: 'run',  baseSize: 2.2, nativeDir:  1 },
  // 🚣 mira a la izquierda
  { emoji: '🚣', behavior: 'run',  baseSize: 2.0, nativeDir: -1 },

  // ── Saltos → jump
  // 🏇 mira a la izquierda
  { emoji: '🏇', behavior: 'jump', baseSize: 2.4, nativeDir: -1 },
  // 🤸 simétrico, usamos 1
  { emoji: '🤸', behavior: 'jump', baseSize: 2.2, nativeDir:  1 },
  // 🧗 mira a la derecha (sube)
  { emoji: '🧗', behavior: 'jump', baseSize: 2.0, nativeDir:  1 },
  // 🤾 mira a la derecha
  { emoji: '🤾', behavior: 'jump', baseSize: 2.2, nativeDir:  1 },
  // 🪂 simétrico
  { emoji: '🪂', behavior: 'jump', baseSize: 2.2, nativeDir:  1 },

  // ── Golpes / fuerza → punch
  // 🥊 mira a la izquierda (guante apuntando izquierda)
  { emoji: '🥊', behavior: 'punch', baseSize: 2.2, nativeDir: -1 },
  // 🥋 figura mirando a la derecha
  { emoji: '🥋', behavior: 'punch', baseSize: 2.2, nativeDir:  1 },
  // 🏋️ simétrico
  { emoji: '🏋️', behavior: 'punch', baseSize: 2.4, nativeDir:  1 },
  // 🤺 mira a la derecha
  { emoji: '🤺', behavior: 'punch', baseSize: 2.2, nativeDir:  1 },
  // 💪 simétrico
  { emoji: '💪', behavior: 'punch', baseSize: 2.0, nativeDir:  1 },

  // ── Pelotas → spin (giran, no tienen dirección)
  { emoji: '⚽', behavior: 'spin', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏀', behavior: 'spin', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🎾', behavior: 'spin', baseSize: 1.6, nativeDir: 1 },
  { emoji: '🏈', behavior: 'spin', baseSize: 1.8, nativeDir: 1 },
  { emoji: '⚾', behavior: 'spin', baseSize: 1.6, nativeDir: 1 },
  { emoji: '🏐', behavior: 'spin', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏉', behavior: 'spin', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🥎', behavior: 'spin', baseSize: 1.6, nativeDir: 1 },
  { emoji: '🎱', behavior: 'spin', baseSize: 1.6, nativeDir: 1 },
  { emoji: '🥏', behavior: 'spin', baseSize: 1.6, nativeDir: 1 },

  // ── Raquetas / palos → throw (wobble)
  // Estos objetos no tienen "frente", el wobble es angular, sin scaleX
  { emoji: '🏓', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏸', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏒', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏑', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏏', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🪃', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏹', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },

  // ── Deportes tranquilos → breathe
  { emoji: '🧘', behavior: 'breathe', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🤿', behavior: 'breathe', baseSize: 2.0, nativeDir:  1 },
  { emoji: '🎣', behavior: 'breathe', baseSize: 2.0, nativeDir:  1 },
  // 🏌️ mira a la izquierda
  { emoji: '🏌️', behavior: 'breathe', baseSize: 2.2, nativeDir: -1 },
]

const MAX_PARTICLES = 4
const SPAWN_INTERVAL = 3.2

interface Particle {
  id: number
  def: IconDef
  x: number
  y: number
  vx: number
  vy: number
  age: number
  lifetime: number
  phase: 'fadein' | 'alive' | 'fadeout'
  opacity: number
  targetOpacity: number
  animTime: number
  // dirección de movimiento: 1=derecha, -1=izquierda
  dir: number
}

let idCounter = 0

function spawnParticle(): Particle {
  const def = ICON_DEFS[Math.floor(Math.random() * ICON_DEFS.length)]
  let x = 0, y = 0, vx = 0, vy = 0, dir = 1

  const needsHorizontal = ['run', 'jump', 'breathe', 'punch', 'throw'].includes(def.behavior)

  if (needsHorizontal) {
    const fromLeft = Math.random() > 0.5
    dir = fromLeft ? 1 : -1
    x = fromLeft ? -10 : 110
    y = 15 + Math.random() * 65
    const speed = def.behavior === 'run'
      ? (5 + Math.random() * 6)
      : (2.5 + Math.random() * 3.5)
    vx = dir * speed
    vy = (Math.random() - 0.5) * 0.8
  } else {
    // spin → desde cualquier borde
    const edge = Math.floor(Math.random() * 4)
    const speed = 4 + Math.random() * 5
    if (edge === 0) { x = 15 + Math.random() * 70; y = -10; vx = (Math.random() - 0.5) * speed * 0.4; vy = speed * 0.7 }
    else if (edge === 1) { x = 110; y = 15 + Math.random() * 70; vx = -speed * 0.7; vy = (Math.random() - 0.5) * speed * 0.3 }
    else if (edge === 2) { x = 15 + Math.random() * 70; y = 110; vx = (Math.random() - 0.5) * speed * 0.4; vy = -speed * 0.7 }
    else { x = -10; y = 15 + Math.random() * 70; vx = speed * 0.7; vy = (Math.random() - 0.5) * speed * 0.3 }
    dir = vx >= 0 ? 1 : -1
  }

  return {
    id: idCounter++, def, x, y, vx, vy, dir,
    age: 0, lifetime: 6 + Math.random() * 7,
    phase: 'fadein', opacity: 0,
    targetOpacity: 0.13 + Math.random() * 0.09,
    animTime: Math.random() * Math.PI * 2,
  }
}

function getTransform(p: Particle): string {
  const t = p.animTime
  const { nativeDir } = p.def

  // scaleX que hay que aplicar para que mire hacia donde va:
  // si va a la derecha (dir=1) y mira a la derecha (nativeDir=1) → scaleX(1)
  // si va a la izquierda (dir=-1) y mira a la derecha (nativeDir=1) → scaleX(-1)
  // si va a la derecha (dir=1) y mira a la izquierda (nativeDir=-1) → scaleX(-1)
  // si va a la izquierda (dir=-1) y mira a la izquierda (nativeDir=-1) → scaleX(1)
  const faceScale = p.dir === nativeDir ? 1 : -1

  switch (p.def.behavior) {
    case 'run': {
      const bob = Math.sin(t * 7) * 2.5
      return `translateY(${bob}px) scaleX(${faceScale})`
    }
    case 'jump': {
      const cycle = t % 1.6
      const jumpY = -Math.abs(Math.sin((cycle / 1.6) * Math.PI)) * 22
      const atGround = cycle < 0.08 || cycle > 1.52
      const squashX = atGround ? 1.12 : 1
      const squashY = atGround ? 0.88 : 1
      return `translateY(${jumpY}px) scaleX(${faceScale * squashX}) scaleY(${squashY})`
    }
    case 'punch': {
      const cycle = t % 1.8
      let extraScaleX = 1, scaleY = 1
      if (cycle < 0.12) {
        const prog = cycle / 0.12
        const punch = 1 + Math.sin(prog * Math.PI) * 0.45
        extraScaleX = punch
        scaleY = 1 / punch
      }
      return `scaleX(${faceScale * extraScaleX}) scaleY(${scaleY})`
    }
    case 'breathe': {
      const scale = 1 + Math.sin(t * 0.7) * 0.07
      const floatY = Math.sin(t * 0.45) * 9
      return `translateY(${floatY}px) scaleX(${faceScale}) scale(${scale})`
    }
    case 'spin': {
      // Pelotas: giran sin importar dirección
      const rot = t * 80
      const scale = 1 + Math.sin(t * 1.8) * 0.1
      return `rotate(${rot}deg) scale(${scale})`
    }
    case 'throw': {
      // Objetos: wobble angular, sin flip de cara
      const rot = Math.sin(t * 2.5) * 18
      const scale = 1 + Math.sin(t * 3) * 0.08
      return `rotate(${rot}deg) scale(${scale})`
    }
    default:
      return `scaleX(${faceScale})`
  }
}

export default function BackgroundParticles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const spawnTimerRef = useRef<number>(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const createEl = (p: Particle) => {
      const el = document.createElement('span')
      el.dataset.id = String(p.id)
      el.textContent = p.def.emoji
      el.style.cssText = `
        position: absolute;
        font-size: ${p.def.baseSize}rem;
        left: ${p.x}vw;
        top: ${p.y}vh;
        opacity: 0;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        line-height: 1;
        display: block;
      `
      container.appendChild(el)
    }

    const getEl = (id: number) =>
      container.querySelector(`[data-id="${id}"]`) as HTMLSpanElement | null

    // 2 partículas iniciales
    for (let i = 0; i < 2; i++) {
      const p = spawnParticle()
      p.x = 15 + Math.random() * 70
      p.y = 20 + Math.random() * 55
      p.phase = 'alive'
      p.opacity = p.targetOpacity
      p.age = Math.random() * p.lifetime * 0.3
      particlesRef.current.push(p)
      createEl(p)
    }

    const tick = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.08)
      lastTimeRef.current = timestamp
      spawnTimerRef.current += dt

      if (spawnTimerRef.current >= SPAWN_INTERVAL && particlesRef.current.length < MAX_PARTICLES) {
        spawnTimerRef.current = 0
        const p = spawnParticle()
        particlesRef.current.push(p)
        createEl(p)
      }

      const toRemove: number[] = []

      for (const p of particlesRef.current) {
        p.age += dt
        p.animTime += dt
        p.x += p.vx * dt
        p.y += p.vy * dt

        if (p.phase === 'fadein') {
          p.opacity = Math.min(p.opacity + dt * 0.9, p.targetOpacity)
          if (p.opacity >= p.targetOpacity * 0.97) p.phase = 'alive'
        }
        if (p.phase === 'alive' && p.age >= p.lifetime) p.phase = 'fadeout'
        if (p.phase === 'fadeout') {
          p.opacity = Math.max(p.opacity - dt * 0.5, 0)
          if (p.opacity <= 0) toRemove.push(p.id)
        }
        if (p.x < -20 || p.x > 120 || p.y < -20 || p.y > 120) p.phase = 'fadeout'

        const el = getEl(p.id)
        if (el) {
          const isDark = document.documentElement.classList.contains('dark')
          const displayOpacity = isDark ? p.opacity : Math.min(p.opacity * 2.8, 0.85)
          el.style.left = `${p.x}vw`
          el.style.top = `${p.y}vh`
          el.style.opacity = String(Math.round(displayOpacity * 1000) / 1000)
          el.style.transform = getTransform(p)
        }
      }

      for (const id of toRemove) {
        particlesRef.current = particlesRef.current.filter(p => p.id !== id)
        const el = getEl(id)
        if (el) container.removeChild(el)
        spawnTimerRef.current = SPAWN_INTERVAL
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (container) container.innerHTML = ''
      particlesRef.current = []
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  )
}
