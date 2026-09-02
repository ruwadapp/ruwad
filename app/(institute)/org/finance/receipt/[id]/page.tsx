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
    .from('payment_records')
    .select(`*, plan:payment_plans(currency, total_amount, institute:institutes(name, logo_url),
             enrollment:enrollments(student:profiles!student_id(full_name), course:courses(title)))`)
    .eq('id', id).single()
  if (!rec) notFound()

  const plan = rec.plan as never as {
    currency: string; total_amount: number
    institute: { name: string; logo_url: string | null }
    enrollment: { student: { full_name: string }; course: { title: string } }
  }
  const cur = CUR[plan.currency] ?? plan.currency

  return (
    <main dir="rtl" className="min-h-screen bg-[#E9EBF5] p-4 sm:p-8 flex flex-col items-center gap-5 print:bg-white print:p-0">
      <div className="w-full max-w-md bg-white rounded-ruwad shadow-card print:shadow-none overflow-hidden">
        <div className="bg-ruwad-gradient text-white p-5 text-center">
          {plan.institute.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plan.institute.logo_url} alt="" className="w-12 h-12 rounded-xl bg-white object-contain p-1 mx-auto mb-2" />
          )}
          <p className="font-extrabold text-lg">{plan.institute.name}</p>
          <p className="text-white/80 text-xs mt-0.5">إيصال قبض</p>
        </div>
        <div className="p-6 flex flex-col gap-3 text-sm">
          {[
            ['رقم الإيصال', rec.receipt_code],
            ['الطالب', plan.enrollment.student.full_name],
            ['التدريب', plan.enrollment.course.title],
            ['المبلغ المقبوض', `${Number(rec.amount).toLocaleString('ar')} ${cur}`],
            ['طريقة الدفع', METHOD_AR[rec.method] ?? rec.method],
            ['التاريخ', new Date(rec.paid_at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-center justify-between gap-3 border-b border-dashed border-ruwad-gray/70 pb-2.5">
              <span className="text-ruwad-navy/55 font-bold">{k}</span>
              <span className="font-extrabold text-ruwad-navy text-left">{v}</span>
            </div>
          ))}
          {rec.note && <p className="text-xs text-ruwad-navy/60 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">{rec.note}</p>}
          <p className="text-center text-[10px] text-ruwad-navy/35 font-bold mt-2">
            صادر عبر منصة رُوّاد — يُتحقق من صحته بمطابقة رقم الإيصال لدى إدارة المعهد
          </p>
        </div>
      </div>
      <PrintReceiptButton />
    </main>
  )
}
