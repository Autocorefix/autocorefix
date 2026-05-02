'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

type Servicio = {
  id: number
  categoria: string
  nombre: string
  precio: number
  activo: boolean
}

const CATEGORIAS = [
  'Cambio de Aceite',
  'Suspensión y Balanceo',
  'Reparación de Motor y Scanner',
  'Reparación de Clima',
  'Frenos y Balatas',
  'Dirección',
  'Tracción General',
]

const SERVICIOS_INICIALES: Servicio[] = [
  { id: 1,  categoria: 'Cambio de Aceite',                  nombre: 'Cambio de aceite sintético',        precio: 850,  activo: true },
  { id: 2,  categoria: 'Cambio de Aceite',                  nombre: 'Cambio de aceite semisintético',    precio: 650,  activo: true },
  { id: 3,  categoria: 'Cambio de Aceite',                  nombre: 'Cambio de aceite mineral',          precio: 450,  activo: true },
  { id: 4,  categoria: 'Suspensión y Balanceo',             nombre: 'Balanceo de llantas',               precio: 400,  activo: true },
  { id: 5,  categoria: 'Suspensión y Balanceo',             nombre: 'Alineación computarizada',          precio: 600,  activo: true },
  { id: 6,  categoria: 'Reparación de Motor y Scanner',     nombre: 'Scanner y diagnóstico',             precio: 450,  activo: true },
  { id: 7,  categoria: 'Reparación de Motor y Scanner',     nombre: 'Revisión general de motor',         precio: 1200, activo: true },
  { id: 8,  categoria: 'Reparación de Clima',               nombre: 'Carga de gas refrigerante',         precio: 800,  activo: true },
  { id: 9,  categoria: 'Reparación de Clima',               nombre: 'Revisión de sistema de clima',      precio: 500,  activo: false },
  { id: 10, categoria: 'Frenos y Balatas',                  nombre: 'Cambio de balatas delanteras',      precio: 950,  activo: true },
  { id: 11, categoria: 'Frenos y Balatas',                  nombre: 'Rectificado de discos',             precio: 700,  activo: true },
  { id: 12, categoria: 'Frenos y Balatas',                  nombre: 'Revisión general de frenos',        precio: 350,  activo: true },
  { id: 13, categoria: 'Dirección',                         nombre: 'Corrección de dirección',           precio: 550,  activo: true },
  { id: 14, categoria: 'Dirección',                         nombre: 'Cambio de terminales de dirección', precio: 800,  activo: false },
  { id: 15, categoria: 'Tracción General',                  nombre: 'Revisión de transmisión',           precio: 600,  activo: true },
  { id: 16, categoria: 'Tracción General',                  nombre: 'Cambio de aceite diferencial',      precio: 500,  activo: true },
]

const EMPTY_FORM = { categoria: CATEGORIAS[0], nombre: '', precio: '' }

export default function CatalogoPage() {
  const [servicios, setServicios] = useState<Servicio[]>(SERVICIOS_INICIALES)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  function openModal() {
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const precio = Number(form.precio)
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    if (!precio || precio <= 0) { setError('Ingresa un precio válido.'); return }

    setServicios(prev => [
      ...prev,
      { id: Date.now(), categoria: form.categoria, nombre: form.nombre.trim(), precio, activo: true },
    ])
    closeModal()
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Catálogo de Servicios</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{servicios.length} servicios registrados</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Agregar servicio
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left border-b border-zinc-100">
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Categoría</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Nombre del servicio</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Precio base</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {servicios.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-[#0EA5E9] ring-1 ring-inset ring-sky-100">
                      {s.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-800">{s.nombre}</td>
                  <td className="px-6 py-4 text-right font-semibold text-zinc-800">
                    ${s.precio.toLocaleString('es-MX')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      s.activo
                        ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                        : 'bg-zinc-100 text-zinc-400 ring-zinc-200'
                    }`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-zinc-900">Agregar servicio</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                >
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Nombre del servicio</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Cambio de aceite sintético"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Precio base</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                  <input
                    type="number"
                    min="1"
                    value={form.precio}
                    onChange={(e) => setForm(f => ({ ...f, precio: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-300 pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
