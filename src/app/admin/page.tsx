'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GOAL_LABELS, LEVEL_LABELS } from '@/lib/utils'

interface ClientRow {
  id: string
  nombre: string
  email: string
  objetivo: string
  nivel: string
  sesiones_semana: number
  status: 'pending' | 'active' | 'inactive'
  created_at: string
  training_plans: { id: string }[]
}

export default function AdminPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clients')
      .select('*, training_plans(id)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClients(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? clients
    : clients.filter(c => c.status === filter)

  const pendingCount = clients.filter(c => c.status === 'pending').length
  const activeCount = clients.filter(c => c.status === 'active').length

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
              PAC<span className="text-brand-400">GYM</span>
            </span>
            <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <p className="text-slate-500 text-sm">{clients.length} clientes en total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/packs"
            className="text-xs px-4 py-2 glass hover:bg-white/10 rounded-xl text-slate-400 transition-all">
            📦 Packs
          </Link>
          <Link href="/start" target="_blank"
            className="text-xs px-4 py-2 glass hover:bg-white/10 rounded-xl text-slate-400 transition-all">
            Ver formulario público ↗
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-yellow-400">{pendingCount}</p>
          <p className="text-xs text-slate-500">Pendientes</p>
          <p className="text-xs text-slate-600">Sin plan generado</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-brand-400">{activeCount}</p>
          <p className="text-xs text-slate-500">Activos</p>
          <p className="text-xs text-slate-600">Con plan activo</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{clients.length}</p>
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xs text-slate-600">Leads + clientes</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'pending', 'active'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-brand-500 text-black font-bold' : 'glass text-slate-400 hover:bg-white/10'
            }`}>
            {f === 'all' ? 'Todos' : f === 'pending' ? '⏳ Pendientes' : '✅ Activos'}
          </button>
        ))}
      </div>

      {/* Client list */}
      {loading ? (
        <p className="text-center py-12 text-slate-500">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(client => (
            <Link key={client.id} href={`/admin/clientes/${client.id}`}
              className="block glass rounded-2xl p-4 hover:bg-white/[0.06] transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    client.status === 'active' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {client.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-brand-400 transition-colors">{client.nombre}</p>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    client.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  }`}>
                    {client.status === 'pending' ? '⏳ Pendiente' : '✅ Activo'}
                  </span>
                  <span className="text-slate-600">›</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2.5 flex-wrap">
                <SmallTag>{GOAL_LABELS[client.objetivo] || client.objetivo}</SmallTag>
                <SmallTag>{LEVEL_LABELS[client.nivel] || client.nivel}</SmallTag>
                <SmallTag>📅 {client.sesiones_semana}x/sem</SmallTag>
                {client.training_plans.length > 0
                  ? <SmallTag className="text-brand-500">📋 Plan creado</SmallTag>
                  : <SmallTag className="text-yellow-500">⚡ Sin plan</SmallTag>
                }
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 glass rounded-2xl">
              <p className="text-slate-500">No hay clientes en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SmallTag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 bg-white/5 rounded-lg text-slate-500 ${className}`}>{children}</span>
  )
}
