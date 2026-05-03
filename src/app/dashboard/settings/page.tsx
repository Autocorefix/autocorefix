'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { UserPlus, Trash2, Clock, Mail } from 'lucide-react'

type Asistente = {
  id: string
  nombre: string | null
  email?: string | null
}

type Invitacion = {
  id: string
  email: string
  created_at: string | null
}

export default function SettingsPage() {
  const supabase = createClient()

  const [asistentes,   setAsistentes]   = useState<Asistente[]>([])
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [email,        setEmail]        = useState('')
  const [loading,      setLoading]      = useState(true)
  const [sending,      setSending]      = useState(false)
  const [revoking,     setRevoking]     = useState<string | null>(null)
  const [cancelling,   setCancelling]   = useState<string | null>(null)
  const [msg,          setMsg]          = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)

    const { data: users } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('rol', 'asistente')

    const { data: invs } = await (supabase as any)
      .from('invitaciones')
      .select('id, email, created_at')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })

    setAsistentes(users ?? [])
    setInvitaciones(invs ?? [])
    setLoading(false)
  }

  async function invitar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setMsg(null)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      setMsg({ type: 'err', text: data.error ?? 'Error al enviar invitación' })
    } else {
      setMsg({ type: 'ok', text: `Acceso otorgado a ${email.trim()}` })
      setEmail('')
      fetchData()
    }
    setSending(false)
  }

  async function revocarAcceso(userId: string) {
    setRevoking(userId)
    const res = await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      setAsistentes(p => p.filter(a => a.id !== userId))
    }
    setRevoking(null)
  }

  async function cancelarInvitacion(inv: Invitacion) {
    setCancelling(inv.id)
    const res = await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitacionId: inv.id, email: inv.email }),
    })
    if (res.ok) {
      setInvitaciones(p => p.filter(i => i.id !== inv.id))
      // Si el usuario ya tenía acceso activo, actualizar lista de asistentes
      fetchData()
    }
    setCancelling(null)
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Ajustes</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Gestión de acceso al taller</p>
      </div>

      {/* Invitar asistente */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <UserPlus className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900">Invitar asistente</h2>
        </div>

        <form onSubmit={invitar} className="flex gap-2">
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
          >
            {sending ? 'Enviando…' : 'Invitar'}
          </button>
        </form>

        {msg && (
          <p className={`mt-3 text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          Si el correo ya tiene cuenta, el acceso se otorga de inmediato. Si es nuevo, recibirá un enlace para registrarse.
        </p>
      </div>

      {/* Asistentes activos */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Asistentes con acceso</h2>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-zinc-400">Cargando…</p>
        ) : asistentes.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-400">Sin asistentes registrados</p>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {asistentes.map(a => (
              <li key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{a.nombre ?? '—'}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Asistente activo</p>
                </div>
                <button
                  onClick={() => revocarAcceso(a.id)}
                  disabled={revoking === a.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {revoking === a.id ? 'Revocando…' : 'Revocar acceso'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invitaciones pendientes */}
      {invitaciones.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900">Invitaciones pendientes</h2>
          </div>
          <ul className="divide-y divide-zinc-50">
            {invitaciones.map(inv => (
              <li key={inv.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-300" />
                  <p className="text-sm text-zinc-700">{inv.email}</p>
                </div>
                <button
                  onClick={() => cancelarInvitacion(inv)}
                  disabled={cancelling === inv.id}
                  className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                >
                  {cancelling === inv.id ? 'Cancelando…' : 'Cancelar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
