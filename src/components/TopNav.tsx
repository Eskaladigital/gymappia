'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null)
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setIsAdmin(data?.role === 'admin')
      }
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const inAdmin = pathname.startsWith('/admin')

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Navegación principal */}
        <div className="flex items-center gap-4">
          <Link
            href={inAdmin ? '/admin' : '/mi-plan'}
            className="text-lg font-black tracking-tight hover:text-brand-400 transition-colors"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            PAC<span className="text-brand-400">GYM</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/mi-plan"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/mi-plan') ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Mi plan
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  inAdmin ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Menú usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/10 transition-all"
            aria-expanded={open}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <User size={18} className="text-brand-400" />
            </div>
            <span className="text-sm text-slate-300 hidden sm:inline max-w-[120px] truncate">
              {userEmail || 'Usuario'}
            </span>
            <ChevronDown size={16} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 glass rounded-xl border border-white/10 py-1 shadow-xl animate-fadeInUp">
              <div className="px-4 py-2 border-b border-white/5">
                <p className="text-xs text-slate-500">Conectado como</p>
                <p className="text-sm font-medium truncate">{userEmail || 'Usuario'}</p>
              </div>
              <Link
                href="/mi-plan"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <User size={16} />
                Mi perfil
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Panel admin
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
