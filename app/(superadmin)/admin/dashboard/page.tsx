import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Users, Building2, DollarSign, Snowflake } from 'lucide-react'

export default async function SuperAdminDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [{ count: trainersCount }, { count: institutesCount }, { data: subs }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('institutes').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('billing_cycle, price, status'),
  ])

  const active = (subs ?? []).filter((s) => s.status === 'active')
  const frozen = (subs ?? []).filter((s) => s.status === 'frozen')

  const mrr = active.reduce((sum, s) => sum + (s.billing_cycle === 'yearly' ? Number(s.price) / 12 : Number(s.price)), 0)

  return (
    <>
      <Header title="لوحة المالك" />
      <main className="p-6 flex flex-col gap-6">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <p className="relative text-white/70 text-sm">الإيراد الشهري المتكرر التقديري (MRR)</p>
          <p className="relative text-4xl font-extrabold text-white mt-1">${mrr.toFixed(2)}</p>
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
            <DollarSign size={20} className="text-ruwad-lime" />
            <p className="text-xs text-ruwad-navy/60">اشتراكات نشطة</p>
            <p className="text-2xl font-bold text-ruwad-navy">{active.length}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <Snowflake size={20} className="text-amber-500" />
            <p className="text-xs text-ruwad-navy/60">اشتراكات مجمَّدة</p>
            <p className="text-2xl font-bold text-ruwad-navy">{frozen.length}</p>
          </div>
        </div>
      </main>
    </>
  )
}
