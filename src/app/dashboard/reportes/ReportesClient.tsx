'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, DollarSign, ShoppingBag, Tag, Percent } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrdenMes = {
  id: string
  total_cobrado: number
  total_base: number
  descuento: number
  created_at: string
  estado: string
}
type OrdenAnt   = { id: string; total_cobrado: number; descuento: number }
type Orden90    = { id: string; total_cobrado: number; created_at: string }
type TopSvc     = { nombre_servicio: string; precio_cobrado: number; ordenes: { created_at: string } }
type PorCat     = {
  precio_cobrado: number
  catalogo_servicios: { categoria_id: string; categorias: { nombre: string } } | null
  ordenes: { created_at: string }
}

type Props = {
  ordenesMes:   OrdenMes[]
  ordenesAnt:   OrdenAnt[]
  ordenes90:    Orden90[]
  topServicios: TopSvc[]
  porCategoria: PorCat[]
  mesLabel:     string
  mesAntLabel:  string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt   = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
const fmtK  = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n)

const PALETTE = ['#2563EB', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554', '#e0f2fe', '#0ea5e9', '#0284c7']

function delta(actual: number, anterior: number) {
  if (anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-zinc-400">Sin datos ant.</span>
  const up = pct > 0
  const eq = pct === 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      eq ? 'bg-zinc-100 text-zinc-500' : up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
    }`}>
      {eq ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  padding: '10px 14px',
  fontSize: '13px',
}
const TOOLTIP_LABEL_STYLE = { color: '#71717a', marginBottom: 4, fontSize: '11px', fontWeight: 500 }
const TOOLTIP_ITEM_STYLE  = { color: '#18181b', fontWeight: 600 }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={TOOLTIP_LABEL_STYLE}>{label}</p>
      <p style={TOOLTIP_ITEM_STYLE}>{fmt(payload[0].value)}</p>
    </div>
  )
}

function CustomTooltipCount({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={TOOLTIP_LABEL_STYLE}>{label}</p>
      <p style={TOOLTIP_ITEM_STYLE}>{v} {v === 1 ? 'vez' : 'veces'}</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportesClient({
  ordenesMes, ordenesAnt, ordenes90, topServicios, porCategoria, mesLabel, mesAntLabel,
}: Props) {

  // ── KPIs mes actual
  const ingresosMes   = ordenesMes.reduce((s, o) => s + o.total_cobrado, 0)
  const ordenesMesCnt = ordenesMes.length
  const ticketProm    = ordenesMesCnt > 0 ? ingresosMes / ordenesMesCnt : 0
  const descuentoMes  = ordenesMes.reduce((s, o) => s + (o.descuento ?? 0), 0)

  // ── % promedio descuento mes actual
  const totalBaseMes   = ordenesMes.reduce((s, o) => s + o.total_base, 0)
  const pctDescProm    = totalBaseMes > 0 ? (descuentoMes / totalBaseMes) * 100 : 0

  // ── KPIs mes anterior
  const ingresosAnt   = ordenesAnt.reduce((s, o) => s + o.total_cobrado, 0)
  const ordenesAntCnt = ordenesAnt.length
  const ticketAnt     = ordenesAntCnt > 0 ? ingresosAnt / ordenesAntCnt : 0
  const descuentoAnt  = ordenesAnt.reduce((s, o) => s + (o.descuento ?? 0), 0)

  // ── Gráfica tendencia 90 días — agrupar por día
  const tendencia = (() => {
    const map: Record<string, number> = {}
    ordenes90.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      map[d] = (map[d] ?? 0) + o.total_cobrado
    })
    return Object.entries(map).map(([fecha, ingresos]) => ({ fecha, ingresos }))
  })()

  // ── Ingresos diarios mes actual
  const diariosMes = (() => {
    const map: Record<string, number> = {}
    ordenesMes.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      map[d] = (map[d] ?? 0) + o.total_cobrado
    })
    return Object.entries(map).map(([fecha, ingresos]) => ({ fecha, ingresos }))
  })()

  // ── Top 10 servicios
  const svcMap: Record<string, number> = {}
  topServicios.forEach(s => { svcMap[s.nombre_servicio] = (svcMap[s.nombre_servicio] ?? 0) + 1 })
  const topSvcData = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nombre, cantidad]) => ({ nombre: nombre.length > 28 ? nombre.slice(0, 26) + '…' : nombre, cantidad }))

  // ── Distribución por categoría (ingresos)
  const catMap: Record<string, number> = {}
  porCategoria.forEach(p => {
    const nombre = p.catalogo_servicios?.categorias?.nombre ?? 'Sin categoría'
    catMap[nombre] = (catMap[nombre] ?? 0) + p.precio_cobrado
  })
  const catData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, valor]) => ({ nombre, valor }))

  // ── Estado de órdenes del mes
  const estados = ['recibido', 'en_proceso', 'listo', 'entregado']
  const estadoData = estados.map(e => ({
    estado: e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' '),
    cantidad: ordenesMes.filter(o => o.estado === e).length,
  })).filter(e => e.cantidad > 0)

  const kpis = [
    {
      label: 'Ingresos del mes',
      value: fmt(ingresosMes),
      delta: delta(ingresosMes, ingresosAnt),
      icon: DollarSign,
      color: 'bg-blue-50 text-[#2563EB]',
    },
    {
      label: 'Órdenes del mes',
      value: ordenesMesCnt.toString(),
      delta: delta(ordenesMesCnt, ordenesAntCnt),
      icon: ShoppingBag,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Ticket promedio',
      value: fmt(ticketProm),
      delta: delta(ticketProm, ticketAnt),
      icon: Tag,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="max-w-7xl space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 capitalize">Reportes</h1>
          <p className="text-sm text-zinc-400 mt-0.5 capitalize">{mesLabel} · comparado con {mesAntLabel}</p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          const d = kpi.invertDelta && kpi.delta !== null ? -kpi.delta : kpi.delta
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <DeltaBadge pct={d} />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{kpi.value}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{kpi.label}</p>
              </div>
            </div>
          )
        })}

        {/* KPI Descuentos — card especial con $ y % */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
              <Percent className="w-5 h-5" strokeWidth={2} />
            </div>
            <DeltaBadge pct={delta(descuentoMes, descuentoAnt) !== null ? -(delta(descuentoMes, descuentoAnt)!) : null} />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900">{fmt(descuentoMes)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Descuento total del mes</p>
            <p className="text-sm font-semibold text-amber-600 mt-2">{pctDescProm.toFixed(1)}% promedio por orden</p>
          </div>
        </div>
      </div>

      {/* ── Gráfica tendencia + Estado órdenes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tendencia 90 días */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Tendencia de ingresos</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Últimos 3 meses</p>
          </div>
          {tendencia.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tendencia} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ingresos" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradBlue)" dot={false} activeDot={{ r: 5, fill: '#2563EB' }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Estado de órdenes */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Estado de órdenes</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Mes actual</p>
          </div>
          {estadoData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={estadoData} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {estadoData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    formatter={(v: number) => [`${v} órdenes`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-col gap-2">
                {estadoData.map((e, i) => (
                  <div key={e.estado} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-zinc-600">{e.estado}</span>
                    </div>
                    <span className="font-semibold text-zinc-800">{e.cantidad}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* ── Top servicios + Categorías ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top servicios */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Servicios más solicitados</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Mes actual · por número de veces</p>
          </div>
          {topSvcData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSvcData} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltipCount />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                <Bar dataKey="cantidad" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Ingresos por categoría */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Ingresos por categoría</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Mes actual</p>
          </div>
          {catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catData} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    formatter={(v: number) => [fmt(v), 'Ingresos']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-col gap-2 max-h-36 overflow-y-auto">
                {catData.map((c, i) => {
                  const pct = ingresosMes > 0 ? (c.valor / ingresosMes) * 100 : 0
                  return (
                    <div key={c.nombre} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-zinc-600 flex-1 truncate">{c.nombre}</span>
                      <span className="text-zinc-400">{pct.toFixed(1)}%</span>
                      <span className="font-semibold text-zinc-800 w-20 text-right">{fmt(c.valor)}</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* ── Ingresos diarios del mes ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-zinc-900 capitalize">Ingresos diarios — {mesLabel}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Total cobrado por día en el mes actual</p>
        </div>
        {diariosMes.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diariosMes} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="ingresos" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
      <p className="text-sm text-zinc-400">Sin datos para este período</p>
    </div>
  )
}
