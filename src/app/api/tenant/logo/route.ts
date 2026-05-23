import { createClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { logoUrl } = await request.json()

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('tenants')
    .update({ logo_url: logoUrl } as any)
    .eq('id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: 'Error al guardar logo' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
