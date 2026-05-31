'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ArrowLeft, User, Car, ChevronDown, Package, FileText } from 'lucide-react'

type Estado = 'recibido' | 'en_proceso' | 'listo' | 'entregado'

const ESTADOS = ['recibido', 'en_proceso', 'listo', 'entregado'] as const
const STATUS_STYLES: Record<Estado, { label: string; badge: string; option: string }> = {
  recibido:   { label: 'Recibido',   badge: 'bg-blue-50 text-[#2563EB] ring-blue-100',        option: 'hover:bg-blue-50 hover:text-[#2563EB]' },
  en_proceso: { label: 'En proceso', badge: 'bg-amber-50 text-amber-600 ring-amber-100',       option: 'hover:bg-amber-50 hover:text-amber-600' },
  listo:      { label: 'Listo',      badge: 'bg-emerald-50 text-emerald-600 ring-emerald-100', option: 'hover:bg-emerald-50 hover:text-emerald-600' },
  entregado:  { label: 'Entregado',  badge: 'bg-violet-600 text-white ring-violet-700',        option: 'hover:bg-violet-600 hover:text-white' },
}

type Orden = {
  id: string
  estado: string | null
  total_cobrado: number | null
  total_base: number | null
  descuento: number | null
  pct_descuento: number | null
  created_at: string | null
  clientes: { nombre: string; telefono: string | null; email: string | null; cliente_id: string | null } | null
  vehiculos: { marca: string | null; modelo: string | null; anio: number | null } | null
  orden_servicios: { id: string; nombre_servicio: string | null; precio_base: number | null; precio_cobrado: number | null }[]
  orden_piezas: { id: string; descripcion: string; cantidad: number; precio_unitario: number }[]
}

function StatusDropdown({ estado, onChange }: { estado: Estado; onChange: (e: Estado) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const btnRef          = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const d = document.getElementById('status-drop')
        if (d && !d.contains(e.target as Node)) setOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX })
    }
    setOpen(p => !p)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset cursor-pointer transition-opacity ${STATUS_STYLES[estado].badge}`}
      >
        {STATUS_STYLES[estado].label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          id="status-drop"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden min-w-[150px]"
        >
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => { onChange(e); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                e === estado ? STATUS_STYLES[e].badge + ' ring-1 ring-inset' : `text-zinc-600 ${STATUS_STYLES[e].option}`
              }`}
            >
              {STATUS_STYLES[e].label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

export default function OrdenDetallePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [orden,        setOrden]        = useState<Orden | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [nombreTaller, setNombreTaller] = useState('AutoCoreFix')
  const [logoUrl,      setLogoUrl]      = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('ordenes')
        .select(`
          id, estado, total_cobrado, total_base, descuento, pct_descuento, created_at,
          clientes(nombre, telefono, email, cliente_id),
          vehiculos(marca, modelo, anio),
          orden_servicios(id, nombre_servicio, precio_base, precio_cobrado),
          orden_piezas(id, descripcion, cantidad, precio_unitario)
        `)
        .eq('id', id)
        .single()
      setOrden(data as Orden)

      const { data: uData } = await supabase
        .from('usuarios')
        .select('tenants(nombre, logo_url)')
        .single()
      const t = (uData?.tenants as { nombre: string; logo_url: string | null } | null)
      if (t) { setNombreTaller(t.nombre); setLogoUrl(t.logo_url) }

      setLoading(false)
    }
    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function cambiarEstado(estado: Estado) {
    if (!orden) return
    setSaving(true)
    const { error } = await supabase.from('ordenes').update({ estado }).eq('id', id)
    if (!error) setOrden(p => p ? { ...p, estado } : p)
    setSaving(false)
  }

  async function generarNota() {
    if (!orden) return
    setGenerandoPDF(true)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const PW = 210, PH = 297, MG = 14, CW = PW - MG * 2
    const BLUE:    [number,number,number] = [37,  99,  235]
    const BLUEDARK:[number,number,number] = [22,  73,  200]
    const BLUEBG:  [number,number,number] = [219, 234, 254]
    const AMBER:   [number,number,number] = [217, 119,   6]
    const AMBERBG: [number,number,number] = [255, 251, 235]
    const WHITE:   [number,number,number] = [255, 255, 255]
    const ZINC9:   [number,number,number] = [24,  24,  27]
    const ZINC7:   [number,number,number] = [63,  63,  70]
    const ZINC5:   [number,number,number] = [113, 113, 122]
    const ZINC1:   [number,number,number] = [244, 244, 245]
    const ROW_ALT: [number,number,number] = [248, 250, 252]

    const fmt = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0 })
    const fechaDoc = orden.created_at
      ? new Date(orden.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const ordenNum = `#${orden.id.slice(0, 8).toUpperCase()}`
    const estadoLabel = { recibido: 'Recibido', en_proceso: 'En proceso', listo: 'Listo', entregado: 'Entregado' }[orden.estado ?? 'recibido'] ?? orden.estado

    const cliente  = Array.isArray(orden.clientes)  ? orden.clientes[0]  : orden.clientes
    const vehiculo = Array.isArray(orden.vehiculos) ? orden.vehiculos[0] : orden.vehiculos
    const servicios = orden.orden_servicios ?? []
    const piezas    = orden.orden_piezas ?? []

    /* ── Logo ── */
    let logoB64: string | null = null
    let logoW = 20, logoH = 20
    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl)
        const blob = await resp.blob()
        logoB64 = await new Promise<string>((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob)
        })
        await new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => {
            const MAX_W = 36, MAX_H = 20, ratio = img.naturalWidth / img.naturalHeight
            if (ratio > MAX_W / MAX_H) { logoW = MAX_W; logoH = MAX_W / ratio }
            else { logoH = MAX_H; logoW = MAX_H * ratio }
            resolve()
          }
          img.onerror = () => resolve()
          img.src = logoB64!
        })
      } catch { logoB64 = null }
    }

    /* ── Header azul ── */
    const BAND = 34
    doc.setFillColor(...BLUE)
    doc.rect(0, 0, PW, BAND, 'F')
    doc.setFillColor(...BLUEDARK)
    doc.rect(0, BAND - 1.2, PW, 1.2, 'F')

    if (logoB64) {
      const PAD = 2, LOGO_TOP = (BAND - logoH) / 2
      doc.setFillColor(...WHITE); doc.roundedRect(MG, LOGO_TOP - PAD, logoW + PAD * 2, logoH + PAD * 2, 1.5, 1.5, 'F')
      try { doc.addImage(logoB64, 'auto' as any, MG + PAD, LOGO_TOP, logoW, logoH) } catch {}
      const tx = MG + logoW + 8
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
      doc.text(nombreTaller, tx, BAND / 2 - 1)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(210, 228, 255)
      doc.text('Orden de Servicio', tx, BAND / 2 + 6)
    } else {
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
      doc.text(nombreTaller, MG, BAND / 2 + 1)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(210, 228, 255)
      doc.text('Orden de Servicio', MG, BAND / 2 + 8)
    }
    // Número orden + fecha (derecha)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text(ordenNum, PW - MG, BAND / 2 - 2, { align: 'right' })
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(210, 228, 255)
    doc.text(`Fecha: ${fechaDoc}  |  Estado: ${estadoLabel}`, PW - MG, BAND / 2 + 5, { align: 'right' })

    let y = BAND + 8

    /* ── Info cliente + vehículo ── */
    const COL2 = PW / 2 + 2
    // Labels
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
    doc.text('CLIENTE', MG, y); doc.text('VEHÍCULO', COL2, y)
    y += 5
    // Nombre cliente
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC9)
    doc.text(cliente?.nombre ?? '—', MG, y)
    doc.text(`${vehiculo?.marca ?? ''} ${vehiculo?.modelo ?? ''}`.trim() || '—', COL2, y)
    y += 5
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC7)
    if (cliente?.telefono) { doc.text(`Tel: ${cliente.telefono}`, MG, y); y += 4.5 }
    if (vehiculo?.anio)    { doc.text(`Año: ${vehiculo.anio}`, COL2, y - 4.5) }
    if (cliente?.email)    { doc.text(cliente.email, MG, y); y += 4.5 }
    y += 4

    // Separador
    doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 5

    /* ── Tabla ── */
    const COL = { cant: MG, desc: MG + 16, punit: PW - MG - 28, imp: PW - MG }
    const ROW_H = 7.5

    // Header tabla
    doc.setFillColor(...BLUE)
    doc.rect(MG, y, CW, 8.5, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text('CANT.',      COL.cant + 2,  y + 6)
    doc.text('DESCRIPCIÓN', COL.desc + 2, y + 6)
    doc.text('P. UNIT.',   COL.punit,     y + 6, { align: 'right' })
    doc.text('IMPORTE',    COL.imp - 2,   y + 6, { align: 'right' })
    y += 8.5

    let rowIdx = 0
    function drawRow(cant: string, desc: string, punit: string, imp: string, rowColor?: [number,number,number]) {
      const bg = rowColor ?? (rowIdx % 2 === 0 ? WHITE : ROW_ALT)
      doc.setFillColor(...bg); doc.rect(MG, y, CW, ROW_H, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC9)
      doc.text(cant,  COL.cant + 2,  y + 5)
      doc.text(doc.splitTextToSize(desc, COL.punit - COL.desc - 4)[0], COL.desc + 2, y + 5)
      doc.setTextColor(...ZINC7)
      doc.text(punit, COL.punit,   y + 5, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(imp,   COL.imp - 2, y + 5, { align: 'right' })
      doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.2); doc.line(MG, y + ROW_H, PW - MG, y + ROW_H)
      y += ROW_H; rowIdx++
    }

    // Servicios
    if (servicios.length > 0) {
      // Sub-header "Mano de obra"
      doc.setFillColor(...BLUEBG)
      doc.rect(MG, y, CW, 6, 'F')
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
      doc.text('MANO DE OBRA', COL.desc + 2, y + 4.2)
      y += 6; rowIdx = 0

      for (const s of servicios) {
        const cobrado = s.precio_cobrado ?? 0
        drawRow('1', s.nombre_servicio ?? '—', fmt(s.precio_base ?? cobrado), fmt(cobrado))
      }
    }

    // Piezas
    if (piezas.length > 0) {
      // Sub-header "Refacciones"
      doc.setFillColor(...AMBERBG)
      doc.rect(MG, y, CW, 6, 'F')
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...AMBER)
      doc.text('REFACCIONES ADQUIRIDAS', COL.desc + 2, y + 4.2)
      y += 6; rowIdx = 0

      for (const p of piezas) {
        drawRow(
          String(p.cantidad),
          p.descripcion,
          fmt(p.precio_unitario),
          fmt(p.cantidad * p.precio_unitario),
        )
      }
    }

    y += 4

    /* ── Totales ── */
    const totalLabor  = servicios.reduce((s, x) => s + (x.precio_cobrado ?? 0), 0)
    const totalPiezas = piezas.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0)
    const totalCobrado = orden.total_cobrado ?? 0
    const descuento    = orden.descuento ?? 0

    const TOTAL_X = PW - MG - 70
    function totalRow(label: string, value: string, bold = false, color: [number,number,number] = ZINC7) {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(...ZINC5); doc.text(label, TOTAL_X, y)
      doc.setTextColor(...color); doc.text(value, PW - MG - 2, y, { align: 'right' })
      y += 5.5
    }

    if (totalPiezas > 0) {
      totalRow('Mano de obra:', fmt(totalLabor))
      totalRow('Refacciones:', fmt(totalPiezas), false, AMBER)
    }
    if (descuento > 0) {
      totalRow(`Subtotal:`, fmt((orden.total_base ?? totalCobrado)))
      totalRow(`Descuento (${Math.round(orden.pct_descuento ?? 0)}%):`, `−${fmt(descuento)}`, false, [5, 150, 105])
    }

    // Total final — caja azul
    y += 2
    doc.setFillColor(...BLUE); doc.roundedRect(TOTAL_X - 4, y - 5, PW - MG - TOTAL_X + 6, 11, 2, 2, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text('TOTAL:', TOTAL_X, y + 2)
    doc.text(fmt(totalCobrado), PW - MG - 2, y + 2, { align: 'right' })
    y += 14

    /* ── Observaciones ── */
    doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 6
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
    doc.text('OBSERVACIONES:', MG, y); y += 5
    for (let i = 0; i < 3; i++) {
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
      doc.line(MG, y, PW - MG, y); y += 7
    }
    y += 4

    /* ── Garantía ── */
    doc.setFillColor(...BLUEBG); doc.roundedRect(MG, y, CW, 8, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
    doc.text('Garantía: 60 días a partir de la fecha de servicio', MG + 4, y + 5.5)
    y += 14

    /* ── Firmas ── */
    const firmaW = (CW - 10) / 2
    doc.setDrawColor(...ZINC5); doc.setLineWidth(0.4)
    doc.line(MG, y, MG + firmaW, y)
    doc.line(MG + firmaW + 10, y, PW - MG, y)
    y += 5
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC5)
    doc.text('Firma del cliente', MG + firmaW / 2, y, { align: 'center' })
    doc.text('Autorizado por el taller', MG + firmaW + 10 + firmaW / 2, y, { align: 'center' })
    y += 3
    doc.setFontSize(6.5); doc.setTextColor(160, 160, 160)
    doc.text('Acepto los servicios descritos y el monto total indicado.', MG + firmaW / 2, y, { align: 'center' })

    /* ── Footer ── */
    doc.setFillColor(...ZINC1); doc.rect(0, PH - 10, PW, 10, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC5)
    doc.text(`${nombreTaller}  ·  Orden ${ordenNum}  ·  ${fechaDoc}`, MG, PH - 3.5)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
    doc.text('AutoCoreFix', PW - MG, PH - 3.5, { align: 'right' })

    const blob = doc.output('blob')
    window.open(URL.createObjectURL(blob), '_blank')
    setGenerandoPDF(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Cargando...</div>
  )
  if (!orden) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Orden no encontrada</div>
  )

  const estado    = (orden.estado ?? 'recibido') as Estado
  const cliente   = Array.isArray(orden.clientes)  ? orden.clientes[0]  : orden.clientes
  const vehiculo  = Array.isArray(orden.vehiculos) ? orden.vehiculos[0] : orden.vehiculos
  const servicios = orden.orden_servicios ?? []
  const piezas    = orden.orden_piezas ?? []
  const fecha     = orden.created_at
    ? new Date(orden.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#2563EB] bg-white hover:bg-[#2563EB] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-[#2563EB] group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 font-mono">#{orden.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-zinc-400 capitalize mt-0.5">{fecha}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generarNota}
            disabled={generandoPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            {generandoPDF ? 'Generando…' : 'Nota de servicio'}
          </button>
          <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
            <StatusDropdown estado={estado} onChange={cambiarEstado} />
          </div>
        </div>
      </div>

      {/* Cliente + Vehículo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
              <User className="w-4 h-4 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">Cliente</p>
          </div>
          <p className="text-base font-semibold text-zinc-900">{cliente?.nombre ?? '—'}</p>
          {cliente?.cliente_id && <p className="text-xs text-zinc-400 mt-0.5 font-mono">{cliente.cliente_id}</p>}
          {cliente?.telefono   && <p className="text-sm text-zinc-500 mt-2">{cliente.telefono}</p>}
          {cliente?.email      && <p className="text-sm text-zinc-500 mt-0.5">{cliente.email}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
              <Car className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">Vehículo</p>
          </div>
          {vehiculo ? (
            <>
              <p className="text-base font-semibold text-zinc-900">
                {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')}
              </p>
              {vehiculo.anio && <p className="text-sm text-zinc-500 mt-0.5">{vehiculo.anio}</p>}
            </>
          ) : (
            <p className="text-sm text-zinc-400">Sin vehículo registrado</p>
          )}
        </div>
      </div>

      {/* Servicios y Piezas */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Servicios</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
              <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Servicio</th>
              <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Precio base</th>
              <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Cobrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {servicios.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">Sin servicios registrados</td>
              </tr>
            )}
            {servicios.map(s => (
              <tr key={s.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 font-medium text-zinc-800">{s.nombre_servicio ?? '—'}</td>
                <td className="px-6 py-4 text-zinc-400 text-right">{s.precio_base != null ? fmt(s.precio_base) : '—'}</td>
                <td className="px-6 py-4 font-semibold text-zinc-900 text-right">{s.precio_cobrado != null ? fmt(s.precio_cobrado) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Piezas y materiales */}
        {piezas.length > 0 && (
          <>
            <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Refacciones adquiridas</p>
            </div>
            <div className="divide-y divide-amber-50">
              {piezas.map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between bg-amber-50/40">
                  <span className="text-sm text-zinc-800 font-medium">
                    {p.descripcion}
                    {p.cantidad > 1 && <span className="text-amber-600 ml-2 text-xs font-semibold">×{p.cantidad}</span>}
                  </span>
                  <span className="text-sm font-semibold text-amber-700">{fmt(p.cantidad * p.precio_unitario)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Totales */}
        <div className="border-t border-zinc-100 px-6 py-4 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-8 text-sm">
            <span className="text-zinc-400">Subtotal</span>
            <span className="font-medium text-zinc-700 w-24 text-right">{fmt(orden.total_base ?? 0)}</span>
          </div>
          {(orden.descuento ?? 0) > 0 && (
            <div className="flex items-center gap-8 text-sm">
              <span className="text-amber-600">
                Descuento {orden.pct_descuento != null ? `(${Math.round(orden.pct_descuento)}%)` : ''}
              </span>
              <span className="font-medium text-amber-600 w-24 text-right">−{fmt(orden.descuento ?? 0)}</span>
            </div>
          )}
          <div className="flex items-center gap-8 text-base border-t border-zinc-100 pt-2 mt-1">
            <span className="font-semibold text-zinc-900">Total</span>
            <span className="font-bold text-zinc-900 w-24 text-right">{fmt(orden.total_cobrado ?? 0)}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
