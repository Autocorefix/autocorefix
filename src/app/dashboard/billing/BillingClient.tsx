'use client'

import { useState } from 'react'
import { CreditCard, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'

type Sub = {
  status: string
  trial_end: string | null
  current_period_end: string | null
  plan_type: string | null
  stripe_customer_id: string | null
} | null

function getDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

const FEATURES = ['Acceso completo', 'Asistentes ilimitadas', 'Reportes y estadísticas', 'Soporte por email']

export default function BillingClient({
  subscription,
  isAdmin,
  success,
}: {
  subscription: Sub
  isAdmin: boolean
  success: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const status = subscription?.status ?? 'none'
  const trialDays = getDaysRemaining(subscription?.trial_end ?? null)
  const isTrialing = status === 'trialing' && trialDays > 0
  const isActive = status === 'active'
  const isPastDue = status === 'past_due'
  const showPlans = !isActive && !isPastDue

  async function handleInitTrial() {
    setLoading('trial')
    await fetch('/api/stripe/init-trial', { method: 'POST' })
    window.location.href = '/dashboard'
  }

  async function handleCheckout(planType: 'monthly' | 'annual') {
    setLoading(planType)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(null)
  }

  async function handlePortal() {
    setLoading('portal')
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(null)
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-2">Suscripción requerida</h2>
        <p className="text-sm text-zinc-500">El administrador del taller necesita activar la suscripción para continuar.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="w-5 h-5 text-[#2563EB]" />
          <h1 className="text-xl font-bold text-zinc-900">Facturación</h1>
        </div>
        <p className="text-sm text-zinc-500">Administra tu suscripción y pagos.</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-6">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-700">¡Suscripción activada! Gracias por unirte a AutoCoreFix.</p>
        </div>
      )}

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Estado actual</p>

        {status === 'none' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-600">Sin suscripción</span>
            </div>
            <button
              onClick={handleInitTrial}
              disabled={!!loading}
              className="text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading === 'trial' ? 'Iniciando...' : 'Iniciar 14 días gratis'}
            </button>
          </div>
        )}

        {isTrialing && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">Prueba gratuita</span>
            </div>
            <p className="text-sm text-zinc-600">
              Quedan <span className="font-semibold text-zinc-900">{trialDays} días</span> de tu prueba
            </p>
          </div>
        )}

        {(status === 'trialing' && trialDays === 0) && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600">Prueba expirada</span>
            </div>
            <p className="text-sm text-zinc-600">Suscríbete para continuar usando AutoCoreFix</p>
          </div>
        )}

        {status === 'canceled' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600">Cancelado</span>
            </div>
            <p className="text-sm text-zinc-600">Suscríbete para continuar usando AutoCoreFix</p>
          </div>
        )}

        {isActive && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Plan activo</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-zinc-800">
                  {subscription?.plan_type === 'annual' ? 'Anual' : 'Mensual'}
                </span>
                {subscription?.current_period_end && (
                  <span className="text-xs text-zinc-500">
                    Renueva el <span className="font-semibold text-zinc-700">{formatDate(subscription.current_period_end)}</span>
                    {' · '}<span className="font-semibold text-zinc-700">{getDaysRemaining(subscription.current_period_end)} días</span> restantes
                  </span>
                )}
              </div>
            </div>
            <button onClick={handlePortal} disabled={!!loading} className="text-sm font-medium text-[#2563EB] hover:underline disabled:opacity-50">
              {loading === 'portal' ? 'Cargando...' : 'Administrar'}
            </button>
          </div>
        )}

        {isPastDue && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Pago pendiente</span>
              </div>
              <span className="text-sm text-zinc-600">Actualiza tu método de pago</span>
            </div>
            <button onClick={handlePortal} disabled={!!loading} className="text-sm font-medium text-[#2563EB] hover:underline disabled:opacity-50">
              {loading === 'portal' ? 'Cargando...' : 'Actualizar pago'}
            </button>
          </div>
        )}
      </div>

      {/* Plan cards */}
      {showPlans && status !== 'none' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Mensual</p>
              <p className="text-2xl font-bold text-zinc-900">$399 <span className="text-sm font-normal text-zinc-500">MXN/mes</span></p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={!!loading}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading === 'monthly' ? 'Redirigiendo...' : 'Suscribirse'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#2563EB] p-6 flex flex-col gap-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#2563EB] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">Ahorra 16%</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Anual</p>
              <p className="text-2xl font-bold text-zinc-900">$3,499 <span className="text-sm font-normal text-zinc-500">MXN/año</span></p>
              <p className="text-xs text-zinc-400 mt-0.5">Equivale a $291/mes</p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={!!loading}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading === 'annual' ? 'Redirigiendo...' : 'Suscribirse anual'}
            </button>
          </div>
        </div>
      )}

      {(isActive || isPastDue) && (
        <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Para cambiar tu plan, cancelar o ver historial de pagos, usa el portal de facturación.</p>
          <button onClick={handlePortal} disabled={!!loading} className="mt-3 text-sm font-semibold text-[#2563EB] hover:underline disabled:opacity-50">
            {loading === 'portal' ? 'Cargando...' : 'Ir al portal de facturación →'}
          </button>
        </div>
      )}
    </div>
  )
}
