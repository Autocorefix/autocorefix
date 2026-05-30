'use client'

import React, { useState, useMemo } from 'react'
import {
  Search, ChevronDown, ChevronUp, ChevronRight,
  Car, ClipboardList, Trash2, FileText,
  Archive, RotateCcw, X, UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type OrdenServicio = { id: string; nombre_servicio: string | null; precio_cobrado: number | null }
type Vehiculo      = { id: string; marca: string | null; modelo: string | null; anio: number | null; descripcion: string | null }
type Orden         = {
  id: string; estado: string | null; total_cobrado: number | null;
  created_at: string | null; vehiculo_id: string | null; orden_servicios: OrdenServicio[]
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
  entregado:  { label: 'Entregado',  className: 'bg-violet-600 text-white ring-violet-700' },
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

/* ─── PDF generation ──────────────────────────────────────────── */
async function generarPDF(
  c: Cliente,
  vehiculo: Vehiculo | null,
  nombreTaller: string,
  logoUrl: string | null,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  /* ── Constantes ───────────────────────────────────────────── */
  const PW = 210, PH = 297, MG = 14, CW = PW - MG * 2
  const BLUE:    [number,number,number] = [37,  99,  235]
  const BLUEDARK:[number,number,number] = [22,  73,  200]
  const BLUEBG:  [number,number,number] = [219, 234, 254]
  const WHITE:   [number,number,number] = [255, 255, 255]
  const ZINC9:   [number,number,number] = [24,  24,  27]
  const ZINC7:   [number,number,number] = [63,  63,  70]
  const ZINC4:   [number,number,number] = [161, 161, 170]
  const ZINC1:   [number,number,number] = [244, 244, 245]
  const ROW_ALT: [number,number,number] = [248, 250, 252]

  const fmt = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0 })
  const fechaDoc = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

  /* ── Cargar logo y calcular dimensiones proporcionales ─────── */
  let logoB64: string | null = null
  let logoW = 22, logoH = 22  // default cuadrado

  if (logoUrl) {
    try {
      const resp = await fetch(logoUrl)
      const blob = await resp.blob()
      logoB64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      // Detectar aspect ratio cargando la imagen
      await new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => {
          const MAX_W = 38, MAX_H = 22
          const ratio = img.naturalWidth / img.naturalHeight
          if (ratio > MAX_W / MAX_H) {
            logoW = MAX_W
            logoH = MAX_W / ratio
          } else {
            logoH = MAX_H
            logoW = MAX_H * ratio
          }
          resolve()
        }
        img.onerror = () => resolve()
        img.src = logoB64!
      })
    } catch { logoB64 = null }
  }

  /* ── Header ────────────────────────────────────────────────── */
  function drawHeader() {
    const BAND_H = 32

    // Banda azul
    doc.setFillColor(...BLUE)
    doc.rect(0, 0, PW, BAND_H, 'F')
    // Franja inferior más oscura
    doc.setFillColor(...BLUEDARK)
    doc.rect(0, BAND_H - 1.2, PW, 1.2, 'F')

    const LOGO_TOP = (BAND_H - logoH) / 2

    if (logoB64) {
      // Recuadro blanco auto-proporcional
      const PAD = 2
      doc.setFillColor(...WHITE)
      doc.roundedRect(MG, LOGO_TOP - PAD, logoW + PAD * 2, logoH + PAD * 2, 1.5, 1.5, 'F')
      try { doc.addImage(logoB64, 'auto' as any, MG + PAD, LOGO_TOP, logoW, logoH) } catch {}

      const textX = MG + logoW + 8

      // Nombre del taller — PRIMARIO, grande y claro
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...WHITE)
      doc.text(nombreTaller, textX, BAND_H / 2 - 1)

      // Subtítulo — blanco, legible
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(220, 235, 255)
      doc.text('Registro de Historial de Servicios', textX, BAND_H / 2 + 6)

    } else {
      // Sin logo — centrado
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...WHITE)
      doc.text(nombreTaller, PW / 2, BAND_H / 2 - 1, { align: 'center' })

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(220, 235, 255)
      doc.text('Registro de Historial de Servicios', PW / 2, BAND_H / 2 + 6, { align: 'center' })
    }

    // Bloque derecho: Sistema AutoCoreFix + fecha — alineados a la derecha
    const rightX = PW - MG

    // "Sistema AutoCoreFix" — visible, bold, bien contrastado
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Sistema AutoCoreFix', rightX, BAND_H / 2 - 1, { align: 'right' })

    // Fecha — debajo del branding, bold, legible
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 235, 255)
    doc.text(`Emitido: ${fechaDoc}`, rightX, BAND_H / 2 + 6, { align: 'right' })
  }

  /* ── Footer ────────────────────────────────────────────────── */
  function drawFooter(page: number, total: number) {
    doc.setFillColor(...ZINC1)
    doc.rect(0, PH - 10, PW, 10, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...ZINC4)
    doc.text(`Pagina ${page} de ${total}  ·  ${nombreTaller}`, MG, PH - 3.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLUE)
    doc.text('AutoCoreFix', PW - MG, PH - 3.5, { align: 'right' })
  }

  /* ── Paginacion ─────────────────────────────────────────────── */
  function checkPage(y: number, needed: number): number {
    if (y + needed > PH - 16) {
      doc.addPage()
      drawHeader()
      return 38
    }
    return y
  }

  /* ── Page 1 ─────────────────────────────────────────────────── */
  drawHeader()
  let y = 38

  /* ── Info cliente ───────────────────────────────────────────── */
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...ZINC9)
  doc.text(c.nombre, MG, y + 6)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...ZINC7)
  doc.text(`ID Cliente: ${c.cliente_id ?? '—'}`, MG, y + 12)

  doc.setDrawColor(...BLUEBG)
  doc.setLineWidth(0.6)
  doc.line(MG, y + 15.5, PW - MG, y + 15.5)
  y += 19

  /* ── Info vehiculo ──────────────────────────────────────────── */
  if (vehiculo) {
    const col1 = MG, col2 = MG + 36, col3 = MG + 76, col4 = MG + 116, col5 = MG + 150

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...ZINC4)
    doc.text('MARCA',    col1, y)
    doc.text('MODELO',   col2, y)
    doc.text('AÑO',      col3, y)
    doc.text('COLOR / DESCRIPCION', col4, y)

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...ZINC9)
    doc.text(vehiculo.marca  ?? '—', col1, y + 6)
    doc.text(vehiculo.modelo ?? '—', col2, y + 6)
    doc.text(vehiculo.anio ? String(vehiculo.anio) : '—', col3, y + 6)
    doc.text(vehiculo.descripcion ?? '—', col4, y + 6)

    doc.setDrawColor(...BLUEBG)
    doc.setLineWidth(0.4)
    doc.line(MG, y + 10.5, PW - MG, y + 10.5)
    y += 15
  }

  /* ── Titulo sección ─────────────────────────────────────────── */
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...ZINC4)
  doc.text('HISTORIAL DE SERVICIOS', MG, y + 4)
  y += 7

  /* ── Tabla header ───────────────────────────────────────────── */
  const COL = { fecha: MG, orden: MG + 26, servicio: MG + 54, precio: PW - MG }
  const ROW_H = 7.5

  function drawTableHeader(yh: number) {
    doc.setFillColor(...BLUE)
    doc.rect(MG, yh, CW, 8.5, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text('FECHA',    COL.fecha    + 2, yh + 6)
    doc.text('# ORDEN',  COL.orden    + 2, yh + 6)
    doc.text('SERVICIO', COL.servicio + 2, yh + 6)
    doc.text('PRECIO',   COL.precio   - 2, yh + 6, { align: 'right' })
    return yh + 8.5
  }

  y = drawTableHeader(y)

  /* ── Filas ──────────────────────────────────────────────────── */
  const ordenesFiltradas = vehiculo
    ? c.ordenes.filter(o => o.vehiculo_id === vehiculo.id)
    : c.ordenes

  if (ordenesFiltradas.length === 0) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...ZINC4)
    doc.text('Sin servicios registrados.', PW / 2, y + 10, { align: 'center' })
    y += 18
  }

  let rowIndex = 0
  for (const orden of ordenesFiltradas) {
    const fechaOrden = orden.created_at
      ? new Date(orden.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—'
    const ordenNum = `#${orden.id.slice(0, 6).toUpperCase()}`

    for (const s of orden.orden_servicios) {
      y = checkPage(y, ROW_H + 1)

      doc.setFillColor(...(rowIndex % 2 === 0 ? WHITE : ROW_ALT))
      doc.rect(MG, y, CW, ROW_H, 'F')

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...ZINC7)
      doc.text(fechaOrden, COL.fecha + 2, y + 5)

      doc.setTextColor(100, 140, 210)
      doc.text(ordenNum, COL.orden + 2, y + 5)

      doc.setTextColor(...ZINC9)
      doc.text(
        doc.splitTextToSize(s.nombre_servicio ?? '—', COL.precio - COL.servicio - 18)[0],
        COL.servicio + 2, y + 5
      )

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...ZINC7)
      doc.text(fmt(s.precio_cobrado ?? 0), COL.precio - 2, y + 5, { align: 'right' })

      doc.setDrawColor(...BLUEBG)
      doc.setLineWidth(0.2)
      doc.line(MG, y + ROW_H, PW - MG, y + ROW_H)

      y += ROW_H
      rowIndex++
    }
  }

  /* ── Footers ────────────────────────────────────────────────── */
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawFooter(p, totalPages)
  }

  /* ── Abrir en nueva pestaña ─────────────────────────────────── */
  const blob = doc.output('blob')
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
/* ─────────────────────────────────────────────────────────────── */

export default function ClientesClient({
  clientes: inicial,
  prefijo,
  tenantId,
  nombreTaller,
  logoUrl,
}: {
  clientes:     Cliente[]
  prefijo:      string
  tenantId:     string
  nombreTaller: string
  logoUrl:      string | null
}) {
  const supabase = createClient()

  const [lista,             setLista]             = useState<Cliente[]>(inicial)
  const [query,             setQuery]             = useState('')
  const [expandido,         setExpandido]         = useState<string | null>(null)
  const [expandedOrden,     setExpandedOrden]     = useState<string | null>(null)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)
  const [modalNuevo,        setModalNuevo]        = useState(false)
  const [form,              setForm]              = useState({ nombre: '', telefono: '', email: '', vMarca: '', vModelo: '', vAnio: '', vDescripcion: '' })
  const [saving,            setSaving]            = useState(false)
  const [formError,         setFormError]         = useState('')
  const [deletingId,        setDeletingId]        = useState<string | null>(null)
  const [procesando,        setProcesando]        = useState<string | null>(null)
  const [generandoPDF,      setGenerandoPDF]      = useState<string | null>(null)
  // Vehicle selector for PDF
  const [vehiculoModal,     setVehiculoModal]     = useState<{ cliente: Cliente } | null>(null)

  const PAGE_SIZE = 20
  const [pagina, setPagina] = useState(1)

  const fmt = (n: number) => '$' + n.toLocaleString('es-MX')

  const activos    = useMemo(() => lista.filter(c => c.activo !== false), [lista])
  const archivados = useMemo(() => lista.filter(c => c.activo === false),  [lista])
  const base       = mostrarArchivados ? lista : activos

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

  function resetForm() { setForm({ nombre: '', telefono: '', email: '', vMarca: '', vModelo: '', vAnio: '', vDescripcion: '' }) }

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setFormError('El nombre es requerido.'); return }
    setSaving(true); setFormError('')
    const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    const codigo = `${prefijo}-${String((count ?? 0) + 1).padStart(4, '0')}`
    const { data, error } = await (supabase.from('clientes') as any).insert({
      nombre: form.nombre.trim(), telefono: form.telefono.trim() || null,
      email: form.email.trim() || null, tenant_id: tenantId, cliente_id: codigo, activo: true,
    }).select('id, cliente_id, nombre, telefono, email, created_at, activo').single()
    if (error || !data) { setFormError('Error al crear cliente.'); setSaving(false); return }

    let vehiculos: Vehiculo[] = []
    if (form.vMarca.trim() && form.vModelo.trim()) {
      const anioNum = form.vAnio.trim() ? parseInt(form.vAnio.trim()) || null : null
      const { data: vData } = await (supabase.from('vehiculos') as any).insert({
        marca: form.vMarca.trim(), modelo: form.vModelo.trim(), anio: anioNum,
        descripcion: form.vDescripcion.trim() || null,
        cliente_id: (data as any).id, tenant_id: tenantId,
      }).select('id, marca, modelo, anio, descripcion').single()
      if (vData) vehiculos = [vData as unknown as Vehiculo]
    }
    setLista(p => [{ ...(data as any), vehiculos, ordenes: [] }, ...p])
    resetForm(); setModalNuevo(false); setSaving(false)
  }

  async function archivarCliente(id: string) {
    setProcesando(id)
    await supabase.from('clientes').update({ activo: false } as any).eq('id', id)
    setLista(p => p.map(c => c.id === id ? { ...c, activo: false } : c))
    setExpandido(null); setProcesando(null); setDeletingId(null)
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
    setExpandido(null); setProcesando(null); setDeletingId(null)
  }

  async function handlePDF(c: Cliente) {
    if (c.ordenes.length === 0) return
    // Show selector when client has 2+ vehicles
    if (c.vehiculos.length > 1) {
      setVehiculoModal({ cliente: c })
    } else {
      const veh = c.vehiculos[0] ?? null
      setGenerandoPDF(c.id)
      await generarPDF(c, veh, nombreTaller, logoUrl)
      setGenerandoPDF(null)
    }
  }

  async function handlePDFConVehiculo(c: Cliente, v: Vehiculo) {
    setVehiculoModal(null)
    setGenerandoPDF(c.id)
    await generarPDF(c, v, nombreTaller, logoUrl)
    setGenerandoPDF(null)
  }

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text" value={query}
          onChange={e => { setQuery(e.target.value); setPagina(1) }}
          placeholder="Buscar por nombre, teléfono, email o ID..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 px-6 py-12 text-center text-sm text-zinc-500">
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
            <div key={c.id} className={`bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden border-l-4 transition-colors ${archivado ? 'opacity-60' : ''} ${abierto ? 'border-l-[#2563EB]' : 'border-l-transparent hover:border-l-[#2563EB]'}`}>
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
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200">Archivado</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{c.cliente_id} · {c.telefono ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Ultima visita</p>
                    <p className="text-sm font-medium text-zinc-700 mt-0.5">{ultimaVisita}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Total gastado</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-0.5">{fmt(totalGastado)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Ordenes</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-0.5">{c.ordenes.length}</p>
                  </div>
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-colors shrink-0 ${abierto ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#2563EB] group-hover:bg-[#2563EB]'}`}>
                    {abierto ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-[#2563EB] group-hover:text-white" />}
                  </div>
                </div>
              </button>

              {abierto && (
                <div className="border-t border-zinc-100 px-6 py-5 flex flex-col gap-5">

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* PDF — amber */}
                    <button
                      onClick={() => handlePDF(c)}
                      disabled={generandoPDF === c.id || !tieneOrdenes}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {generandoPDF === c.id ? 'Generando PDF…' : 'Descargar historial PDF'}
                    </button>

                    {/* Archive / Delete / Reactivate */}
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

                  {/* Mini cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Teléfono', value: c.telefono ?? '—' },
                      { label: 'Email',    value: c.email    ?? '—' },
                      { label: 'Cliente desde', value: c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
                        <p className="text-sm font-semibold text-zinc-800 truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vehicles */}
                  {c.vehiculos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" /> Vehículos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.vehiculos.map(v => (
                          <span key={v.id} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm font-medium text-[#2563EB]">
                            {v.marca} {v.modelo}{v.anio ? ` ${v.anio}` : ''}{v.descripcion ? ` · ${v.descripcion}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders */}
                  {c.ordenes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
                                  <tr onClick={() => toggleOrden(o.id)} className={`group cursor-pointer transition-colors border-t border-zinc-100 ${ordenAbierta ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'}`}>
                                    <td className={`pl-3 pr-2 py-3.5 border-l-2 transition-colors ${ordenAbierta ? 'border-l-[#2563EB]' : 'border-l-transparent'}`}>
                                      <div className={`flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${ordenAbierta ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#2563EB] group-hover:bg-[#2563EB]'}`}>
                                        {ordenAbierta
                                          ? <ChevronDown  className="w-3.5 h-3.5 text-white" />
                                          : <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] group-hover:text-white" />}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">#{o.id.slice(0,8).toUpperCase()}</span>
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
                    <p className="text-sm text-zinc-500 text-center py-2">Este cliente aún no tiene órdenes de servicio</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
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

      {/* Vehicle selector modal */}
      {vehiculoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVehiculoModal(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900">¿Para qué vehículo?</h2>
              <button onClick={() => setVehiculoModal(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-zinc-500 mb-4">Selecciona de qué vehículo quieres el historial.</p>
            <div className="flex flex-col gap-2">
              {/* Opción: todo el historial */}
              <button
                onClick={async () => { setVehiculoModal(null); setGenerandoPDF(vehiculoModal.cliente.id); await generarPDF(vehiculoModal.cliente, null, nombreTaller, logoUrl); setGenerandoPDF(null) }}
                className="flex items-center gap-3 rounded-xl border-2 border-[#2563EB] bg-blue-50 px-4 py-3 text-left hover:bg-blue-100 transition-colors"
              >
                <ClipboardList className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="text-sm font-semibold text-[#2563EB]">Todo el historial</span>
              </button>
              {/* Un botón por vehículo */}
              {vehiculoModal.cliente.vehiculos.map(v => (
                <button key={v.id}
                  onClick={() => handlePDFConVehiculo(vehiculoModal.cliente, v)}
                  className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-300 px-4 py-3 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <Car className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="text-sm font-medium text-zinc-800">
                    {v.marca} {v.modelo}{v.anio ? ` ${v.anio}` : ''}{v.descripcion ? ` · ${v.descripcion}` : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New client modal */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalNuevo(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
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

              {/* Vehicle section */}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-500">Año <span className="text-zinc-400">(opcional)</span></label>
                      <input className={INPUT} type="number" min="1950" max="2030" placeholder="Ej. 2019" value={form.vAnio}
                        onChange={e => setForm(p => ({ ...p, vAnio: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-zinc-500">Descripción <span className="text-zinc-400">(opcional)</span></label>
                      <input className={INPUT} placeholder="Color, motor…" value={form.vDescripcion}
                        onChange={e => setForm(p => ({ ...p, vDescripcion: e.target.value }))} />
                    </div>
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
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700">
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
