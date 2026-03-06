'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerificaContent() {
  const params = useSearchParams()
  const email = params.get('email') || ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full animate-fadeInUp text-center">
        <div className="text-5xl mb-6">📧</div>
        <h2 className="text-2xl font-black mb-2">Revisa tu correo</h2>
        <p className="text-slate-500 mb-6">
          Te hemos enviado un enlace de confirmación a <strong className="text-slate-300">{email || 'tu email'}</strong>
        </p>
        <p className="text-slate-400 text-sm mb-8">
          Haz clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.
        </p>
        <Link href="/auth/login" className="text-brand-400 hover:underline font-semibold">
          Volver al login
        </Link>
      </div>
    </div>
  )
}

export default function VerificaEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">💪</div>
      </div>
    }>
      <VerificaContent />
    </Suspense>
  )
}
