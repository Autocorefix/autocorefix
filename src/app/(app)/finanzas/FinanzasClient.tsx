'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import FinanzasNav from './FinanzasNav'

type TrabajadorCalc = {
  id: string; nombre: string; especialidad: string | null
  salario_semanal: number
  comisionResponsable: number; comisionAyudante: number; pagosExtra: number
}

type Props = {
  totalIngresos:   number
  countOrdenes:    number
  egresosMap:      Record<string, number>
  totalEgresos:    number
  nominaData:      TrabajadorCalc[]
  totalNomina:     number
  semanasEnPeriodo: number
  desde:           string
  hasta:           string
}

const PRESETS = [
  { key: 'hoy',     label: 'Hoy' },
  { key: 'ayer',    label: 'Ayer' },
  { key: '7d',      label: 'Últimos 7 días' },
  { key: '14d',     label: 'Últimos 14 días' },
  { key: '30d',     label: 'Últimos 30 días' },
  { key: 'mes',     label: 'Este mes' },
  { key: 'mes_ant', label: 'Mes anterior' },
]

// Categorías del sistema — el fallback ?? cat maneja las personalizadas automáticamente
const CAT_LABELS: Record<string, string> = {
  renta:          'Renta / Arrendamiento',
  electricidad:   'Electricidad',
  agua:           'Agua',
  gas:            'Gas',
  movil:          'Teléfono móvil',
  tel_fijo:       'Teléfono fijo',
  internet:       'Internet',
  cable_tv:       'Cable / TV',
  herramientas:   'Herramientas',
  insumos:        'Insumos de taller',
  imprevistos:    'Imprevistos',
  // Compatibilidad con registros anteriores
  telefono:       'Comunicaciones',
  consumibles:    'Insumos de taller',
  otros:          'Otros',
}

const fmt  = (n: number) => `$${Math.round(n).toLocaleString('es-MX')}`
const pct  = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—'
const INPUT = 'border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-full'

export default function FinanzasClient({
  totalIngresos, countOrdenes, egresosMap, totalEgresos,
  nominaData, totalNomina, semanasEnPeriodo, desde, hasta,
}: Props) {
  const router = useRouter()
  const [desdeLocal, setDesdeLocal] = useState(desde)
  const [hastaLocal, setHastaLocal] = useState(hasta)
  const [open, setOpen]             = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function aplicar(d: string, h: string) {
    setOpen(false)
    router.push(`/finanzas?desde=${d}&hasta=${h}`)
  }

  function preset(tipo: string) {
    const n = new Date()
    const pad = (x: number) => String(x).padStart(2, '0')
    const iso = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`
    const shift = (days: number) => { const dt = new Date(n); dt.setDate(n.getDate() + days); return dt }
    const ranges: Record<string, [string, string]> = {
      hoy:     [iso(n), iso(n)],
      ayer:    [iso(shift(-1)), iso(shift(-1))],
      '7d':    [iso(shift(-6)), iso(n)],
      '14d':   [iso(shift(-13)), iso(n)],
      '30d':   [iso(shift(-29)), iso(n)],
      mes:     [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)],
      mes_ant: [iso(new Date(n.getFullYear(), n.getMonth()-1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))],
    }
    const [d, h] = ranges[tipo]
    setDesdeLocal(d); setHastaLocal(h)
    aplicar(d, h)
  }

  const btnLabel = desde === hasta
    ? new Date(desde + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : `${new Date(desde+'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'short' })} – ${new Date(hasta+'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}`

  const totalGeneral = totalNomina + totalEgresos
  const margenNeto   = totalIngresos - totalGeneral
  const esPositivo   = margenNeto >= 0

  return (
    <div className="max-w-4xl">
      <FinanzasNav />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Resumen financiero</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{btnLabel} · {semanasEnPeriodo} {semanasEnPeriodo === 1 ? 'semana' : 'semanas'}</p>
        </div>
        <div className="relative" ref={pickerRef}>
          <button onClick={() => setOpen(p => !p)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors">
            <span>{btnLabel}</span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl flex flex-col sm:flex-row overflow-hidden sm:min-w-[400px]">
              <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-100 py-2 sm:min-w-[150px]">
                {PRESETS.map(p => (
                  <button key={p.key} onClick={() => preset(p.key)}
                    className="text-left px-4 py-2 text-sm text-zinc-600 hover:bg-blue-50 hover:text-[#2563EB] transition-colors">{p.label}</button>
                ))}
              </div>
              <div className="flex flex-col gap-3 p-4 flex-1">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Personalizado</p>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Desde</label>
                  <input type="date" value={desdeLocal} onChange={e => setDesdeLocal(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Hasta</label>
                  <input type="date" value={hastaLocal} onChange={e => setHastaLocal(e.target.value)} className={INPUT} />
                </div>
                <button onClick={() => aplicar(desdeLocal, hastaLocal)}
                  className="w-full px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">Aplicar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">

        {/* INGRESOS */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-emerald-50">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Ingresos</span>
            <span className="text-lg font-bold text-emerald-700">{fmt(totalIngresos)}</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-zinc-500">Órdenes del período</span>
            <div className="text-right">
              <span className="font-semibold text-zinc-800">{fmt(totalIngresos)}</span>
              <span className="text-xs text-zinc-400 ml-2">({countOrdenes} {countOrdenes === 1 ? 'orden' : 'órdenes'})</span>
            </div>
          </div>
        </section>

        {/* NÓMINA */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-blue-50">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">Nómina</span>
            <span className="text-lg font-bold text-[#2563EB]">{fmt(totalNomina)}</span>
          </div>
          {nominaData.length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-400">Sin trabajadores registrados. Ve a <strong>Trabajadores</strong> para agregar el equipo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trabajador</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Salario</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comisiones</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Extras</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {nominaData.map(t => {
                  const salario    = t.salario_semanal * semanasEnPeriodo
                  const comisiones = t.comisionResponsable + t.comisionAyudante
                  const totalT     = salario + comisiones + t.pagosExtra
                  return (
                    <tr key={t.id} className="hover:bg-[#EFF6FF]">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-zinc-900">{t.nombre}</span>
                        {t.especialidad && <span className="text-xs text-zinc-400 ml-2">· {t.especialidad}</span>}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3.5 text-right text-zinc-600">
                        {fmt(salario)}
                        {semanasEnPeriodo > 1 && <span className="text-xs text-zinc-400 ml-1">×{semanasEnPeriodo}</span>}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3.5 text-right text-zinc-600">{fmt(comisiones)}</td>
                      <td className="hidden sm:table-cell px-4 py-3.5 text-right text-zinc-600">{t.pagosExtra > 0 ? fmt(t.pagosExtra) : <span className="text-zinc-300">—</span>}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-zinc-800">{fmt(totalT)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* GASTOS OPERATIVOS */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-amber-50">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Gastos operativos</span>
            <span className="text-lg font-bold text-amber-700">{fmt(totalEgresos)}</span>
          </div>
          {Object.keys(egresosMap).length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-400">Sin gastos registrados en este período. Ve a <strong>Gastos</strong> para agregar.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-50">
                {Object.entries(egresosMap).map(([cat, monto]) => (
                  <tr key={cat} className="hover:bg-[#EFF6FF]">
                    <td className="px-5 py-3 text-zinc-600">{CAT_LABELS[cat] ?? cat}</td>
                    <td className="px-5 py-3 text-right text-zinc-400 text-xs">{pct(monto, totalEgresos)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-800">{fmt(monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* RESULTADO */}
        <section className={`rounded-2xl border shadow-sm overflow-hidden ${esPositivo ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <div className="px-5 py-4 space-y-2.5">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Total ingresos</span>
              <span className="font-semibold">{fmt(totalIngresos)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Nómina</span>
              <span className="font-semibold">− {fmt(totalNomina)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Gastos operativos</span>
              <span className="font-semibold">− {fmt(totalEgresos)}</span>
            </div>
            <div className={`flex justify-between items-center pt-3 border-t ${esPositivo ? 'border-emerald-200' : 'border-red-200'}`}>
              <span className="text-base font-bold text-zinc-900">Margen neto</span>
              <div className="flex items-center gap-2">
                {esPositivo
                  ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                  : <TrendingDown className="w-5 h-5 text-red-500" />}
                <span className={`text-2xl font-bold ${esPositivo ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(margenNeto)}</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
