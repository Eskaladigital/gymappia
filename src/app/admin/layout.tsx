'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRoot = pathname === '/admin'

  return (
    <div className="min-h-screen">
      {/* Barra superior: Admin | Mi perfil */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors ${isRoot ? 'text-brand-400' : 'text-slate-500 hover:text-white'}`}
            >
              Admin
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/mi-plan"
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              👤 Mi perfil
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
