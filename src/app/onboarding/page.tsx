'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Wrench, AlertCircle } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [nombreTaller, setNombreTaller] = useState('')
  const [nombre,       setNombre]       = useState('')
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)

  // Pre-llenar nombre desde el perfil OAuth si existe
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setNombre(user.user_metadata.full_name)
      } else if (user?.user_metadata?.name) {
        setNombre(user.user_metadata.name)
      }
    }
    loadProfile()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('complete_onboarding', {
      p_nombre_taller:       nombreTaller.trim(),
      p_nombre_propietario:  nombre.trim(),
    })

    if (error) {
      setError('No se pudo configurar el taller. Intenta de nuevo.')
      console.error(error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2563EB]">
            <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-zinc-900 font-semibold text-base tracking-tight">AutoCoreFix</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span className="text-[#2563EB] text-xs font-medium">Ultimo paso</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Configura tu taller</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Solo necesitamos estos datos para personalizar tu panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
                Configurando...
              </>
            ) : (
              'Ir a mi panel'
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
