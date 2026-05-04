'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Wrench, Eye, EyeOff } from 'lucide-react'

export default function BienvenidaPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [email,     setEmail]     = useState('')
  const [nombre,    setNombre]    = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nombre, tenant_id')
        .eq('id', user.id)
        .single()

      // Si ya completó el setup, ir al dashboard
      if (usuario?.nombre) { router.push('/dashboard'); return }

      setEmail(user.email ?? '')
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!nombre.trim())          { setError('Ingresa tu nombre completo'); return }
    if (password.length < 8)     { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm)    { setError('Las contraseñas no coinciden'); return }

    setSaving(true)

    // Establecer contraseña
    const { error: passErr } = await supabase.auth.updateUser({ password })
    if (passErr) { setError(passErr.message); setSaving(false); return }

    // Guardar nombre
    const { data: { user } } = await supabase.auth.getUser()
    const { error: nameErr } = await supabase
      .from('usuarios')
      .update({ nombre: nombre.trim() })
      .eq('id', user!.id)

    if (nameErr) { setError('Error al guardar el nombre'); setSaving(false); return }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2563EB]">
            <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-zinc-900">AutoCoreFix</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900">Configura tu acceso</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Completa tu perfil para entrar al taller. Guarda bien tu email — lo necesitarás cada vez que inicies sesión.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email (solo lectura) */}
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 block">
                Tu email de acceso
              </label>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <span className="text-sm font-semibold text-[#2563EB] flex-1">{email}</span>
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Solo lectura</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Usa este email cada vez que quieras entrar.</p>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 block">
                Tu nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. María González"
                required
                className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 block">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                <button type="button" onClick={() => setShowConf(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors mt-1"
            >
              {saving ? 'Guardando...' : 'Confirmar y entrar al taller'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
