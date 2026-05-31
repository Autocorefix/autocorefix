'use client'

import { useState } from 'react'
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, XCircle,
  FileText, Save, Send, X, AlertCircle, Receipt,
} from 'lucide-react'

// ─── Catálogos SAT ─────────────────────────────────────────────────────────────
const REGIMENES = [
  { value: '601', label: '601 — General de Ley Personas Morales' },
  { value: '603', label: '603 — Personas Morales sin Fines de Lucro' },
  { value: '606', label: '606 — Arrendamiento' },
  { value: '612', label: '612 — Personas Físicas con Actividades Empresariales' },
  { value: '616', label: '616 — Sin Obligaciones Fiscales' },
  { value: '621', label: '621 — Incorporación Fiscal' },
  { value: '625', label: '625 — Actividades con Plataformas Tecnológicas' },
  { value: '626', label: '626 — Régimen Simplificado de Confianza (RESICO)' },
]

const USOS_CFDI = [
  { value: 'G01', label: 'G01 — Adquisición de mercancias' },
  { value: 'G03', label: 'G03 — Gastos en general' },
  { value: 'I01', label: 'I01 — Construcciones' },
  { value: 'D01', label: 'D01 — Honorarios médicos y dentales' },
  { value: 'S01', label: 'S01 — Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 — Pagos' },
  { value: 'P01', label: 'P01 — Por definir' },
]

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type Sub = {
  status: string
  trial_end: string | null
  current_period_end: string | null
  plan_type: string | null
  stripe_customer_id: string | null
} | null

type DatosFiscales = {
  rfc: string
  razon_social: string
  codigo_postal: string
  regimen_fiscal: string
  uso_cfdi: string
  email_facturacion: string
}

type Solicitud = {
  id: string
  periodo: string
  monto: number
  estado: string
  created_at: string
  emitida_at: string | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function periodoActual(): string {
  return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

const FEATURES = [
  'Acceso completo',
  'Asistentes ilimitadas',
  'Reportes y estadísticas',
  'Factura CFDI incluida',
  'Soporte prioritario',
]

const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white'
const SELECT = 'w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white'
const LABEL = 'block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5'

// ─── Componente principal ──────────────────────────────────────────────────────
export default function BillingClient({
  subscription,
  isAdmin,
  success,
  tallerName,
  datosFiscales: initialDatos,
  solicitudes: initialSolicitudes,
}: {
  subscription: Sub
  isAdmin: boolean
  success: boolean
  tallerName: string
  datosFiscales: DatosFiscales
  solicitudes: Solicitud[]
}) {
  const [loading,       setLoading]       = useState<string | null>(null)
  const [datos,         setDatos]         = useState<DatosFiscales>(initialDatos)
  const [savingDatos,   setSavingDatos]   = useState(false)
  const [savedDatos,    setSavedDatos]    = useState(false)
  const [rfcError,      setRfcError]      = useState('')
  const [cpError,       setCpError]       = useState('')
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [requesting,    setRequesting]    = useState(false)
  const [solicitudes,   setSolicitudes]   = useState<Solicitud[]>(initialSolicitudes)
  const [reqSuccess,    setReqSuccess]    = useState(false)

  const status    = subscription?.status ?? 'none'
  const trialDays = getDaysRemaining(subscription?.trial_end ?? null)
  const isTrialing = status === 'trialing' && trialDays > 0
  const isActive   = status === 'active'
  const isPastDue  = status === 'past_due'
  const showPlans  = !isActive && !isPastDue

  const datosFiscalesCompletos =
    datos.rfc && datos.razon_social && datos.codigo_postal &&
    datos.regimen_fiscal && datos.uso_cfdi && datos.email_facturacion

  const montoSolicitud = subscription?.plan_type === 'annual' ? 4499 : 499

  // ── Handlers suscripción ───────────────────────────────────────────────────
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
    if (url) window.open(url, '_blank')
    setLoading(null)
  }

  async function handlePortal() {
    setLoading('portal')
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.open(url, '_blank')
    setLoading(null)
  }

  // ── Handlers datos fiscales ────────────────────────────────────────────────
  function validateRFC() {
    const val = datos.rfc.trim().toUpperCase()
    if (!val) { setRfcError('El RFC es requerido'); return false }
    if (!RFC_REGEX.test(val)) { setRfcError('Formato de RFC inválido (ej: GARM850101AB2)'); return false }
    setRfcError('')
    return true
  }

  function validateCP() {
    if (!/^\d{5}$/.test(datos.codigo_postal)) { setCpError('El código postal debe tener 5 dígitos'); return false }
    setCpError('')
    return true
  }

  async function handleSaveDatos(e: React.FormEvent) {
    e.preventDefault()
    if (!validateRFC() || !validateCP()) return
    setSavingDatos(true)
    setSavedDatos(false)
    const res = await fetch('/api/factura-datos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, rfc: datos.rfc.toUpperCase().trim() }),
    })
    setSavingDatos(false)
    if (res.ok) setSavedDatos(true)
  }

  // ── Handlers solicitud de factura ──────────────────────────────────────────
  async function handleConfirmarFactura() {
    setRequesting(true)
    const res = await fetch('/api/factura-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodo:           periodoActual(),
        monto:             montoSolicitud,
        rfc:               datos.rfc.toUpperCase().trim(),
        razon_social:      datos.razon_social,
        codigo_postal:     datos.codigo_postal,
        regimen_fiscal:    datos.regimen_fiscal,
        uso_cfdi:          datos.uso_cfdi,
        email_facturacion: datos.email_facturacion,
        nombre_taller:     tallerName,
      }),
    })
    setRequesting(false)
    setShowConfirm(false)
    if (res.ok) {
      const { id } = await res.json()
      setSolicitudes(prev => [{
        id,
        periodo:    periodoActual(),
        monto:      montoSolicitud,
        estado:     'pendiente',
        created_at: new Date().toISOString(),
        emitida_at: null,
      }, ...prev])
      setReqSuccess(true)
      setTimeout(() => setReqSuccess(false), 5000)
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-2">Sección de administrador</h2>
        <p className="text-sm text-zinc-500">Solo el administrador del taller puede gestionar la facturación.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-[#2563EB]" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Facturación</h1>
          <p className="text-sm text-zinc-500">Suscripción, datos fiscales y solicitud de CFDI.</p>
        </div>
      </div>

      {/* Banners */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-700">¡Suscripción activada! Gracias por unirte a AutoCoreFix.</p>
        </div>
      )}
      {reqSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-700">Solicitud enviada. Recibirás tu CFDI en menos de 24 horas hábiles.</p>
        </div>
      )}

      {/* ── Estado de suscripción ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Estado actual</p>

        {status === 'none' && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-600">Sin suscripción</span>
            </div>
            <button onClick={handleInitTrial} disabled={!!loading}
              className="text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
              {loading === 'trial' ? 'Iniciando...' : 'Iniciar 14 días gratis'}
            </button>
          </div>
        )}

        {isTrialing && (
          <div className="flex items-center gap-3 flex-wrap">
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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600">Prueba expirada</span>
            </div>
            <p className="text-sm text-zinc-600">Suscríbete para continuar usando AutoCoreFix</p>
          </div>
        )}

        {status === 'canceled' && (
          <div className="flex items-center gap-3 flex-wrap">
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
                  {subscription?.plan_type === 'annual' ? 'Anual · $4,499 MXN/año' : 'Mensual · $499 MXN/mes'}
                </span>
                {subscription?.current_period_end && (
                  <span className="text-xs text-zinc-500">
                    Renueva el <span className="font-semibold text-zinc-700">{formatDate(subscription.current_period_end)}</span>
                    {' · '}<span className="font-semibold text-zinc-700">{getDaysRemaining(subscription.current_period_end)} días</span> restantes
                  </span>
                )}
              </div>
            </div>
            <button onClick={handlePortal} disabled={!!loading}
              className="text-sm font-medium text-[#2563EB] hover:underline disabled:opacity-50">
              {loading === 'portal' ? 'Cargando...' : 'Administrar suscripción'}
            </button>
          </div>
        )}

        {isPastDue && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Pago pendiente</span>
              </div>
              <span className="text-sm text-zinc-600">Actualiza tu método de pago</span>
            </div>
            <button onClick={handlePortal} disabled={!!loading}
              className="text-sm font-medium text-[#2563EB] hover:underline disabled:opacity-50">
              {loading === 'portal' ? 'Cargando...' : 'Actualizar pago'}
            </button>
          </div>
        )}
      </div>

      {/* ── Planes ── */}
      {showPlans && status !== 'none' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Mensual</p>
              <p className="text-2xl font-bold text-zinc-900">$499 <span className="text-sm font-normal text-zinc-400">MXN/mes</span></p>
              <p className="text-xs text-zinc-400 mt-0.5">IVA incluido · Sin permanencia</p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckout('monthly')} disabled={!!loading}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors disabled:opacity-60">
              {loading === 'monthly' ? 'Redirigiendo...' : 'Suscribirse mensual'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#2563EB] p-6 flex flex-col gap-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                25% descuento
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1">Anual</p>
              <p className="text-2xl font-bold text-zinc-900">$4,499 <span className="text-sm font-normal text-zinc-400">MXN/año</span></p>
              <p className="text-xs text-zinc-400 mt-0.5">IVA incluido · Equivale a $374/mes</p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckout('annual')} disabled={!!loading}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors disabled:opacity-60">
              {loading === 'annual' ? 'Redirigiendo...' : 'Suscribirse anual'}
            </button>
          </div>
        </div>
      )}

      {(isActive || isPastDue) && (
        <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Para cambiar tu plan, cancelar o ver historial de pagos, usa el portal de facturación.</p>
          <button onClick={handlePortal} disabled={!!loading}
            className="mt-3 text-sm font-medium text-[#2563EB] hover:underline disabled:opacity-50">
            {loading === 'portal' ? 'Cargando...' : 'Abrir portal de facturación'}
          </button>
        </div>
      )}

      {/* ── Datos de facturación ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-zinc-900">Datos de facturación</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Completa estos datos una sola vez. Los usaremos para generar tu CFDI cuando lo solicites.
        </p>

        <form onSubmit={handleSaveDatos} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>RFC *</label>
              <input
                className={INPUT}
                placeholder="Ej: GARM850101AB2"
                value={datos.rfc}
                onChange={e => { setDatos(p => ({ ...p, rfc: e.target.value.toUpperCase() })); setRfcError('') }}
                onBlur={validateRFC}
                maxLength={13}
              />
              {rfcError && <p className="text-xs text-red-500 mt-1">{rfcError}</p>}
            </div>
            <div>
              <label className={LABEL}>Código Postal *</label>
              <input
                className={INPUT}
                placeholder="06600"
                value={datos.codigo_postal}
                onChange={e => { setDatos(p => ({ ...p, codigo_postal: e.target.value.replace(/\D/g, '').slice(0, 5) })); setCpError('') }}
                onBlur={validateCP}
                maxLength={5}
              />
              {cpError && <p className="text-xs text-red-500 mt-1">{cpError}</p>}
            </div>
          </div>

          <div>
            <label className={LABEL}>Razón Social * <span className="normal-case font-normal text-zinc-400">(igual que en tu Constancia de Situación Fiscal)</span></label>
            <input
              className={INPUT}
              placeholder="Ej: GARCIA RAMIREZ MANUEL"
              value={datos.razon_social}
              onChange={e => setDatos(p => ({ ...p, razon_social: e.target.value }))}
              maxLength={300}
            />
          </div>

          <div>
            <label className={LABEL}>Régimen Fiscal *</label>
            <select className={SELECT} value={datos.regimen_fiscal}
              onChange={e => setDatos(p => ({ ...p, regimen_fiscal: e.target.value }))}>
              <option value="">Selecciona tu régimen</option>
              {REGIMENES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Uso de CFDI *</label>
              <select className={SELECT} value={datos.uso_cfdi}
                onChange={e => setDatos(p => ({ ...p, uso_cfdi: e.target.value }))}>
                {USOS_CFDI.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Email para recibir facturas *</label>
              <input
                type="email"
                className={INPUT}
                placeholder="contabilidad@taller.com"
                value={datos.email_facturacion}
                onChange={e => setDatos(p => ({ ...p, email_facturacion: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={savingDatos}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-60">
              <Save className="w-4 h-4" />
              {savingDatos ? 'Guardando...' : 'Guardar datos'}
            </button>
            {savedDatos && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4" /> Datos guardados
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── Solicitar factura ── */}
      {isActive && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center gap-3 mb-1">
            <Receipt className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-zinc-900">Solicitar factura CFDI</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-5">
            La factura será generada y enviada a <span className="font-medium text-zinc-600">{datos.email_facturacion || 'tu email de facturación'}</span> en menos de 24 horas hábiles.
          </p>

          {!datosFiscalesCompletos ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">Completa y guarda tus datos de facturación para solicitar tu CFDI.</p>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors"
            >
              <Send className="w-4 h-4" />
              Solicitar factura — {periodoActual()}
            </button>
          )}
        </div>
      )}

      {/* ── Historial de solicitudes ── */}
      {solicitudes.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-bold text-zinc-900">Historial de solicitudes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Período</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Monto</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(s => (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-5 py-3.5 font-medium text-zinc-800">{s.periodo}</td>
                    <td className="px-5 py-3.5 text-zinc-600">${Number(s.monto).toLocaleString('es-MX')} MXN</td>
                    <td className="px-5 py-3.5">
                      {s.estado === 'emitida' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Emitida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900">Confirma los datos de tu factura</h2>
              <button onClick={() => setShowConfirm(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 space-y-2">
              {[
                ['RFC',            datos.rfc.toUpperCase()],
                ['Razón Social',   datos.razon_social],
                ['Código Postal',  datos.codigo_postal],
                ['Régimen Fiscal', REGIMENES.find(r => r.value === datos.regimen_fiscal)?.label ?? datos.regimen_fiscal],
                ['Uso de CFDI',    USOS_CFDI.find(u => u.value === datos.uso_cfdi)?.label ?? datos.uso_cfdi],
                ['Período',        periodoActual()],
                ['Monto',          `$${montoSolicitud.toLocaleString('es-MX')} MXN (IVA incluido)`],
                ['Email',          datos.email_facturacion],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2 text-sm">
                  <span className="text-zinc-400 w-32 shrink-0">{label}</span>
                  <span className="text-zinc-800 font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Verifica que tus datos coincidan exactamente con tu <strong>Constancia de Situación Fiscal</strong> del SAT. Un error requiere cancelación del CFDI, lo cual puede tomar hasta 72 horas. Al confirmar, aceptas la responsabilidad sobre la exactitud de los datos.
              </p>
            </div>
            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Si solicitas un reembolso dentro de los 30 días de garantía, el CFDI emitido será cancelado ante el SAT y se emitirá una nota de crédito (CFDI Egreso). El reembolso se procesa de forma independiente a través de Stripe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors">
                Regresar y corregir
              </button>
              <button onClick={handleConfirmarFactura} disabled={requesting}
                className="flex-1 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-60">
                {requesting ? 'Enviando...' : 'Confirmar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
