import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function assertSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return null
  return user
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const caller = await assertSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'غير مصرّح' }, { status: 403 })

  const body = await req.json()
  const { action, userId, newPassword } = body as { action: string; userId: string; newPassword?: string }
  if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })

  const admin = adminClient()

  if (action === 'set_password') {
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    if (userId === caller.id) return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 })
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
}
