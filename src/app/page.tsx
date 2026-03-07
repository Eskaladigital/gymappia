import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/12 dark:bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-brand-600/12 dark:bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-amber-400/5 dark:bg-amber-400/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] bg-cyan-400/5 dark:bg-cyan-400/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-brand-500/15 dark:via-brand-500/10 to-transparent" />
      </div>

      <div className="relative z-10 text-center max-w-xl w-full animate-fadeInUp">
        {/* Logo PACGYM */}
        <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
          <div className="logo-glow w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center animate-pulse-green">
            <span className="text-2xl sm:text-3xl">💪</span>
          </div>
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-black leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              PAC<span className="text-brand-400">GYM</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm tracking-widest uppercase">Entrenamiento personal</p>
          </div>
        </div>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-1 font-light">
          Tu plan de entrenamiento personalizado
        </p>
        <p className="text-slate-500 text-xs sm:text-sm mb-5 sm:mb-8">
          Generado con IA · Supervisado por tu coach
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-8">
          {[
            { icon: '🤖', label: 'IA con GPT-4o', sub: 'Plan ultra-personalizado' },
            { icon: '📅', label: '4 semanas', sub: 'Con progresión integrada' },
            { icon: '🎮', label: 'Gamificación', sub: 'Rachas y logros' },
          ].map((f, i) => (
            <div key={f.label} className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center card-hover animate-fadeInUp" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{f.icon}</div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <Link href="/start"
            className="btn-primary px-8 py-3.5 sm:py-4 text-black font-black rounded-xl text-sm tracking-wide">
            🚀 Crear mi plan
          </Link>
          <Link href="/auth/login"
            className="px-8 py-3.5 sm:py-4 glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-medium rounded-xl transition-all duration-200 text-sm border border-slate-200 dark:border-white/10 hover:scale-[1.02] active:scale-[0.98]">
            Acceder a mi cuenta →
          </Link>
        </div>
      </div>
    </main>
  )
}
