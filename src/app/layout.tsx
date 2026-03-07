import type { Metadata, Viewport } from 'next'
import './globals.css'
import { UnregisterSW } from '@/components/UnregisterSW'
import ThemeToggleOrFixed from '@/components/ThemeToggleOrFixed'
import MotivatingPhrase from '@/components/MotivatingPhrase'

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
        {/* Emojis: rellenan el fondo en claro (casi opacos), más sutiles en oscuro */}
        <div className="bg-silhouette" aria-hidden>
          <span className="text-4xl md:text-5xl opacity-90 dark:opacity-25" style={{ left: '5%', top: '15%', animation: 'floatRight 28s ease-in-out infinite' }}>🏃</span>
          <span className="text-4xl md:text-5xl opacity-85 dark:opacity-22" style={{ right: '8%', top: '25%', animation: 'floatLeft 32s ease-in-out infinite 4s' }}>🏊</span>
          <span className="text-4xl md:text-5xl opacity-90 dark:opacity-25" style={{ left: '12%', bottom: '30%', animation: 'floatUp 38s ease-in-out infinite 2s' }}>🧗</span>
          <span className="text-4xl md:text-5xl opacity-85 dark:opacity-22" style={{ right: '15%', bottom: '20%', animation: 'floatDown 30s ease-in-out infinite 7s' }}>💪</span>
          <span className="text-3xl md:text-4xl opacity-80 dark:opacity-18" style={{ left: '60%', top: '8%', animation: 'floatDown 34s ease-in-out infinite 1s' }}>🔥</span>
          <span className="text-3xl md:text-4xl opacity-85 dark:opacity-22" style={{ right: '40%', top: '50%', animation: 'floatRight 26s ease-in-out infinite 5s' }}>⚡</span>
          <span className="text-3xl md:text-4xl opacity-80 dark:opacity-18" style={{ left: '35%', bottom: '15%', animation: 'floatLeft 36s ease-in-out infinite 9s' }}>🎯</span>
          <span className="text-3xl md:text-4xl opacity-85 dark:opacity-22" style={{ left: '75%', top: '70%', animation: 'floatUp 40s ease-in-out infinite 3s' }}>🏋️</span>
        </div>
        <MotivatingPhrase />
        <div className="relative z-10">{children}</div>
        <ThemeToggleOrFixed />
      </body>
    </html>
  )
}
