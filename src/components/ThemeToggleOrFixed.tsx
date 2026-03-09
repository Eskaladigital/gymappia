'use client'

import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

/** Muestra ThemeToggle fijo solo en páginas sin TopNav ni formulario con header propio */
export default function ThemeToggleOrFixed() {
  const pathname = usePathname()
  const hasTopNav = pathname.startsWith('/admin') || pathname.startsWith('/mi-plan')
  const hasOwnHeader = pathname.startsWith('/start') || pathname.startsWith('/onboarding')

  if (hasTopNav || hasOwnHeader) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
  )
}
