import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CheckCircle2, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createServerSupabaseClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, student:profiles!student_id(full_name), course:courses(title), trainer:profiles!trainer_id(full_name)')
    .eq('certificate_code', code)
    .maybeSingle()

  if (!cert) {
    return (
      <main className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-ruwad shadow-card p-10 max-w-sm text-center flex flex-col items-center gap-3">
          <h1 className="font-bold text-ruwad-navy">شهادة غير موجودة</h1>
          <p className="text-sm text-ruwad-navy/60">رمز التحقق غير صحيح أو الشهادة غير موجودة في نظام رُوّاد.</p>
        </div>
      </main>
    )
  }

  const studentName = (cert.student as unknown as { full_name?: string })?.full_name ?? '—'
  const courseTitle = (cert.course as unknown as { title?: string })?.title ?? '—'
  const trainerName = (cert.trainer as unknown as { full_name?: string })?.full_name ?? '—'

  return (
    <main className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-ruwad shadow-ruwad-lg p-10 max-w-md w-full flex flex-col items-center gap-4 text-center">
        <span className="flex items-center gap-1.5 text-sm font-bold bg-ruwad-lime text-ruwad-navy px-4 py-1.5 rounded-full">
          <ShieldCheck size={16} /> شهادة موثّقة
        </span>

        <CheckCircle2 size={48} className="text-ruwad-blue mt-2" />

        <h1 className="text-2xl font-extrabold text-ruwad-navy">{studentName}</h1>
        <p className="text-ruwad-navy/70">
          أكمل بنجاح كورس <span className="font-bold text-ruwad-blue">{courseTitle}</span>
        </p>

        <div className="bg-ruwad-gray/20 rounded-ruwad-sm px-6 py-3 mt-2">
          <p className="text-sm text-ruwad-navy/60">العلامة النهائية</p>
          <p className="text-2xl font-bold text-ruwad-navy">{Number(cert.score)}%</p>
        </div>

        <div className="text-xs text-ruwad-navy/50 mt-2 flex flex-col gap-1">
          <p>صادرة عن: {trainerName} — منصة رُوّاد</p>
          <p>تاريخ الإصدار: {new Date(cert.issued_at).toLocaleDateString('ar')}</p>
        </div>
      </div>
    </main>
  )
}
