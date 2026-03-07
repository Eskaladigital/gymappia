import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="h-[100dvh] flex flex-col items-center justify-center px-5 relative overflow-hidden">

      {/* Orbes de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/12 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-brand-600/12 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] bg-cyan-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center w-full max-w-sm sm:max-w-lg animate-fadeInUp flex flex-col items-center gap-4 sm:gap-6">

        {/* Logo */}
        <div className="inline-flex items-center gap-3">
          <div className="logo-glow w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center animate-pulse-green flex-shrink-0">
            <span className="text-2xl sm:text-3xl">💪</span>
          </div>
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-black leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              PAC<span className="text-brand-400">GYM</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-500 text-[10px] sm:text-xs tracking-widest uppercase mt-0.5">Entrenamiento personal</p>
          </div>
        </div>

        {/* Subtítulo */}
        <div>
          <p className="text-base sm:text-xl text-slate-700 dark:text-slate-300 font-light leading-snug">
            Tu plan de entrenamiento personalizado
          </p>
          <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm mt-1">
            Generado con IA · Supervisado por tu coach
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
          {[
            { icon: '🤖', label: 'IA con GPT-4o', sub: 'Plan ultra-personalizado' },
            { icon: '📅', label: '4 semanas', sub: 'Con progresión integrada' },
            { icon: '🎮', label: 'Gamificación', sub: 'Rachas y logros' },
          ].map((f, i) => (
            <div
              key={f.label}
              className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center card-hover"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div className="text-xl sm:text-2xl mb-1">{f.icon}</div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white">{f.label}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5 hidden sm:block">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:justify-center">
          <Link
            href="/start"
            className="btn-primary py-3.5 sm:py-4 sm:px-10 text-black font-black rounded-xl text-sm tracking-wide text-center"
          >
            🚀 Crear mi plan
          </Link>
          <Link
            href="/auth/login"
            className="py-3.5 sm:py-4 sm:px-8 glass hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold rounded-xl transition-all text-sm border border-slate-200 dark:border-white/10 text-center"
          >
            Acceder a mi cuenta →
          </Link>
        </div>

      </div>
    </main>
  )
}
