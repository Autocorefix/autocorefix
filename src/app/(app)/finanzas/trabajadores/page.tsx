'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Plus, Pencil, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
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

const EMPTY: Omit<Trabajador, 'id' | 'activo'> = {
  nombre: '',
  especialidad: '',
  salario_semanal: 0,
  comision_responsable_pct: 0,
  comision_ayudante_pct: 0,
}

const INPUT = 'border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-full'
const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

export default function TrabajadoresPage() {
  const supabase = createClient()
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState<string | null>(null)
  const [form, setForm]                 = useState({ ...EMPTY })
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => { fetchTrabajadores() }, [])

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
      nombre: t.nombre,
      especialidad: t.especialidad ?? '',
      salario_semanal: t.salario_semanal,
      comision_responsable_pct: t.comision_responsable_pct,
      comision_ayudante_pct: t.comision_ayudante_pct,
    })
    setError('')
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError('') }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    setSaving(true); setError('')
    const payload = {
      nombre: form.nombre.trim(),
      especialidad: form.especialidad?.trim() || null,
      salario_semanal: Number(form.salario_semanal) || 0,
      comision_responsable_pct: Number(form.comision_responsable_pct) || 0,
      comision_ayudante_pct: Number(form.comision_ayudante_pct) || 0,
    }
    if (editId) {
      await (supabase as any).from('trabajadores').update(payload).eq('id', editId)
    } else {
      await (supabase as any).from('trabajadores').insert({ ...payload, activo: true })
    }
    await fetchTrabajadores()
    cancelForm()
    setSaving(false)
  }

  async function toggleActivo(t: Trabajador) {
    await (supabase as any).from('trabajadores').update({ activo: !t.activo }).eq('id', t.id)
    setTrabajadores(prev => prev.map(w => w.id === t.id ? { ...w, activo: !w.activo } : w))
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

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-800 mb-4">{editId ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Nombre *</label>
              <input className={INPUT} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Carlos Ramírez" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Especialidad</label>
              <input className={INPUT} value={form.especialidad ?? ''} onChange={e => setForm(p => ({ ...p, especialidad: e.target.value }))} placeholder="Motor, Clima, Frenos…" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Salario semanal ($)</label>
              <input className={INPUT} type="number" min="0" value={form.salario_semanal} onChange={e => setForm(p => ({ ...p, salario_semanal: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Comisión responsable (%)</label>
              <input className={INPUT} type="number" min="0" max="100" step="0.5" value={form.comision_responsable_pct} onChange={e => setForm(p => ({ ...p, comision_responsable_pct: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Comisión ayudante (%)</label>
              <input className={INPUT} type="number" min="0" max="100" step="0.5" value={form.comision_ayudante_pct} onChange={e => setForm(p => ({ ...p, comision_ayudante_pct: Number(e.target.value) }))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={guardar} disabled={saving}
              className="px-4 py-2 bg-[#1649C8] hover:bg-[#1340B0] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Guardando…' : <><Check className="w-4 h-4 inline mr-1" />Guardar</>}
            </button>
            <button onClick={cancelForm} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              <X className="w-4 h-4 inline mr-1" />Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-2 border-zinc-200 border-t-[#2563EB] rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Especialidad</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Salario/sem</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">% Resp.</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">% Ayud.</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
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
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggleActivo(t)} title="Desactivar" className="p-1.5 rounded-lg hover:bg-zinc-100 text-emerald-600 transition-colors"><ToggleRight className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inactivos.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <p className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 border-b border-zinc-100">Inactivos</p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-zinc-50">
                  {inactivos.map(t => (
                    <tr key={t.id} className="opacity-50 hover:opacity-80">
                      <td className="px-5 py-3 text-zinc-500 line-through">{t.nombre}</td>
                      <td className="hidden sm:table-cell px-5 py-3 text-zinc-400">{t.especialidad ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => toggleActivo(t)} title="Activar" className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"><ToggleLeft className="w-4 h-4" /></button>
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
