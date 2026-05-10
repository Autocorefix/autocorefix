'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Eye, EyeOff, Save, KeyRound, User } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()

  const [email,            setEmail]            = useState('')
  const [nombre,           setNombre]           = useState('')
  const [nombreOriginal,   setNombreOriginal]   = useState('')
  const [password,         setPassword]         = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [showPass,         setShowPass]         = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)
  const [loadingPerfil,    setLoadingPerfil]    = useState(true)
  const [savingNombre,     setSavingNombre]     = useState(false)
  const [savingPass,       setSavingPass]       = useState(false)
  const [msgNombre,        setMsgNombre]        = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [msgPass,          setMsgPass]          = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    async function loadPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .single()

      const nombreActual = usuario?.nombre ?? ''
      setNombre(nombreActual)
      setNombreOriginal(nombreActual)
      setLoadingPerfil(false)
    }
    loadPerfil()
  }, [])

  async function guardarNombre(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSavingNombre(true)
    setMsgNombre(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingNombre(false); return }

    const { error } = await supabase
      .from('usuarios')
      .update({ nombre: nombre.trim() })
      .eq('id', user.id)

    if (error) {
      setMsgNombre({ type: 'err', text: 'Error al guardar el nombre' })
    } else {
      setNombreOriginal(nombre.trim())
      setMsgNombre({ type: 'ok', text: 'Nombre actualizado correctamente' })
    }
    setSavingNombre(false)
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setMsgPass(null)

    if (password.length < 6) {
      setMsgPass({ type: 'err', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (password !== confirmPassword) {
      setMsgPass({ type: 'err', text: 'Las contraseñas no coinciden' })
      return
    }

    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMsgPass({ type: 'err', text: error.message })
    } else {
      setMsgPass({ type: 'ok', text: 'Contraseña actualizada correctamente' })
      setPassword('')
      setConfirmPassword('')
    }
    setSavingPass(false)
  }

  if (loadingPerfil) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-zinc-400">Cargando perfil…</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Mi perfil</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Configura tu nombre y contraseña de acceso</p>
      </div>

      {/* Nombre */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <User className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900">Información personal</h2>
        </div>

        <div className="space-y-4">
          {/* Email readonly */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
              Correo electrónico
            </label>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
              <span className="text-sm text-zinc-500 flex-1">{email}</span>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide shrink-0">
                Solo lectura
              </span>
            </div>
          </div>

          {/* Nombre */}
          <form onSubmit={guardarNombre} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
            </div>

            {msgNombre && (
              <p className={`text-sm ${msgNombre.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                {msgNombre.text}
              </p>
            )}

            <button
              type="submit"
              disabled={savingNombre || nombre.trim() === nombreOriginal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {savingNombre ? 'Guardando…' : 'Guardar nombre'}
            </button>
          </form>
        </div>
      </div>

      {/* Contraseña */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <KeyRound className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900">Cambiar contraseña</h2>
        </div>

        <form onSubmit={cambiarPassword} className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {msgPass && (
            <p className={`text-sm ${msgPass.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
              {msgPass.text}
            </p>
          )}

          <button
            type="submit"
            disabled={savingPass}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            {savingPass ? 'Actualizando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
