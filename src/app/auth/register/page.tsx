'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function RegisterContent() {
  const router = useRouter()
  const params = useSearchParams()
  const emailFromForm = params.get('email') || ''

  const [email, setEmail] = useState(emailFromForm)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback` }
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      await fetch('/api/link-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, user_id: data.user.id }),
      })
    }

    if (!data.session) {
      setLoading(false)
      setError('')
      router.push(`/auth/verifica-email?email=${encodeURIComponent(email)}`)
      return
    }

    router.push('/mi-plan?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl">💪</span>
            <span className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              PAC<span className="text-brand-500 dark:text-brand-400">GYM</span>
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Accede a tu plan</h2>
          <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">Crea tu cuenta para ver tu entrenamiento</p>
        </div>

        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">¡Tu plan está listo!</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Solo falta crear tu cuenta para acceder</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Confirmar contraseña</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="input-field" placeholder="Repite la contraseña" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleRegister} disabled={loading}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-black rounded-xl transition-all">
            {loading ? 'Creando cuenta...' : 'Crear cuenta y ver mi plan →'}
          </button>
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-500 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-brand-600 dark:text-brand-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">💪</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
