'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.get('error') === 'auth') {
      setError('El enlace de confirmación ha expirado o no es válido. Intenta iniciar sesión con tu contraseña.')
    }
  }, [params])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    // Redirigir según rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    let redirect = params.get('redirect') || (profile?.role === 'admin' ? '/admin' : '/mi-plan')
    if (redirect.startsWith('/admin') && profile?.role !== 'admin') redirect = '/mi-plan'
    router.push(redirect)
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="Tu contraseña" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-black rounded-xl transition-all">
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </div>

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
