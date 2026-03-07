'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BASE_MODULES, SYSTEM_PACKS, getCanonicalModulesForDisplay, sortModulesByCanonicalOrder, type TrainingPack } from '@/types'

export default function PacksPage() {
  const router = useRouter()
  const [customPacks, setCustomPacks] = useState<TrainingPack[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<TrainingPack | null>(null)

  useEffect(() => {
    fetch('/api/packs')
      .then(r => r.json())
      .then(data => {
        setCustomPacks(data.custom || [])
        setLoading(false)
      })
  }, [])

  const deletePack = async (id: string) => {
    if (!confirm('¿Eliminar este pack?')) return
    setDeleting(id)
    await fetch(`/api/packs?id=${id}`, { method: 'DELETE' })
    setCustomPacks(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  const allPacks = [
    ...SYSTEM_PACKS.map(p => ({ ...p, id: p.nombre, es_sistema: true })),
    ...customPacks.map(p => ({ ...p, es_sistema: false })),
  ]

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/admin')}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white text-sm mb-2 flex items-center gap-1">
            ← Admin
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            📦 Packs de entrenamiento
          </h1>
          <p className="text-slate-600 dark:text-slate-500 text-sm">{allPacks.length} packs disponibles · {SYSTEM_PACKS.length} del sistema · {customPacks.length} personalizados</p>
        </div>
      </div>

      {/* System packs */}
      <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3">Packs del sistema</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {SYSTEM_PACKS.map((pack, i) => (
          <PackCard
            key={i}
            pack={{ ...pack, id: pack.nombre }}
            onPreview={() => setPreview({ ...pack, id: pack.nombre })}
            isSystem
          />
        ))}
      </div>

      {/* Custom packs */}
      <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-3">Packs personalizados</p>
      {loading ? (
        <p className="text-slate-600 dark:text-slate-500 text-sm">Cargando...</p>
      ) : customPacks.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-slate-600 dark:text-slate-500 text-sm">Aún no has creado packs personalizados.</p>
          <p className="text-slate-600 dark:text-slate-500 text-xs mt-1">Ve al configurador de cualquier cliente y guarda tu configuración como pack.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {customPacks.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              onPreview={() => setPreview(pack)}
              onDelete={() => deletePack(pack.id!)}
              deleting={deleting === pack.id}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setPreview(null)}>
          <div className="glass rounded-3xl p-6 max-w-md w-full animate-fadeInUp"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{preview.icono}</span>
                <div>
                  <h2 className="font-black text-lg text-slate-800 dark:text-white">{preview.nombre}</h2>
                  <p className="text-slate-600 dark:text-slate-500 text-sm">{preview.descripcion}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">✕</button>
            </div>

            {/* Módulos como barras (siempre los 8 tipos en orden alfabético para comparar entre packs) */}
            <div className="space-y-2 mb-4">
              {getCanonicalModulesForDisplay(preview.modules).map(pm => {
                  const base = BASE_MODULES.find(b => b.id === pm.id)
                  if (!base) return null
                  return (
                    <div key={pm.id} className={`flex items-center gap-3 ${pm.value === 0 ? 'opacity-50' : ''}`}>
                      <span className="text-sm w-24 text-slate-600 dark:text-slate-400">{base.icon} {base.label}</span>
                      <div className="flex-1 bg-slate-200 dark:bg-white/5 rounded-full h-2">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pm.value}%`, backgroundColor: base.color }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: base.color }}>
                        {pm.value}
                      </span>
                    </div>
                  )
                })}
            </div>

            {/* Session params */}
            <div className="grid grid-cols-3 gap-3 glass rounded-xl p-3">
              <div className="text-center">
                <p className="text-brand-600 dark:text-brand-400 font-black">{preview.session.duracion_media_min}min</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">Duración</p>
              </div>
              <div className="text-center">
                <p className="text-brand-600 dark:text-brand-400 font-black">{preview.session.rpe_objetivo}/10</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">RPE</p>
              </div>
              <div className="text-center">
                <p className="text-brand-600 dark:text-brand-400 font-black capitalize">{preview.session.progresion}</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">Progresión</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              {preview.tags.map(t => (
                <span key={t} className="text-xs px-2 py-1 glass rounded-full text-slate-600 dark:text-slate-400">{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PackCard({
  pack, onPreview, onDelete, deleting, isSystem = false
}: {
  pack: TrainingPack & { es_sistema?: boolean }
  onPreview: () => void
  onDelete?: () => void
  deleting?: boolean
  isSystem?: boolean
}) {
  const topModules = sortModulesByCanonicalOrder(pack.modules)
    .filter(m => m.value > 0)
    .slice(0, 4)

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2 hover:bg-slate-100/50 dark:hover:bg-white/[0.06] transition-all">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{pack.icono}</span>
        {isSystem && (
          <span className="text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-500 px-2 py-0.5 rounded-full">Sistema</span>
        )}
      </div>
      <p className="font-bold text-sm leading-tight text-slate-800 dark:text-white">{pack.nombre}</p>
      <p className="text-xs text-slate-600 dark:text-slate-500 line-clamp-2 flex-1">{pack.descripcion}</p>

      {/* Top módulos */}
      <div className="flex gap-1 flex-wrap">
        {topModules.map(pm => {
          const base = BASE_MODULES.find(b => b.id === pm.id)
          return base ? (
            <span key={pm.id} className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${base.color}20`, color: base.color }}>
              {base.icon}
            </span>
          ) : null
        })}
      </div>

      <div className="flex gap-2 mt-1">
        <button onClick={onPreview}
          className="flex-1 py-1.5 glass hover:bg-slate-100/50 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 transition-all">
          Ver detalles
        </button>
        {onDelete && (
          <button onClick={onDelete} disabled={deleting}
            className="py-1.5 px-2 glass hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition-all disabled:opacity-50">
            {deleting ? '...' : '🗑️'}
          </button>
        )}
      </div>
    </div>
  )
}
