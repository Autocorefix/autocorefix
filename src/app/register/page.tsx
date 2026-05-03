'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Wrench, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [nombreTaller,    setNombreTaller]    = useState('')
  const [nombre,          setNombre]          = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd,         setShowPwd]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [googleLoading,   setGoogleLoading]   = useState(false)
  const [success,         setSuccess]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_taller: nombreTaller.trim(),
          nombre:        nombre.trim(),
        },
      },
    })

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Este correo ya tiene una cuenta. Inicia sesion.'
        : 'Ocurrio un error al crear la cuenta. Intenta de nuevo.'
      setError(msg)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={2} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Revisa tu correo</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Enviamos un enlace de confirmacion a <strong className="text-zinc-700">{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 text-sm font-medium text-[#2563EB] hover:underline"
          >
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo (brand) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563EB 60%, #3b82f6 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: '#ffffff' }} />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: '#ffffff' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
            <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">AutoCoreFix</span>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span className="text-white/90 text-xs font-medium">Registro gratuito, sin tarjeta</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Tu taller,<br />
            <span className="text-blue-200">digitalizado hoy</span>
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
            Registro en menos de 2 minutos. Accede a ordenes, clientes, catalogo y reportes desde el primer dia.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            'Panel listo para usar desde el primer dia',
            'Datos aislados — cada taller ve solo lo suyo',
            'Soporte incluido en todos los planes',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-400/30 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" strokeWidth={2.5} />
              </div>
              <span className="text-blue-100 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-sm py-8">

          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2563EB]">
              <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-zinc-900 font-semibold text-base tracking-tight">AutoCoreFix</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-zinc-900">Crear cuenta</h1>
            <p className="text-sm text-zinc-500 mt-1">Registra tu taller y empieza a operar hoy</p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60 mb-5"
          >
            {googleLoading ? (
              <svg className="animate-spin w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-zinc-400">o con correo</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre_taller" className="text-sm font-medium text-zinc-700">
                Nombre del taller
              </label>
              <input
                id="nombre_taller"
                type="text"
                value={nombreTaller}
                onChange={(e) => setNombreTaller(e.target.value)}
                required
                placeholder="Ej. Taller Garcia"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre" className="text-sm font-medium text-zinc-700">
                Tu nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Nombre del propietario"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="correo@taller.com"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Contrasena <span className="text-zinc-400 font-normal">(min. 8 caracteres)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-11 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm_password" className="text-sm font-medium text-zinc-700">
                Confirmar contrasena
              </label>
              <input
                id="confirm_password"
                type={showPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repite la contrasena"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" strokeWidth={2} />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: loading ? '#93c5fd' : '#2563EB' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta gratis'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-[#2563EB] hover:underline">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
