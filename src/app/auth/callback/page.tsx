'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/mi-plan'

      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
        const errorCode = hashParams.get('error_code')
        const errorDesc = hashParams.get('error_description')
        if (errorCode || errorDesc) {
          const msg = errorDesc || 'El enlace ha expirado o no es válido.'
          router.replace(`/auth/login?error=auth&msg=${encodeURIComponent(msg)}`)
          return
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace(`/auth/login?error=auth&msg=${encodeURIComponent(error.message)}`)
          return
        }
        setStatus('ok')
        router.replace(next)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setStatus('ok')
        router.replace(next)
        return
      }

      setStatus('error')
      router.replace('/auth/login?error=auth')
    }

    run()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl animate-bounce mb-4">💪</div>
            <p className="text-slate-400">Verificando tu cuenta...</p>
          </>
        )}
        {status === 'ok' && (
          <p className="text-slate-400">Redirigiendo...</p>
        )}
        {status === 'error' && (
          <p className="text-slate-400">Redirigiendo al login...</p>
        )}
      </div>
    </div>
  )
}
