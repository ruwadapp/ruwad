import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VERCEL_API = 'https://api.vercel.com'

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return { ok: false as const }
  return { ok: true as const, supabase }
}

function vercelHeaders() {
  return { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' }
}
function teamQS() {
  return `teamId=${process.env.VERCEL_TEAM_ID}`
}

// إضافة دومين خاص لبوابة: يسجّله في مشروع Vercel ويعيد تعليمات DNS
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { portalId, domain } = await req.json()
  const clean = String(domain ?? '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!portalId || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean) || clean.endsWith('ruwaad.app')) {
    return NextResponse.json({ error: 'invalid_domain' }, { status: 400 })
  }

  const res = await fetch(`${VERCEL_API}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains?${teamQS()}`, {
    method: 'POST', headers: vercelHeaders(), body: JSON.stringify({ name: clean }),
  })
  const body = await res.json()
  if (!res.ok && body?.error?.code !== 'domain_already_in_use_by_project') {
    return NextResponse.json({ error: body?.error?.code ?? 'vercel_error' }, { status: 502 })
  }

  const { error } = await auth.supabase
    .from('institute_portals')
    .update({ custom_domain: clean, domain_status: 'pending_dns' })
    .eq('id', portalId)
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })

  return NextResponse.json({
    domain: clean,
    verification: body?.verification ?? null,
    dns: [
      { type: 'A', name: '@', value: '76.76.21.21', note: 'للدومين الجذر' },
      { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', note: 'اختياري لـ www' },
    ],
  })
}

// فحص حالة الدومين: هل اكتمل DNS؟
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const portalId = req.nextUrl.searchParams.get('portalId')
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase()
  if (!portalId || !domain) return NextResponse.json({ error: 'missing' }, { status: 400 })

  const res = await fetch(`${VERCEL_API}/v6/domains/${domain}/config?${teamQS()}`, { headers: vercelHeaders() })
  const cfg = await res.json()
  const ready = res.ok && cfg?.misconfigured === false

  if (ready) {
    await auth.supabase.from('institute_portals')
      .update({ domain_status: 'active' }).eq('id', portalId).eq('custom_domain', domain)
  }
  return NextResponse.json({ ready, misconfigured: cfg?.misconfigured ?? true })
}

// فك ربط الدومين
export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { portalId, domain } = await req.json()
  if (!portalId || !domain) return NextResponse.json({ error: 'missing' }, { status: 400 })

  await fetch(`${VERCEL_API}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${String(domain).toLowerCase()}?${teamQS()}`, {
    method: 'DELETE', headers: vercelHeaders(),
  })
  const { error } = await auth.supabase.from('institute_portals')
    .update({ custom_domain: null, domain_status: 'none' }).eq('id', portalId)
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
