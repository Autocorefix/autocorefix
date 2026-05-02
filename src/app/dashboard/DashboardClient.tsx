'use client'

import { useState, useRef, useEffect } from 'react'
import { ClipboardList, Wrench, CheckCircle2, Banknote, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

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
type Estado = typeof ESTADOS[number]

const STATUS_STYLES: Record<Estado, { label: string; badge: string; option: string }> = {
  recibido:   { label: 'Recibido',   badge: 'bg-blue-50 text-[#2563EB] ring-blue-100',        option: 'hover:bg-blue-50 hover:text-[#2563EB]' },
  en_proceso: { label: 'En proceso', badge: 'bg-amber-50 text-amber-600 ring-amber-100',       option: 'hover:bg-amber-50 hover:text-amber-600' },
  listo:      { label: 'Listo',      badge: 'bg-emerald-50 text-emerald-600 ring-emerald-100', option: 'hover:bg-emerald-50 hover:text-emerald-600' },
  entregado:  { label: 'Entregado',  badge: 'bg-violet-600 text-white ring-violet-700',        option: 'hover:bg-violet-600 hover:text-white' },
}

function StatusDropdown({
  ordenId,
  estado,
  updating,
  onChange,
}: {
  ordenId: string
  estado: Estado
  updating: boolean
  onChange: (id: string, estado: Estado) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current && !btnRef.current.contains(target)) {
        const dropdown = document.getElementById(`dropdown-${ordenId}`)
        if (dropdown && !dropdown.contains(target)) setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ordenId])

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    setOpen(prev => !prev)
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
          id={`dropdown-${ordenId}`}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
        >
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => { onChange(ordenId, e); setOpen(false) }}
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

export default function DashboardClient({
  ordenes: inicial,
  todayLabel,
}: {
  ordenes: Orden[]
  todayLabel: string
}) {
  const [ordenes, setOrdenes] = useState<Orden[]>(inicial)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  const recibidas   = ordenes.filter(o => o.estado === 'recibido').length
  const enProceso   = ordenes.filter(o => o.estado === 'en_proceso').length
  const completadas = ordenes.filter(o => o.estado === 'listo' || o.estado === 'entregado').length
  const ingresos    = ordenes.reduce((s, o) => s + (o.total_cobrado ?? 0), 0)

  const METRICS = [
    { label: 'Órdenes Recibidas', value: String(recibidas),   Icon: ClipboardList, iconBg: 'bg-blue-50',    iconColor: 'text-[#2563EB]' },
    { label: 'En Proceso',        value: String(enProceso),   Icon: Wrench,        iconBg: 'bg-amber-50',   iconColor: 'text-amber-500' },
    { label: 'Completadas',       value: String(completadas), Icon: CheckCircle2,  iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { label: 'Ingresos del Día',  value: `$${ingresos.toLocaleString('es-MX')}`, Icon: Banknote, iconBg: 'bg-blue-50', iconColor: 'text-[#2563EB]' },
  ]

  async function cambiarEstado(id: string, estado: Estado) {
    setUpdating(id)
    const { error } = await supabase.from('ordenes').update({ estado }).eq('id', id)
    if (!error) setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado } : o))
    setUpdating(null)
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-0.5 capitalize">{todayLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-8">
        {METRICS.map(({ label, value, Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center gap-4">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
              <p className="text-xs text-zinc-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Órdenes de hoy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left">
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">#Orden</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Cliente</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Vehículo</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Servicios</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {ordenes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-400 text-sm">
                    No hay órdenes registradas hoy
                  </td>
                </tr>
              )}
              {ordenes.map(order => {
                const cliente      = Array.isArray(order.clientes) ? order.clientes[0] : order.clientes
                const vehiculo     = Array.isArray(order.vehiculos) ? order.vehiculos[0] : order.vehiculos
                const numServicios = order.orden_servicios?.length ?? 0
                const estadoActual = (order.estado ?? 'recibido') as Estado

                return (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-5 font-mono text-xs text-zinc-400">{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-5 font-medium text-zinc-800">{cliente?.nombre ?? '—'}</td>
                    <td className="px-6 py-5 text-zinc-500">
                      {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}` : '—'}
                    </td>
                    <td className="px-6 py-5 text-zinc-500">
                      {numServicios} {numServicios === 1 ? 'servicio' : 'servicios'}
                    </td>
                    <td className="px-6 py-5">
                      <StatusDropdown
                        ordenId={order.id}
                        estado={estadoActual}
                        updating={updating === order.id}
                        onChange={cambiarEstado}
                      />
                    </td>
                    <td className="px-6 py-5 font-semibold text-zinc-800 text-right">
                      ${(order.total_cobrado ?? 0).toLocaleString('es-MX')}
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