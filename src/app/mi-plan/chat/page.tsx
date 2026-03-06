'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ClientProfile, TrainingPlan } from '@/types'

interface Message {
  id?: string
  remitente: 'coach' | 'client' | 'ai'
  mensaje: string
  created_at?: string
  leido?: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const clientRes = await supabase.from('clients').select('*').eq('user_id', user.id).single()
    if (!clientRes.data) return
    setClient(clientRes.data)

    const planRes = await supabase.from('training_plans').select('*').eq('client_id', clientRes.data.id).eq('activo', true).maybeSingle()
    if (planRes.data) setPlan(planRes.data)

    // Cargar mensajes reales del coach
    const msgsRes = await fetch(`/api/coach-message?client_id=${clientRes.data.id}`)
    const msgsData = await msgsRes.json()
    setMessages(Array.isArray(msgsData) ? msgsData : [])
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !client || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    // Añadir mensaje del cliente optimísticamente
    const clientMsg: Message = { remitente: 'client', mensaje: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, clientMsg])

    // Guardar en BD
    await fetch('/api/coach-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: client.id, remitente: 'client', mensaje: text }),
    })

    // Respuesta IA como "coach IA" si no hay coach disponible
    // Siempre respondemos con IA para mantener la experiencia
    const aiThinking: Message = { remitente: 'ai', mensaje: '...', created_at: new Date().toISOString() }
    setMessages(prev => [...prev, aiThinking])

    try {
      const res = await fetch('/api/ai-coach-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: text,
          client: client,
          plan_titulo: plan?.titulo,
          historial: messages.slice(-6).map(m => ({ rol: m.remitente, texto: m.mensaje })),
        }),
      })
      const data = await res.json()
      const aiReply: Message = { remitente: 'ai', mensaje: data.respuesta, created_at: new Date().toISOString() }
      setMessages(prev => [...prev.slice(0, -1), aiReply])
    } catch {
      setMessages(prev => prev.slice(0, -1))
    }

    setSending(false)
  }

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 py-4 glass border-b border-white/5 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.push('/mi-plan')} className="text-slate-500 hover:text-white">←</button>
        <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          <span className="text-lg">💪</span>
        </div>
        <div>
          <p className="font-bold text-sm">Tu Coach PACGYM</p>
          <p className="text-xs text-brand-400">● Disponible ahora</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && <p className="text-center text-slate-500 text-sm">Cargando...</p>}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-slate-400 text-sm font-medium">¡Hola, {client?.nombre?.split(' ')[0]}!</p>
            <p className="text-slate-500 text-xs mt-1">Pregúntame cualquier cosa sobre tu entrenamiento</p>
            {/* Quick suggestions */}
            <div className="mt-4 space-y-2">
              {[
                '¿Cómo puedo mejorar mi técnica?',
                '¿Qué como antes de entrenar?',
                'Me duele un poco el hombro hoy',
                '¿Cuánto peso debo usar?',
              ].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="block w-full text-left glass hover:bg-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.remitente === 'client' ? 'justify-end' : 'justify-start'}`}>
            {(msg.remitente === 'coach' || msg.remitente === 'ai') && (
              <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                💪
              </div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${
              msg.remitente === 'client'
                ? 'bg-brand-500 text-black rounded-br-sm'
                : 'glass text-white rounded-bl-sm'
            }`}>
              {msg.remitente === 'ai' && msg.mensaje === '...' ? (
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{msg.mensaje}</p>
              )}
              {msg.remitente === 'ai' && msg.mensaje !== '...' && (
                <p className="text-xs mt-1 opacity-50">Coach IA · PACGYM</p>
              )}
              {msg.remitente === 'coach' && (
                <p className="text-xs mt-1 opacity-50">Tu coach</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 glass border-t border-white/5 flex gap-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1 input-field"
          placeholder="Pregunta a tu coach..."
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-black rounded-xl flex items-center justify-center transition-all font-bold">
          ↑
        </button>
      </div>
    </div>
  )
}
