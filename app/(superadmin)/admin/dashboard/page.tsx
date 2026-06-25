import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Users, Building2, Clock, UserCheck } from 'lucide-react'

export default async function SuperAdminDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [{ count: trainersCount }, { count: institutesCount }, { count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('institutes').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'approved'),
  ])

  return (
    <>
      <Header title="لوحة المالك" />
      <main className="p-6 flex flex-col gap-6">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <p className="relative text-white/70 text-sm">حسابات بانتظار موافقتك</p>
          <p className="relative text-4xl font-extrabold text-white mt-1">{pendingCount ?? 0}</p>
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
      </main>
    </>
  )
}
