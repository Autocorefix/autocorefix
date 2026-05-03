'use client'

import React, { useState } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronRight, Car, ClipboardList } from 'lucide-react'

type OrdenServicio = {
  id: string
  nombre_servicio: string | null
  precio_cobrado: number | null
}

type Vehiculo = {
  id: string
  marca: string | null
  modelo: string | null
  anio: number | null
}

type Orden = {
  id: string
  estado: string | null
  total_cobrado: number | null
  created_at: string | null
  orden_servicios: OrdenServicio[]
}

type Cliente = {
  id: string
  cliente_id: string | null
  nombre: string
  telefono: string | null
  email: string | null
  created_at: string | null
  vehiculos: Vehiculo[]
  ordenes: Orden[]
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  recibido:   { label: 'Recibido',   className: 'bg-blue-50 text-[#2563EB] ring-blue-100' },
  en_proceso: { label: 'En proceso', className: 'bg-amber-50 text-amber-600 ring-amber-100' },
  listo:      { label: 'Listo',      className: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  entregado:  { label: 'Entregado',  className: 'bg-zinc-100 text-zinc-500 ring-zinc-200' },
}

function StatusBadge({ estado }: { estado: string }) {
  const s = STATUS_STYLES[estado] ?? STATUS_STYLES['recibido']
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}>
      {s.label}
    </span>
  )
}

export default function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const [query,        setQuery]        = useState('')
  const [expandido,    setExpandido]    = useState<string | null>(null)
  const [expandedOrden, setExpandedOrden] = useState<string | null>(null)

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(query.toLowerCase()) ||
    c.telefono?.includes(query) ||
    c.email?.toLowerCase().includes(query.toLowerCase()) ||
    c.cliente_id?.toLowerCase().includes(query.toLowerCase())
  )

  const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`

  function toggleOrden(ordenId: string) {
    setExpandedOrden(prev => prev === ordenId ? null : ordenId)
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{clientes.length} clientes registrados</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono, email o ID..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
        />
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 px-6 py-12 text-center text-sm text-zinc-400">
            No se encontraron clientes
          </div>
        )}

        {filtrados.map(c => {
          const abierto      = expandido === c.id
          const totalGastado = c.ordenes.reduce((s, o) => s + (o.total_cobrado ?? 0), 0)
          const ultimaVisita = c.ordenes[0]?.created_at
            ? new Date(c.ordenes[0].created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border border-zinc-100 overflow-hidden border-l-4 transition-colors ${
                abierto ? 'border-l-[#2563EB]' : 'border-l-transparent hover:border-l-[#2563EB]'
              }`}
            >
              {/* Header del cliente */}
              <button
                onClick={() => {
                  setExpandido(abierto ? null : c.id)
                  setExpandedOrden(null)
                }}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors text-left ${
                  abierto ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-[#2563EB]">
                      {c.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{c.nombre}</p>
                    <p className="text-xs text-zinc-400">{c.cliente_id} · {c.telefono ?? '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-zinc-400">Última visita</p>
                    <p className="text-sm font-medium text-zinc-700">{ultimaVisita}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-zinc-400">Total gastado</p>
                    <p className="text-sm font-semibold text-zinc-900">{fmt(totalGastado)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Órdenes</p>
                    <p className="text-sm font-semibold text-zinc-900">{c.ordenes.length}</p>
                  </div>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors shrink-0 ${abierto ? 'bg-[#2563EB]' : 'bg-zinc-100'}`}>
                    {abierto
                      ? <ChevronUp className="w-3.5 h-3.5 text-white" />
                      : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    }
                  </div>
                </div>
              </button>

              {/* Detalle expandido */}
              {abierto && (
                <div className="border-t border-zinc-100 px-6 py-5 flex flex-col gap-6">

                  {/* Info de contacto */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-zinc-400 mb-0.5">Teléfono</p>
                      <p className="font-medium text-zinc-800">{c.telefono ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-0.5">Email</p>
                      <p className="font-medium text-zinc-800">{c.email ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-0.5">Cliente desde</p>
                      <p className="font-medium text-zinc-800">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Vehículos */}
                  {c.vehiculos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" /> Vehículos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.vehiculos.map(v => (
                          <span key={v.id} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700">
                            {v.marca} {v.modelo} {v.anio}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historial de órdenes con acordeón */}
                  {c.ordenes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5" /> Historial de órdenes
                      </p>
                      <div className="rounded-xl border border-zinc-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-zinc-50 text-left">
                              <th className="w-10 px-3 py-2.5"></th>
                              <th className="px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">#Orden</th>
                              <th className="px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">Fecha</th>
                              <th className="px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">Estado</th>
                              <th className="px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.ordenes.map(o => {
                              const ordenAbierta = expandedOrden === o.id
                              const servicios    = o.orden_servicios ?? []
                              return (
                                <React.Fragment key={o.id}>
                                  <tr
                                    onClick={() => toggleOrden(o.id)}
                                    className={`cursor-pointer transition-colors border-t border-zinc-50 ${ordenAbierta ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'}`}
                                  >
                                    <td className={`pl-3 pr-2 py-3 border-l-4 transition-colors ${ordenAbierta ? 'border-l-[#2563EB]' : 'border-l-transparent'}`}>
                                      <div className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${ordenAbierta ? 'bg-[#2563EB]' : 'bg-zinc-100'}`}>
                                        {ordenAbierta
                                          ? <ChevronDown className="w-3 h-3 text-white" />
                                          : <ChevronRight className="w-3 h-3 text-zinc-500" />
                                        }
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{o.id.slice(0, 8).toUpperCase()}</td>
                                    <td className="px-4 py-3 text-zinc-600">
                                      {o.created_at ? new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge estado={o.estado ?? 'recibido'} /></td>
                                    <td className="px-4 py-3 font-semibold text-zinc-800 text-right">{fmt(o.total_cobrado ?? 0)}</td>
                                  </tr>

                                  {/* Acordeón de servicios de la orden */}
                                  {ordenAbierta && (
                                    <tr className="bg-[#EFF6FF]">
                                      <td colSpan={5} className="border-l-4 border-l-[#2563EB] px-4 pb-3 pt-1">
                                        <div className="ml-6 border border-blue-100 rounded-lg overflow-hidden bg-white">
                                          <div className="px-3 py-2 border-b border-blue-50 bg-blue-50">
                                            <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">Servicios realizados</p>
                                          </div>
                                          <div className="divide-y divide-zinc-50">
                                            {servicios.length === 0 ? (
                                              <p className="px-3 py-2.5 text-xs text-zinc-400">Sin servicios registrados</p>
                                            ) : (
                                              servicios.map((s, i) => (
                                                <div key={s.id ?? i} className="flex items-center justify-between px-3 py-2">
                                                  <span className="text-xs text-zinc-700">{s.nombre_servicio ?? '—'}</span>
                                                  <span className="text-xs font-semibold text-zinc-800">{fmt(s.precio_cobrado ?? 0)}</span>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
                                    onClick={() => toggleOrden(o.id)}
                                    className={`cursor-pointer transition-colors border-t border-zinc-50 ${ordenAbierta ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'}`}
                                  >
                                    <td className={`pl-3 pr-2 py-3 border-l-4 transition-colors ${ordenAbierta ? 'border-l-[#2563EB]' : 'border-l-transparent'}`}>
                                      <div className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${ordenAbierta ? 'bg-[#2563EB]' : 'bg-zinc-100'}`}>
                                        {ordenAbierta
                                          ? <ChevronDown className="w-3 h-3 text-white" />
                                          : <ChevronRight className="w-3 h-3 text-zinc-500" />
                                        }
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{o.id.slice(0, 8).toUpperCase()}</td>
                                    <td className="px-4 py-3 text-zinc-600">
                                      {o.created_at ? new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge estado={o.estado ?? 'recibido'} /></td>
                                    <td className="px-4 py-3 font-semibold text-zinc-800 text-right">{fmt(o.total_cobrado ?? 0)}</td>
                                  </tr>
                                  {ordenAbierta && (
                                    <tr className="bg-[#EFF6FF]">
                                      <td colSpan={5} className="border-l-4 border-l-[#2563EB] px-4 pb-3 pt-1">
                                        <div className="ml-6 border border-blue-100 rounded-lg overflow-hidden bg-white">
                                          <div className="px-3 py-2 border-b border-blue-50 bg-blue-50">
                                            <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">Servicios realizados</p>
                                          </div>
                                          <div className="divide-y divide-zinc-50">
                                            {servicios.length === 0 ? (
                                              <p className="px-3 py-2.5 text-xs text-zinc-400">Sin servicios registrados</p>
                                            ) : (
                                              servicios.map((s, i) => (
                                                <div key={s.id ?? i} className="flex items-center justify-between px-3 py-2">
                                                  <span className="text-xs text-zinc-700">{s.nombre_servicio ?? '—'}</span>
                                                  <span className="text-xs font-semibold text-zinc-800">{fmt(s.precio_cobrado ?? 0)}</span>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
