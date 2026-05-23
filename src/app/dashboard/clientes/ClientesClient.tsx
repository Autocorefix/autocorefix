'use client'

import React, { useState, useMemo } from 'react'
import {
  Search, ChevronDown, ChevronUp, ChevronRight,
  Car, ClipboardList, Plus, Trash2, FileText,
  Archive, RotateCcw, X, UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type OrdenServicio = { id: string; nombre_servicio: string | null; precio_cobrado: number | null }
type Vehiculo      = { id: string; marca: string | null; modelo: string | null; anio: number | null; descripcion: string | null }
type Orden         = {
  id: string; estado: string | null; total_cobrado: number | null;
  created_at: string | null; orden_servicios: OrdenServicio[]
}
type Cliente = {
  id: string; cliente_id: string | null; nombre: string;
  telefono: string | null; email: string | null;
  created_at: string | null; activo: boolean | null;
  vehiculos: Vehiculo[]; ordenes: Orden[]
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

const INPUT = 'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent w-full'

function generarPDF(c: Cliente) {
  const fmt        = (n: number) => '$' + n.toLocaleString('es-MX')
  const totalGastado = c.ordenes.reduce((s, o) => s + (o.total_cobrado ?? 0), 0)
  const fecha      = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  const vehiculosHTML = c.vehiculos.map(v =>
    `<span class="vbadge">${v.marca} ${v.modelo} ${v.anio}</span>`
  ).join('')

  const ordenesHTML = c.ordenes.map(o => {
    const sHTML = o.orden_servicios.map(s =>
      `<tr><td>${s.nombre_servicio ?? '—'}</td><td class="monto">${fmt(s.precio_cobrado ?? 0)}</td></tr>`
    ).join('')
    const fechaOrden = o.created_at
      ? new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'
    return `
      <div class="orden">
        <div class="ohead">
          <span class="oid">#${o.id.slice(0,8).toUpperCase()}</span>
          <span class="ofecha">${fechaOrden}</span>
          <span class="ototal">${fmt(o.total_cobrado ?? 0)}</span>
        </div>
        <table class="stable"><thead><tr><th>Servicio</th><th>Precio</th></tr></thead>
        <tbody>${sHTML || '<tr><td colspan="2" style="color:#a1a1aa">Sin servicios</td></tr>'}</tbody></table>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Historial — ${c.nombre}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181b;padding:40px;font-size:13px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #2563EB}
.htitle{font-size:20px;font-weight:700;color:#2563EB}.hsub{font-size:10px;color:#71717a;margin-top:3px;text-transform:uppercase;letter-spacing:.08em}
.hfecha{font-size:11px;color:#71717a;text-align:right}
.cbox{background:#f4f4f5;border-radius:10px;padding:14px 18px;margin-bottom:24px}
.cnombre{font-size:16px;font-weight:700;margin-bottom:5px}
.cmeta{display:flex;gap:18px;font-size:11px;color:#71717a}
.vlabel,.olabel{font-size:10px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.vbadge{display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:3px 9px;font-size:12px;color:#1e40af;margin-right:5px;margin-bottom:8px}
.orden{border:1px solid #e4e4e7;border-radius:8px;margin-bottom:10px;overflow:hidden;page-break-inside:avoid}
.ohead{display:flex;align-items:center;gap:10px;padding:9px 13px;background:#fafafa;border-bottom:1px solid #e4e4e7}
.oid{font-family:monospace;font-size:11px;font-weight:600;color:#52525b;background:#e4e4e7;padding:2px 7px;border-radius:4px}
.ofecha{font-size:11px;color:#71717a;flex:1}
.ototal{font-size:13px;font-weight:700}
.stable{width:100%;border-collapse:collapse}
.stable th{padding:5px 13px;font-size:10px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:.07em;text-align:left;background:#f9fafb}
.stable td{padding:6px 13px;font-size:12px;color:#3f3f46;border-top:1px solid #f4f4f5}
td.monto{text-align:right;font-weight:600;color:#18181b}
.totalbox{margin-top:22px;display:flex;justify-content:flex-end}
.totalinner{background:#2563EB;color:#fff;padding:11px 18px;border-radius:8px;text-align:right}
.tlabel{font-size:10px;text-transform:uppercase;letter-spacing:.1em;opacity:.8}
.tmonto{font-size:18px;font-weight:700;margin-top:2px}
.footer{margin-top:28px;padding-top:14px;border-top:1px solid #e4e4e7;font-size:10px;color:#a1a1aa;text-align:center}
@media print{body{padding:20px}}
</style></head><body>
<div class="hdr">
  <div><div class="htitle">Historial de Servicios</div><div class="hsub">Registro de mantenimiento vehicular</div></div>
  <div class="hfecha">Emitido el ${fecha}</div>
</div>
<div class="cbox">
  <div class="cnombre">${c.nombre}</div>
  <div class="cmeta">
    <span>ID: ${c.cliente_id ?? '—'}</span>
    ${c.telefono ? `<span>Tel: ${c.telefono}</span>` : ''}
    ${c.email    ? `<span>${c.email}</span>`         : ''}
  </div>
</div>
${c.vehiculos.length > 0 ? `<div class="vlabel">Vehículos registrados</div><div style="margin-bottom:20px">${vehiculosHTML}</div>` : ''}
<div class="olabel">${c.ordenes.length} orden${c.ordenes.length !== 1 ? 'es' : ''} de servicio</div>
${ordenesHTML}
${c.ordenes.length > 0 ? `<div class="totalbox"><div class="totalinner"><div class="tlabel">Total histórico</div><div class="tmonto">${fmt(totalGastado)}</div></div></div>` : ''}
<div class="footer">Documento generado por AutoCoreFix · ${fecha}</div>
</body></html>`

  const ventana = window.open('', '_blank')
  if (!ventana) { alert('El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio.'); return }
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => { ventana.print() }, 600)
}

export default function ClientesClient({
  clientes: inicial,
  prefijo,
  tenantId,
}: {
  clientes: Cliente[]
  prefijo: string
  tenantId: string
}) {
  const supabase = createClient()

  const [lista,              setLista]              = useState<Cliente[]>(inicial)
  const [query,              setQuery]              = useState('')
  const [expandido,          setExpandido]          = useState<string | null>(null)
  const [expandedOrden,      setExpandedOrden]      = useState<string | null>(null)
  const [mostrarArchivados,  setMostrarArchivados]  = useState(false)
  const [modalNuevo,         setModalNuevo]         = useState(false)
  const [form,               setForm]               = useState({ nombre: '', telefono: '', email: '', vMarca: '', vModelo: '', vAnio: '', vDescripcion: '' })
  const [saving,             setSaving]             = useState(false)
  const [formError,          setFormError]          = useState('')
  const [deletingId,         setDeletingId]         = useState<string | null>(null)
  const [procesando,         setProcesando]         = useState<string | null>(null)
  const [generandoPDF,       setGenerandoPDF]       = useState<string | null>(null)

  const PAGE_SIZE = 20
  const [pagina, setPagina] = useState(1)

  const fmt = (n: number) => '$' + n.toLocaleString('es-MX')

  const activos    = useMemo(() => lista.filter(c => c.activo !== false), [lista])
  const archivados = useMemo(() => lista.filter(c => c.activo === false),  [lista])

  const base = mostrarArchivados ? lista : activos

  const filtrados = useMemo(() => base.filter(c =>
    c.nombre.toLowerCase().includes(query.toLowerCase()) ||
    c.telefono?.includes(query) ||
    c.email?.toLowerCase().includes(query.toLowerCase()) ||
    c.cliente_id?.toLowerCase().includes(query.toLowerCase())
  ), [base, query])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginados    = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const desde_item   = filtrados.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1
  const hasta_item   = Math.min(pagina * PAGE_SIZE, filtrados.length)

  function toggleOrden(id: string) { setExpandedOrden(p => p === id ? null : id) }

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setFormError('El nombre es requerido.'); return }
    setSaving(true); setFormError('')
    const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    const codigo = `${prefijo}-${String((count ?? 0) + 1).padStart(4, '0')}`
    const { data, error } = await (supabase.from('clientes') as any).insert({
      nombre:     form.nombre.trim(),
      telefono:   form.telefono.trim() || null,
      email:      form.email.trim()    || null,
      tenant_id:  tenantId,
      cliente_id: codigo,
      activo:     true,
    }).select('id, cliente_id, nombre, telefono, email, created_at, activo').single()
    if (error || !data) { setFormError('Error al crear cliente.'); setSaving(false); return }
    let vehiculos: Vehiculo[] = []
    if (form.vMarca.trim() && form.vModelo.trim()) {
      const anioNum = form.vAnio.trim() ? parseInt(form.vAnio.trim()) || null : null
      const { data: vData } = await supabase.from('vehiculos').insert({
        marca:       form.vMarca.trim(),
        modelo:      form.vModelo.trim(),
        anio:        anioNum,
        descripcion: form.vDescripcion.trim() || null,
        cliente_id:  (data as any).id,
        tenant_id:   tenantId,
      } as any).select('id, marca, modelo, anio, descripcion').single()
      if (vData) vehiculos = [vData as unknown as Vehiculo]
    }
    const nuevo: Cliente = { ...(data as any), vehiculos, ordenes: [] }
    setLista(p => [nuevo, ...p])
    setForm({ nombre: '', telefono: '', email: '', vMarca: '', vModelo: '', vAnio: '', vDescripcion: '' })
    setModalNuevo(false)
    setSaving(false)
  }

  async function archivarCliente(id: string) {
    setProcesando(id)
    await supabase.from('clientes').update({ activo: false } as any).eq('id', id)
    setLista(p => p.map(c => c.id === id ? { ...c, activo: false } : c))
    setExpandido(null)
    setProcesando(null)
    setDeletingId(null)
  }

  async function reactivarCliente(id: string) {
    setProcesando(id)
    await supabase.from('clientes').update({ activo: true } as any).eq('id', id)
    setLista(p => p.map(c => c.id === id ? { ...c, activo: true } : c))
    setProcesando(null)
  }

  async function eliminarCliente(id: string) {
    setProcesando(id)
    await supabase.from('clientes').delete().eq('id', id)
    setLista(p => p.filter(c => c.id !== id))
    setExpandido(null)
    setProcesando(null)
    setDeletingId(null)
  }

  function handlePDF(c: Cliente) {
    setGenerandoPDF(c.id)
    try { generarPDF(c) } finally { setTimeout(() => setGenerandoPDF(null), 1000) }
  }

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {activos.length} {activos.length === 1 ? 'cliente' : 'clientes'}
            {archivados.length > 0 && (
              <button
                onClick={() => { setMostrarArchivados(p => !p); setPagina(1) }}
                className="ml-3 text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
              >
                {mostrarArchivados ? 'Ocultar archivados' : `Ver ${archivados.length} archivado${archivados.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </p>
        </div>
        <button
          onClick={() => { setModalNuevo(true); setFormError('') }}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors bg-[#1649C8] hover:bg-[#1340B0]"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text" value={query} onChange={e => { setQuery(e.target.value); setPagina(1) }}
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

        {paginados.map(c => {
          const abierto      = expandido === c.id
          const archivado    = c.activo === false
          const totalGastado = c.ordenes.reduce((s, o) => s + (o.total_cobrado ?? 0), 0)
          const ultimaVisita = c.ordenes[0]?.created_at
            ? new Date(c.ordenes[0].created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'
          const tieneOrdenes = c.ordenes.length > 0
          const confirmando  = deletingId === c.id

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden border-l-4 transition-colors ${
                archivado ? 'opacity-60' : ''
              } ${abierto ? 'border-l-[#2563EB]' : 'border-l-transparent hover:border-l-[#2563EB]'}`}
            >
              <button
                onClick={() => { setExpandido(abierto ? null : c.id); setExpandedOrden(null); setDeletingId(null) }}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors text-left group ${abierto ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-white">{c.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{c.nombre}</p>
                      {archivado && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200">
                          Archivado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{c.cliente_id} · {c.telefono ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Ultima visita</p>
                    <p className="text-sm font-medium text-zinc-700 mt-0.5">{ultimaVisita}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Total gastado</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-0.5">{fmt(totalGastado)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Ordenes</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-0.5">{c.ordenes.length}</p>
                  </div>
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-colors shrink-0 ${
                    abierto ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#2563EB] group-hover:bg-[#2563EB]'
                  }`}>
                    {abierto
                      ? <ChevronUp   className="w-4 h-4 text-white" />
                      : <ChevronDown className="w-4 h-4 text-[#2563EB] group-hover:text-white" />}
                  </div>
                </div>
              </button>

              {abierto && (
                <div className="border-t border-zinc-100 px-6 py-5 flex flex-col gap-5">

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* PDF */}
                    <button
                      onClick={() => handlePDF(c)}
                      disabled={generandoPDF === c.id || c.ordenes.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {generandoPDF === c.id ? 'Generando…' : 'Descargar historial PDF'}
                    </button>

                    {/* Reactivar / Archivar / Eliminar */}
                    {archivado ? (
                      <button
                        onClick={() => reactivarCliente(c.id)}
                        disabled={procesando === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {procesando === c.id ? 'Procesando…' : 'Reactivar cliente'}
                      </button>
                    ) : confirmando ? (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">
                          {tieneOrdenes ? `Este cliente tiene ${c.ordenes.length} orden(es). ¿Archivar?` : '¿Eliminar permanentemente?'}
                        </span>
                        <button
                          onClick={() => tieneOrdenes ? archivarCliente(c.id) : eliminarCliente(c.id)}
                          disabled={procesando === c.id}
                          className="text-red-500 font-semibold hover:underline disabled:opacity-50"
                        >
                          {tieneOrdenes ? 'Archivar' : 'Eliminar'}
                        </button>
                        <button onClick={() => setDeletingId(null)} className="text-zinc-400 hover:underline">Cancelar</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeletingId(c.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        {tieneOrdenes ? <Archive className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {tieneOrdenes ? 'Archivar cliente' : 'Eliminar cliente'}
                      </button>
                    )}
                  </div>

                  {/* Info mini-cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Teléfono</p>
                      <p className="text-sm font-semibold text-zinc-800">{c.telefono ?? '—'}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Email</p>
                      <p className="text-sm font-medium text-zinc-800 truncate">{c.email ?? '—'}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Cliente desde</p>
                      <p className="text-sm font-semibold text-zinc-800">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Vehículos */}
                  {c.vehiculos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" /> Vehículos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.vehiculos.map(v => (
                          <span key={v.id} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700">
                            {v.marca} {v.modelo}{v.anio ? ` ${v.anio}` : ''}{v.descripcion ? ` · ${v.descripcion}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historial de órdenes */}
                  {c.ordenes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5" /> Historial de órdenes
                      </p>
                      <div className="rounded-xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                              <th className="w-12 px-3 py-3"></th>
                              <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">#Orden</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.ordenes.map(o => {
                              const ordenAbierta = expandedOrden === o.id
                              return (
                                <React.Fragment key={o.id}>
                                  <tr
                                    onClick={() => toggleOrden(o.id)}
                                    className={`group cursor-pointer transition-colors border-t border-zinc-100 ${ordenAbierta ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'}`}
                                  >
                                    <td className={`pl-3 pr-2 py-3.5 border-l-2 transition-colors ${ordenAbierta ? 'border-l-[#2563EB]' : 'border-l-transparent'}`}>
                                      <div className={`flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${
                                        ordenAbierta ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#2563EB] group-hover:bg-[#2563EB]'
                                      }`}>
                                        {ordenAbierta
                                          ? <ChevronDown  className="w-3.5 h-3.5 text-white" />
                                          : <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white" />}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">
                                        #{o.id.slice(0,8).toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm text-zinc-600">
                                      {o.created_at ? new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-4 py-3.5"><StatusBadge estado={o.estado ?? 'recibido'} /></td>
                                    <td className="px-4 py-3.5 font-semibold text-zinc-800 text-right">{fmt(o.total_cobrado ?? 0)}</td>
                                  </tr>
                                  {ordenAbierta && (
                                    <tr className="bg-[#EFF6FF]">
                                      <td colSpan={5} className="border-l-2 border-l-[#2563EB] px-4 pb-4 pt-2">
                                        <div className="ml-6 border border-blue-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                          <div className="px-4 py-2.5 border-b border-blue-100 bg-blue-50">
                                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Servicios realizados</p>
                                          </div>
                                          <div className="divide-y divide-zinc-50">
                                            {o.orden_servicios.length === 0 ? (
                                              <p className="px-4 py-3 text-xs text-zinc-400">Sin servicios registrados</p>
                                            ) : o.orden_servicios.map((s, i) => (
                                              <div key={s.id ?? i} className="flex items-center justify-between px-4 py-2.5">
                                                <span className="text-sm text-zinc-700">{s.nombre_servicio ?? '—'}</span>
                                                <span className="text-sm font-semibold text-zinc-800">{fmt(s.precio_cobrado ?? 0)}</span>
                                              </div>
                                            ))}
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

                  {c.ordenes.length === 0 && (
                    <p className="text-sm text-zinc-400 text-center py-2">Este cliente aún no tiene órdenes de servicio</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-zinc-400">Mostrando {desde_item}–{hasta_item} de {filtrados.length} clientes</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Anterior
            </button>
            <span className="text-xs text-zinc-500">{pagina} / {totalPaginas}</span>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal nuevo cliente */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalNuevo(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-zinc-900">Nuevo cliente</h2>
              <button onClick={() => setModalNuevo(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={crearCliente} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Nombre completo *</label>
                <input autoFocus className={INPUT} placeholder="Ej. Carlos Ramírez" value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Teléfono <span className="text-zinc-400 font-normal">(opcional)</span></label>
                <input className={INPUT} placeholder="Ej. 9981234567" value={form.telefono}
                  onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Email <span className="text-zinc-400 font-normal">(opcional)</span></label>
                <input className={INPUT} type="email" placeholder="correo@ejemplo.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>

              {/* Sección vehículo */}
              <div className="border-t border-zinc-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-700">Vehículo <span className="text-zinc-400 font-normal">(opcional)</span></p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-500">Marca</label>
                      <input className={INPUT} placeholder="Ej. Toyota" value={form.vMarca}
                        onChange={e => setForm(p => ({ ...p, vMarca: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-500">Modelo</label>
                      <input className={INPUT} placeholder="Ej. Corolla" value={form.vModelo}
                        onChange={e => setForm(p => ({ ...p, vModelo: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Año <span className="text-zinc-400">(opcional)</span></label>
                    <input className={INPUT} type="number" min="1950" max="2030" placeholder="Ej. 2019" value={form.vAnio}
                      onChange={e => setForm(p => ({ ...p, vAnio: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Descripción <span className="text-zinc-400">(opcional)</span></label>
                    <input className={INPUT} placeholder="Color, motor, transmisión…" value={form.vDescripcion}
                      onChange={e => setForm(p => ({ ...p, vDescripcion: e.target.value }))} />
                  </div>
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setModalNuevo(false)}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 bg-[#1649C8] hover:bg-[#1340B0]">
                  {saving ? 'Guardando…' : 'Guardar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
