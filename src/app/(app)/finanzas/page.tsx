import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase-admin'
import FinanzasClient from './FinanzasClient'

function isoDate(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('rol, tenant_id').eq('id', user.id).single()
  if (usuario?.rol !== 'admin') redirect('/dashboard')

  const params     = await searchParams
  const MX_OFFSET  = '-06:00'
  const nowMx      = new Date(new Date().getTime() - 6 * 3600 * 1000)
  const todayStr   = isoDate(nowMx)
  const adminClient = getAdminClient()
  const tenantId    = usuario!.tenant_id!

  // ── Calcular lunes de la semana actual (UTC-6) ──────────────────────────────
  const dow = nowMx.getUTCDay() // 0=Dom…6=Sáb
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const currMonday = new Date(nowMx)
  currMonday.setUTCDate(nowMx.getUTCDate() - daysFromMon)
  const currMondayStr = isoDate(currMonday)

  const prevMonday = new Date(currMonday)
  prevMonday.setUTCDate(currMonday.getUTCDate() - 7)
  const prevSunday = new Date(currMonday)
  prevSunday.setUTCDate(currMonday.getUTCDate() - 1)
  const prevMondayStr = isoDate(prevMonday)
  const prevSundayStr = isoDate(prevSunday)

  // ── Determinar rango a mostrar ──────────────────────────────────────────────
  const isManual = !!(params.desde || params.hasta)
  let desdeStr: string
  let hastaStr: string
  let showingPreviousWeek = false

  if (isManual) {
    desdeStr = params.desde!
    hastaStr = params.hasta!
  } else {
    // Detectar si hay actividad esta semana (órdenes, gastos o pagos)
    const semanaInicio = new Date(currMondayStr + 'T00:00:00' + MX_OFFSET).toISOString()
    const semanaFin    = new Date(todayStr      + 'T23:59:59' + MX_OFFSET).toISOString()

    const [{ count: cOrd }, { count: cGas }, { count: cPag }] = await Promise.all([
      adminClient.from('ordenes')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', semanaInicio)
        .lte('created_at', semanaFin),
      adminClient.from('egresos')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('fecha', currMondayStr)
        .lte('fecha', todayStr),
      (adminClient as any).from('pagos_trabajadores')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('fecha', currMondayStr)
        .lte('fecha', todayStr),
    ])

    const hayActividad = ((cOrd ?? 0) + (cGas ?? 0) + (cPag ?? 0)) > 0

    if (hayActividad) {
      desdeStr = currMondayStr
      hastaStr = todayStr
    } else {
      desdeStr = prevMondayStr
      hastaStr = prevSundayStr
      showingPreviousWeek = true
    }
  }

  const inicio = new Date(desdeStr + 'T00:00:00' + MX_OFFSET).toISOString()
  const fin    = new Date(hastaStr + 'T23:59:59' + MX_OFFSET).toISOString()

  const daysDiff         = Math.round((new Date(hastaStr).getTime() - new Date(desdeStr).getTime()) / 86400000) + 1
  const semanasEnPeriodo = Math.max(1, Math.round(daysDiff / 7))

  const [
    { data: ordenesRaw },
    { data: egresosRaw },
    { data: trabajadoresRaw },
    { data: ordenesComisionRaw },
    { data: pagosExtrasRaw },
  ] = await Promise.all([
    adminClient.from('ordenes')
      .select('total_cobrado')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio)
      .lte('created_at', fin),

    adminClient.from('egresos')
      .select('categoria, monto')
      .eq('tenant_id', tenantId)
      .gte('fecha', desdeStr)
      .lte('fecha', hastaStr),

    (adminClient as any).from('trabajadores')
      .select('id, nombre, especialidad, salario_semanal, comision_responsable_pct, comision_ayudante_pct')
      .eq('tenant_id', tenantId)
      .eq('activo', true)
      .order('nombre'),

    adminClient.from('ordenes')
      .select('total_cobrado, responsable_id, ayudante_id')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio)
      .lte('created_at', fin)
      .not('responsable_id', 'is', null),

    (adminClient as any).from('pagos_trabajadores')
      .select('trabajador_id, monto')
      .eq('tenant_id', tenantId)
      .gte('fecha', desdeStr)
      .lte('fecha', hastaStr),
  ])

  // Ingresos
  const totalIngresos = (ordenesRaw ?? []).reduce((s: number, o: any) => s + (o.total_cobrado ?? 0), 0)
  const countOrdenes  = (ordenesRaw ?? []).length

  // Egresos agrupados
  const egresosMap: Record<string, number> = {}
  ;(egresosRaw ?? []).forEach((e: any) => {
    egresosMap[e.categoria] = (egresosMap[e.categoria] ?? 0) + (e.monto ?? 0)
  })
  const totalEgresos = Object.values(egresosMap).reduce((s, v) => s + v, 0)

  // Comisiones por trabajador
  type TrabajadorCalc = {
    id: string; nombre: string; especialidad: string | null
    salario_semanal: number
    comisionResponsable: number; comisionAyudante: number; pagosExtra: number
  }
  const trabajadores: any[] = trabajadoresRaw ?? []
  const calcMap: Record<string, TrabajadorCalc> = {}
  trabajadores.forEach((t: any) => {
    calcMap[t.id] = {
      id: t.id, nombre: t.nombre, especialidad: t.especialidad,
      salario_semanal: t.salario_semanal,
      comisionResponsable: 0, comisionAyudante: 0, pagosExtra: 0,
    }
  })
  ;(ordenesComisionRaw ?? []).forEach((o: any) => {
    const total = o.total_cobrado ?? 0
    if (o.responsable_id && calcMap[o.responsable_id]) {
      const t = trabajadores.find((w: any) => w.id === o.responsable_id)
      if (t) calcMap[o.responsable_id].comisionResponsable += total * (t.comision_responsable_pct / 100)
    }
    if (o.ayudante_id && calcMap[o.ayudante_id]) {
      const t = trabajadores.find((w: any) => w.id === o.ayudante_id)
      if (t) calcMap[o.ayudante_id].comisionAyudante += total * (t.comision_ayudante_pct / 100)
    }
  })
  ;(pagosExtrasRaw ?? []).forEach((p: any) => {
    if (calcMap[p.trabajador_id]) calcMap[p.trabajador_id].pagosExtra += p.monto ?? 0
  })

  const nominaData  = Object.values(calcMap)
  const totalNomina = nominaData.reduce((s, t) =>
    s + t.salario_semanal * semanasEnPeriodo + t.comisionResponsable + t.comisionAyudante + t.pagosExtra, 0)

  return (
    <FinanzasClient
      totalIngresos={totalIngresos}
      countOrdenes={countOrdenes}
      egresosMap={egresosMap}
      totalEgresos={totalEgresos}
      nominaData={nominaData}
      totalNomina={totalNomina}
      semanasEnPeriodo={semanasEnPeriodo}
      daysDiff={daysDiff}
      desde={desdeStr}
      hasta={hastaStr}
      tenantId={tenantId}
      showingPreviousWeek={showingPreviousWeek}
    />
  )
}
