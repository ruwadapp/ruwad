import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Users, Building2, Clock, UserCheck, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = { trainer: 'مدرب', student: 'طالب', institute_admin: 'معهد' }
const fmt = (n: number) => Number(n).toLocaleString('ar')

export default async function SuperAdminDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [{ count: trainersCount }, { count: institutesCount }, { count: pendingCount }, { count: approvedCount }, { data: overview }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('institutes').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'approved'),
    supabase.rpc('superadmin_dashboard'),
  ])

  const o = (overview ?? { mrr: 0, paying_accounts: 0, paying_portals: 0, expiring_soon: [], recent_signups: [] }) as {
    mrr: number; paying_accounts: number; paying_portals: number
    expiring_soon: { id: string; name: string; role: string; plan: string | null; ends_at: string }[]
    recent_signups: { id: string; name: string; role: string; created_at: string; status: string }[]
  }

  return (
    <>
      <Header title="لوحة المالك" />
      <main className="p-4 sm:p-6 flex flex-col gap-6">
        {/* الإيراد المقدَّر شهرياً */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-6 sm:p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm flex items-center gap-1.5"><TrendingUp size={15} /> الإيراد الشهري المتكرر المقدَّر (MRR)</p>
              <p className="text-4xl sm:text-5xl font-extrabold text-white mt-1">${fmt(o.mrr)}</p>
              <p className="text-white/60 text-xs mt-1">{o.paying_accounts} حساب مشترك + {o.paying_portals} بوابة مدفوعة</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">حسابات بانتظار موافقتك</p>
              <p className="text-3xl font-extrabold text-white mt-1">{pendingCount ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <Users size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">إجمالي المدربين</p>
            <p className="text-2xl font-bold text-ruwad-navy">{trainersCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <Building2 size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">إجمالي المعاهد</p>
            <p className="text-2xl font-bold text-ruwad-navy">{institutesCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <UserCheck size={20} className="text-ruwad-lime" />
            <p className="text-xs text-ruwad-navy/60">حسابات موافَق عليها</p>
            <p className="text-2xl font-bold text-ruwad-navy">{approvedCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <Clock size={20} className="text-amber-500" />
            <p className="text-xs text-ruwad-navy/60">بانتظار الموافقة</p>
            <p className="text-2xl font-bold text-ruwad-navy">{pendingCount ?? 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* حسابات قاربت الانتهاء */}
          <div className="bg-white rounded-ruwad shadow-card p-5">
            <h2 className="font-extrabold text-ruwad-navy mb-3 flex items-center gap-2"><AlertTriangle size={17} className="text-amber-500" /> قاربت الانتهاء خلال 7 أيام</h2>
            {o.expiring_soon.length === 0 ? (
              <p className="text-sm text-ruwad-navy/45 text-center py-6">لا حسابات قاربت الانتهاء حالياً. ✓</p>
            ) : (
              <div className="flex flex-col gap-2">
                {o.expiring_soon.map((r) => (
                  <Link key={r.id} href="/admin/accounts" className="flex items-center justify-between gap-2 bg-amber-50 rounded-ruwad-sm px-3.5 py-2.5 hover:bg-amber-100 transition">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-ruwad-navy truncate">{r.name}</p>
                      <p className="text-[11px] font-bold text-ruwad-navy/45">{ROLE_LABELS[r.role] ?? r.role}{r.plan ? ` · ${r.plan}` : ''}</p>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-600 shrink-0">{new Date(r.ends_at).toLocaleDateString('ar')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* أحدث التسجيلات */}
          <div className="bg-white rounded-ruwad shadow-card p-5">
            <h2 className="font-extrabold text-ruwad-navy mb-3 flex items-center gap-2"><Sparkles size={17} className="text-ruwad-blue" /> أحدث التسجيلات</h2>
            <div className="flex flex-col gap-2">
              {o.recent_signups.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate">{r.name}</p>
                    <p className="text-[11px] font-bold text-ruwad-navy/45">{ROLE_LABELS[r.role] ?? r.role} · {new Date(r.created_at).toLocaleDateString('ar')}</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${r.status === 'approved' ? 'bg-green-50 text-green-600' : r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {r.status === 'approved' ? 'موافَق' : r.status === 'pending' ? 'بالانتظار' : 'مرفوض'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
