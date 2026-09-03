import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrintReceiptButton } from '@/components/institute/PrintReceiptButton'

const METHOD_AR: Record<string, string> = { cash: 'نقداً', transfer: 'حوالة', other: 'أخرى' }
const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }

// إيصال قبض رسمي قابل للطباعة — الوصول محكوم بـRLS (إدارة المعهد أو الطالب صاحبه)
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: rec } = await supabase
    .from('finance_ledger')
    .select(`*, institute:institutes(name, logo_url),
             student:profiles!student_id(full_name), course:courses(title)`)
    .eq('id', id).eq('entry_type', 'income').single()
  if (!rec) notFound()

  const inst = rec.institute as never as { name: string; logo_url: string | null }
  const cur = CUR[rec.currency] ?? rec.currency
  const payer = (rec.student as never as { full_name: string } | null)?.full_name ?? rec.party_name ?? '—'

  const rows: [string, string][] = [
    ['رقم الإيصال', rec.receipt_code ?? '—'],
    ['القبض من', payer],
  ]
  const courseTitle = (rec.course as never as { title: string } | null)?.title
  if (courseTitle) rows.push(['التدريب', courseTitle])
  rows.push(
    ['المبلغ المقبوض', `${Number(rec.amount).toLocaleString('ar')} ${cur}`],
    ['طريقة الدفع', METHOD_AR[rec.method ?? ''] ?? '—'],
    ['التاريخ', new Date(rec.occurred_at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })],
  )

  return (
    <main dir="rtl" className="min-h-screen bg-[#E9EBF5] p-4 sm:p-8 flex flex-col items-center gap-5 print:bg-white print:p-0">
      <div className="w-full max-w-md bg-white rounded-ruwad shadow-card print:shadow-none overflow-hidden">
        <div className="bg-ruwad-gradient text-white p-5 text-center">
          {inst.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={inst.logo_url} alt="" className="w-12 h-12 rounded-xl bg-white object-contain p-1 mx-auto mb-2" />
          )}
          <p className="font-extrabold text-lg">{inst.name}</p>
          <p className="text-white/80 text-xs mt-0.5">إيصال قبض</p>
        </div>
        <div className="p-6 flex flex-col gap-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-b border-dashed border-ruwad-gray/70 pb-2.5">
              <span className="text-ruwad-navy/55 font-bold">{k}</span>
              <span className="font-extrabold text-ruwad-navy text-left">{v}</span>
            </div>
          ))}
          {rec.description && <p className="text-xs text-ruwad-navy/60 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">{rec.description}</p>}
          <p className="text-center text-[10px] text-ruwad-navy/35 font-bold mt-2">
            صادر عبر منصة رُوّاد — يُتحقق من صحته بمطابقة رقم الإيصال لدى إدارة المعهد
          </p>
        </div>
      </div>
      <PrintReceiptButton />
    </main>
  )
}
