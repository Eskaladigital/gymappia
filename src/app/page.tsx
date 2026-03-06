import Link from 'next/link'

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
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center animate-pulse-green">
            <span className="text-3xl">💪</span>
          </div>
          <div className="text-left">
            <h1 className="text-5xl font-black leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              PAC<span className="text-brand-400">GYM</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-500 text-sm tracking-widest uppercase">Entrenamiento personal</p>
          </div>
        </div>

        <p className="text-xl text-slate-600 dark:text-slate-300 mb-2 font-light">
          Tu plan de entrenamiento personalizado
        </p>
        <p className="text-slate-500 dark:text-slate-500 mb-10 text-sm">
          Generado con IA · Supervisado por tu coach
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
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/start"
            className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-black font-black rounded-xl transition-all text-sm tracking-wide">
            🚀 Crear mi plan
          </Link>
          <Link href="/auth/login"
            className="px-8 py-4 glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-medium rounded-xl transition-all text-sm border border-slate-200 dark:border-white/10">
            Acceder a mi cuenta →
          </Link>
        </div>
      </div>
    </main>
  )
}
