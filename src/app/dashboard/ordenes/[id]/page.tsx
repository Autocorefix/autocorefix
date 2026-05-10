'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ArrowLeft, User, Car, ChevronDown } from 'lucide-react'

type Estado = 'recibido' | 'en_proceso' | 'listo' | 'entregado'

const ESTADOS = ['recibido', 'en_proceso', 'listo', 'entregado'] as const
const STATUS_STYLES: Record<Estado, { label: string; badge: string; option: string }> = {
  recibido:   { label: 'Recibido',   badge: 'bg-blue-50 text-[#2563EB] ring-blue-100',        option: 'hover:bg-blue-50 hover:text-[#2563EB]' },
  en_proceso: { label: 'En proceso', badge: 'bg-amber-50 text-amber-600 ring-amber-100',       option: 'hover:bg-amber-50 hover:text-amber-600' },
  listo:      { label: 'Listo',      badge: 'bg-emerald-50 text-emerald-600 ring-emerald-100', option: 'hover:bg-emerald-50 hover:text-emerald-600' },
  entregado:  { label: 'Entregado',  badge: 'bg-violet-600 text-white ring-violet-700',        option: 'hover:bg-violet-600 hover:text-white' },
}

type Orden = {
  id: string
  estado: string | null
  total_cobrado: number | null
  total_base: number | null
  descuento: number | null
  pct_descuento: number | null
  created_at: string | null
  clientes: { nombre: string; telefono: string | null; email: string | null; cliente_id: string | null } | null
  vehiculos: { marca: string | null; modelo: string | null; anio: number | null } | null
  orden_servicios: { id: string; nombre_servicio: string | null; precio_base: number | null; precio_cobrado: number | null }[]
}

function StatusDropdown({ estado, onChange }: { estado: Estado; onChange: (e: Estado) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const btnRef          = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const d = document.getElementById('status-drop')
        if (d && !d.contains(e.target as Node)) setOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleOpen() {
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
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset cursor-pointer transition-opacity ${STATUS_STYLES[estado].badge}`}
      >
        {STATUS_STYLES[estado].label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          id="status-drop"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden min-w-[150px]"
        >
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => { onChange(e); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                e === estado ? STATUS_STYLES[e].badge + ' ring-1 ring-inset' : `text-zinc-600 ${STATUS_STYLES[e].option}`
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

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

export default function OrdenDetallePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [orden,   setOrden]   = useState<Orden | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('ordenes')
        .select(`
          id, estado, total_cobrado, total_base, descuento, pct_descuento, created_at,
          clientes(nombre, telefono, email, cliente_id),
          vehiculos(marca, modelo, anio),
          orden_servicios(id, nombre_servicio, precio_base, precio_cobrado)
        `)
        .eq('id', id)
        .single()
      setOrden(data as Orden)
      setLoading(false)
    }
    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function cambiarEstado(estado: Estado) {
    if (!orden) return
    setSaving(true)
    const { error } = await supabase.from('ordenes').update({ estado }).eq('id', id)
    if (!error) setOrden(p => p ? { ...p, estado } : p)
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Cargando...</div>
  )
  if (!orden) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Orden no encontrada</div>
  )

  const estado    = (orden.estado ?? 'recibido') as Estado
  const cliente   = Array.isArray(orden.clientes)  ? orden.clientes[0]  : orden.clientes
  const vehiculo  = Array.isArray(orden.vehiculos) ? orden.vehiculos[0] : orden.vehiculos
  const servicios = orden.orden_servicios ?? []
  const fecha     = orden.created_at
    ? new Date(orden.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#2563EB] bg-white hover:bg-[#2563EB] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-[#2563EB] group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 font-mono">#{orden.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-zinc-400 capitalize mt-0.5">{fecha}</p>
          </div>
        </div>
        <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
          <StatusDropdown estado={estado} onChange={cambiarEstado} />
        </div>
      </div>

      {/* Cliente + Vehículo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
              <User className="w-4 h-4 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">Cliente</p>
          </div>
          <p className="text-base font-semibold text-zinc-900">{cliente?.nombre ?? '—'}</p>
          {cliente?.cliente_id && <p className="text-xs text-zinc-400 mt-0.5 font-mono">{cliente.cliente_id}</p>}
          {cliente?.telefono   && <p className="text-sm text-zinc-500 mt-2">{cliente.telefono}</p>}
          {cliente?.email      && <p className="text-sm text-zinc-500 mt-0.5">{cliente.email}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
              <Car className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">Vehículo</p>
          </div>
          {vehiculo ? (
            <>
              <p className="text-base font-semibold text-zinc-900">
                {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')}
              </p>
              {vehiculo.anio && <p className="text-sm text-zinc-500 mt-0.5">{vehiculo.anio}</p>}
            </>
          ) : (
            <p className="text-sm text-zinc-400">Sin vehículo registrado</p>
          )}
        </div>
      </div>

      {/* Servicios */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Servicios</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
              <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Servicio</th>
              <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Precio base</th>
              <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Cobrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {servicios.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">Sin servicios registrados</td>
              </tr>
            )}
            {servicios.map(s => (
              <tr key={s.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 font-medium text-zinc-800">{s.nombre_servicio ?? '—'}</td>
                <td className="px-6 py-4 text-zinc-400 text-right">{s.precio_base != null ? fmt(s.precio_base) : '—'}</td>
                <td className="px-6 py-4 font-semibold text-zinc-900 text-right">{s.precio_cobrado != null ? fmt(s.precio_cobrado) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t border-zinc-100 px-6 py-4 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-8 text-sm">
            <span className="text-zinc-400">Subtotal</span>
            <span className="font-medium text-zinc-700 w-24 text-right">{fmt(orden.total_base ?? 0)}</span>
          </div>
          {(orden.descuento ?? 0) > 0 && (
            <div className="flex items-center gap-8 text-sm">
              <span className="text-amber-600">
                Descuento {orden.pct_descuento != null ? `(${Math.round(orden.pct_descuento)}%)` : ''}
              </span>
              <span className="font-medium text-amber-600 w-24 text-right">−{fmt(orden.descuento ?? 0)}</span>
            </div>
          )}
          <div className="flex items-center gap-8 text-base border-t border-zinc-100 pt-2 mt-1">
            <span className="font-semibold text-zinc-900">Total</span>
            <span className="font-bold text-zinc-900 w-24 text-right">{fmt(orden.total_cobrado ?? 0)}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
