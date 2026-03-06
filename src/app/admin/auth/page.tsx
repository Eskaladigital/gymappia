'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AdminAuthRedirect() {
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
