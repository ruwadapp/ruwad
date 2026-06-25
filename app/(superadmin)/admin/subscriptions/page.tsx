import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SubscriptionsManager } from '@/components/superadmin/SubscriptionsManager'

export default async function SuperAdminSubscriptionsPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: institutes }, { data: trainers }, { data: subs }, { data: memberships }] = await Promise.all([
    supabase.from('institutes').select('id, name, institute_code'),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'trainer'),
    supabase.from('subscriptions').select('*'),
    supabase.from('institute_members').select('user_id, institute_id, status, member_role').eq('status', 'approved').eq('member_role', 'trainer'),
  ])

  const subByInstitute = new Map((subs ?? []).filter((s) => s.institute_id).map((s) => [s.institute_id, s]))
  const subByTrainer = new Map((subs ?? []).filter((s) => s.trainer_id).map((s) => [s.trainer_id, s]))
  const instituteNameMap = new Map((institutes ?? []).map((i) => [i.id, i.name]))
  const trainerInstituteMap = new Map((memberships ?? []).map((m) => [m.user_id, instituteNameMap.get(m.institute_id)]))

  const instituteRows = (institutes ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    subtitle: `معرّف: ${i.institute_code}`,
    subscription: subByInstitute.get(i.id) ?? null,
  }))

  const trainerRows = (trainers ?? []).map((t) => ({
    id: t.id,
    name: t.full_name,
    subtitle: t.email,
    subscription: subByTrainer.get(t.id) ?? null,
    coveredBy: subByTrainer.get(t.id) ? null : trainerInstituteMap.get(t.id) ?? null,
  }))

  return (
    <>
      <Header title="الاشتراكات" />
      <main className="p-6 flex flex-col gap-8">
        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">المعاهد ({instituteRows.length})</h2>
          {instituteRows.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا توجد معاهد مسجَّلة بعد.</p>
          ) : (
            <SubscriptionsManager entityType="institute" initial={instituteRows} />
          )}
        </section>

        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">المدربون ({trainerRows.length})</h2>
          {trainerRows.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا يوجد مدربون مسجَّلون بعد.</p>
          ) : (
            <SubscriptionsManager entityType="trainer" initial={trainerRows} />
          )}
        </section>
      </main>
    </>
  )
}
