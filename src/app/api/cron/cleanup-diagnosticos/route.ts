import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Vercel envía automáticamente CRON_SECRET como Bearer token
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const treintaDiasAtras = new Date()
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30)

  const { error, count } = await (admin as any)
    .from('diagnosticos')
    .delete({ count: 'exact' })
    .lt('created_at', treintaDiasAtras.toISOString())

  if (error) {
    console.error('[cron cleanup-diagnosticos]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[cron] Eliminados ${count ?? 0} diagnósticos vencidos`)
  return NextResponse.json({ eliminados: count ?? 0 })
}
