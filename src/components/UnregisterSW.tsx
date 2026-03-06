'use client'

import { useEffect } from 'react'

/**
 * En desarrollo: desregistra el Service Worker para evitar errores
 * "Request scheme 'chrome-extension' is unsupported" cuando extensiones
 * (React DevTools, etc.) inyectan recursos.
 */
export function UnregisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister())
    })
  }, [])
  return null
}
