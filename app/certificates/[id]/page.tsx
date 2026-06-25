import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrintCertificateButton } from '@/components/shared/PrintCertificateButton'

export const dynamic = 'force-dynamic'

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, student:profiles!student_id(full_name), course:courses(title), trainer:profiles!trainer_id(full_name)')
    .eq('id', id)
    .single()

  if (!cert) notFound()

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ruwadapp.vercel.app'}/certificates/verify/${cert.certificate_code}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}`

  const studentName = (cert.student as unknown as { full_name?: string })?.full_name ?? '—'
  const courseTitle = (cert.course as unknown as { title?: string })?.title ?? '—'
  const trainerName = (cert.trainer as unknown as { full_name?: string })?.full_name ?? '—'

  return (
    <main className="min-h-screen bg-[#F5F6FA] p-6 flex flex-col items-center gap-6" dir="rtl">
      <div className="w-full max-w-2xl bg-white rounded-ruwad shadow-ruwad-lg border-[6px] border-ruwad-lime p-12 flex flex-col items-center gap-6 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-ruwad-blue/5 rounded-full blur-3xl print:hidden" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-ruwad-lime/10 rounded-full blur-3xl print:hidden" />

        <h1 className="relative text-2xl font-extrabold text-ruwad-navy">رُوّاد | Ruwad</h1>
        <p className="relative text-sm text-ruwad-navy/50">شهادة إتمام كورس</p>

        <div className="relative w-16 h-px bg-ruwad-gray" />

        <p className="relative text-ruwad-navy/60 text-sm">تُمنح هذه الشهادة إلى</p>
        <h2 className="relative text-4xl font-extrabold text-ruwad-navy">{studentName}</h2>
        <p className="relative text-ruwad-navy/70">
          لإتمامه بنجاح كورس <span className="font-bold text-ruwad-blue">{courseTitle}</span>
        </p>

        <div className="relative bg-ruwad-lime/20 rounded-ruwad-sm px-6 py-3">
          <p className="text-sm text-ruwad-navy/60">العلامة النهائية</p>
          <p className="text-3xl font-bold text-ruwad-navy">{Number(cert.score)}%</p>
        </div>

        <div className="relative flex items-center justify-between w-full mt-4 gap-6">
          <div className="text-right text-xs text-ruwad-navy/50">
            <p>تاريخ الإصدار: {new Date(cert.issued_at).toLocaleDateString('ar')}</p>
            <p>المدرب: {trainerName}</p>
            <p className="mt-1 font-mono">كود التحقق: {cert.certificate_code}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="رمز التحقق" className="w-24 h-24 shrink-0" />
        </div>
      </div>

      <PrintCertificateButton />
    </main>
  )
}
