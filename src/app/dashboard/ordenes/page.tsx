'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'

type Estado = 'recibido' | 'en_proceso' | 'listo' | 'entregado'

type Orden = {
  id: string
  estado: string | null
  total_cobrado: number | null
  created_at: string | null
  clientes: { nombre: string } | { nombre: string }[] | null
  vehiculos: { marca: string | null; modelo: string | null; anio: number | null } | { marca: string | null; modelo: string | null; anio: number | null }[] | null
  orden_servicios: { id: string }[] | null
}

const ESTADOS = ['recibido', 'en_proceso', 'listo', 'entregado'] as const

const STATUS_STYLES: Record<Estado, { label: string; badge: string; option: string }> = {
  recibido:   { label: 'Recibido',   badge: 'bg-blue-50 text-[#2563EB] ring-blue-100',        option: 'hover:bg-blue-50 hover:text-[#2563EB]' },
  en_proceso: { label: 'En proceso', badge: 'bg-amber-50 text-amber-600 ring-amber-100',       option: 'hover:bg-amber-50 hover:text-amber-600' },
  listo:      { label: 'Listo',      badge: 'bg-emerald-50 text-emerald-600 ring-emerald-100', option: 'hover:bg-emerald-50 hover:text-emerald-600' },
  entregado:  { label: 'Entregado',  badge: 'bg-violet-600 text-white ring-violet-700',        option: 'hover:bg-violet-600 hover:text-white' },
}

function StatusDropdown({ ordenId, estado, updating, onChange }: {
  ordenId: string; estado: Estado; updating: boolean; onChange: (id: string, e: Estado) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current && !btnRef.current.contains(t)) {
        const d = document.getElementById(`od-${ordenId}`)
        if (d && !d.contains(t)) setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ordenId])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX })
    }
    setOpen(p => !p)
  }

  return (
    <>
      <button
        ref={btnRef}
        disabled={updating}
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-opacity ${STATUS_STYLES[estado].badge} ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {STATUS_STYLES[estado].label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div
          id={`od-${ordenId}`}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
        >
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={(ev) => { ev.stopPropagation(); onChange(ordenId, e); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors ${
                e === estado
                  ? STATUS_STYLES[e].badge + ' ring-1 ring-inset'
                  : `text-zinc-600 ${STATUS_STYLES[e].option}`
              }`}
            >
              {STATUS_STYLES[e].label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default function OrdenesPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [ordenes,      setOrdenes]      = useState<Orden[]>([])
  const [loading,      setLoading]      = useState(true)
  const [updating,     setUpdating]     = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<Estado | 'todos'>('todos')
  const [busqueda,     setBusqueda]     = useState('')

  const hoy = new Date()
  const [desde, setDesde] = useState(() =>
    new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  )
  const [hasta, setHasta] = useState(() => hoy.toISOString().split('T')[0])

  const fetchOrdenes = useCallback(async () => {
    setLoading(true)
    const desdeISO = new Date(desde + 'T00:00:00').toISOString()
    const hastaISO = new Date(hasta + 'T23:59:59').toISOString()
    const { data } = await supabase
      .from('ordenes')
      .select(`
        id, estado, total_cobrado, created_at,
        clientes(nombre),
        vehiculos(marca, modelo, anio),
        orden_servicios(id)
      `)
      .gte('created_at', desdeISO)
      .lte('created_at', hastaISO)
      .order('created_at', { ascending: false })
      .limit(200)
    setOrdenes(data ?? [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta])

  useEffect(() => { fetchOrdenes() }, [fetchOrdenes])

  async function cambiarEstado(id: string, estado: Estado) {
    setUpdating(id)
    const { error } = await supabase.from('ordenes').update({ estado }).eq('id', id)
    if (!error) setOrdenes(p => p.map(o => o.id === id ? { ...o, estado } : o))
    setUpdating(null)
  }

  const filtradas = ordenes.filter(o => {
    const cliente = Array.isArray(o.clientes) ? o.clientes[0] : o.clientes
    const matchEstado   = filtroEstado === 'todos' || o.estado === filtroEstado
    const matchBusqueda = !busqueda ||
      cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.id.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusqueda
  })

  const totalFiltrado = filtradas.reduce((s, o) => s + (o.total_cobrado ?? 0), 0)

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Órdenes</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {filtradas.length} {filtradas.length === 1 ? 'orden' : 'órdenes'} · ${totalFiltrado.toLocaleString('es-MX')} total
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar cliente o ID..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            className="text-sm text-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
          <span className="text-zinc-400 text-sm">—</span>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="text-sm text-zinc-900 border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Pills de estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['todos', ...ESTADOS] as const).map(e => {
          const count = e === 'todos' ? ordenes.length : ordenes.filter(o => o.estado === e).length
          return (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filtroEstado === e
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {e === 'todos' ? 'Todos' : STATUS_STYLES[e].label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                <th className="w-12 px-3 py-3"></th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">#Orden</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vehículo</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Servicios</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha</th>
                <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Total</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-zinc-400 text-sm">Cargando...</td>
                </tr>
              )}
              {!loading && filtradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-zinc-400 text-sm">Sin órdenes en este período</td>
                </tr>
              )}
              {!loading && filtradas.map(o => {
                const cliente  = Array.isArray(o.clientes)  ? o.clientes[0]  : o.clientes
                const vehiculo = Array.isArray(o.vehiculos) ? o.vehiculos[0] : o.vehiculos
                const numSvc   = o.orden_servicios?.length ?? 0
                const estado   = (o.estado ?? 'recibido') as Estado
                const fecha    = o.created_at
                  ? new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'
                return (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/dashboard/ordenes/${o.id}`)}
                    className="group cursor-pointer transition-colors border-t border-zinc-100 hover:bg-[#EFF6FF]"
                  >
                    <td className="pl-3 pr-2 py-4 border-l-2 border-l-transparent group-hover:border-l-[#2563EB] transition-colors">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md border border-[#2563EB] bg-white group-hover:bg-[#2563EB] transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white transition-colors" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-800">{cliente?.nombre ?? '—'}</td>
                    <td className="px-5 py-4 text-zinc-500">
                      {vehiculo
                        ? `${vehiculo.marca ?? ''} ${vehiculo.modelo ?? ''} ${vehiculo.anio ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {numSvc} {numSvc === 1 ? 'servicio' : 'servicios'}
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <StatusDropdown
                        ordenId={o.id}
                        estado={estado}
                        updating={updating === o.id}
                        onChange={cambiarEstado}
                      />
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{fecha}</td>
                    <td className="px-5 py-4 font-semibold text-zinc-800 text-right">
                      {'$' + (o.total_cobrado ?? 0).toLocaleString('es-MX')}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md border border-[#2563EB] bg-white group-hover:bg-[#2563EB] transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white transition-colors" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
