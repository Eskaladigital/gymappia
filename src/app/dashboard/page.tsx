'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GOAL_LABELS, LEVEL_LABELS, LOCATION_LABELS } from '@/lib/utils'

interface ClientWithPlan {
  id: string
  nombre: string
  email: string
  objetivo: string
  nivel: string
  lugar: string
  sesiones_semana: number
  created_at: string
  training_plans: { id: string; titulo: string; activo: boolean }[]
}

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientWithPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
            Train<span className="text-brand-400">Cal</span>
          </h1>
          <p className="text-slate-500 text-sm">{clients.length} clientes activos</p>
        </div>
        <Link
          href="/onboarding"
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-sm transition-all"
        >
          + Nuevo cliente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Clientes', value: clients.length, icon: '👥' },
          { label: 'Planes generados', value: clients.reduce((a, c) => a + c.training_plans.length, 0), icon: '📋' },
          { label: 'Esta semana', value: clients.filter(c => {
            const d = new Date(c.created_at)
            const now = new Date()
            return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000
          }).length, icon: '📅' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-black text-brand-400">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Clients list */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Cargando clientes...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <div className="text-5xl mb-4">💪</div>
          <h2 className="text-xl font-bold mb-2">Sin clientes todavía</h2>
          <p className="text-slate-500 text-sm mb-6">Añade tu primer cliente para generar su plan</p>
          <Link href="/onboarding" className="px-6 py-3 bg-brand-500 text-black font-bold rounded-xl text-sm">
            Añadir primer cliente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map(client => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
                    {client.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold group-hover:text-brand-400 transition-colors">{client.nombre}</h3>
                    <p className="text-slate-500 text-xs">{client.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    client.training_plans.length > 0
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {client.training_plans.length > 0 ? '✓ Plan activo' : 'Sin plan'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Tag>{GOAL_LABELS[client.objetivo]}</Tag>
                <Tag>{LEVEL_LABELS[client.nivel]}</Tag>
                <Tag>{LOCATION_LABELS[client.lugar]}</Tag>
                <Tag>📅 {client.sesiones_semana}x semana</Tag>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-1 bg-white/5 rounded-lg text-slate-400">
      {children}
    </span>
  )
}
