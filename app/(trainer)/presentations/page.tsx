import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Plus, MonitorPlay, Pencil, Layers } from 'lucide-react'

export default async function PresentationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: presentations } = await supabase
    .from('presentations')
    .select('*, presentation_slides(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="العروض التقديمية" />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <Link href="/presentations/new" className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad flex items-center gap-2">
            <Plus size={18} /> عرض جديد
          </Link>
        </div>

        {!presentations || presentations.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <MonitorPlay className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد عروض تقديمية حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentations.map((p) => (
              <div key={p.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition">
                <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{p.title}</h3>
                <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{p.description || 'بلا وصف'}</p>
                <span className="flex items-center gap-1.5 text-sm text-ruwad-navy/50">
                  <Layers size={16} /> {p.presentation_slides?.[0]?.count ?? 0} شريحة
                </span>

                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-ruwad-gray/40">
                  <Link href={`/presentations/${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
                    <Pencil size={15} /> تعديل
                  </Link>
                  <Link href={`/presentations/${p.id}/present`} className="flex items-center justify-center gap-1.5 text-sm font-bold bg-ruwad-navy text-white px-3 py-2 rounded-ruwad-sm hover:opacity-90 transition">
                    <MonitorPlay size={15} /> عرض مباشر
                  </Link>
                  <DeleteButton table="presentations" id={p.id} label="" confirmText="حذف العرض سيحذف معه كل شرائحه وجلساته السابقة. متابعة؟" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
