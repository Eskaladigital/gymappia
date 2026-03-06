'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const params = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const redirect = params.get('redirect') || '/mi-plan'
  const errorMsg = params.get('msg')
  const hasError = error || params.get('error') === 'auth' || errorMsg

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const fd = new FormData(form)
    const email = (fd.get('email') as string)?.trim()
    const password = fd.get('password') as string
    if (!email || !password) {
      setError('Email y contraseña son obligatorios')
      setLoading(false)
      return
    }
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      let target = redirect
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        if (profile?.role === 'admin' && redirect.startsWith('/admin')) target = '/admin'
        else if (!redirect.startsWith('/admin')) target = redirect
        else target = '/mi-plan'
      }
      await supabase.auth.getSession()
      await new Promise(r => setTimeout(r, 500))
      window.location.href = target
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl">💪</span>
            <span className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
              PAC<span className="text-brand-400">GYM</span>
            </span>
          </div>
          <h2 className="text-2xl font-black">Bienvenido de vuelta</h2>
          <p className="text-slate-500 text-sm mt-1">Accede a tu plan de entrenamiento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="redirect" value={redirect} />
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input type="email" name="email" required
              className="input-field" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                className="input-field pr-12"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {hasError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              ⚠️ {errorMsg || error || 'Error al iniciar sesión'}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-black rounded-xl transition-all">
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          ¿No tienes cuenta?{' '}
          <Link href="/start" className="text-brand-400 hover:underline">Crea tu plan gratis</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">💪</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
