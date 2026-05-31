'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, UserPlus, X, Trash2, Car, Plus, Package, FileText,
  ChevronRight, Clock, CheckCircle2, XCircle, FileSearch,
  Droplets, Disc, Navigation2, CircleDot, Zap, Thermometer,
  Settings2, Settings, Cpu, Wind, Flame, Sun, Wrench,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

/* ── Types ── */
type CatInfo = { id: string; nombre: string; is_system_default: boolean; orden: number }
type ServicioCat = { id: string; nombre: string; precio_base: number; categoria_id: string; categorias: CatInfo }
type Cliente  = { id: string; nombre: string; telefono: string | null; email: string | null; cliente_id: string | null }
type Vehiculo = { id: string; marca: string | null; modelo: string | null; anio: number | null }
type ItemPresupuesto = { tempId: string; nombre: string; precio: number }
type PiezaEstimada   = { tempId: string; descripcion: string; cantidad: number; precioUnitario: number }
type Diagnostico = {
  id: string; hallazgos: string; servicios: { nombre: string; precio: number }[]
  piezas: { descripcion: string; cantidad: number; precioUnitario: number }[]
  total_estimado: number; estado: string; created_at: string
  clientes: { nombre: string; telefono: string | null } | null
  vehiculos: { marca: string | null; modelo: string | null; anio: number | null } | null
}

const ESTADO_STYLES: Record<string, { label: string; badge: string }> = {
  pendiente:    { label: 'Pendiente',    badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  aprobado:     { label: 'Aprobado',     badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  no_aprobado:  { label: 'No aprobado',  badge: 'bg-red-50 text-red-600 ring-red-200' },
}

const CATEGORIA_ICONS: Record<string, React.ElementType> = {
  'Cambio de Aceite y Filtros':   Droplets,
  'Sistema de Frenos':            Disc,
  'Suspensión y Dirección':       Navigation2,
  'Alineación y Balanceo':        CircleDot,
  'Sistema Eléctrico y Batería':  Zap,
  'Sistema de Enfriamiento':      Thermometer,
  'Afinación de Motor':           Settings2,
  'Transmisión y Embrague':       Settings,
  'Diagnóstico por Escáner':      Cpu,
  'Aire Acondicionado':           Wind,
  'Sistema de Escape':            Flame,
  'Luces y Visibilidad':          Sun,
  'Reparación Mayor de Motor':    Wrench,
}

const INPUT = 'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent w-full'

function diasRestantes(created_at: string): number {
  const created = new Date(created_at)
  const expira  = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000)
  return Math.max(0, Math.ceil((expira.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}

export default function DiagnosticoClient({
  serviciosIniciales,
  diagnosticosIniciales,
  tenantId,
  prefijo,
  nombreTaller,
  logoUrl,
}: {
  serviciosIniciales: ServicioCat[]
  diagnosticosIniciales: Diagnostico[]
  tenantId: string
  prefijo: string
  nombreTaller: string
  logoUrl: string | null
}) {
  const router   = useRouter()
  const supabase = createClient()

  /* Vista */
  const [vista, setVista] = useState<'lista' | 'nuevo'>('lista')

  /* Lista */
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>(diagnosticosIniciales)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [convirtiendo, setConvirtiendo] = useState<string | null>(null)

  /* Formulario — cliente */
  const [query,             setQuery]             = useState('')
  const [resultados,        setResultados]        = useState<Cliente[]>([])
  const [showDropdown,      setShowDropdown]      = useState(false)
  const [cliente,           setCliente]           = useState<Cliente | null>(null)
  const [modoNuevoCliente,  setModoNuevoCliente]  = useState(false)
  const [nuevoCliente,      setNuevoCliente]      = useState({ nombre: '', telefono: '', email: '' })

  /* Formulario — vehículo */
  const [vehiculosCliente,      setVehiculosCliente]      = useState<Vehiculo[]>([])
  const [vehiculoSeleccionado,  setVehiculoSeleccionado]  = useState<Vehiculo | null>(null)
  const [modoNuevoVehiculo,     setModoNuevoVehiculo]     = useState(false)
  const [nuevoVehiculo,         setNuevoVehiculo]         = useState({ marca: '', modelo: '', anio: '' })

  /* Formulario — contenido */
  const [hallazgos,        setHallazgos]        = useState('')
  const [categoriaActiva,  setCategoriaActiva]  = useState<string | null>(null)
  const [items,            setItems]            = useState<ItemPresupuesto[]>([])
  const [piezas,           setPiezas]           = useState<PiezaEstimada[]>([])
  const [nuevaPieza,       setNuevaPieza]       = useState({ descripcion: '', cantidad: '1', precio: '' })

  /* Estado form */
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const categorias = [
    ...new Map(serviciosIniciales.map(s => [s.categorias.id, s.categorias])).values()
  ].sort((a, b) => a.orden - b.orden)

  const totalServicios = items.reduce((s, i) => s + i.precio, 0)
  const totalPiezas    = piezas.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0)
  const totalEstimado  = totalServicios + totalPiezas
  const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`
  const hayCliente = cliente || modoNuevoCliente

  /* ── Búsqueda de cliente ── */
  async function buscarClientes(q: string) {
    setQuery(q)
    if (q.length < 2) { setResultados([]); setShowDropdown(false); return }
    const { data } = await supabase.from('clientes').select('*')
      .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,cliente_id.ilike.%${q}%`).limit(5)
    setResultados(data ?? [])
    setShowDropdown(true)
  }

  async function seleccionarCliente(c: Cliente) {
    setCliente(c); setQuery(''); setShowDropdown(false); setModoNuevoCliente(false)
    const { data } = await supabase.from('vehiculos').select('*').eq('cliente_id', c.id)
    setVehiculosCliente(data ?? [])
    setVehiculoSeleccionado(null)
    setModoNuevoVehiculo((data ?? []).length === 0)
  }

  function limpiarCliente() {
    setCliente(null); setResultados([]); setQuery(''); setModoNuevoCliente(false)
    setNuevoCliente({ nombre: '', telefono: '', email: '' })
    setVehiculosCliente([]); setVehiculoSeleccionado(null); setModoNuevoVehiculo(false)
    setNuevoVehiculo({ marca: '', modelo: '', anio: '' })
  }

  /* ── Servicios / Piezas ── */
  function agregarServicio(s: ServicioCat) {
    if (items.some(i => i.nombre === s.nombre)) return
    setItems(prev => [...prev, { tempId: Date.now().toString(), nombre: s.nombre, precio: s.precio_base }])
  }

  function agregarPieza() {
    const desc = nuevaPieza.descripcion.trim()
    const cant = Math.max(1, parseInt(nuevaPieza.cantidad) || 1)
    const precio = parseFloat(nuevaPieza.precio) || 0
    if (!desc || precio <= 0) return
    setPiezas(prev => [...prev, { tempId: Date.now().toString(), descripcion: desc, cantidad: cant, precioUnitario: precio }])
    setNuevaPieza({ descripcion: '', cantidad: '1', precio: '' })
  }

  /* ── Guardar diagnóstico ── */
  async function guardarDiagnostico() {
    setError('')
    if (!cliente && !modoNuevoCliente)                                         { setError('Selecciona o registra un cliente.'); return }
    if (modoNuevoCliente && !nuevoCliente.nombre.trim())                       { setError('El nombre del cliente es requerido.'); return }
    if (!vehiculoSeleccionado && !modoNuevoVehiculo)                           { setError('Selecciona o registra un vehículo.'); return }
    if (modoNuevoVehiculo && (!nuevoVehiculo.marca || !nuevoVehiculo.modelo))  { setError('Completa marca y modelo del vehículo.'); return }
    if (!hallazgos.trim() && items.length === 0)                               { setError('Agrega hallazgos del diagnóstico o servicios recomendados.'); return }

    setLoading(true)
    try {
      let clienteId = cliente?.id
      if (modoNuevoCliente) {
        const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
        const codigo = `${prefijo}-${String((count ?? 0) + 1).padStart(4, '0')}`
        const { data, error: e } = await supabase.from('clientes')
          .insert({ nombre: nuevoCliente.nombre.trim(), telefono: nuevoCliente.telefono || null, email: nuevoCliente.email || null, tenant_id: tenantId, cliente_id: codigo })
          .select('id').single()
        if (e) throw new Error('Error al crear cliente')
        clienteId = data.id
      }

      let vehiculoId = vehiculoSeleccionado?.id
      if (modoNuevoVehiculo) {
        const { data, error: e } = await supabase.from('vehiculos')
          .insert({ marca: nuevoVehiculo.marca.trim(), modelo: nuevoVehiculo.modelo.trim(), anio: nuevoVehiculo.anio ? Number(nuevoVehiculo.anio) : null, cliente_id: clienteId, tenant_id: tenantId })
          .select('id').single()
        if (e) throw new Error('Error al crear vehículo')
        vehiculoId = data.id
      }

      const { error: e } = await (supabase as any).from('diagnosticos').insert({
        tenant_id:       tenantId,
        cliente_id:      clienteId,
        vehiculo_id:     vehiculoId,
        hallazgos:       hallazgos.trim(),
        servicios:       items.map(i => ({ nombre: i.nombre, precio: i.precio })),
        piezas:          piezas.map(p => ({ descripcion: p.descripcion, cantidad: p.cantidad, precioUnitario: p.precioUnitario })),
        total_estimado:  totalEstimado,
        estado:          'pendiente',
      })
      if (e) throw new Error(e.message)

      // Refresh
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: fresh } = await (supabase as any).from('diagnosticos')
        .select('id, hallazgos, servicios, piezas, total_estimado, estado, created_at, clientes(nombre, telefono), vehiculos(marca, modelo, anio)')
        .gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false })
      setDiagnosticos(fresh ?? [])

      // Reset form
      limpiarCliente(); setHallazgos(''); setItems([]); setPiezas([]); setNuevaPieza({ descripcion: '', cantidad: '1', precio: '' }); setCategoriaActiva(null)
      setVista('lista')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
    setLoading(false)
  }

  /* ── Cambiar estado ── */
  async function cambiarEstado(id: string, estado: string) {
    await (supabase as any).from('diagnosticos').update({ estado }).eq('id', id)
    setDiagnosticos(prev => prev.map(d => d.id === id ? { ...d, estado } : d))
  }

  /* ── Eliminar ── */
  async function eliminarDiagnostico(id: string) {
    await (supabase as any).from('diagnosticos').delete().eq('id', id)
    setDiagnosticos(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  /* ── Convertir a Orden ── */
  async function convertirAOrden(d: Diagnostico) {
    setConvirtiendo(d.id)
    const res = await fetch('/api/diagnostico/convertir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticoId: d.id }),
    })
    const data = await res.json()
    if (res.ok && data.ordenId) {
      await cambiarEstado(d.id, 'aprobado')
      router.push(`/dashboard/ordenes/${data.ordenId}`)
    }
    setConvirtiendo(null)
  }

  /* ── PDF Diagnóstico ── */
  async function generarPDF(d: Diagnostico) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const PW = 210, PH = 297, MG = 14, CW = PW - MG * 2
    const BLUE:   [number,number,number] = [37, 99, 235]
    const BLUEDARK:[number,number,number]= [22, 73, 200]
    const AMBER:  [number,number,number] = [217, 119, 6]
    const AMBERBG:[number,number,number] = [255, 251, 235]
    const WHITE:  [number,number,number] = [255, 255, 255]
    const ZINC9:  [number,number,number] = [24, 24, 27]
    const ZINC7:  [number,number,number] = [63, 63, 70]
    const ZINC5:  [number,number,number] = [113, 113, 122]
    const ZINC1:  [number,number,number] = [244, 244, 245]
    const ROW_ALT:[number,number,number] = [248, 250, 252]
    const BLUEBG: [number,number,number] = [219, 234, 254]

    const fecha = new Date(d.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const cliente = d.clientes
    const vehiculo = d.vehiculos

    /* Header */
    const BAND = 34
    doc.setFillColor(...BLUE); doc.rect(0, 0, PW, BAND, 'F')
    doc.setFillColor(...BLUEDARK); doc.rect(0, BAND - 1.2, PW, 1.2, 'F')

    let logoB64: string | null = null
    let logoW = 20, logoH = 20
    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl); const blob = await resp.blob()
        logoB64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob) })
        await new Promise<void>(resolve => {
          const img = new Image(); img.onload = () => { const ratio = img.naturalWidth / img.naturalHeight; const MAX_W = 36, MAX_H = 20; if (ratio > MAX_W / MAX_H) { logoW = MAX_W; logoH = MAX_W / ratio } else { logoH = MAX_H; logoW = MAX_H * ratio }; resolve() }; img.onerror = () => resolve(); img.src = logoB64!
        })
      } catch { logoB64 = null }
    }

    if (logoB64) {
      const PAD = 2, LOGO_TOP = (BAND - logoH) / 2
      doc.setFillColor(...WHITE); doc.roundedRect(MG, LOGO_TOP - PAD, logoW + PAD * 2, logoH + PAD * 2, 1.5, 1.5, 'F')
      try { doc.addImage(logoB64, 'auto' as any, MG + PAD, LOGO_TOP, logoW, logoH) } catch {}
      const tx = MG + logoW + 8
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE); doc.text(nombreTaller, tx, BAND / 2 - 1)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(210, 228, 255); doc.text('Diagnóstico y Presupuesto', tx, BAND / 2 + 6)
    } else {
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE); doc.text(nombreTaller, MG, BAND / 2 + 1)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(210, 228, 255); doc.text('Diagnóstico y Presupuesto', MG, BAND / 2 + 8)
    }
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text(`Fecha: ${fecha}`, PW - MG, BAND / 2 - 2, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setTextColor(210, 228, 255)
    doc.text(`Vigente 30 días`, PW - MG, BAND / 2 + 5, { align: 'right' })

    let y = BAND + 8

    /* Cliente + Vehículo */
    const COL2 = PW / 2 + 2
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
    doc.text('CLIENTE', MG, y); doc.text('VEHÍCULO', COL2, y); y += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC9)
    doc.text(cliente?.nombre ?? '—', MG, y)
    doc.text(`${vehiculo?.marca ?? ''} ${vehiculo?.modelo ?? ''}`.trim() || '—', COL2, y); y += 5
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC7)
    if (cliente?.telefono) { doc.text(`Tel: ${cliente.telefono}`, MG, y) }
    if (vehiculo?.anio) { doc.text(`Año: ${vehiculo.anio}`, COL2, y) }
    y += 8

    /* Hallazgos */
    if (d.hallazgos) {
      doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 5
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
      doc.text('HALLAZGOS DEL DIAGNÓSTICO', MG, y); y += 5
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC7)
      const lines = doc.splitTextToSize(d.hallazgos, CW)
      doc.text(lines, MG, y); y += lines.length * 5 + 4
    }

    doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 5

    /* Tabla */
    const COL = { cant: MG, desc: MG + 16, punit: PW - MG - 28, imp: PW - MG }
    doc.setFillColor(...BLUE); doc.rect(MG, y, CW, 8.5, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text('CANT.', COL.cant + 2, y + 6); doc.text('DESCRIPCIÓN', COL.desc + 2, y + 6)
    doc.text('P. UNIT.', COL.punit, y + 6, { align: 'right' }); doc.text('IMPORTE', COL.imp - 2, y + 6, { align: 'right' })
    y += 8.5

    let rowIdx = 0
    const drawRow = (cant: string, desc: string, punit: string, imp: string, rowColor?: [number,number,number]) => {
      const bg = rowColor ?? (rowIdx % 2 === 0 ? WHITE : ROW_ALT)
      doc.setFillColor(...bg); doc.rect(MG, y, CW, 7.5, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC9)
      doc.text(cant, COL.cant + 2, y + 5)
      doc.text(doc.splitTextToSize(desc, COL.punit - COL.desc - 4)[0], COL.desc + 2, y + 5)
      doc.setTextColor(...ZINC7); doc.text(punit, COL.punit, y + 5, { align: 'right' })
      doc.setFont('helvetica', 'bold'); doc.text(imp, COL.imp - 2, y + 5, { align: 'right' })
      doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.2); doc.line(MG, y + 7.5, PW - MG, y + 7.5)
      y += 7.5; rowIdx++
    }

    if (d.servicios?.length > 0) {
      doc.setFillColor(...BLUEBG); doc.rect(MG, y, CW, 6, 'F')
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
      doc.text('SERVICIOS RECOMENDADOS', COL.desc + 2, y + 4.2); y += 6; rowIdx = 0
      for (const s of d.servicios) drawRow('1', s.nombre, fmt(s.precio), fmt(s.precio))
    }

    if (d.piezas?.length > 0) {
      doc.setFillColor(...AMBERBG); doc.rect(MG, y, CW, 6, 'F')
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...AMBER)
      doc.text('REFACCIONES ESTIMADAS', COL.desc + 2, y + 4.2); y += 6; rowIdx = 0
      for (const p of d.piezas) drawRow(String(p.cantidad), p.descripcion, fmt(p.precioUnitario), fmt(p.cantidad * p.precioUnitario))
    }

    y += 4

    /* Totales */
    const TOTAL_X = PW - MG - 70
    if (d.piezas?.length > 0) {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC5)
      doc.text('Servicios:', TOTAL_X, y); doc.setTextColor(...ZINC7); doc.text(fmt(d.servicios.reduce((s, x) => s + x.precio, 0)), PW - MG - 2, y, { align: 'right' }); y += 5.5
      doc.setTextColor(...ZINC5); doc.text('Refacciones:', TOTAL_X, y); doc.setTextColor(...AMBER); doc.text(fmt(d.piezas.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0)), PW - MG - 2, y, { align: 'right' }); y += 5.5
    }
    y += 2
    doc.setFillColor(...BLUE); doc.roundedRect(TOTAL_X - 4, y - 5, PW - MG - TOTAL_X + 6, 11, 2, 2, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text('PRESUPUESTO ESTIMADO:', TOTAL_X, y + 2); doc.text(fmt(d.total_estimado), PW - MG - 2, y + 2, { align: 'right' })
    y += 14

    /* Observaciones */
    doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 6
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
    doc.text('OBSERVACIONES / NOTAS:', MG, y); y += 5
    for (let i = 0; i < 3; i++) { doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.line(MG, y, PW - MG, y); y += 7 }
    y += 4

    /* Firmas */
    const firmaW = (CW - 10) / 2
    doc.setDrawColor(...ZINC5); doc.setLineWidth(0.4)
    doc.line(MG, y, MG + firmaW, y); doc.line(MG + firmaW + 10, y, PW - MG, y); y += 5
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC5)
    doc.text('Firma del cliente', MG + firmaW / 2, y, { align: 'center' })
    doc.text('Autorización del taller', MG + firmaW + 10 + firmaW / 2, y, { align: 'center' })
    y += 8

    /* Garantía + vigencia (debajo de firmas) */
    doc.setFillColor(...BLUEBG); doc.roundedRect(MG, y, CW, 8, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
    doc.text('Este presupuesto tiene vigencia de 30 días a partir de la fecha de emisión.', MG + 4, y + 5.5)
    y += 12

    /* Footer */
    doc.setFillColor(...ZINC1); doc.rect(0, PH - 10, PW, 10, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC5)
    doc.text(`${nombreTaller}  ·  Diagnóstico y Presupuesto  ·  ${fecha}`, MG, PH - 3.5)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
    doc.text('AutoCoreFix', PW - MG, PH - 3.5, { align: 'right' })

    window.open(URL.createObjectURL(doc.output('blob')), '_blank')
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Diagnóstico y Presupuesto</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Registra hallazgos y entrega un presupuesto al cliente</p>
        </div>
        {vista === 'lista' ? (
          <button
            onClick={() => setVista('nuevo')}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo diagnóstico
          </button>
        ) : (
          <button
            onClick={() => { setVista('lista'); limpiarCliente(); setHallazgos(''); setItems([]); setPiezas([]); setError('') }}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 px-4 py-2.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
        )}
      </div>

      {/* ── LISTA ── */}
      {vista === 'lista' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {diagnosticos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
              <FileSearch className="w-10 h-10 text-zinc-300" />
              <p className="text-sm">No hay diagnósticos registrados</p>
              <button onClick={() => setVista('nuevo')} className="text-sm text-[#2563EB] font-medium hover:underline">
                Crear el primero
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Cliente</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Vehículo</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Hallazgos</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Estado</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-right">Estimado</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">Vigencia</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {diagnosticos.map(d => {
                  const dias = diasRestantes(d.created_at)
                  const estilo = ESTADO_STYLES[d.estado] ?? ESTADO_STYLES['pendiente']
                  return (
                    <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-zinc-800">{d.clientes?.nombre ?? '—'}</td>
                      <td className="hidden sm:table-cell px-5 py-4 text-zinc-500">
                        {d.vehiculos ? `${d.vehiculos.marca} ${d.vehiculos.modelo} ${d.vehiculos.anio ?? ''}` : '—'}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4 text-zinc-500 max-w-[200px]">
                        <p className="truncate text-xs">{d.hallazgos || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={d.estado}
                          onChange={e => cambiarEstado(d.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 ring-inset border-none focus:outline-none cursor-pointer ${estilo.badge}`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="no_aprobado">No aprobado</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-zinc-800">{fmt(d.total_estimado)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-semibold ${dias <= 5 ? 'text-red-500' : dias <= 10 ? 'text-amber-600' : 'text-zinc-500'}`}>
                          {dias}d
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => generarPDF(d)}
                            title="PDF"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </button>
                          {d.estado === 'aprobado' && (
                            <button
                              onClick={() => convertirAOrden(d)}
                              disabled={convirtiendo === d.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                              {convirtiendo === d.id ? 'Creando…' : 'Orden'}
                            </button>
                          )}
                          {deletingId === d.id ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <button onClick={() => eliminarDiagnostico(d.id)} className="text-red-500 font-semibold hover:underline">Sí, eliminar</button>
                              <button onClick={() => setDeletingId(null)} className="text-zinc-400 hover:underline">No</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeletingId(d.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── NUEVO FORMULARIO ── */}
      {vista === 'nuevo' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* LEFT */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Cliente */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Cliente</h2>
              {cliente ? (
                <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{cliente.nombre}</p>
                    <p className="text-xs text-zinc-500">{cliente.cliente_id} · {cliente.telefono}</p>
                  </div>
                  <button onClick={limpiarCliente} className="text-zinc-400 hover:text-zinc-600 ml-3">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : modoNuevoCliente ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo cliente</p>
                    <button onClick={() => { setModoNuevoCliente(false); setNuevoCliente({ nombre: '', telefono: '', email: '' }) }}>
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                  <input className={INPUT} placeholder="Nombre completo *" value={nuevoCliente.nombre} onChange={e => setNuevoCliente(p => ({ ...p, nombre: e.target.value }))} />
                  <input className={INPUT} placeholder="Teléfono" value={nuevoCliente.telefono} onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                      placeholder="Nombre, teléfono o ID..."
                      value={query}
                      onChange={e => buscarClientes(e.target.value)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    />
                    {showDropdown && resultados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
                        {resultados.map(c => (
                          <button key={c.id} onMouseDown={() => seleccionarCliente(c)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 border-b border-zinc-50 last:border-0">
                            <span className="font-medium text-zinc-900">{c.nombre}</span>
                            <span className="text-zinc-400 ml-2 text-xs">{c.cliente_id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setModoNuevoCliente(true)} className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit">
                    <UserPlus className="w-4 h-4" /> Registrar nuevo cliente
                  </button>
                </div>
              )}
            </div>

            {/* Vehículo */}
            {hayCliente && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-4">Selecciona el vehículo</h2>
                {vehiculosCliente.length > 0 && !modoNuevoVehiculo && (
                  <div className="flex flex-col gap-2 mb-3">
                    {vehiculosCliente.map(v => (
                      <button key={v.id} onClick={() => setVehiculoSeleccionado(v)}
                        className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${vehiculoSeleccionado?.id === v.id ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 border-zinc-300 hover:bg-amber-50 hover:border-amber-300'}`}>
                        <Car className={`w-4 h-4 shrink-0 ${vehiculoSeleccionado?.id === v.id ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-amber-500'}`} />
                        <span className={`text-sm font-medium ${vehiculoSeleccionado?.id === v.id ? 'text-emerald-700' : 'text-zinc-800 group-hover:text-amber-700'}`}>{v.marca} {v.modelo} {v.anio}</span>
                      </button>
                    ))}
                  </div>
                )}
                {modoNuevoVehiculo ? (
                  <div className="flex flex-col gap-3">
                    {vehiculosCliente.length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo vehículo</p>
                        <button onClick={() => setModoNuevoVehiculo(false)}><X className="w-4 h-4 text-zinc-400" /></button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <input className={INPUT} placeholder="Marca *" value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo(p => ({ ...p, marca: e.target.value }))} />
                      <input className={INPUT} placeholder="Modelo *" value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo(p => ({ ...p, modelo: e.target.value }))} />
                    </div>
                    <input className={INPUT} placeholder="Año (opcional)" type="number" min="1990" max="2030" value={nuevoVehiculo.anio} onChange={e => setNuevoVehiculo(p => ({ ...p, anio: e.target.value }))} />
                  </div>
                ) : (
                  <button onClick={() => { setModoNuevoVehiculo(true); setVehiculoSeleccionado(null) }} className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit">
                    <Car className="w-4 h-4" /> {vehiculosCliente.length > 0 ? 'Agregar otro vehículo' : 'Registrar vehículo'}
                  </button>
                )}
              </div>
            )}

            {/* Hallazgos */}
            {hayCliente && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-1">Hallazgos del diagnóstico</h2>
                <p className="text-xs text-zinc-500 mb-3">¿Qué encontraste al revisar el vehículo?</p>
                <textarea
                  placeholder="Ej. Motor con pérdida de potencia, correa de distribución desgastada, frenos delanteros al límite de desgaste..."
                  value={hallazgos}
                  onChange={e => setHallazgos(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Refacciones estimadas */}
            {hayCliente && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Package className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-zinc-900">Refacciones estimadas</h2>
                  </div>
                  <p className="text-xs text-zinc-500 pl-6">Piezas que probablemente se necesitarán</p>
                </div>
                {piezas.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {piezas.map(p => (
                      <div key={p.tempId} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-800 truncate">{p.descripcion}</p>
                          {p.cantidad > 1 && <p className="text-xs text-amber-600">×{p.cantidad} — {fmt(p.precioUnitario)} c/u</p>}
                        </div>
                        <span className="text-sm font-semibold text-amber-700 shrink-0">{fmt(p.cantidad * p.precioUnitario)}</span>
                        <button onClick={() => setPiezas(prev => prev.filter(x => x.tempId !== p.tempId))} className="text-red-400 hover:text-red-600 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input placeholder="Descripción de la pieza" value={nuevaPieza.descripcion} onChange={e => setNuevaPieza(p => ({ ...p, descripcion: e.target.value }))} onKeyDown={e => e.key === 'Enter' && agregarPieza()} className={INPUT} />
                  <div className="flex gap-2 items-center">
                    <input type="number" min="1" placeholder="×1" value={nuevaPieza.cantidad} onChange={e => setNuevaPieza(p => ({ ...p, cantidad: e.target.value }))}
                      className="w-14 shrink-0 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900 text-center placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                      <input type="number" min="0" placeholder="Precio unit." value={nuevaPieza.precio} onChange={e => setNuevaPieza(p => ({ ...p, precio: e.target.value }))} onKeyDown={e => e.key === 'Enter' && agregarPieza()}
                        className="w-full rounded-lg border border-zinc-300 pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                    </div>
                    <button onClick={agregarPieza} title="Agregar" className="flex items-center justify-center w-9 h-9 shrink-0 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Servicios recomendados */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Servicios recomendados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categorias.map(cat => {
                  const Icon = CATEGORIA_ICONS[cat.nombre] ?? Settings2
                  const active = categoriaActiva === cat.id
                  return (
                    <button key={cat.id} onClick={() => setCategoriaActiva(prev => prev === cat.id ? null : cat.id)}
                      className={`group flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-3 rounded-xl border text-left transition-all ${active ? 'bg-[#2563EB] border-[#2563EB] shadow-sm' : 'bg-zinc-50 border-zinc-300 hover:bg-[#2563EB] hover:border-[#2563EB] hover:shadow-sm'}`}>
                      <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 transition-colors ${active ? 'bg-white/20' : 'bg-blue-50 group-hover:bg-white/20'}`}>
                        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${active ? 'text-white' : 'text-[#2563EB] group-hover:text-white'}`} strokeWidth={2} />
                      </div>
                      <span className={`text-xs sm:text-sm font-medium leading-tight break-words transition-colors ${active ? 'text-white' : 'text-zinc-700 group-hover:text-white'}`}>{cat.nombre}</span>
                    </button>
                  )
                })}
              </div>
              {categoriaActiva && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <p className="text-xs font-medium text-zinc-600 uppercase tracking-wide mb-3">
                    {categorias.find(c => c.id === categoriaActiva)?.nombre}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {serviciosIniciales.filter(s => s.categorias.id === categoriaActiva).map(s => {
                      const agregado = items.some(i => i.nombre === s.nombre)
                      return (
                        <button key={s.id} onClick={() => agregarServicio(s)} disabled={agregado}
                          className={`rounded-lg px-3 py-2 text-sm border transition-colors ${agregado ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default' : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-blue-50 hover:text-[#2563EB] hover:border-blue-200'}`}>
                          {s.nombre}
                          <span className="ml-1.5 text-xs opacity-60">${s.precio_base.toLocaleString('es-MX')}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Resumen presupuesto */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Resumen del presupuesto</h2>
              </div>

              {items.length === 0 && piezas.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-zinc-500">
                  Selecciona servicios recomendados o agrega refacciones
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-3">
                  {items.length > 0 && (
                    <div className="rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                        <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest">Servicios recomendados</span>
                      </div>
                      <div className="bg-white divide-y divide-zinc-50">
                        {items.map(item => (
                          <div key={item.tempId} className="flex items-center justify-between px-4 py-3 gap-3">
                            <span className="text-sm text-zinc-800 font-medium flex-1">{item.nombre}</span>
                            <span className="text-sm font-semibold text-zinc-700 shrink-0">{fmt(item.precio)}</span>
                            <button onClick={() => setItems(prev => prev.filter(i => i.tempId !== item.tempId))} className="text-red-400 hover:text-red-600 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {piezas.length > 0 && (
                    <div className="rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Refacciones estimadas</span>
                      </div>
                      <div className="bg-white divide-y divide-amber-50">
                        {piezas.map(p => (
                          <div key={p.tempId} className="flex items-center justify-between px-4 py-3 gap-3">
                            <span className="text-sm text-zinc-700 flex-1">{p.descripcion}{p.cantidad > 1 && <span className="text-amber-600 ml-2 text-xs font-semibold">×{p.cantidad}</span>}</span>
                            <span className="text-sm font-semibold text-amber-700 shrink-0">{fmt(p.cantidad * p.precioUnitario)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    <div className="bg-white px-4 py-3 flex justify-between text-sm">
                      <span className="text-zinc-800 font-semibold">Total estimado</span>
                      <span className="font-bold text-zinc-900">{fmt(totalEstimado)}</span>
                    </div>
                    <div className="bg-[#2563EB] px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Presupuesto total</span>
                      <span className="text-xl font-bold text-white">{fmt(totalEstimado)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={guardarDiagnostico}
                disabled={loading}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando…' : 'Guardar diagnóstico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
