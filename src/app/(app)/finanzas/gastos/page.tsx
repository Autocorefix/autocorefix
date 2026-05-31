'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Plus, Trash2, ChevronDown, X } from 'lucide-react'
import FinanzasNav from '../FinanzasNav'

type Egreso = {
  id: string
  categoria: string
  descripcion: string | null
  monto: number
  fecha: string
}

// Categorías del sistema — universales, no editables
const SYSTEM_CATS = [
  { key: 'renta',          label: 'Renta / Arrendamiento' },
  { key: 'electricidad',   label: 'Electricidad' },
  { key: 'agua',           label: 'Agua' },
  { key: 'gas',            label: 'Gas' },
  { key: 'movil',          label: 'Teléfono móvil' },
  { key: 'tel_fijo',       label: 'Teléfono fijo' },
  { key: 'internet',       label: 'Internet' },
  { key: 'cable_tv',       label: 'Cable / TV' },
  { key: 'herramientas',   label: 'Herramientas' },
  { key: 'insumos',        label: 'Insumos de taller' },
  { key: 'imprevistos',    label: 'Imprevistos' },
]

const PRESETS = [
  { key: 'hoy',     label: 'Hoy' },
  { key: 'ayer',    label: 'Ayer' },
  { key: '7d',      label: 'Últimos 7 días' },
  { key: '14d',     label: 'Últimos 14 días' },
  { key: '30d',     label: 'Últimos 30 días' },
  { key: 'mes',     label: 'Este mes' },
  { key: 'mes_ant', label: 'Mes anterior' },
]

const INPUT   = 'border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-full'
const fmt     = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
const isoHoy  = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}` }

// Devuelve el label de una categoría (sistema o personalizada)
function catLabel(key: string): string {
  return SYSTEM_CATS.find(c => c.key === key)?.label ?? key
}

export default function GastosPage() {
  const supabase = createClient()

  // Egresos
  const [egresos,    setEgresos]    = useState<Egreso[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fechas
  const [desde,      setDesde]      = useState(isoHoy)
  const [hasta,      setHasta]      = useState(isoHoy)
  const [desdeLocal, setDesdeLocal] = useState(isoHoy)
  const [hastaLocal, setHastaLocal] = useState(isoHoy)
  const [openPicker, setOpenPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Formulario de gasto
  const [form, setForm] = useState({ categoria: 'renta', descripcion: '', monto: '', fecha: isoHoy() })

  // Categorías personalizadas del tenant
  const [tenantId,     setTenantId]     = useState<string>('')
  const [customCats,   setCustomCats]   = useState<string[]>([])
  const [newCatName,   setNewCatName]   = useState('')
  const [savingCat,    setSavingCat]    = useState(false)
  const [showCatInput, setShowCatInput] = useState(false)

  // Cerrar picker al hacer click fuera
  useEffect(() => {
    function h(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpenPicker(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Cargar tenant y sus categorías personalizadas
  useEffect(() => {
    async function fetchTenant() {
      const { data } = await supabase
        .from('usuarios')
        .select('tenant_id, tenants(categorias_egreso)')
        .single()
      if (data) {
        setTenantId(data.tenant_id ?? '')
        const cats = (data.tenants as any)?.categorias_egreso ?? []
        setCustomCats(cats)
      }
    }
    fetchTenant()
  }, [])

  const fetchEgresos = useCallback(async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('egresos')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
    setEgresos(data ?? [])
    setLoading(false)
  }, [desde, hasta])

  useEffect(() => { fetchEgresos() }, [fetchEgresos])

  // Date picker
  function aplicarFiltro(d: string, h: string) {
    setDesde(d); setDesdeLocal(d)
    setHasta(h); setHastaLocal(h)
    setOpenPicker(false)
  }

  function preset(tipo: string) {
    const n = new Date()
    const pad = (x: number) => String(x).padStart(2, '0')
    const iso = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`
    const shift = (days: number) => { const dt = new Date(n); dt.setDate(n.getDate() + days); return dt }
    const ranges: Record<string, [string, string]> = {
      hoy:     [iso(n), iso(n)],
      ayer:    [iso(shift(-1)), iso(shift(-1))],
      '7d':    [iso(shift(-6)), iso(n)],
      '14d':   [iso(shift(-13)), iso(n)],
      '30d':   [iso(shift(-29)), iso(n)],
      mes:     [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)],
      mes_ant: [iso(new Date(n.getFullYear(), n.getMonth()-1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))],
    }
    const [d, h] = ranges[tipo]
    aplicarFiltro(d, h)
  }

  const btnLabel = desde === hasta
    ? new Date(desde + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : `${new Date(desde+'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'short' })} – ${new Date(hasta+'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}`

  // Guardar gasto
  async function guardar() {
    if (!form.monto || Number(form.monto) <= 0) return
    setSaving(true)
    await (supabase as any).from('egresos').insert({
      categoria:   form.categoria,
      descripcion: form.descripcion.trim() || null,
      monto:       Number(form.monto),
      fecha:       form.fecha,
    })
    setForm({ categoria: 'renta', descripcion: '', monto: '', fecha: isoHoy() })
    setShowForm(false)
    await fetchEgresos()
    setSaving(false)
  }

  // Eliminar gasto
  async function eliminar(id: string) {
    await (supabase as any).from('egresos').delete().eq('id', id)
    setEgresos(p => p.filter(e => e.id !== id))
    setDeletingId(null)
  }

  // Agregar categoría personalizada
  async function agregarCategoria() {
    const nombre = newCatName.trim()
    if (!nombre) return
    const exists = SYSTEM_CATS.some(c => c.label.toLowerCase() === nombre.toLowerCase())
      || customCats.some(c => c.toLowerCase() === nombre.toLowerCase())
    if (exists) { setNewCatName(''); setShowCatInput(false); return }
    setSavingCat(true)
    const nuevas = [...customCats, nombre]
    await (supabase as any).rpc('update_categorias_egreso', { cats: nuevas })
    setCustomCats(nuevas)
    setNewCatName('')
    setShowCatInput(false)
    setSavingCat(false)
  }

  // Eliminar categoría personalizada
  async function eliminarCategoria(cat: string) {
    const nuevas = customCats.filter(c => c !== cat)
    await (supabase as any).rpc('update_categorias_egreso', { cats: nuevas })
    setCustomCats(nuevas)
  }

  // Totales y agrupación
  const total = egresos.reduce((s, e) => s + (e.monto ?? 0), 0)
  const porCategoria: Record<string, { label: string; total: number; items: Egreso[] }> = {}
  egresos.forEach(e => {
    if (!porCategoria[e.categoria]) {
      porCategoria[e.categoria] = { label: catLabel(e.categoria), total: 0, items: [] }
    }
    porCategoria[e.categoria].total += e.monto
    porCategoria[e.categoria].items.push(e)
  })

  return (
    <div className="max-w-4xl">
      <FinanzasNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Gastos operativos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{egresos.length} registros · {fmt(total)} total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date picker */}
          <div className="relative" ref={pickerRef}>
            <button onClick={() => setOpenPicker(p => !p)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors">
              <span>{btnLabel}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${openPicker ? 'rotate-180' : ''}`} />
            </button>
            {openPicker && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl flex flex-col sm:flex-row overflow-hidden sm:min-w-[400px]">
                <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-100 py-2 sm:min-w-[150px]">
                  {PRESETS.map(p => (
                    <button key={p.key} onClick={() => preset(p.key)}
                      className="text-left px-4 py-2 text-sm text-zinc-600 hover:bg-blue-50 hover:text-[#2563EB] transition-colors">{p.label}</button>
                  ))}
                </div>
                <div className="flex flex-col gap-3 p-4 flex-1">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Personalizado</p>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Desde</label>
                    <input type="date" value={desdeLocal} onChange={e => setDesdeLocal(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Hasta</label>
                    <input type="date" value={hastaLocal} onChange={e => setHastaLocal(e.target.value)} className={INPUT} />
                  </div>
                  <button onClick={() => aplicarFiltro(desdeLocal, hastaLocal)}
                    className="w-full px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">Aplicar</button>
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setShowForm(p => !p)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1649C8] hover:bg-[#1340B0] text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Agregar gasto
          </button>
        </div>
      </div>

      {/* Gestión de categorías personalizadas */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mis categorías</span>
          {!showCatInput && (
            <button onClick={() => setShowCatInput(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          )}
        </div>

        {/* Categorías del sistema — referencia */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SYSTEM_CATS.map(c => (
            <span key={c.key}
              className="px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-500 rounded-full">
              {c.label}
            </span>
          ))}
        </div>

        {/* Categorías personalizadas */}
        {customCats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-zinc-100">
            {customCats.map(cat => (
              <span key={cat}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-[#2563EB] rounded-full border border-blue-100">
                {cat}
                <button onClick={() => eliminarCategoria(cat)}
                  className="hover:text-red-500 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input para nueva categoría */}
        {showCatInput && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
            <input
              autoFocus
              className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              placeholder="Ej: ICA, ARBA, Seguro local…"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') agregarCategoria(); if (e.key === 'Escape') { setShowCatInput(false); setNewCatName('') } }}
            />
            <button onClick={agregarCategoria} disabled={!newCatName.trim() || savingCat}
              className="px-3 py-1.5 text-xs font-semibold bg-[#2563EB] text-white rounded-lg disabled:opacity-50 hover:bg-[#1d4ed8] transition-colors">
              {savingCat ? '…' : 'Agregar'}
            </button>
            <button onClick={() => { setShowCatInput(false); setNewCatName('') }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {customCats.length === 0 && !showCatInput && (
          <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-100">
            Sin categorías propias aún. Las del sistema aplican para todos los países — agrega las específicas de tu negocio o región.
          </p>
        )}
      </div>

      {/* Formulario de gasto */}
      {showForm && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-4">Nuevo gasto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Categoría</label>
              <select className={INPUT} value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                <optgroup label="Categorías del sistema">
                  {SYSTEM_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </optgroup>
                {customCats.length > 0 && (
                  <optgroup label="Mis categorías">
                    {customCats.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Descripción</label>
              <input className={INPUT} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Opcional" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Monto ($) *</label>
              <input className={INPUT} type="number" min="0" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">Fecha</label>
              <input className={INPUT} type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={guardar} disabled={saving || !form.monto}
              className="px-4 py-2 bg-[#1649C8] hover:bg-[#1340B0] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista agrupada por categoría */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-zinc-200 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : Object.keys(porCategoria).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-10 text-center">
          <p className="text-sm text-zinc-400">Sin gastos en este período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(porCategoria).map(([cat, { label, total: catTotal, items }]) => (
            <div key={cat} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-bold text-zinc-800">{fmt(catTotal)}</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-zinc-50">
                  {items.map(e => (
                    <tr key={e.id} className="hover:bg-[#EFF6FF]">
                      <td className="px-5 py-3 text-zinc-600">
                        {e.descripcion || <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-xs">
                        {new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-zinc-800">{fmt(e.monto)}</td>
                      <td className="px-3 py-3 text-right">
                        {deletingId === e.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => eliminar(e.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                            <button onClick={() => setDeletingId(null)}
                              className="px-2 py-1 text-xs border border-zinc-200 rounded-md hover:bg-zinc-50">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(e.id)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="flex justify-end px-1">
            <span className="text-sm font-bold text-zinc-700">
              Total egresos: <span className="text-zinc-900">{fmt(total)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
