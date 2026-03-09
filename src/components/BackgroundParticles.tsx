'use client'

import { useEffect, useRef } from 'react'

type Behavior = 'run' | 'punch' | 'jump' | 'breathe' | 'spin' | 'throw'

interface IconDef {
  emoji: string
  behavior: Behavior
  baseSize: number
  nativeDir: 1 | -1
}

const ICON_DEFS: IconDef[] = [
  { emoji: '🏃', behavior: 'run',  baseSize: 2.2, nativeDir:  1 },
  { emoji: '🚴', behavior: 'run',  baseSize: 2.2, nativeDir: -1 },
  { emoji: '🏊', behavior: 'run',  baseSize: 2.0, nativeDir: -1 },
  { emoji: '🚶', behavior: 'run',  baseSize: 2.0, nativeDir:  1 },
  { emoji: '⛷️', behavior: 'run', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🏂', behavior: 'run',  baseSize: 2.0, nativeDir:  1 },
  { emoji: '🛹', behavior: 'run',  baseSize: 1.8, nativeDir:  1 },
  { emoji: '🏄', behavior: 'run',  baseSize: 2.2, nativeDir:  1 },
  { emoji: '🚣', behavior: 'run',  baseSize: 2.0, nativeDir: -1 },
  { emoji: '🏇', behavior: 'jump', baseSize: 2.4, nativeDir: -1 },
  { emoji: '🤸', behavior: 'jump', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🧗', behavior: 'jump', baseSize: 2.0, nativeDir:  1 },
  { emoji: '🤾', behavior: 'jump', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🪂', behavior: 'jump', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🥊', behavior: 'punch', baseSize: 2.2, nativeDir: -1 },
  { emoji: '🥋', behavior: 'punch', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🏋️', behavior: 'punch', baseSize: 2.4, nativeDir:  1 },
  { emoji: '🤺', behavior: 'punch', baseSize: 2.2, nativeDir:  1 },
  { emoji: '💪', behavior: 'punch', baseSize: 2.0, nativeDir:  1 },
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
  { emoji: '🏓', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏸', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏒', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏑', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏏', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🪃', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🏹', behavior: 'throw', baseSize: 1.8, nativeDir: 1 },
  { emoji: '🧘', behavior: 'breathe', baseSize: 2.2, nativeDir:  1 },
  { emoji: '🤿', behavior: 'breathe', baseSize: 2.0, nativeDir:  1 },
  { emoji: '🎣', behavior: 'breathe', baseSize: 2.0, nativeDir:  1 },
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
    vy = (Math.random() - 0.5) * (speed * 0.2)
  } else {
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
  const faceScale = p.dir === nativeDir ? 1 : -1

  switch (p.def.behavior) {
    case 'run': {
      const speedMult = Math.abs(p.vx) * 0.8
      const bob = Math.abs(Math.sin(t * speedMult)) * -6
      const lean = 12 * p.dir * faceScale
      const rock = Math.sin(t * speedMult) * 8
      return `scaleX(${faceScale}) translateY(${bob}px) rotate(${lean + rock}deg)`
    }
    case 'jump': {
      const speedMult = Math.abs(p.vx) * 0.5
      const cycle = (t * speedMult) % Math.PI
      const jumpY = -Math.sin(cycle) * 45
      const isGround = cycle < 0.2 || cycle > Math.PI - 0.2
      const squashX = isGround ? 1.25 : 0.9
      const squashY = isGround ? 0.75 : 1.1
      const rot = Math.cos(cycle) * -25 * p.dir * faceScale
      return `scaleX(${faceScale * squashX}) scaleY(${squashY}) translateY(${jumpY}px) rotate(${rot}deg)`
    }
    case 'punch': {
      const speedMult = 3.5
      const cycle = (t * speedMult) % 2
      let punchDist = 0
      let rot = 0
      let sX = 1, sY = 1
      if (cycle < 0.2) {
        const prog = cycle / 0.2
        const extension = Math.sin(prog * Math.PI)
        punchDist = extension * 18 * faceScale
        rot = extension * 25 * p.dir * faceScale
        sX = 1 + extension * 0.25
        sY = 1 - extension * 0.1
      }
      const bob = Math.abs(Math.sin(t * speedMult * 1.5)) * -3
      return `translateY(${bob}px) scaleX(${faceScale * sX}) scaleY(${sY}) translateX(${punchDist}px) rotate(${rot}deg)`
    }
    case 'breathe': {
      const floatY = Math.sin(t * 1.5) * 15
      const floatX = Math.cos(t * 1.1) * 8
      const scale = 1 + Math.sin(t * 2.2) * 0.08
      const rot = Math.sin(t * 0.8) * 5
      return `translate(${floatX}px, ${floatY}px) scaleX(${faceScale}) scale(${scale}) rotate(${rot}deg)`
    }
    case 'spin': {
      const rot = t * p.vx * 25
      const bounce = Math.abs(Math.sin(t * Math.abs(p.vx) * 0.3)) * -30
      const cycle = (t * Math.abs(p.vx) * 0.3) % Math.PI
      const isGround = cycle < 0.15 || cycle > Math.PI - 0.15
      const squashX = isGround ? 1.2 : 0.95
      const squashY = isGround ? 0.8 : 1.05
      return `translateY(${bounce}px) rotate(${rot}deg) scaleX(${squashX}) scaleY(${squashY})`
    }
    case 'throw': {
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
  
  // Para el efecto parallax con el ratón
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    // Escuchar el ratón para el parallax hiperfluido
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 60
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 60
    }
    window.addEventListener('mousemove', handleMouseMove)

    const container = containerRef.current
    if (!container) return

    const createEl = (p: Particle) => {
      const el = document.createElement('span')
      el.dataset.id = String(p.id)
      el.textContent = p.def.emoji
      el.style.cssText = `position:absolute;font-size:${p.def.baseSize}rem;left:${p.x}vw;top:${p.y}vh;opacity:0;pointer-events:none;user-select:none;will-change:transform,opacity;line-height:1;display:block;filter:drop-shadow(0px 8px 16px rgba(34,197,94,0.4));`
      container.appendChild(el)
    }

    const getEl = (id: number) =>
      container.querySelector(`[data-id="${id}"]`) as HTMLSpanElement | null

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

      // Suavizado del movimiento del ratón para el Parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

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
        if (p.x < -25 || p.x > 125 || p.y < -25 || p.y > 125) p.phase = 'fadeout'

        const el = getEl(p.id)
        if (el) {
          const isDark = document.documentElement.classList.contains('dark')
          const displayOpacity = isDark ? p.opacity : Math.min(p.opacity * 3.5, 0.95)
          el.style.left = `${p.x}vw`
          el.style.top = `${p.y}vh`
          el.style.opacity = String(Math.round(displayOpacity * 1000) / 1000)
          
          // Combinar parallax de cámara + transformación base de la física
          const pX = mouseRef.current.x * (p.def.baseSize * 0.4)
          const pY = mouseRef.current.y * (p.def.baseSize * 0.4)
          el.style.transform = `translate(${pX}px, ${pY}px) ${getTransform(p)}`
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
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafRef.current)
      if (container) container.innerHTML = ''
      particlesRef.current = []
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center" style={{ zIndex: 0 }} aria-hidden>
      
      {/* ─── AURORAS DINÁMICAS (Orbes de color flotantes) ─── */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] sm:w-[45vw] sm:h-[45vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] opacity-40 dark:opacity-[0.15] animate-blob bg-brand-400 dark:bg-brand-500" />
      <div className="absolute top-[20%] right-[-10%] w-[55vw] h-[55vw] sm:w-[40vw] sm:h-[40vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] opacity-40 dark:opacity-[0.15] animate-blob animation-delay-2000 bg-emerald-300 dark:bg-emerald-600" />
      <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] sm:w-[50vw] sm:h-[50vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] opacity-40 dark:opacity-[0.15] animate-blob animation-delay-4000 bg-cyan-300 dark:bg-cyan-900" />

      {/* ─── TYPOGRAPHY KINÉTICA DE FONDO (Estilo Gymshark/Nike) ─── */}
      <div className="absolute inset-0 flex flex-col justify-center gap-12 sm:gap-20 opacity-60 dark:opacity-[0.15] transform -rotate-[12deg] scale-[1.35] select-none">
        <div className="kinetic-text">
          TRAIN HARD • BEAST MODE • NO EXCUSES • LEVEL UP • OVERCOME • TRAIN HARD • BEAST MODE • NO EXCUSES • LEVEL UP • OVERCOME
        </div>
        <div className="kinetic-text reverse">
          TRUST THE PROCESS • STAY CONSISTENT • GAIN STRENGTH • PACGYM • TRUST THE PROCESS • STAY CONSISTENT • GAIN STRENGTH • PACGYM
        </div>
        <div className="kinetic-text">
          MASTER YOUR BODY • FOCUS • DISCIPLINE • HYPERTROPHY • MASTER YOUR BODY • FOCUS • DISCIPLINE • HYPERTROPHY
        </div>
        <div className="kinetic-text reverse">
          ONE MORE REP • KEEP PUSHING • ENDURANCE • NEVER SURRENDER • ONE MORE REP • KEEP PUSHING • ENDURANCE • NEVER SURRENDER
        </div>
      </div>

      {/* Contenedor de las partículas físicas interactivas */}
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
}
