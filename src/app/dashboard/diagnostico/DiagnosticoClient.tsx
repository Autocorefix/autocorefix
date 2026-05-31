'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, X, Trash2, Car, Plus, FileText, FileSearch, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

/* ── Types ── */
type Cliente  = { id: string; nombre: string; telefono: string | null; cliente_id: string | null }
type Vehiculo = { id: string; marca: string | null; modelo: string | null; anio: number | null }
type Linea    = { tempId: string; descripcion: string; precio: number }
type Diagnostico = {
  id: string; hallazgos: string
  servicios: { descripcion: string; precio: number }[]
  total_estimado: number; estado: string; created_at: string
  clientes: { nombre: string; telefono: string | null } | null
  vehiculos: { marca: string | null; modelo: string | null; anio: number | null } | null
}

const ESTADO_STYLES: Record<string, { label: string; badge: string }> = {
  pendiente: { label: 'Pendiente', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  aprobado:  { label: 'Aprobado',  badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

function diasRestantes(created_at: string) {
  const expira = new Date(new Date(created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
  return Math.max(0, Math.ceil((expira.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}

const INPUT = 'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent w-full'

export default function DiagnosticoClient({
  diagnosticosIniciales,
  tenantId,
  prefijo,
  nombreTaller,
  logoUrl,
}: {
  serviciosIniciales: any[]
  diagnosticosIniciales: Diagnostico[]
  tenantId: string
  prefijo: string
  nombreTaller: string
  logoUrl: string | null
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [vista,        setVista]        = useState<'lista' | 'nuevo'>('lista')
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>(diagnosticosIniciales)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [convirtiendo, setConvirtiendo] = useState<string | null>(null)

  /* Cliente */
  const [query,            setQuery]            = useState('')
  const [resultados,       setResultados]       = useState<Cliente[]>([])
  const [showDropdown,     setShowDropdown]     = useState(false)
  const [cliente,          setCliente]          = useState<Cliente | null>(null)
  const [modoNuevo,        setModoNuevo]        = useState(false)
  const [nuevoCliente,     setNuevoCliente]     = useState({ nombre: '', telefono: '' })

  /* Vehículo */
  const [vehiculos,       setVehiculos]       = useState<Vehiculo[]>([])
  const [vehiculo,        setVehiculo]        = useState<Vehiculo | null>(null)
  const [modoNuevoVeh,    setModoNuevoVeh]    = useState(false)
  const [nuevoVehiculo,   setNuevoVehiculo]   = useState({ marca: '', modelo: '', anio: '' })

  /* Contenido */
  const [hallazgos,   setHallazgos]   = useState('')
  const [lineas,      setLineas]      = useState<Linea[]>([])
  const [nuevaLinea,  setNuevaLinea]  = useState({ descripcion: '', precio: '' })

  /* Estado */
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const total   = lineas.reduce((s, l) => s + l.precio, 0)
  const fmt     = (n: number) => `$${n.toLocaleString('es-MX')}`
  const hayCliente = cliente || modoNuevo

  /* ── Cliente ── */
  async function buscarClientes(q: string) {
    setQuery(q)
    if (q.length < 2) { setResultados([]); setShowDropdown(false); return }
    const { data } = await supabase.from('clientes').select('*')
      .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,cliente_id.ilike.%${q}%`).limit(5)
    setResultados(data ?? [])
    setShowDropdown(true)
  }

  async function seleccionarCliente(c: Cliente) {
    setCliente(c); setQuery(''); setShowDropdown(false); setModoNuevo(false)
    const { data } = await supabase.from('vehiculos').select('*').eq('cliente_id', c.id)
    setVehiculos(data ?? [])
    setVehiculo(null)
    setModoNuevoVeh((data ?? []).length === 0)
  }

  function resetForm() {
    setCliente(null); setQuery(''); setModoNuevo(false); setNuevoCliente({ nombre: '', telefono: '' })
    setVehiculos([]); setVehiculo(null); setModoNuevoVeh(false); setNuevoVehiculo({ marca: '', modelo: '', anio: '' })
    setHallazgos(''); setLineas([]); setNuevaLinea({ descripcion: '', precio: '' }); setError('')
  }

  /* ── Líneas ── */
  function agregarLinea() {
    const desc  = nuevaLinea.descripcion.trim()
    const precio = parseFloat(nuevaLinea.precio) || 0
    if (!desc) return
    setLineas(prev => [...prev, { tempId: Date.now().toString(), descripcion: desc, precio }])
    setNuevaLinea({ descripcion: '', precio: '' })
  }

  /* ── Guardar ── */
  async function guardar() {
    setError('')
    if (!cliente && !modoNuevo)                    { setError('Selecciona o registra un cliente.'); return }
    if (modoNuevo && !nuevoCliente.nombre.trim())  { setError('El nombre del cliente es requerido.'); return }
    if (!vehiculo && !modoNuevoVeh)                { setError('Selecciona o registra un vehículo.'); return }
    if (modoNuevoVeh && !nuevoVehiculo.marca)      { setError('Ingresa al menos la marca del vehículo.'); return }
    if (!hallazgos.trim() && lineas.length === 0)  { setError('Agrega hallazgos o al menos un trabajo estimado.'); return }

    setLoading(true)
    try {
      let clienteId = cliente?.id
      if (modoNuevo) {
        const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
        const codigo = `${prefijo}-${String((count ?? 0) + 1).padStart(4, '0')}`
        const { data, error: e } = await supabase.from('clientes')
          .insert({ nombre: nuevoCliente.nombre.trim(), telefono: nuevoCliente.telefono || null, tenant_id: tenantId, cliente_id: codigo })
          .select('id').single()
        if (e) throw new Error('Error al crear cliente')
        clienteId = data.id
      }

      let vehiculoId = vehiculo?.id
      if (modoNuevoVeh) {
        const { data, error: e } = await supabase.from('vehiculos')
          .insert({ marca: nuevoVehiculo.marca.trim(), modelo: nuevoVehiculo.modelo.trim() || null, anio: nuevoVehiculo.anio ? Number(nuevoVehiculo.anio) : null, cliente_id: clienteId, tenant_id: tenantId })
          .select('id').single()
        if (e) throw new Error('Error al crear vehículo')
        vehiculoId = data.id
      }

      const { error: e } = await (supabase as any).from('diagnosticos').insert({
        tenant_id:      tenantId,
        cliente_id:     clienteId,
        vehiculo_id:    vehiculoId,
        hallazgos:      hallazgos.trim(),
        servicios:      lineas.map(l => ({ descripcion: l.descripcion, precio: l.precio })),
        piezas:         [],
        total_estimado: total,
        estado:         'pendiente',
      })
      if (e) throw new Error(e.message)

      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: fresh } = await (supabase as any).from('diagnosticos')
        .select('id, hallazgos, servicios, piezas, total_estimado, estado, created_at, clientes(nombre, telefono), vehiculos(marca, modelo, anio)')
        .gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false })
      setDiagnosticos(fresh ?? [])
      resetForm(); setVista('lista')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
    setLoading(false)
  }

  /* ── Estado / Eliminar / Convertir ── */
  async function cambiarEstado(id: string, estado: string) {
    await (supabase as any).from('diagnosticos').update({ estado }).eq('id', id)
    setDiagnosticos(prev => prev.map(d => d.id === id ? { ...d, estado } : d))
  }

  async function eliminar(id: string) {
    await (supabase as any).from('diagnosticos').delete().eq('id', id)
    setDiagnosticos(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  async function convertir(d: Diagnostico) {
    setConvirtiendo(d.id)
    const res = await fetch('/api/diagnostico/convertir', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticoId: d.id }),
    })
    const data = await res.json()
    if (res.ok && data.ordenId) {
      // Eliminar el diagnóstico — ya está en órdenes, no tiene caso mantenerlo aquí
      await (supabase as any).from('diagnosticos').delete().eq('id', d.id)
      setDiagnosticos(prev => prev.filter(x => x.id !== d.id))
      router.push(`/dashboard/ordenes/${data.ordenId}`)
    }
    setConvirtiendo(null)
  }

  /* ── PDF ── */
  async function generarPDF(d: Diagnostico) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const PW = 210, PH = 297, MG = 14, CW = PW - MG * 2
    const BLUE:   [number,number,number] = [37, 99, 235]
    const BLUEDARK:[number,number,number]= [22, 73, 200]
    const WHITE:  [number,number,number] = [255, 255, 255]
    const ZINC9:  [number,number,number] = [24, 24, 27]
    const ZINC7:  [number,number,number] = [63, 63, 70]
    const ZINC5:  [number,number,number] = [113, 113, 122]
    const ZINC1:  [number,number,number] = [244, 244, 245]
    const BLUEBG: [number,number,number] = [219, 234, 254]
    const ROW_ALT:[number,number,number] = [248, 250, 252]

    const fmtN  = (n: number) => `$${n.toLocaleString('es-MX')}`
    const fecha = new Date(d.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

    /* Header azul */
    const BAND = 34
    doc.setFillColor(...BLUE); doc.rect(0, 0, PW, BAND, 'F')
    doc.setFillColor(...BLUEDARK); doc.rect(0, BAND - 1.2, PW, 1.2, 'F')

    let logoB64: string | null = null, logoW = 20, logoH = 20
    if (logoUrl) {
      try {
        const blob = await (await fetch(logoUrl)).blob()
        logoB64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob) })
        await new Promise<void>(resolve => { const img = new Image(); img.onload = () => { const ratio = img.naturalWidth / img.naturalHeight, MAX_W = 36, MAX_H = 20; if (ratio > MAX_W / MAX_H) { logoW = MAX_W; logoH = MAX_W / ratio } else { logoH = MAX_H; logoW = MAX_H * ratio }; resolve() }; img.onerror = () => resolve(); img.src = logoB64! })
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
    doc.text('Vigente 30 días', PW - MG, BAND / 2 + 5, { align: 'right' })

    let y = BAND + 8

    /* Cliente + Vehículo */
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
    doc.text('CLIENTE', MG, y); doc.text('VEHÍCULO', PW / 2 + 2, y); y += 5
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC9)
    doc.text(d.clientes?.nombre ?? '—', MG, y)
    doc.text(`${d.vehiculos?.marca ?? ''} ${d.vehiculos?.modelo ?? ''}`.trim() || '—', PW / 2 + 2, y); y += 5
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC7)
    if (d.clientes?.telefono) doc.text(`Tel: ${d.clientes.telefono}`, MG, y)
    if (d.vehiculos?.anio)    doc.text(`Año: ${d.vehiculos.anio}`, PW / 2 + 2, y)
    y += 8

    /* Hallazgos */
    if (d.hallazgos) {
      doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 6
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC5)
      doc.text('HALLAZGOS DEL DIAGNÓSTICO', MG, y); y += 5
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC7)
      const lines = doc.splitTextToSize(d.hallazgos, CW)
      doc.text(lines, MG, y); y += lines.length * 5 + 5
    }

    doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, y, PW - MG, y); y += 5

    /* Tabla de presupuesto */
    doc.setFillColor(...BLUE); doc.rect(MG, y, CW, 8.5, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text('DESCRIPCIÓN DEL TRABAJO', MG + 4, y + 6)
    doc.text('IMPORTE', PW - MG - 2, y + 6, { align: 'right' }); y += 8.5

    const lineasPDF = d.servicios ?? []
    lineasPDF.forEach((l, i) => {
      const bg: [number,number,number] = i % 2 === 0 ? WHITE : ROW_ALT
      doc.setFillColor(...bg); doc.rect(MG, y, CW, 7.5, 'F')
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ZINC9)
      doc.text(doc.splitTextToSize(l.descripcion, CW - 32)[0], MG + 4, y + 5.2)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC7)
      doc.text(fmtN(l.precio), PW - MG - 2, y + 5.2, { align: 'right' })
      doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.2); doc.line(MG, y + 7.5, PW - MG, y + 7.5)
      y += 7.5
    })

    y += 4

    /* Total — caja completa ancha, bien espaciada */
    doc.setFillColor(...BLUE); doc.roundedRect(MG, y, CW, 11, 2, 2, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
    doc.text('TOTAL ESTIMADO:', MG + 4, y + 7.5)
    doc.text(fmtN(d.total_estimado), PW - MG - 2, y + 7.5, { align: 'right' })

    /* ── SECCIÓN FIJA AL FONDO (posición absoluta desde PH) ── */
    const fw = (CW - 10) / 2

    /* Footer */
    doc.setFillColor(...ZINC1); doc.rect(0, PH - 10, PW, 10, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    doc.text(`${nombreTaller}  ·  Diagnóstico y Presupuesto  ·  ${fecha}`, MG, PH - 3.5)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
    doc.text('AutoCoreFix', PW - MG, PH - 3.5, { align: 'right' })

    /* Vigencia */
    doc.setFillColor(...BLUEBG); doc.roundedRect(MG, PH - 21, CW, 8, 1.5, 1.5, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE)
    doc.text('Este presupuesto tiene vigencia de 30 días a partir de la fecha de emisión.', MG + 4, PH - 15.5)

    /* Firmas */
    doc.setDrawColor(60, 60, 60); doc.setLineWidth(0.5)
    doc.line(MG, PH - 42, MG + fw, PH - 42)
    doc.line(MG + fw + 10, PH - 42, PW - MG, PH - 42)
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC9)
    doc.text('Firma del cliente', MG + fw / 2, PH - 37, { align: 'center' })
    doc.text('Autorización del taller', MG + fw + 10 + fw / 2, PH - 37, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
    doc.text('Acepto el presupuesto indicado y autorizo los trabajos descritos.', MG + fw / 2, PH - 33, { align: 'center' })

    /* Observaciones */
    doc.setDrawColor(...BLUEBG); doc.setLineWidth(0.5); doc.line(MG, PH - 76, PW - MG, PH - 76)
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ZINC9)
    doc.text('OBSERVACIONES / NOTAS:', MG, PH - 70)
    const obsY = [PH - 63, PH - 56, PH - 49]
    obsY.forEach(yLine => { doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.line(MG, yLine, PW - MG, yLine) })

    window.open(URL.createObjectURL(doc.output('blob')), '_blank')
  }

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Diagnóstico y Presupuesto</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Registra hallazgos y genera un presupuesto para el cliente</p>
        </div>
        {vista === 'lista' ? (
          <button onClick={() => setVista('nuevo')} className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nuevo diagnóstico
          </button>
        ) : (
          <button onClick={() => { resetForm(); setVista('lista') }} className="flex items-center gap-2 text-sm font-medium text-zinc-600 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 px-4 py-2.5 rounded-lg transition-colors">
            <X className="w-4 h-4" /> Cancelar
          </button>
        )}
      </div>

      {/* ── LISTA ── */}
      {vista === 'lista' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {diagnosticos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
              <FileSearch className="w-10 h-10 text-zinc-300" />
              <p className="text-sm">No hay diagnósticos registrados</p>
              <button onClick={() => setVista('nuevo')} className="text-sm text-[#2563EB] font-medium hover:underline">Crear el primero</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Cliente</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Vehículo</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-right">Estimado</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">Días</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {diagnosticos.map(d => {
                  const dias      = diasRestantes(d.created_at)
                  const aprobado  = d.estado === 'aprobado'
                  return (
                    <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-zinc-800">{d.clientes?.nombre ?? '—'}</p>
                        {aprobado && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Convertida a Orden
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4 text-zinc-500 text-sm">
                        {d.vehiculos ? `${d.vehiculos.marca ?? ''} ${d.vehiculos.modelo ?? ''} ${d.vehiculos.anio ?? ''}`.trim() : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-zinc-800">{fmt(d.total_estimado)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-semibold ${dias <= 5 ? 'text-red-500' : dias <= 10 ? 'text-amber-600' : 'text-zinc-500'}`}>{dias}d</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => generarPDF(d)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </button>
                          {!aprobado && (
                            <button onClick={() => convertir(d)} disabled={convirtiendo === d.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {convirtiendo === d.id ? 'Creando orden…' : 'Cliente aprobó'}
                            </button>
                          )}
                          {deletingId === d.id ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <button onClick={() => eliminar(d.id)} className="text-red-500 font-semibold hover:underline">Sí</button>
                              <button onClick={() => setDeletingId(null)} className="text-zinc-400 hover:underline">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setDeletingId(d.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar diagnóstico">
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

      {/* ── FORMULARIO NUEVO ── */}
      {vista === 'nuevo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Cliente + Vehículo */}
          <div className="flex flex-col gap-5">

            {/* Cliente */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Cliente</h2>
              {cliente ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{cliente.nombre}</p>
                    <p className="text-xs text-zinc-500">{cliente.cliente_id} · {cliente.telefono}</p>
                  </div>
                  <button onClick={() => { setCliente(null); setVehiculos([]); setVehiculo(null); setModoNuevoVeh(false) }} className="text-zinc-400 hover:text-zinc-600 ml-3"><X className="w-4 h-4" /></button>
                </div>
              ) : modoNuevo ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo cliente</p>
                    <button onClick={() => { setModoNuevo(false); setNuevoCliente({ nombre: '', telefono: '' }) }}><X className="w-4 h-4 text-zinc-400" /></button>
                  </div>
                  <input className={INPUT} placeholder="Nombre completo *" value={nuevoCliente.nombre} onChange={e => setNuevoCliente(p => ({ ...p, nombre: e.target.value }))} />
                  <input className={INPUT} placeholder="Teléfono (opcional)" value={nuevoCliente.telefono} onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                      placeholder="Nombre, teléfono o ID..." value={query}
                      onChange={e => buscarClientes(e.target.value)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)} />
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
                  <button onClick={() => setModoNuevo(true)} className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit">
                    <UserPlus className="w-4 h-4" /> Registrar nuevo cliente
                  </button>
                </div>
              )}
            </div>

            {/* Vehículo */}
            {hayCliente && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-4">Selecciona el vehículo</h2>
                {vehiculos.length > 0 && !modoNuevoVeh && (
                  <div className="flex flex-col gap-2 mb-3">
                    {vehiculos.map(v => (
                      <button key={v.id} onClick={() => setVehiculo(v)}
                        className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${vehiculo?.id === v.id ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 border-zinc-300 hover:bg-amber-50 hover:border-amber-300'}`}>
                        <Car className={`w-4 h-4 shrink-0 ${vehiculo?.id === v.id ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-amber-500'}`} />
                        <span className={`text-sm font-medium ${vehiculo?.id === v.id ? 'text-emerald-700' : 'text-zinc-800 group-hover:text-amber-700'}`}>{v.marca} {v.modelo} {v.anio}</span>
                      </button>
                    ))}
                  </div>
                )}
                {modoNuevoVeh ? (
                  <div className="flex flex-col gap-3">
                    {vehiculos.length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nuevo vehículo</p>
                        <button onClick={() => setModoNuevoVeh(false)}><X className="w-4 h-4 text-zinc-400" /></button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <input className={INPUT} placeholder="Marca *" value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo(p => ({ ...p, marca: e.target.value }))} />
                      <input className={INPUT} placeholder="Modelo" value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo(p => ({ ...p, modelo: e.target.value }))} />
                    </div>
                    <input className={INPUT} placeholder="Año (opcional)" type="number" value={nuevoVehiculo.anio} onChange={e => setNuevoVehiculo(p => ({ ...p, anio: e.target.value }))} />
                  </div>
                ) : (
                  <button onClick={() => { setModoNuevoVeh(true); setVehiculo(null) }} className="flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline w-fit">
                    <Car className="w-4 h-4" /> {vehiculos.length > 0 ? 'Agregar otro vehículo' : 'Registrar vehículo'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Hallazgos + Presupuesto */}
          <div className="flex flex-col gap-5">

            {/* Hallazgos */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Hallazgos del diagnóstico</h2>
              <p className="text-xs text-zinc-500 mb-3">¿Qué encontraste al revisar el vehículo?</p>
              <textarea
                placeholder="Ej. Motor con pérdida de potencia, correa de distribución desgastada, frenos delanteros al límite..."
                value={hallazgos}
                onChange={e => setHallazgos(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              />
            </div>

            {/* Líneas de presupuesto */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Trabajos y costo estimado</h2>
              <p className="text-xs text-zinc-500 mb-4">Agrega cada trabajo con su precio aproximado</p>

              {/* Input primera — siempre arriba */}
              <div className="flex gap-2 items-center mb-3">
                <input
                  placeholder="Descripción del trabajo o pieza..."
                  value={nuevaLinea.descripcion}
                  onChange={e => setNuevaLinea(p => ({ ...p, descripcion: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && agregarLinea()}
                  className={INPUT}
                />
                <div className="relative w-28 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                  <input
                    type="number" min="0" placeholder="Precio"
                    value={nuevaLinea.precio}
                    onChange={e => setNuevaLinea(p => ({ ...p, precio: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && agregarLinea()}
                    className="w-full rounded-lg border border-zinc-300 pl-7 pr-2 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
                <button onClick={agregarLinea} title="Agregar" className="flex items-center justify-center w-9 h-9 shrink-0 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Lista debajo del input */}
              {lineas.length > 0 && (
                <div className="flex flex-col divide-y divide-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
                  {lineas.map((l, i) => (
                    <div key={l.tempId} className={`flex items-center justify-between px-4 py-3 gap-3 ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60'}`}>
                      <span className="text-sm text-zinc-800 font-medium flex-1">{l.descripcion}</span>
                      <span className="text-sm font-semibold text-zinc-700 shrink-0">{fmt(l.precio)}</span>
                      <button onClick={() => setLineas(prev => prev.filter(x => x.tempId !== l.tempId))} className="text-red-400 hover:text-red-600 shrink-0 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total + acciones */}
            {(lineas.length > 0 || hallazgos.trim()) && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                {lineas.length > 0 && (
                  <div className="px-5 py-4 flex justify-between items-center border-b border-zinc-100">
                    <span className="text-sm font-semibold text-zinc-800">Total estimado</span>
                    <span className="text-lg font-bold text-zinc-900">{fmt(total)}</span>
                  </div>
                )}
                <div className="bg-[#2563EB] px-5 py-3.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Presupuesto total</span>
                  <span className="text-xl font-bold text-white">{fmt(total)}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

            <button onClick={guardar} disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar diagnóstico'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
