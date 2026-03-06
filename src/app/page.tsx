import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-brand-500/10 to-transparent" />
      </div>

      <div className="relative z-10 text-center max-w-xl animate-fadeInUp">
        {/* Logo PACGYM */}
        <div className="inline-flex flex-col items-center gap-3 mb-8">
          <Logo size={80} className="rounded-2xl" />
          <p className="text-slate-500 text-sm tracking-widest uppercase">Entrenamiento personal</p>
        </div>

        <p className="text-xl text-slate-300 mb-2 font-light">
          Tu plan de entrenamiento personalizado
        </p>
        <p className="text-slate-500 mb-10 text-sm">
          Generado con IA · Supervisado por tu coach · Gratis para empezar
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '🤖', label: 'IA con GPT-4o', sub: 'Plan ultra-personalizado' },
            { icon: '📅', label: '4 semanas', sub: 'Con progresión integrada' },
            { icon: '🎮', label: 'Gamificación', sub: 'Rachas y logros' },
          ].map(f => (
            <div key={f.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-xs font-semibold text-white">{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/start"
            className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl transition-all text-sm tracking-wide">
            🚀 Crear mi plan gratis
          </Link>
          <Link href="/auth/login"
            className="px-8 py-4 glass hover:bg-white/10 text-white font-medium rounded-xl transition-all text-sm border border-white/10">
            Acceder a mi cuenta →
          </Link>
        </div>

        <p className="text-xs text-slate-600 mt-6">
          ¿Eres entrenador?{' '}
          <Link href="/admin" className="text-brand-500 hover:underline">Panel de administración</Link>
        </p>
      </div>
    </main>
  )
}
