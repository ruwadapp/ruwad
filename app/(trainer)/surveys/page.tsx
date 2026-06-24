import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Plus, ClipboardList, MessageSquare } from 'lucide-react'

export default async function SurveysPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: surveys } = await supabase
    .from('surveys')
    .select('*, survey_questions(count), survey_responses(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="الاستبيانات" />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <Link
            href="/surveys/new"
            className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad flex items-center gap-2"
          >
            <Plus size={18} /> استبيان جديد
          </Link>
        </div>

        {!surveys || surveys.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <ClipboardList className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد استبيانات حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((survey) => (
              <Link
                key={survey.id}
                href={`/surveys/${survey.id}`}
                className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{survey.title}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    survey.is_active ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/50 text-ruwad-navy/60'
                  }`}>
                    {survey.is_active ? 'نشط' : 'متوقف'}
                  </span>
                </div>
                <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">
                  {survey.description || 'بلا وصف'}
                </p>
                <div className="flex items-center gap-4 text-sm text-ruwad-navy/50 mt-1">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList size={16} /> {survey.survey_questions?.[0]?.count ?? 0} سؤال
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={16} /> {survey.survey_responses?.[0]?.count ?? 0} رد
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
