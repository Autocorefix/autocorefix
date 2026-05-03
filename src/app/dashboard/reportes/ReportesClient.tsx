'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, DollarSign, ShoppingBag, Tag, Percent, Users } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrdenMes = {
  id: string
  total_cobrado: number
  total_base: number
  descuento: number
  created_at: string
  estado: string
  cliente_id: string
}
type OrdenAnt   = { id: string; total_cobrado: number; descuento: number; cliente_id: string }
type Orden90    = { id: string; total_cobrado: number; created_at: string }
type TopSvc     = {
  nombre_servicio: string
  precio_cobrado: number
  catalogo_servicios: { categoria_id: string; categorias: { nombre: string } } | null
  ordenes: { created_at: string }
}
type PorCat     = {
  precio_cobrado: number
  catalogo_servicios: { categoria_id: string; categorias: { nombre: string } } | null
  ordenes: { created_at: string }
}
type TopClienteRaw = {
  total_cobrado: number
  cliente_id: string
  clientes: { nombre: string; cliente_id: string } | null
}

type Props = {
  ordenesMes:       OrdenMes[]
  ordenesAnt:       OrdenAnt[]
  ordenes90:        Orden90[]
  topServicios:     TopSvc[]
  porCategoria:     PorCat[]
  topClientesRaw:   TopClienteRaw[]
  mesLabel:         string
  mesAntLabel:      string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt   = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
const fmtK  = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n)

const PALETTE = [
  '#2563EB', // azul
  '#7C3AED', // violeta
  '#059669', // esmeralda
  '#DC2626', // rojo
  '#D97706', // ámbar
  '#0891B2', // cian
  '#DB2777', // rosa
  '#65A30D', // lima
  '#9333EA', // púrpura
  '#0284C7', // cielo
  '#B45309', // café dorado
  '#047857', // verde oscuro
  '#1D4ED8', // azul oscuro
]

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
  border: '1px solid #FFD700',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(255,215,0,0.15)',
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

function CustomTooltipMoney({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={TOOLTIP_LABEL_STYLE}>{label}</p>
      <p style={TOOLTIP_ITEM_STYLE}>{fmt(payload[0].value)}</p>
    </div>
  )
}

type PiePayloadItem = {
  name: string
  value: number
  payload: { nombre?: string; estado?: string; valor?: number; cantidad?: number; color?: string }
  fill?: string
}
function PieTooltip({ active, payload, total }: { active?: boolean; payload?: PiePayloadItem[]; total?: number }) {
  if (!active || !payload?.length) return null
  const item  = payload[0]
  const name  = item.payload.nombre ?? item.payload.estado ?? item.name
  const value = item.value
  const pct   = total && total > 0 ? ((value / total) * 100).toFixed(1) : null
  const color = item.fill ?? '#2563EB'
  return (
    <div style={{ ...TOOLTIP_STYLE, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <p style={{ ...TOOLTIP_LABEL_STYLE, margin: 0, color: '#18181b', fontWeight: 600, fontSize: 12 }}>{name}</p>
      </div>
      <p style={TOOLTIP_ITEM_STYLE}>{item.payload.valor !== undefined ? fmt(value) : `${value} órdenes`}</p>
      {pct && <p style={{ ...TOOLTIP_LABEL_STYLE, margin: '2px 0 0', fontSize: 11 }}>{pct}% del total</p>}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportesClient({
  ordenesMes, ordenesAnt, ordenes90, topServicios, porCategoria, topClientesRaw, mesLabel, mesAntLabel,
}: Props) {

  // ── KPIs mes actual
  const ingresosMes    = ordenesMes.reduce((s, o) => s + o.total_cobrado, 0)
  const ordenesMesCnt  = ordenesMes.length
  const ticketProm     = ordenesMesCnt > 0 ? ingresosMes / ordenesMesCnt : 0
  const descuentoMes   = ordenesMes.reduce((s, o) => s + (o.descuento ?? 0), 0)
  const clientesUnicos = new Set(ordenesMes.map(o => o.cliente_id).filter(Boolean)).size

  // ── % promedio descuento mes actual
  const totalBaseMes  = ordenesMes.reduce((s, o) => s + o.total_base, 0)
  const pctDescProm   = totalBaseMes > 0 ? (descuentoMes / totalBaseMes) * 100 : 0

  // ── KPIs mes anterior
  const ingresosAnt       = ordenesAnt.reduce((s, o) => s + o.total_cobrado, 0)
  const ordenesAntCnt     = ordenesAnt.length
  const ticketAnt         = ordenesAntCnt > 0 ? ingresosAnt / ordenesAntCnt : 0
  const descuentoAnt      = ordenesAnt.reduce((s, o) => s + (o.descuento ?? 0), 0)
  const clientesUnicosAnt = new Set(ordenesAnt.map(o => o.cliente_id).filter(Boolean)).size

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

  // ── Mapa categoría → color (asigna paleta en orden de aparición)
  const catColorMap: Record<string, string> = {}
  let catIdx = 0
  ;[...topServicios, ...porCategoria].forEach(s => {
    const nombre = s.catalogo_servicios?.categorias?.nombre ?? 'Sin categoría'
    if (!(nombre in catColorMap)) {
      catColorMap[nombre] = PALETTE[catIdx++ % PALETTE.length]
    }
  })

  // ── Top 8 servicios con color de su categoría
  const svcMap: Record<string, { count: number; cat: string }> = {}
  topServicios.forEach(s => {
    const cat = s.catalogo_servicios?.categorias?.nombre ?? 'Sin categoría'
    if (!svcMap[s.nombre_servicio]) svcMap[s.nombre_servicio] = { count: 0, cat }
    svcMap[s.nombre_servicio].count += 1
  })
  const topSvcData = Object.entries(svcMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([nombre, { count, cat }]) => ({
      nombre: nombre.length > 28 ? nombre.slice(0, 26) + '…' : nombre,
      cantidad: count,
      color: catColorMap[cat] ?? '#2563EB',
    }))

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

  // ── Top 5 clientes por ingresos del mes
  const clienteAgg: Record<string, { nombre: string; total: number }> = {}
  topClientesRaw.forEach(r => {
    const id     = r.clientes?.cliente_id ?? r.cliente_id
    const nombre = r.clientes?.nombre ?? 'Desconocido'
    if (!clienteAgg[id]) clienteAgg[id] = { nombre, total: 0 }
    clienteAgg[id].total += r.total_cobrado
  })
  const top5Clientes = Object.values(clienteAgg)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(c => ({
      nombre: c.nombre.length > 22 ? c.nombre.slice(0, 20) + '…' : c.nombre,
      total: c.total,
    }))

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
    {
      label: 'Clientes únicos',
      value: clientesUnicos.toString(),
      delta: delta(clientesUnicos, clientesUnicosAnt),
      icon: Users,
      color: 'bg-sky-50 text-sky-600',
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <DeltaBadge pct={kpi.delta} />
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
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
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
                <PieChart style={{ outline: 'none' }}>
                  <Pie data={estadoData} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} style={{ outline: 'none' }}>
                    {estadoData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} style={{ outline: 'none' }} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip total={ordenesMesCnt} />} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: true }} />
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

        {/* Top servicios — barras coloreadas por categoría */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Servicios más solicitados</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Mes actual · coloreados por categoría</p>
          </div>
          {topSvcData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSvcData} layout="vertical" margin={{ top: 0, right: 52, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltipCount />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: true }} />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={false}>
                  {topSvcData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                  <LabelList dataKey="cantidad" position="right" style={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} formatter={(v: number) => v === 1 ? '1 vez' : `${v}x`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
          {/* Leyenda de categorías usadas */}
          {topSvcData.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {Object.entries(
                topSvcData.reduce<Record<string, string>>((acc, s) => {
                  const cat = [...topServicios].find(t => {
                    const n = t.nombre_servicio.length > 28 ? t.nombre_servicio.slice(0, 26) + '…' : t.nombre_servicio
                    return n === s.nombre || t.nombre_servicio === s.nombre
                  })
                  const catName = cat?.catalogo_servicios?.categorias?.nombre ?? 'Sin categoría'
                  acc[catName] = s.color
                  return acc
                }, {})
              ).map(([catName, color]) => (
                <div key={catName} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  {catName}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingresos por categoría */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Ingresos por categoría</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Mes actual</p>
          </div>
          {catData.length > 0 ? (
            <div className="flex items-center gap-4">
              {/* Donut fijo a la izquierda */}
              <div style={{ width: 190, height: 190, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Pie data={catData} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2} style={{ outline: 'none' }}>
                      {catData.map((c, i) => (
                        <Cell key={i} fill={catColorMap[c.nombre] ?? PALETTE[i % PALETTE.length]} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip total={ingresosMes} />} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: true }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Leyenda scrollable a la derecha */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 190 }}>
                {catData.map((c, i) => {
                  const pct = ingresosMes > 0 ? (c.valor / ingresosMes) * 100 : 0
                  return (
                    <div key={c.nombre} className="flex items-center gap-2 text-xs py-1.5 border-b border-zinc-50 last:border-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColorMap[c.nombre] ?? PALETTE[i % PALETTE.length] }} />
                      <span className="text-zinc-700 flex-1 truncate font-medium">{c.nombre}</span>
                      <span className="text-zinc-400 w-10 text-right">{pct.toFixed(1)}%</span>
                      <span className="font-semibold text-zinc-800 w-16 text-right">{fmt(c.valor)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* ── Top 5 clientes + Ingresos diarios ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 5 clientes */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-zinc-900">Top 5 clientes</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Mes actual · por ingresos generados</p>
          </div>
          {top5Clientes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {top5Clientes.map((c, i) => {
                const maxTotal = top5Clientes[0].total
                const pct = maxTotal > 0 ? (c.total / maxTotal) * 100 : 0
                const color = PALETTE[i % PALETTE.length]
                return (
                  <div key={`${c.nombre}-${i}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-xs shrink-0" style={{ background: color, fontSize: 9 }}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-zinc-700 truncate max-w-[120px]">{c.nombre}</span>
                      </div>
                      <span className="font-semibold text-zinc-900 shrink-0">{fmt(c.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Ingresos diarios del mes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 p-6">
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
                <Tooltip content={<CustomTooltipMoney />} cursor={false} isAnimationActive={false} allowEscapeViewBox={{ x: false, y: true }} />
                <Bar dataKey="ingresos" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={28} isAnimationActive={false}
                  activeBar={{ fill: '#1d4ed8', radius: [6, 6, 0, 0] }}>
                  <LabelList dataKey="ingresos" position="top" style={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} formatter={(v: number) => fmtK(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
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
