'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Plus, Pencil, Check, X, ToggleLeft, ToggleRight, Trash2, AlertTriangle } from 'lucide-react'
import FinanzasNav from '../FinanzasNav'

type Trabajador = {
  id: string
  nombre: string
  especialidad: string | null
  salario_semanal: number
  comision_responsable_pct: number
  comision_ayudante_pct: number
  activo: boolean
}

const EMPTY = {
  nombre: '',
  especialidad: '',
  salario_semanal: '',
  comision_responsable_pct: '',
  comision_ayudante_pct: '',
}

const INPUT = 'border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-full'
const fmt   = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

function PrefixInput({ prefix, suffix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">{prefix}</span>}
      <input
        {...props}
        className={`border border-zinc-200 rounded-lg py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-full ${prefix ? 'pl-6' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">{suffix}</span>}
    </div>
  )
}

export default function TrabajadoresPage() {
  const supabase = createClient()
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tenantId,     setTenantId]     = useState('')
  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState<string | null>(null)
  const [form,         setForm]         = useState({ ...EMPTY })
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  // Estado para eliminar — guarda {id, orderCount} mientras confirma
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string; orderCount: number } | null>(null)
  const [checkingOrders, setCheckingOrders] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: uData } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .single()
      if (uData?.tenant_id) setTenantId(uData.tenant_id)
      await fetchTrabajadores()
    }
    init()
  }, [])

  async function fetchTrabajadores() {
    setLoading(true)
    const { data } = await (supabase as any).from('trabajadores').select('*').order('nombre')
    setTrabajadores(data ?? [])
    setLoading(false)
  }

  function startAdd() {
    setEditId(null)
    setForm({ ...EMPTY })
    setError('')
    setShowForm(true)
  }

  function startEdit(t: Trabajador) {
    setEditId(t.id)
    setForm({
      nombre:                   t.nombre,
      especialidad:             t.especialidad ?? '',
      salario_semanal:          String(t.salario_semanal),
      comision_responsable_pct: String(t.comision_responsable_pct),
      comision_ayudante_pct:    String(t.comision_ayudante_pct),
    })
    setError('')
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError('') }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    if (!tenantId)           { setError('Error: no se pudo obtener el taller.'); return }
    setSaving(true); setError('')

    const payload = {
      nombre:                   form.nombre.trim(),
      especialidad:             form.especialidad?.trim() || null,
      salario_semanal:          Number(form.salario_semanal) || 0,
      comision_responsable_pct: Number(form.comision_responsable_pct) || 0,
      comision_ayudante_pct:    Number(form.comision_ayudante_pct) || 0,
    }

    const { error: dbError } = editId
      ? await (supabase as any).from('trabajadores').update(payload).eq('id', editId)
      : await (supabase as any).from('trabajadores').insert({ ...payload, tenant_id: tenantId, activo: true })

    if (dbError) {
      setError('Error al guardar. Intenta de nuevo.')
      setSaving(false)
      return
    }

    await fetchTrabajadores()
    cancelForm()
    setSaving(false)
  }

  async function toggleActivo(t: Trabajador) {
    await (supabase as any).from('trabajadores').update({ activo: !t.activo }).eq('id', t.id)
    setTrabajadores(prev => prev.map(w => w.id === t.id ? { ...w, activo: !w.activo } : w))
  }

  async function iniciarEliminar(t: Trabajador) {
    setCheckingOrders(true)
    const { count } = await (supabase as any)
      .from('ordenes')
      .select('id', { count: 'exact', head: true })
      .or(`responsable_id.eq.${t.id},ayudante_id.eq.${t.id}`)
    setDeleteTarget({ id: t.id, nombre: t.nombre, orderCount: count ?? 0 })
    setCheckingOrders(false)
  }

  async function confirmarEliminar() {
    if (!deleteTarget || deleteTarget.orderCount > 0) return
    await (supabase as any).from('trabajadores').delete().eq('id', deleteTarget.id)
    setTrabajadores(prev => prev.filter(w => w.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const activos   = trabajadores.filter(t => t.activo)
  const inactivos = trabajadores.filter(t => !t.activo)

  return (
    <div className="max-w-5xl">
      <FinanzasNav />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Trabajadores</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{activos.length} activos · configura salarios y comisiones</p>
        </div>
        <button onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1649C8] hover:bg-[#1340B0] text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {/* Modal de eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            {deleteTarget.orderCount > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">No se puede eliminar</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      <strong>{deleteTarget.nombre}</strong> tiene {deleteTarget.orderCount} {deleteTarget.orderCount === 1 ? 'orden registrada' : 'órdenes registradas'}.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 mb-5">
                  Eliminar un mecánico con órdenes borra su historial de comisiones y trabajo. La opción correcta es <strong>desactivarlo</strong> — deja de aparecer en nuevas órdenes pero su historial queda intacto.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { const t = trabajadores.find(w => w.id === deleteTarget.id); if (t) toggleActivo(t); setDeleteTarget(null) }}
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                    Desactivar
                  </button>
                  <button onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Eliminar trabajador</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">Esta acción no se puede deshacer.</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 mb-5">
                  ¿Eliminar a <strong>{deleteTarget.nombre}</strong> permanentemente? No tiene órdenes registradas, por lo que no hay historial que preservar.
                </p>
                <div className="flex gap-2">
                  <button onClick={confirmarEliminar}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    Eliminar permanentemente
                  </button>
                  <button onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-800 mb-4">{editId ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Nombre *</label>
              <input className={INPUT} value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Carlos Ramírez" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Especialidad</label>
              <input className={INPUT} value={form.especialidad ?? ''}
                onChange={e => setForm(p => ({ ...p, especialidad: e.target.value }))}
                placeholder="Motor, Clima, Frenos…" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Salario semanal</label>
              <PrefixInput prefix="$" type="number" min="0" value={form.salario_semanal}
                onChange={e => setForm(p => ({ ...p, salario_semanal: e.target.value }))}
                placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Comisión responsable</label>
              <PrefixInput suffix="%" type="number" min="0" max="100" step="0.5" value={form.comision_responsable_pct}
                onChange={e => setForm(p => ({ ...p, comision_responsable_pct: e.target.value }))}
                placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Comisión ayudante</label>
              <PrefixInput suffix="%" type="number" min="0" max="100" step="0.5" value={form.comision_ayudante_pct}
                onChange={e => setForm(p => ({ ...p, comision_ayudante_pct: e.target.value }))}
                placeholder="0" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={guardar} disabled={saving}
              className="px-4 py-2 bg-[#1649C8] hover:bg-[#1340B0] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Guardando…' : <><Check className="w-4 h-4 inline mr-1" />Guardar</>}
            </button>
            <button onClick={cancelForm}
              className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              <X className="w-4 h-4 inline mr-1" />Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-zinc-200 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Activos */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Activos</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nombre</th>
                  <th className="hidden sm:table-cell px-5 py-2.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Especialidad</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Salario / sem</th>
                  <th className="hidden sm:table-cell px-5 py-2.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">% Resp.</th>
                  <th className="hidden sm:table-cell px-5 py-2.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">% Ayud.</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {activos.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">Sin trabajadores activos. Agrega el primero.</td></tr>
                )}
                {activos.map(t => (
                  <tr key={t.id} className="hover:bg-[#EFF6FF]">
                    <td className="px-5 py-3.5 font-medium text-zinc-900">{t.nombre}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-zinc-500">{t.especialidad ?? <span className="text-zinc-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-zinc-800">{fmt(t.salario_semanal)}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-right text-zinc-600">{t.comision_responsable_pct}%</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-right text-zinc-600">{t.comision_ayudante_pct}%</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(t)} title="Editar"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleActivo(t)} title="Desactivar"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-emerald-600 hover:text-emerald-700 transition-colors">
                          <ToggleRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => iniciarEliminar(t)} title="Eliminar" disabled={checkingOrders}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inactivos — historial preservado</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-zinc-50">
                  {inactivos.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 text-zinc-400 line-through">{t.nombre}</td>
                      <td className="hidden sm:table-cell px-5 py-3 text-zinc-300">{t.especialidad ?? '—'}</td>
                      <td className="hidden sm:table-cell px-5 py-3 text-right text-zinc-300">{fmt(t.salario_semanal)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleActivo(t)} title="Reactivar"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-emerald-600 transition-colors">
                            <ToggleLeft className="w-4 h-4" />
                          </button>
                          <button onClick={() => iniciarEliminar(t)} title="Eliminar" disabled={checkingOrders}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-40">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
