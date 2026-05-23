'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Eye, EyeOff, Save, KeyRound, User, ImagePlus, Trash2, Building2 } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()

  /* ── Auth / perfil ─────────────────────────────────────── */
  const [email,           setEmail]           = useState('')
  const [nombre,          setNombre]          = useState('')
  const [nombreOriginal,  setNombreOriginal]  = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass,        setShowPass]        = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [loadingPerfil,   setLoadingPerfil]   = useState(true)
  const [savingNombre,    setSavingNombre]    = useState(false)
  const [savingPass,      setSavingPass]      = useState(false)
  const [msgNombre,       setMsgNombre]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [msgPass,         setMsgPass]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  /* ── Taller / logo (solo admin) ────────────────────────── */
  const [rol,           setRol]           = useState<string | null>(null)
  const [tenantId,      setTenantId]      = useState('')
  const [nombreTaller,  setNombreTaller]  = useState('')
  const [logoUrl,       setLogoUrl]       = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingLogo,  setDeletingLogo]  = useState(false)
  const [msgLogo,       setMsgLogo]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Carga inicial ─────────────────────────────────────── */
  useEffect(() => {
    async function loadPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nombre, rol, tenant_id, tenants(nombre, logo_url)')
        .eq('id', user.id)
        .single()

      const nombreActual = usuario?.nombre ?? ''
      setNombre(nombreActual)
      setNombreOriginal(nombreActual)
      setRol(usuario?.rol ?? null)
      setTenantId(usuario?.tenant_id ?? '')

      const t = usuario?.tenants as { nombre: string; logo_url: string | null } | null
      setNombreTaller(t?.nombre ?? '')
      setLogoUrl(t?.logo_url ?? null)

      setLoadingPerfil(false)
    }
    loadPerfil()
  }, [])

  /* ── Guardar nombre ────────────────────────────────────── */
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

  /* ── Cambiar contraseña ────────────────────────────────── */
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

  /* ── Subir logo ────────────────────────────────────────── */
  async function subirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    if (file.size > 2 * 1024 * 1024) {
      setMsgLogo({ type: 'err', text: 'El archivo no puede superar 2 MB' })
      return
    }

    setUploadingLogo(true)
    setMsgLogo(null)

    const ext  = file.name.split('.').pop() ?? 'png'
    const path = `${tenantId}/logo.${ext}`

    const { error: storageErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (storageErr) {
      setMsgLogo({ type: 'err', text: 'Error al subir la imagen' })
      setUploadingLogo(false)
      return
    }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`

    const res = await fetch('/api/tenant/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: urlData.publicUrl }),
    })

    if (!res.ok) {
      setMsgLogo({ type: 'err', text: 'Error al guardar el logo en la base de datos' })
    } else {
      setLogoUrl(publicUrl)
      setMsgLogo({ type: 'ok', text: 'Logo actualizado correctamente' })
    }
    setUploadingLogo(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── Eliminar logo ─────────────────────────────────────── */
  async function eliminarLogo() {
    if (!tenantId) return
    setDeletingLogo(true)
    setMsgLogo(null)

    const res = await fetch('/api/tenant/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: null }),
    })

    if (!res.ok) {
      setMsgLogo({ type: 'err', text: 'Error al eliminar el logo' })
    } else {
      setLogoUrl(null)
      setMsgLogo({ type: 'ok', text: 'Logo eliminado' })
    }
    setDeletingLogo(false)
  }

  /* ── Loading ───────────────────────────────────────────── */
  if (loadingPerfil) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-zinc-400">Cargando perfil…</p>
      </div>
    )
  }

  const esAdmin = rol === 'admin'

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Mi perfil</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Configura tu nombre y contraseña de acceso</p>
      </div>

      {/* ── Logo del taller (solo admin) ────────────────── */}
      {esAdmin && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Logo del taller</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{nombreTaller}</p>
            </div>
          </div>

          {logoUrl ? (
            /* Preview + acciones */
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo del taller"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo || deletingLogo}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {uploadingLogo ? 'Subiendo…' : 'Cambiar logo'}
                  </button>
                  <button
                    type="button"
                    onClick={eliminarLogo}
                    disabled={uploadingLogo || deletingLogo}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingLogo ? 'Eliminando…' : 'Eliminar logo'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-400">PNG, JPG o WebP · máx. 2 MB · aparece en los PDFs de historial</p>
            </div>
          ) : (
            /* Zona de upload */
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-xl py-8 text-zinc-400 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50/30 transition-colors disabled:opacity-50"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm font-medium">
                  {uploadingLogo ? 'Subiendo…' : 'Seleccionar logo'}
                </span>
                <span className="text-xs">PNG, JPG o WebP · máx. 2 MB</span>
              </button>
              <p className="text-xs text-zinc-400 text-center">El logo aparecerá en los PDFs de historial de clientes</p>
            </div>
          )}

          {/* Input oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={subirLogo}
          />

          {msgLogo && (
            <p className={`mt-3 text-sm ${msgLogo.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
              {msgLogo.text}
            </p>
          )}
        </div>
      )}

      {/* ── Información personal ─────────────────────────── */}
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

      {/* ── Cambiar contraseña ───────────────────────────── */}
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
