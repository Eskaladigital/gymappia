import type { Metadata, Viewport } from 'next'
import './globals.css'
import { UnregisterSW } from '@/components/UnregisterSW'

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
        {/* Emojis coloridos flotando en el fondo (estilo gamificación) */}
        <div className="bg-silhouette" aria-hidden>
          <span className="text-4xl md:text-5xl opacity-30" style={{ left: '8%', top: '10%', animation: 'floatRight 25s ease-in-out infinite' }}>🏃</span>
          <span className="text-4xl md:text-5xl opacity-25" style={{ right: '12%', top: '18%', animation: 'floatLeft 30s ease-in-out infinite 3s' }}>🏊</span>
          <span className="text-4xl md:text-5xl opacity-30" style={{ left: '18%', bottom: '22%', animation: 'floatRight 28s ease-in-out infinite 5s' }}>🧗</span>
          <span className="text-4xl md:text-5xl opacity-25" style={{ right: '22%', bottom: '12%', animation: 'floatLeft 26s ease-in-out infinite 8s' }}>💪</span>
          <span className="text-3xl md:text-4xl opacity-20" style={{ left: '55%', top: '30%', animation: 'floatUp 35s ease-in-out infinite 2s' }}>🔥</span>
          <span className="text-3xl md:text-4xl opacity-25" style={{ right: '35%', top: '45%', animation: 'floatRight 22s ease-in-out infinite 6s' }}>⚡</span>
          <span className="text-3xl md:text-4xl opacity-20" style={{ left: '40%', bottom: '35%', animation: 'floatLeft 32s ease-in-out infinite 4s' }}>🎯</span>
          <span className="text-3xl md:text-4xl opacity-25" style={{ left: '70%', top: '60%', animation: 'floatRight 24s ease-in-out infinite 10s' }}>🏋️</span>
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
