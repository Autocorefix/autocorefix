import { ClipboardList, Wrench, CheckCircle2, Banknote } from 'lucide-react'

const METRICS = [
  {
    label: 'Órdenes Recibidas',
    value: '8',
    icon: ClipboardList,
    iconBg: 'bg-sky-50',
    iconColor: 'text-[#0EA5E9]',
  },
  {
    label: 'En Proceso',
    value: '3',
    icon: Wrench,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  {
    label: 'Completadas',
    value: '5',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    label: 'Ingresos del Día',
    value: '$6,900',
    icon: Banknote,
    iconBg: 'bg-sky-50',
    iconColor: 'text-[#0EA5E9]',
  },
]

const ORDERS = [
  {
    id: 'ORD-001',
    cliente: 'Carlos Mendoza',
    vehiculo: 'Honda Civic 2019',
    servicio: 'Cambio de aceite sintético',
    estado: 'listo',
    total: '$850',
  },
  {
    id: 'ORD-002',
    cliente: 'María García',
    vehiculo: 'Toyota Corolla 2020',
    servicio: 'Balanceo y alineación',
    estado: 'en_proceso',
    total: '$650',
  },
  {
    id: 'ORD-003',
    cliente: 'Roberto Sánchez',
    vehiculo: 'Nissan Sentra 2018',
    servicio: 'Revisión de frenos',
    estado: 'recibido',
    total: '$1,200',
  },
  {
    id: 'ORD-004',
    cliente: 'Ana López',
    vehiculo: 'VW Jetta 2021',
    servicio: 'Reparación de clima',
    estado: 'en_proceso',
    total: '$2,800',
  },
  {
    id: 'ORD-005',
    cliente: 'Juan Pérez',
    vehiculo: 'Chevrolet Trax 2017',
    servicio: 'Scanner y diagnóstico',
    estado: 'listo',
    total: '$450',
  },
  {
    id: 'ORD-006',
    cliente: 'Lucía Torres',
    vehiculo: 'Ford Focus 2016',
    servicio: 'Cambio de balatas',
    estado: 'entregado',
    total: '$950',
  },
]

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  recibido:   { label: 'Recibido',   className: 'bg-sky-50 text-[#0EA5E9] ring-sky-100' },
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

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-0.5 capitalize">{today}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-8">
        {METRICS.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center gap-4">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
              <p className="text-xs text-zinc-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Órdenes de hoy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left">
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">#Orden</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Cliente</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Vehículo</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Servicio</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wide text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-zinc-800">{order.cliente}</td>
                  <td className="px-6 py-4 text-zinc-500">{order.vehiculo}</td>
                  <td className="px-6 py-4 text-zinc-500">{order.servicio}</td>
                  <td className="px-6 py-4"><StatusBadge estado={order.estado} /></td>
                  <td className="px-6 py-4 font-semibold text-zinc-800 text-right">{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
