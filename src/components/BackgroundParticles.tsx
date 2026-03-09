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

const MAX_PARTICLES = 6
const SPAWN_INTERVAL = 2.5

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
    x = fromLeft ? -15 : 115
    y = 10 + Math.random() * 75

    let speed = 3
    if (def.behavior === 'run') speed = 8 + Math.random() * 8
    else if (def.behavior === 'jump') speed = 6 + Math.random() * 6
    else if (def.behavior === 'throw') speed = 12 + Math.random() * 10
    else if (def.behavior === 'punch') speed = 3.5 + Math.random() * 3
    else if (def.behavior === 'breathe') speed = 1.5 + Math.random() * 2

    vx = dir * speed
    // vy suave para que no vayan perfectamente rectos
    vy = (Math.random() - 0.5) * (speed * 0.2)
  } else {
    // spin → desde cualquier borde
    const edge = Math.floor(Math.random() * 4)
    const speed = 7 + Math.random() * 8
    if (edge === 0) { x = Math.random() * 100; y = -15; vx = (Math.random() - 0.5) * speed; vy = speed * 0.8 }
    else if (edge === 1) { x = 115; y = Math.random() * 100; vx = -speed * 0.8; vy = (Math.random() - 0.5) * speed }
    else if (edge === 2) { x = Math.random() * 100; y = 115; vx = (Math.random() - 0.5) * speed; vy = -speed * 0.8 }
    else { x = -15; y = Math.random() * 100; vx = speed * 0.8; vy = (Math.random() - 0.5) * speed }
    dir = vx >= 0 ? 1 : -1
  }

  return {
    id: idCounter++, def, x, y, vx, vy, dir,
    age: 0, lifetime: 10 + Math.random() * 15,
    phase: 'fadein', opacity: 0,
    targetOpacity: 0.12 + Math.random() * 0.08,
    animTime: Math.random() * 100,
  }
}

function getTransform(p: Particle): string {
  const t = p.animTime
  const { nativeDir } = p.def

  // scaleX que hay que aplicar para que mire hacia donde va:
  const faceScale = p.dir === nativeDir ? 1 : -1

  switch (p.def.behavior) {
    case 'run': {
      // Salto rápido de carrera, inclinación hacia adelante
      const speedMult = Math.abs(p.vx) * 0.8
      const bob = Math.abs(Math.sin(t * speedMult)) * -6
      const lean = 12 * p.dir * faceScale // Inclinación hacia adelante
      const rock = Math.sin(t * speedMult) * 8
      return `scaleX(${faceScale}) translateY(${bob}px) rotate(${lean + rock}deg)`
    }
    case 'jump': {
      // Trayectoria de saltos continuos (parkour)
      const speedMult = Math.abs(p.vx) * 0.5
      const cycle = (t * speedMult) % Math.PI
      const jumpY = -Math.sin(cycle) * 45 // Arco del salto
      
      // Squash & stretch al tocar el suelo
      const isGround = cycle < 0.2 || cycle > Math.PI - 0.2
      const squashX = isGround ? 1.25 : 0.9
      const squashY = isGround ? 0.75 : 1.1
      
      // Rotación en el aire para dar sensación de inercia
      const rot = Math.cos(cycle) * -25 * p.dir * faceScale

      return `scaleX(${faceScale * squashX}) scaleY(${squashY}) translateY(${jumpY}px) rotate(${rot}deg)`
    }
    case 'punch': {
      // Caminar y soltar golpes secos
      const speedMult = 3.5
      const cycle = (t * speedMult) % 2
      let punchDist = 0
      let rot = 0
      let sX = 1, sY = 1
      
      // Golpe ultrarrápido (0.15s relativos)
      if (cycle < 0.2) {
        const prog = cycle / 0.2
        const extension = Math.sin(prog * Math.PI)
        punchDist = extension * 18 * faceScale
        rot = extension * 25 * p.dir * faceScale
        sX = 1 + extension * 0.25
        sY = 1 - extension * 0.1
      }
      
      // Pequeño balanceo al caminar
      const bob = Math.abs(Math.sin(t * speedMult * 1.5)) * -3

      return `translateY(${bob}px) scaleX(${faceScale * sX}) scaleY(${sY}) translateX(${punchDist}px) rotate(${rot}deg)`
    }
    case 'breathe': {
      // Flotación meditativa super fluida
      const floatY = Math.sin(t * 1.5) * 15
      const floatX = Math.cos(t * 1.1) * 8
      const scale = 1 + Math.sin(t * 2.2) * 0.08
      const rot = Math.sin(t * 0.8) * 5
      return `translate(${floatX}px, ${floatY}px) scaleX(${faceScale}) scale(${scale}) rotate(${rot}deg)`
    }
    case 'spin': {
      // Pelotas botando y girando según velocidad
      const rot = t * p.vx * 25
      const bounce = Math.abs(Math.sin(t * Math.abs(p.vx) * 0.3)) * -30
      // Squash al rebotar
      const cycle = (t * Math.abs(p.vx) * 0.3) % Math.PI
      const isGround = cycle < 0.15 || cycle > Math.PI - 0.15
      const squashX = isGround ? 1.2 : 0.95
      const squashY = isGround ? 0.8 : 1.05
      
      return `translateY(${bounce}px) rotate(${rot}deg) scaleX(${squashX}) scaleY(${squashY})`
    }
    case 'throw': {
      // Objetos arrojados dando vueltas ultrarrápidas
      const rot = t * 350 * p.dir
      const floatY = Math.sin(t * Math.abs(p.vx) * 0.4) * 10
      return `translateY(${floatY}px) rotate(${rot}deg)`
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
