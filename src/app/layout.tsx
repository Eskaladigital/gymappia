import type { Metadata, Viewport } from 'next'
import './globals.css'
import { UnregisterSW } from '@/components/UnregisterSW'
import ThemeToggleOrFixed from '@/components/ThemeToggleOrFixed'
import MotivatingPhrase from '@/components/MotivatingPhrase'
import BackgroundParticles from '@/components/BackgroundParticles'

export const metadata: Metadata = {
  title: 'TrainCal - Entrenamiento Personal a Distancia',
  description: 'Genera calendarios de entrenamiento personalizados con IA para tus clientes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TrainCal',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('pacgym-theme');var d=!s&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',s==='light'?false:s==='dark'?true:d);})();`,
          }}
        />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if(typeof navigator!=='undefined'&&navigator.serviceWorker){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(reg=>reg.unregister()));}`,
            }}
          />
        )}
      </head>
      <body className="relative">
        <UnregisterSW />
        <BackgroundParticles />
        <MotivatingPhrase />
        <div className="relative z-10">{children}</div>
        <ThemeToggleOrFixed />
      </body>
    </html>
  )
}
