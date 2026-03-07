'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const STORAGE_KEY = 'pacgym-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setThemeState(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
  }, [])

  const setTheme = (next: 'dark' | 'light') => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggle, mounted }
}

export default function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme()

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-9 h-9 rounded-lg glass hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {!mounted ? (
        <span className="w-[18px] h-[18px]" aria-hidden />
      ) : theme === 'dark' ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} className="text-slate-600" />
      )}
    </button>
  )
}
