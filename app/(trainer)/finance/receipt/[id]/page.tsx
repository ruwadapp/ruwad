import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrintReceiptButton } from '@/components/institute/PrintReceiptButton'

const METHOD_AR: Record<string, string> = { cash: 'نقداً', transfer: 'حوالة', other: 'أخرى' }
const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }

// إيصال قبض من دفتر المدرب المستقل — الوصول محكوم بـRLS (المدرب صاحب القيد فقط)
export default async function TrainerReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: rec } = await supabase
    .from('trainer_ledger').select('*, trainer:profiles!trainer_id(full_name)')
    .eq('id', id).eq('entry_type', 'income').single()
  if (!rec) notFound()

  const trainer = rec.trainer as never as { full_name: string }
  const cur = CUR[rec.currency] ?? rec.currency

  return (
    <main dir="rtl" className="min-h-screen bg-[#E9EBF5] p-4 sm:p-8 flex flex-col items-center gap-5 print:bg-white print:p-0">
      <div className="w-full max-w-md bg-white rounded-ruwad shadow-card print:shadow-none overflow-hidden">
        <div className="bg-ruwad-gradient text-white p-5 text-center">
          <p className="font-extrabold text-lg">{trainer.full_name}</p>
          <p className="text-white/80 text-xs mt-0.5">إيصال قبض — دفتر مستقل</p>
        </div>
        <div className="p-6 flex flex-col gap-3 text-sm">
          {[
            ['رقم الإيصال', rec.receipt_code ?? '—'],
            ['استُلم من', rec.party_name ?? '—'],
            ['المبلغ', `${Number(rec.amount).toLocaleString('ar')} ${cur}`],
            ['طريقة الدفع', METHOD_AR[rec.method ?? ''] ?? '—'],
            ['التاريخ', new Date(rec.occurred_at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-center justify-between gap-3 border-b border-dashed border-ruwad-gray/70 pb-2.5">
              <span className="text-ruwad-navy/55 font-bold">{k}</span>
              <span className="font-extrabold text-ruwad-navy text-left">{v}</span>
            </div>
          ))}
          {rec.description && <p className="text-xs text-ruwad-navy/60 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">{rec.description}</p>}
          <p className="text-center text-[10px] text-ruwad-navy/35 font-bold mt-2">صادر عبر منصة رُوّاد</p>
        </div>
      </div>
      {session?.user.id === rec.trainer_id && <PrintReceiptButton />}
    </main>
  )
}
