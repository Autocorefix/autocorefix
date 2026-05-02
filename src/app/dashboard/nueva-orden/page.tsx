'use client'

import { useState } from 'react'
import { Search, UserPlus, X, Trash2 } from 'lucide-react'

type Cliente = {
  id: number
  nombre: string
  telefono: string
  email: string
}

type OrderItem = {
  id: number
  nombre: string
  precioBase: number
  precioCobrado: number
}

type Servicio = {
  id: number
  nombre: string
  precio: number
}

type CategoriaData = {
  nombre: string
  servicios: Servicio[]
}

const MOCK_CLIENTES: Cliente[] = [
  { id: 1, nombre: 'Carlos Mendoza',  telefono: '6641234567', email: 'carlos@mail.com' },
  { id: 2, nombre: 'María García',    telefono: '6649876543', email: 'maria@mail.com' },
  { id: 3, nombre: 'Roberto Sánchez', telefono: '6645551234', email: 'roberto@mail.com' },
  { id: 4, nombre: 'Ana López',       telefono: '6643214321', email: 'ana@mail.com' },
  { id: 5, nombre: 'Juan Pérez',      telefono: '6647654321', email: 'juan@mail.com' },
]

const CATEGORIAS: CategoriaData[] = [
  {
    nombre: 'Cambio de Aceite',
    servicios: [
      { id: 1, nombre: 'Cambio de aceite sintético',     precio: 850 },
      { id: 2, nombre: 'Cambio de aceite semisintético', precio: 650 },
      { id: 3, nombre: 'Cambio de aceite mineral',       precio: 450 },
    ],
  },
  {
    nombre: 'Suspensión y Balanceo',
    servicios: [
      { id: 4, nombre: 'Balanceo de llantas',      precio: 400 },
      { id: 5, nombre: 'Alineación computarizada', precio: 600 },
    ],
  },
  {
    nombre: 'Motor y Scanner',
    servicios: [
      { id: 6, nombre: 'Scanner y diagnóstico',    precio: 450  },
      { id: 7, nombre: 'Revisión general de motor', precio: 1200 },
    ],
  },
  {
    nombre: 'Clima',
    servicios: [
      { id: 8, nombre: 'Carga de gas refrigerante',    precio: 800 },
      { id: 9, nombre: 'Revisión de sistema de clima', precio: 500 },
    ],
  },
  {
    nombre: 'Frenos y Balatas',
    servicios: [
      { id: 10, nombre: 'Cambio de balatas delanteras', precio: 950 },
      { id: 11, nombre: 'Rectificado de discos',        precio: 700 },
      { id: 12, nombre: 'Revisión general de frenos',   precio: 350 },
    ],
  },
  {
    nombre: 'Dirección',
    servicios: [
      { id: 13, nombre: 'Corrección de dirección',           precio: 550 },
      { id: 14, nombre: 'Cambio de terminales de dirección', precio: 800 },
    ],
  },
  {
    nombre: 'Tracción General',
    servicios: [
      { id: 15, nombre: 'Revisión de transmisión',      precio: 600 },
      { id: 16, nombre: 'Cambio de aceite diferencial', precio: 500 },
    ],
  },
]

const EMPTY_NUEVO_CLIENTE = { nombre: '', telefono: '', email: '' }
const EMPTY_VEHICULO = { placa: '', marca: '', modelo: '', anio: '' }

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent'

export default function NuevaOrdenPage() {
  const [query, setQuery]                       = useState('')
  const [showDropdown, setShowDropdown]         = useState(false)
  const [cliente, setCliente]                   = useState<Cliente | null>(null)
  const [modoNuevo, setModoNuevo]               = useState(false)
  const [nuevoCliente, setNuevoCliente]         = useState(EMPTY_NUEVO_CLIENTE)
  const [vehiculo, setVehiculo]                 = useState(EMPTY_VEHICULO)
  const [categoriaActiva, setCategoriaActiva]   = useState<string | null>(null)
  const [orderItems, setOrderItems]             = useState<OrderItem[]>([])

  const clientesFiltrados =
    query.length >= 2
      ? MOCK_CLIENTES.filter(
          (c) =>
            c.nombre.toLowerCase().includes(query.toLowerCase()) ||
            c.telefono.includes(query)
        )
      : []

  function seleccionarCliente(c: Cliente) {
    setCliente(c)
    setQuery('')
    setShowDropdown(false)
    setModoNuevo(false)
  }

  function limpiarCliente() {
    setCliente(null)
    setQuery('')
    setModoNuevo(false)
    setNuevoCliente(EMPTY_NUEVO_CLIENTE)
  }

  function toggleCategoria(nombre: string) {
    setCategoriaActiva((prev) => (prev === nombre ? null : nombre))
  }

  function agregarServicio(s: Servicio) {
    if (orderItems.some((i) => i.id === s.id)) return
    setOrderItems((prev) => [
      ...prev,
      { id: s.id, nombre: s.nombre, precioBase: s.precio, precioCobrado: s.precio },
    ])
  }

  function quitarServicio(id: number) {
    setOrderItems((prev) => prev.filter((i) => i.id !== id))
  }

  function actualizarPrecio(id: number, valor: string) {
    setOrderItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, precioCobrado: Number(valor) || 0 } : i))
    )
  }

  const totalBase    = orderItems.reduce((s, i) => s + i.precioBase, 0)
  const totalCobrado = orderItems.reduce((s, i) => s + i.precioCobrado, 0)
  const descuento    = totalBase - totalCobrado
  const pctDescuento = totalBase > 0 ? (descuento / totalBase) * 100 : 0

  const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Nueva Orden</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Registra cliente, vehículo y servicios</p>
      </div>

      <div className="grid grid-cols-5 gap-6 items-start">
        {/* ─── LEFT COLUMN ─── */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Cliente */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Cliente</h2>

            {cliente && !modoNuevo ? (
              /* Selected client chip */
              <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{cliente.nombre}</p>
                  <p className="text-xs text-zinc-500">{cliente.telefono}</p>
                </div>
                <button onClick={limpiarCliente} className="text-zinc-400 hover:text-zinc-600 transition-colors ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : !modoNuevo ? (
              /* Search */
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Buscar por nombre o teléfono..."
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent`}
                  />
                  {showDropdown && clientesFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
                      {clientesFiltrados.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={() => seleccionarCliente(c)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                        >
                          <span className="font-medium text-zinc-900">{c.nombre}</span>
                          <span className="text-zinc-400 ml-2">{c.telefono}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setModoNuevo(true)}
                  className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrar nuevo cliente
                </button>
              </div>
            ) : (
              /* New client form */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo cliente</p>
                  <button
                    onClick={() => { setModoNuevo(false); setNuevoCliente(EMPTY_NUEVO_CLIENTE) }}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, telefono: e.target.value }))}
                  placeholder="Teléfono"
                  className={INPUT_CLASS}
                />
                <input
                  type="email"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email (opcional)"
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>

          {/* Vehículo */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Vehículo</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={vehiculo.placa}
                onChange={(e) => setVehiculo((p) => ({ ...p, placa: e.target.value.toUpperCase() }))}
                placeholder="Placa"
                className={INPUT_CLASS + ' uppercase'}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={vehiculo.marca}
                  onChange={(e) => setVehiculo((p) => ({ ...p, marca: e.target.value }))}
                  placeholder="Marca"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={vehiculo.modelo}
                  onChange={(e) => setVehiculo((p) => ({ ...p, modelo: e.target.value }))}
                  placeholder="Modelo"
                  className={INPUT_CLASS}
                />
              </div>
              <input
                type="number"
                value={vehiculo.anio}
                onChange={(e) => setVehiculo((p) => ({ ...p, anio: e.target.value }))}
                placeholder="Año"
                min="1990"
                max="2030"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="col-span-3 flex flex-col gap-5">

          {/* Services */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Servicios</h2>

            {/* Category buttons */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.nombre}
                  onClick={() => toggleCategoria(cat.nombre)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors border ${
                    categoriaActiva === cat.nombre
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Sub-services */}
            {categoriaActiva && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
                  {categoriaActiva}
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.find((c) => c.nombre === categoriaActiva)?.servicios.map((s) => {
                    const yaAgregado = orderItems.some((i) => i.id === s.id)
                    return (
                      <button
                        key={s.id}
                        onClick={() => agregarServicio(s)}
                        disabled={yaAgregado}
                        className={`rounded-lg px-3 py-2 text-sm transition-colors border ${
                          yaAgregado
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-blue-50 hover:text-[#2563EB] hover:border-blue-200'
                        }`}
                      >
                        {s.nombre}
                        <span className="ml-1.5 text-xs opacity-60">${s.precio.toLocaleString('es-MX')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Resumen de orden</h2>

            {orderItems.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">
                Selecciona servicios del panel de arriba
              </p>
            ) : (
              <>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_80px_96px_24px] gap-3 items-center text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 px-1">
                  <span>Servicio</span>
                  <span className="text-right">Base</span>
                  <span className="text-right">Cobrado</span>
                  <span />
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2.5 mb-5">
                  {orderItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_80px_96px_24px] gap-3 items-center">
                      <span className="text-sm text-zinc-800 font-medium leading-tight">{item.nombre}</span>
                      <span className="text-sm text-zinc-400 text-right">{fmt(item.precioBase)}</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={item.precioCobrado}
                          onChange={(e) => actualizarPrecio(item.id, e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 pl-5 pr-2 py-1.5 text-sm text-zinc-900 text-right focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => quitarServicio(item.id)}
                        className="flex justify-center text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-zinc-100 pt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Total base</span>
                    <span>{fmt(totalBase)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Descuento</span>
                    <span className={descuento > 0 ? 'text-emerald-600 font-medium' : ''}>
                      {fmt(descuento)}
                    </span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>% Descuento</span>
                      <span>{pctDescuento.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100 mt-1">
                    <span>Total cobrado</span>
                    <span className="text-[#2563EB]">{fmt(totalCobrado)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Save */}
          <button
            onClick={() => alert('Orden guardada (demo)')}
            className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Guardar Orden
          </button>
        </div>
      </div>
    </div>
  )
}
