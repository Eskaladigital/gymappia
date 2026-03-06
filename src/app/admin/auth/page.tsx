'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function AdminAuthRedirectInner() {
  const params = useSearchParams()

  useEffect(() => {
    const redirect = params.get('redirect') || '/mi-plan'
    window.location.href = `/auth/login?redirect=${encodeURIComponent(redirect)}`
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">💪</div>
    </div>
  )
}

export default function AdminAuthRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">💪</div>
      </div>
    }>
      <AdminAuthRedirectInner />
    </Suspense>
  )
}
