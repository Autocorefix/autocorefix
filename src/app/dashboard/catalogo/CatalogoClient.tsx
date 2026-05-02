'use client'

import { useState } from 'react'
import { Plus, X, Pencil, Trash2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import type { Tables } from '@/types/database.types'

export type Categoria = Tables<'categorias'>
export type Servicio = Tables<'catalogo_servicios'> & {
  categorias: Pick<Categoria, 'id' | 'nombre' | 'is_system_default' | 'orden'>
}

const EMPTY_SVC = { categoria_id: '', nombre: '', precio: '' }
const EMPTY_CAT = { nombre: '' }

export default function CatalogoClient({
  servicios: inicial,
  categorias: inicialCats,
}: {
  servicios: Servicio[]
  categorias: Categoria[]
}) {
  const supabase = createClient()
  const [servicios, setServicios] = useState(inicial)
  const [categorias, setCategorias] = useState(inicialCats)

  const [modal, setModal] = useState<'none' | 'svc-create' | 'svc-edit' | 'cat-create'>('none')
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [formSvc, setFormSvc] = useState(EMPTY_SVC)
  const [formCat, setFormCat] = useState(EMPTY_CAT)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null)

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)
  const serviciosOrdenados = [...servicios].sort((a, b) => {
    if (a.categorias.orden !== b.categorias.orden) return a.categorias.orden - b.categorias.orden
    return a.nombre.localeCompare(b.nombre, 'es')
  })

  function openCreateSvc() {
    setFormSvc({ ...EMPTY_SVC, categoria_id: categoriasOrdenadas[0]?.id ?? '' })
    setEditando(null)
    setError('')
    setModal('svc-create')
  }

  function openEditSvc(s: Servicio) {
    setFormSvc({ categoria_id: s.categoria_id, nombre: s.nombre, precio: String(s.precio_base) })
    setEditando(s)
    setError('')
    setModal('svc-edit')
  }

  function openCreateCat() {
    setFormCat(EMPTY_CAT)
    setError('')
    setModal('cat-create')
  }

  function closeModal() { setModal('none'); setError('') }

  async function handleSvcSubmit(e: React.FormEvent) {
    e.preventDefault()
    const precio = Number(formSvc.precio)
    if (!formSvc.nombre.trim()) { setError('El nombre es requerido.'); return }
    if (!formSvc.categoria_id) { setError('Selecciona una categoría.'); return }
    if (!precio || precio <= 0) { setError('Ingresa un precio válido.'); return }
    setLoading(true)

    if (editando) {
      const { data, error: err } = await supabase
        .from('catalogo_servicios')
        .update({ categoria_id: formSvc.categoria_id, nombre: formSvc.nombre.trim(), precio_base: precio })
        .eq('id', editando.id)
        .select('*, categorias(id, nombre, is_system_default, orden)')
        .single()

      if (err) { setError('Error al guardar.'); setLoading(false); return }
      setServicios(prev => prev.map(s => s.id === editando.id ? data as Servicio : s))
    } else {
      const { data: usuario } = await supabase.from('usuarios').select('tenant_id').single()
      const { data, error: err } = await supabase
        .from('catalogo_servicios')
        .insert({ categoria_id: formSvc.categoria_id, nombre: formSvc.nombre.trim(), precio_base: precio, activo: true, tenant_id: usuario?.tenant_id })
        .select('*, categorias(id, nombre, is_system_default, orden)')
        .single()

      if (err) { setError('Error al guardar.'); setLoading(false); return }
      setServicios(prev => [...prev, data as Servicio])
    }

    setLoading(false)
    closeModal()
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formCat.nombre.trim()) { setError('El nombre es requerido.'); return }
    setLoading(true)

    const { data: usuario } = await supabase.from('usuarios').select('tenant_id').single()
    const maxOrden = Math.max(0, ...categorias.map(c => c.orden))

    const { data, error: err } = await supabase
      .from('categorias')
      .insert({ nombre: formCat.nombre.trim(), tenant_id: usuario?.tenant_id, is_system_default: false, orden: maxOrden + 1, activo: true })
      .select()
      .single()

    if (err) { setError('Error al crear categoría.'); setLoading(false); return }
    setCategorias(prev => [...prev, data])
    setLoading(false)
    closeModal()
  }

  async function toggleActivo(s: Servicio) {
    const { data } = await supabase
      .from('catalogo_servicios')
      .update({ activo: !s.activo })
      .eq('id', s.id)
      .select('*, categorias(id, nombre, is_system_default, orden)')
      .single()

    if (data) setServicios(prev => prev.map(x => x.id === s.id ? data as Servicio : x))
  }

  async function confirmDeleteSvc(id: string) {
    const { count } = await supabase
      .from('orden_servicios')
      .select('*', { count: 'exact', head: true })
      .eq('servicio_id', id)

    if (count && count > 0) {
      setError(`Este servicio tiene ${count} orden(es) registrada(s). Solo puedes desactivarlo.`)
      setDeletingId(null)
      return
    }

    await supabase.from('catalogo_servicios').delete().eq('id', id)
    setServicios(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  async function confirmDeleteCat(id: string) {
    const { count } = await supabase
      .from('catalogo_servicios')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', id)

    if (count && count > 0) {
      setError(`Esta categoría tiene ${count} servicio(s). Elimina o reasigna los servicios primero.`)
      setDeletingCatId(null)
      return
    }

    await supabase.from('categorias').delete().eq('id', id)
    setCategorias(prev => prev.filter(c => c.id !== id))
    setDeletingCatId(null)
  }

  return (
    <div className="max-w-6xl space-y-10">

      {/* Error global (fuera de modal) */}
      {error && modal === 'none' && (
        <div className="flex items-center justify-between text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── SERVICIOS ── */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Catálogo de Servicios</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{servicios.length} servicios registrados</p>
          </div>
          <button
            onClick={openCreateSvc}
            className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Agregar servicio
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 text-left border-b border-zinc-100">
                  <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Categoría</th>
                  <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Nombre del servicio</th>
                  <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Precio base</th>
                  <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-center">Estado</th>
                  <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {serviciosOrdenados.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#2563EB] ring-1 ring-inset ring-blue-100">
                        {s.categorias.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-800">{s.nombre}</td>
                    <td className="px-6 py-4 text-right font-semibold text-zinc-800">
                      ${s.precio_base.toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleActivo(s)}>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset cursor-pointer ${
                          s.activo
                            ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                            : 'bg-zinc-100 text-zinc-400 ring-zinc-200'
                        }`}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {deletingId === s.id ? (
                        <span className="inline-flex items-center gap-2 text-xs">
                          <span className="text-zinc-400">¿Eliminar?</span>
                          <button onClick={() => confirmDeleteSvc(s.id)} className="text-red-500 font-semibold hover:underline">Sí</button>
                          <button onClick={() => setDeletingId(null)} className="text-zinc-400 font-medium hover:underline">No</button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-3">
                          <button onClick={() => openEditSvc(s)} className="text-zinc-400 hover:text-[#2563EB] transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeletingId(s.id); setError('') }} className="text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-400">
                      No hay servicios registrados. Agrega el primero.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── CATEGORÍAS ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Categorías</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Las categorías del sistema <Lock className="inline w-3 h-3 mb-0.5" /> no se pueden eliminar
            </p>
          </div>
          <button
            onClick={openCreateCat}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nueva categoría
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoriasOrdenadas.map(cat => (
            <div
              key={cat.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                cat.is_system_default ? 'border-zinc-100 bg-zinc-50' : 'border-zinc-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {cat.is_system_default && <Lock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />}
                <span className="text-sm font-medium text-zinc-800 truncate">{cat.nombre}</span>
              </div>
              {!cat.is_system_default && (
                deletingCatId === cat.id ? (
                  <span className="inline-flex items-center gap-1.5 text-xs ml-2 shrink-0">
                    <button onClick={() => confirmDeleteCat(cat.id)} className="text-red-500 font-semibold">Sí</button>
                    <span className="text-zinc-300">·</span>
                    <button onClick={() => setDeletingCatId(null)} className="text-zinc-400">No</button>
                  </span>
                ) : (
                  <button
                    onClick={() => { setDeletingCatId(cat.id); setError('') }}
                    className="ml-2 shrink-0 text-zinc-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL ── */}
      {modal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-zinc-900">
                {modal === 'svc-create' && 'Agregar servicio'}
                {modal === 'svc-edit' && 'Editar servicio'}
                {modal === 'cat-create' && 'Nueva categoría'}
              </h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modal === 'cat-create' ? (
              <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Nombre de la categoría</label>
                  <input
                    type="text"
                    value={formCat.nombre}
                    onChange={e => setFormCat({ nombre: e.target.value })}
                    placeholder="Ej. Revisión de suspensión"
                    autoFocus
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSvcSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Categoría</label>
                  <select
                    value={formSvc.categoria_id}
                    onChange={e => setFormSvc(f => ({ ...f, categoria_id: e.target.value }))}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  >
                    {categoriasOrdenadas.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Nombre del servicio</label>
                  <input
                    type="text"
                    value={formSvc.nombre}
                    onChange={e => setFormSvc(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej. Cambio de aceite sintético 5W-30"
                    autoFocus
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Precio base</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                    <input
                      type="number"
                      min="1"
                      value={formSvc.precio}
                      onChange={e => setFormSvc(f => ({ ...f, precio: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-lg border border-zinc-300 pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
