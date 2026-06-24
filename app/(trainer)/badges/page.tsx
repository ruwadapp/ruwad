import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BadgeCard } from '@/components/shared/BadgeCard'
import { CreateBadgeForm } from '@/components/trainer/CreateBadgeForm'
import { DeleteButton } from '@/components/shared/DeleteButton'

export default async function TrainerBadgesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .or(`trainer_id.is.null,trainer_id.eq.${user!.id}`)
    .order('rarity', { ascending: false })

  const platformBadges = (badges ?? []).filter((b) => !b.trainer_id)
  const customBadges = (badges ?? []).filter((b) => b.trainer_id)

  return (
    <>
      <Header title="الشارات والإنجازات" />
      <main className="p-6 flex flex-col gap-8">
        <p className="text-sm text-ruwad-navy/60 max-w-2xl">
          شارات المنصة العامة تُمنح تلقائياً لكل الطلاب عند تحقيق الشرط (مثل التحاق أول كورس، أو نسبة حضور مرتفعة).
          يمكنك أيضاً إنشاء شارات خاصة بطلابك فقط.
        </p>

        <CreateBadgeForm />

        <section>
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">شارات المنصة العامة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {platformBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned={true} />
            ))}
          </div>
        </section>

        {customBadges.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">شاراتي المخصصة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {customBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col gap-2">
                  <BadgeCard badge={badge} earned={true} />
                  <DeleteButton table="badges" id={badge.id} label="حذف" confirmText="حذف هذه الشارة سيُلغي منحها لكل من حصل عليها سابقاً. متابعة؟" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
