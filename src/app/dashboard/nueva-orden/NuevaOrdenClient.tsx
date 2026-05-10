'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, UserPlus, X, Trash2, Car,
  Droplets, Disc, Navigation2, CircleDot, Zap, Thermometer,
  Settings2, Settings, Cpu, Wind, Flame, Sun, Wrench,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import type { Tables } from '@/types/database.types'

type CatInfo = { id: string; nombre: string; is_system_default: boolean; orden: number }
export type ServicioOrden = Pick<Tables<'catalogo_servicios'>, 'id' | 'nombre' | 'precio_base' | 'categoria_id'> & {
  categorias: CatInfo
}
type Cliente  = Tables<'clientes'>
type Vehiculo = Tables<'vehiculos'>

type OrderItem = {
  servicioId: string
  nombre: string
  precioBase: number
  precioCobrado: number
}

const CATEGORIA_ICONS: Record<string, React.ElementType> = {
  'Cambio de Aceite y Filtros':   Droplets,
  'Sistema de Frenos':            Disc,
  'Suspensión y Dirección':       Navigation2,
  'Alineación y Balanceo':        CircleDot,
  'Sistema Eléctrico y Batería':  Zap,
  'Sistema de Enfriamiento':      Thermometer,
  'Afinación de Motor':           Settings2,
  'Transmisión y Embrague':       Settings,
  'Diagnóstico por Escáner':      Cpu,
  'Aire Acondicionado':           Wind,
  'Sistema de Escape':            Flame,
  'Luces y Visibilidad':          Sun,
  'Reparación Mayor de Motor':    Wrench,
}

const INPUT = 'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent w-full'

export default function NuevaOrdenClient({
  servicios,
  tenantId,
  prefijo,
}: {
  servicios: ServicioOrden[]
  tenantId: string
  prefijo: string
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [query, setQuery]                           = useState('')
  const [resultados, setResultados]                 = useState<Cliente[]>([])
  const [showDropdown, setShowDropdown]             = useState(false)
  const [cliente, setCliente]                       = useState<Cliente | null>(null)
  const [modoNuevoCliente, setModoNuevoCliente]     = useState(false)
  const [nuevoCliente, setNuevoCliente]             = useState({ nombre: '', telefono: '', email: '' })

  const [vehiculosCliente, setVehiculosCliente]         = useState<Vehiculo[]>([])
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null)
  const [modoNuevoVehiculo, setModoNuevoVehiculo]       = useState(false)
  const [nuevoVehiculo, setNuevoVehiculo]               = useState({ marca: '', modelo: '', anio: '' })

  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [items, setItems]                     = useState<OrderItem[]>([])
  const [precioFinalInput, setPrecioFinalInput] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Categorías únicas ordenadas por campo orden
  const categorias = [
    ...new Map(servicios.map(s => [s.categorias.id, s.categorias])).values()
  ].sort((a, b) => a.orden - b.orden)

  const totalBase    = items.reduce((s, i) => s + i.precioBase, 0)
  const precioFinal  = precioFinalInput === '' ? totalBase : Math.min(totalBase, Math.max(0, Number(precioFinalInput) || 0))
  const descuento    = totalBase - precioFinal
  const pctDescuento = totalBase > 0 ? (descuento / totalBase) * 100 : 0
  const fmt          = (n: number) => `$${n.toLocaleString('es-MX')}`

  async function buscarClientes(q: string) {
    setQuery(q)
    if (q.length < 2) { setResultados([]); setShowDropdown(false); return }
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%,cliente_id.ilike.%${q}%`)
      .limit(5)
    setResultados(data ?? [])
    setShowDropdown(true)
  }

  async function seleccionarCliente(c: Cliente) {
    setCliente(c)
    setQuery('')
    setShowDropdown(false)
    setModoNuevoCliente(false)
    const { data } = await supabase.from('vehiculos').select('*').eq('cliente_id', c.id)
    setVehiculosCliente(data ?? [])
    setVehiculoSeleccionado(null)
    setModoNuevoVehiculo((data ?? []).length === 0)
  }

  function limpiarCliente() {
    setCliente(null)
    setResultados([])
    setQuery('')
    setModoNuevoCliente(false)
    setNuevoCliente({ nombre: '', telefono: '', email: '' })
    setVehiculosCliente([])
    setVehiculoSeleccionado(null)
    setModoNuevoVehiculo(false)
    setNuevoVehiculo({ marca: '', modelo: '', anio: '' })
  }

  function agregarServicio(s: ServicioOrden) {
    if (items.some(i => i.servicioId === s.id)) return
    setItems(prev => [...prev, {
      servicioId:    s.id,
      nombre:        s.nombre,
      precioBase:    s.precio_base,
      precioCobrado: s.precio_base,
    }])
    setPrecioFinalInput('')
  }

  function quitarServicio(id: string) {
    setItems(prev => prev.filter(i => i.servicioId !== id))
    setPrecioFinalInput('')
  }

  async function guardarOrden() {
    setError('')
    if (!cliente && !modoNuevoCliente)                                                               { setError('Selecciona o registra un cliente.'); return }
    if (modoNuevoCliente && !nuevoCliente.nombre.trim())                                             { setError('El nombre del cliente es requerido.'); return }
    if (!vehiculoSeleccionado && !modoNuevoVehiculo)                                                 { setError('Selecciona o registra un vehículo.'); return }
    if (modoNuevoVehiculo && (!nuevoVehiculo.marca || !nuevoVehiculo.modelo || !nuevoVehiculo.anio)) { setError('Completa marca, modelo y año del vehículo.'); return }
    if (items.length === 0)                                                                          { setError('Agrega al menos un servicio.'); return }

    setLoading(true)

    try {
      let clienteId = cliente?.id
      if (modoNuevoCliente) {
        const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
        const codigo = `${prefijo}-${String((count ?? 0) + 1).padStart(4, '0')}`
        const { data, error: e } = await supabase
          .from('clientes')
          .insert({ nombre: nuevoCliente.nombre.trim(), telefono: nuevoCliente.telefono || null, email: nuevoCliente.email || null, tenant_id: tenantId, cliente_id: codigo })
          .select('id').single()
        if (e) throw new Error('Error al crear cliente')
        clienteId = data.id
      }

      let vehiculoId = vehiculoSeleccionado?.id
      if (modoNuevoVehiculo) {
        const { data, error: e } = await supabase
          .from('vehiculos')
          .insert({ marca: nuevoVehiculo.marca.trim(), modelo: nuevoVehiculo.modelo.trim(), anio: Number(nuevoVehiculo.anio), cliente_id: clienteId, tenant_id: tenantId })
          .select('id').single()
        if (e) throw new Error('Error al crear vehículo')
        vehiculoId = data.id
      }

      const { data: orden, error: e } = await supabase
        .from('ordenes')
        .insert({ tenant_id: tenantId, cliente_id: clienteId, vehiculo_id: vehiculoId, estado: 'recibido', total_base: totalBase, total_cobrado: precioFinal, descuento, pct_descuento: pctDescuento })
        .select('id').single()
      if (e) throw new Error('Error al crear orden')

      const ratio = totalBase > 0 ? precioFinal / totalBase : 1
      const { error: e2 } = await supabase.from('orden_servicios').insert(
        items.map(i => ({
          orden_id:        orden.id,
          servicio_id:     i.servicioId,
          nombre_servicio: i.nombre,
          precio_base:     i.precioBase,
          precio_cobrado:  Math.round(i.precioBase * ratio),
        }))
      )
      if (e2) throw new Error('Error al guardar servicios')

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  const hayCliente = cliente || modoNuevoCliente

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Nueva Orden</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Registra cliente, vehículo y servicios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Cliente</h2>

            {cliente ? (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{cliente.nombre}</p>
                  <p className="text-xs text-zinc-500">{cliente.cliente_id} · {cliente.telefono}</p>
                </div>
                <button onClick={limpiarCliente} className="text-zinc-400 hover:text-zinc-600 ml-3 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

            ) : modoNuevoCliente ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo cliente</p>
                  <button onClick={() => { setModoNuevoCliente(false); setNuevoCliente({ nombre: '', telefono: '', email: '' }) }}>
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
                <input className={INPUT} placeholder="Nombre completo *" value={nuevoCliente.nombre} onChange={e => setNuevoCliente(p => ({ ...p, nombre: e.target.value }))} />
                <input className={INPUT} placeholder="Teléfono" value={nuevoCliente.telefono} onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))} />
                <input className={INPUT} placeholder="Email (opcional)" type="email" value={nuevoCliente.email} onChange={e => setNuevoCliente(p => ({ ...p, email: e.target.value }))} />
              </div>

            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    placeholder="Nombre, teléfono, email o ID..."
                    value={query}
                    onChange={e => buscarClientes(e.target.value)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  />
                  {showDropdown && resultados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
                      {resultados.map(c => (
                        <button key={c.id} onMouseDown={() => seleccionarCliente(c)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 border-b border-zinc-50 last:border-0">
                          <span className="font-medium text-zinc-900">{c.nombre}</span>
                          <span className="text-zinc-400 ml-2 text-xs">{c.cliente_id} · {c.telefono}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setModoNuevoCliente(true)} className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit">
                  <UserPlus className="w-4 h-4" /> Registrar nuevo cliente
                </button>
              </div>
            )}
          </div>

          {hayCliente && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Vehículo</h2>

              {vehiculosCliente.length > 0 && !modoNuevoVehiculo && (
                <div className="flex flex-col gap-2 mb-3">
                  {vehiculosCliente.map(v => (
                    <button key={v.id} onClick={() => setVehiculoSeleccionado(v)}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        vehiculoSeleccionado?.id === v.id ? 'bg-blue-50 border-blue-200' : 'border-zinc-200 hover:bg-zinc-50'
                      }`}>
                      <Car className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="text-sm font-medium text-zinc-800">{v.marca} {v.modelo} {v.anio}</span>
                    </button>
                  ))}
                </div>
              )}

              {modoNuevoVehiculo ? (
                <div className="flex flex-col gap-3">
                  {vehiculosCliente.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo vehículo</p>
                      <button onClick={() => setModoNuevoVehiculo(false)}><X className="w-4 h-4 text-zinc-400" /></button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <input className={INPUT} placeholder="Marca *" value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo(p => ({ ...p, marca: e.target.value }))} />
                    <input className={INPUT} placeholder="Modelo *" value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo(p => ({ ...p, modelo: e.target.value }))} />
                  </div>
                  <input className={INPUT} placeholder="Año *" type="number" min="1990" max="2030" value={nuevoVehiculo.anio} onChange={e => setNuevoVehiculo(p => ({ ...p, anio: e.target.value }))} />
                </div>
              ) : (
                <button onClick={() => { setModoNuevoVehiculo(true); setVehiculoSeleccionado(null) }}
                  className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit">
                  <Car className="w-4 h-4" />
                  {vehiculosCliente.length > 0 ? 'Agregar otro vehículo' : 'Registrar vehículo'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Servicios</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categorias.map(cat => {
                const Icon   = CATEGORIA_ICONS[cat.nombre] ?? Settings2
                const active = categoriaActiva === cat.id
                return (
                  <button key={cat.id} onClick={() => setCategoriaActiva(prev => prev === cat.id ? null : cat.id)}
                    className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                      active ? 'bg-[#2563EB] border-[#2563EB] shadow-sm' : 'bg-white border-zinc-200 hover:bg-[#2563EB] hover:border-[#2563EB] hover:shadow-sm'
                    }`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${active ? 'bg-white/20' : 'bg-blue-50 group-hover:bg-white/20'}`}>
                      <Icon className={`w-4 h-4 transition-colors ${active ? 'text-white' : 'text-[#2563EB] group-hover:text-white'}`} strokeWidth={2} />
                    </div>
                    <span className={`text-sm font-medium leading-tight transition-colors ${active ? 'text-white' : 'text-zinc-700 group-hover:text-white'}`}>{cat.nombre}</span>
                  </button>
                )
              })}
            </div>

            {categoriaActiva && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
                  {categorias.find(c => c.id === categoriaActiva)?.nombre}
                </p>
                <div className="flex flex-wrap gap-2">
                  {servicios.filter(s => s.categorias.id === categoriaActiva).map(s => {
                    const agregado = items.some(i => i.servicioId === s.id)
                    return (
                      <button key={s.id} onClick={() => agregarServicio(s)} disabled={agregado}
                        className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                          agregado
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-blue-50 hover:text-[#2563EB] hover:border-blue-200'
                        }`}>
                        {s.nombre}
                        <span className="ml-1.5 text-xs opacity-60">${s.precio_base.toLocaleString('es-MX')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Resumen de orden</h2>

            {items.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">Selecciona servicios del panel de arriba</p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_80px] gap-3 items-center text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 px-1">
                  <span>Servicio</span><span className="text-right">Precio base</span>
                </div>
                <div className="flex flex-col gap-2 mb-5">
                  {items.map(item => (
                    <div key={item.servicioId} className="grid grid-cols-[1fr_80px_24px] gap-3 items-center">
                      <span className="text-sm text-zinc-800 font-medium leading-tight">{item.nombre}</span>
                      <span className="text-sm text-zinc-400 text-right">{fmt(item.precioBase)}</span>
                      <button onClick={() => quitarServicio(item.servicioId)} className="flex justify-center text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Subtotal</span><span className="font-medium text-zinc-800">{fmt(totalBase)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm text-zinc-500 shrink-0">Precio final</label>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                      <input
                        type="number" min="0" max={totalBase}
                        placeholder={totalBase.toString()}
                        value={precioFinalInput}
                        onChange={e => setPrecioFinalInput(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 pl-7 pr-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {descuento > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Descuento aplicado</span>
                      <span className="text-emerald-600 font-medium">{fmt(descuento)} ({pctDescuento.toFixed(1)}%)</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100">
                    <span>Total a cobrar</span>
                    <span className="text-[#2563EB]">{fmt(precioFinal)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}

          <button onClick={guardarOrden} disabled={loading}
            className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar Orden'}
          </button>
        </div>
      </div>
    </div>
  )
}
