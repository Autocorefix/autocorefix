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

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const storagePath = `${usuario.tenant_id}/logo.png`
  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  const { error: uploadErr } = await admin.storage
    .from('logos')
    .upload(storagePath, buffer, { upsert: true, contentType: 'image/png' })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = admin.storage.from('logos').getPublicUrl(storagePath)

  // Also update tenants.logo_url
  await (admin.from('tenants') as any).update({ logo_url: urlData.publicUrl }).eq('id', usuario.tenant_id)

  return NextResponse.json({ publicUrl: urlData.publicUrl })
}
