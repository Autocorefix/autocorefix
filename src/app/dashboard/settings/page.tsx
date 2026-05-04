'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { UserPlus, Trash2, Clock, Mail, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react'

type Asistente = {
  id: string
  nombre: string | null
  email?: string | null
}

type Invitacion = {
  id: string
  email: string
  created_at: string | null
  estado: string
}

export default function SettingsPage() {
  const supabase = createClient()

  const [asistentes,    setAsistentes]    = useState<Asistente[]>([])
  const [invPendientes, setInvPendientes] = useState<Invitacion[]>([])
  const [invAceptadas,  setInvAceptadas]  = useState<Invitacion[]>([])
  const [email,         setEmail]         = useState('')
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)
  const [resending,     setResending]     = useState<string | null>(null)
  const [revoking,      setRevoking]      = useState<string | null>(null)
  const [cancelling,    setCancelling]    = useState<string | null>(null)
  const [msg,           setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)

    // Asistentes activos via API segura (service role)
    const res = await fetch('/api/assistants')
    const json = res.ok ? await res.json() : { asistentes: [] }
    const asistentesActivos: Asistente[] = json.asistentes ?? []
    setAsistentes(asistentesActivos)

    // Emails de asistentes activos para excluirlos de "aceptadas"
    const emailsActivos = new Set(asistentesActivos.map((a: Asistente) => a.email))

    // Invitaciones pendientes
    const { data: pendientes } = await (supabase as any)
      .from('invitaciones')
      .select('id, email, created_at, estado')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })

    setInvPendientes(pendientes ?? [])

    // Invitaciones aceptadas — deduplicadas por email, excluyendo asistentes ya activos
    const { data: aceptadasRaw } = await (supabase as any)
      .from('invitaciones')
      .select('id, email, created_at, estado')
      .eq('estado', 'aceptada')
      .order('created_at', { ascending: false })

    // Deduplicar: 1 por email (el más reciente), excluyendo los ya en asistentes activos
    const seen = new Set<string>()
    const aceptadasFiltradas: Invitacion[] = []
    for (const inv of (aceptadasRaw ?? [])) {
      if (!seen.has(inv.email) && !emailsActivos.has(inv.email)) {
        seen.add(inv.email)
        aceptadasFiltradas.push(inv)
      }
    }
    setInvAceptadas(aceptadasFiltradas)

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
    } else if (data.existing) {
      setMsg({ type: 'ok', text: `Invitación registrada. ${email.trim()} ya tiene cuenta — recibirá acceso al iniciar sesión.` })
      setEmail('')
      fetchData()
    } else {
      setMsg({ type: 'ok', text: `Invitación enviada a ${email.trim()}` })
      setEmail('')
      fetchData()
    }
    setSending(false)
  }

  async function reenviarInvitacion(inv: Invitacion) {
    setResending(inv.id)
    setMsg(null)
    await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitacionId: inv.id }),
    })
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inv.email }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'ok', text: `Invitación reenviada a ${inv.email}` })
      fetchData()
    } else {
      setMsg({ type: 'err', text: data.error ?? 'Error al reenviar' })
    }
    setResending(null)
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

  async function revocarPorEmail(emailTarget: string) {
    setRevoking(emailTarget)
    const res = await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailTarget }),
    })
    if (res.ok) {
      setInvAceptadas(p => p.filter(i => i.email !== emailTarget))
    }
    setRevoking(null)
  }

  async function cancelarInvitacion(inv: Invitacion) {
    setCancelling(inv.id)
    const res = await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitacionId: inv.id }),
    })
    if (res.ok) {
      setInvPendientes(p => p.filter(i => i.id !== inv.id))
    }
    setCancelling(null)
  }

  function formatFecha(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const totalInvitados = asistentes.length + invPendientes.length + invAceptadas.length
  const maxAsistentes = 1 // plan básico: 1 asistente
  const limitAlcanzado = asistentes.length >= maxAsistentes && invPendientes.length === 0

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
          <div className={`mt-3 flex items-start gap-2 text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {msg.type === 'err' && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <p>{msg.text}</p>
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          Se enviará un enlace de acceso por correo. La asistente deberá configurar su nombre y contraseña al aceptar.
        </p>
      </div>

      {/* Asistentes con acceso activo */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Asistentes con acceso</h2>
          {!loading && (
            <span className="text-xs text-zinc-400">
              {asistentes.length} activo{asistentes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-zinc-400">Cargando…</p>
        ) : asistentes.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-400">Sin asistentes con acceso activo</p>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {asistentes.map(a => (
              <li key={a.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-white">
                      {(a.nombre ?? a.email ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{a.nombre ?? '—'}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{a.email}</p>
                  </div>
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
      {!loading && invPendientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-900">Invitaciones pendientes</h2>
            <span className="ml-auto text-xs text-zinc-400">{invPendientes.length}</span>
          </div>
          <ul className="divide-y divide-zinc-50">
            {invPendientes.map(inv => (
              <li key={inv.id} className="flex items-center justify-between px-6 py-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-4 h-4 text-zinc-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700 truncate">{inv.email}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Enviada el {formatFecha(inv.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => reenviarInvitacion(inv)}
                    disabled={resending === inv.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {resending === inv.id ? 'Enviando…' : 'Reenviar'}
                  </button>
                  <button
                    onClick={() => cancelarInvitacion(inv)}
                    disabled={cancelling === inv.id}
                    className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-100 rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                  >
                    {cancelling === inv.id ? 'Cancelando…' : 'Cancelar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invitaciones aceptadas sin acceso activo (edge case o acceso pendiente de sesión) */}
      {!loading && invAceptadas.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-900">Invitaciones aceptadas</h2>
            <span className="ml-auto text-xs text-zinc-400">{invAceptadas.length}</span>
          </div>
          <div className="px-6 pt-3 pb-1">
            <p className="text-xs text-zinc-400">
              Estos correos aceptaron la invitación. Si no aparecen en "Asistentes con acceso", deben iniciar sesión para activar su cuenta.
            </p>
          </div>
          <ul className="divide-y divide-zinc-50 mt-2">
            {invAceptadas.map(inv => (
              <li key={inv.id} className="flex items-center justify-between px-6 py-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700 truncate">{inv.email}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Aceptada el {formatFecha(inv.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => revocarPorEmail(inv.email)}
                  disabled={revoking === inv.email}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {revoking === inv.email ? 'Revocando…' : 'Revocar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
