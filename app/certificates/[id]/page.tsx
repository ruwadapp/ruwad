import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrintCertificateButton } from '@/components/shared/PrintCertificateButton'
import { Award } from 'lucide-react'

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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&color=252943&bgcolor=ffffff`

  const studentName = (cert.student as unknown as { full_name?: string })?.full_name ?? '—'
  const courseTitle = (cert.course as unknown as { title?: string })?.title ?? '—'
  const trainerName = (cert.trainer as unknown as { full_name?: string })?.full_name ?? '—'

  return (
    <main className="min-h-screen bg-[#E9EBF5] p-4 sm:p-8 flex flex-col items-center gap-6" dir="rtl">
      <div className="w-full max-w-4xl aspect-[1.55/1] relative">
        {/* الإطار الخارجي الفخم */}
        <div className="absolute inset-0 rounded-[28px] bg-ruwad-dark shadow-2xl" />
        <div className="absolute inset-[10px] rounded-[22px] p-[3px]" style={{ background: 'linear-gradient(135deg, #E3FF3B, #3A4EFB, #E3FF3B)' }}>
          <div className="w-full h-full rounded-[19px] bg-white relative overflow-hidden flex flex-col items-center justify-center px-6 sm:px-16 py-6 sm:py-10 text-center">

            {/* نقشة زخرفية خفيفة في الخلفية */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04] print:hidden" aria-hidden="true">
              <pattern id="cert-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.4" fill="#252943" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#cert-dots)" />
            </svg>

            {/* زوايا زخرفية */}
            {[
              'top-3 right-3 border-t-4 border-r-4 rounded-tr-2xl',
              'top-3 left-3 border-t-4 border-l-4 rounded-tl-2xl',
              'bottom-3 right-3 border-b-4 border-r-4 rounded-br-2xl',
              'bottom-3 left-3 border-b-4 border-l-4 rounded-bl-2xl',
            ].map((c) => (
              <span key={c} className={`absolute w-10 h-10 sm:w-14 sm:h-14 border-ruwad-lime ${c}`} />
            ))}

            <div className="relative flex flex-col items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-ruwad-gradient flex items-center justify-center shadow-ruwad">
                  <Award size={20} className="text-white" />
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-ruwad-navy tracking-wide">رُوّاد</span>
              </div>
              <p className="text-[10px] sm:text-xs font-semibold text-ruwad-navy/40 tracking-[0.3em] uppercase">Certificate of Completion</p>
            </div>

            <div className="relative w-20 sm:w-28 h-[3px] rounded-full bg-ruwad-lime my-3 sm:my-5" />

            <p className="relative text-ruwad-navy/50 text-xs sm:text-sm">تشهد منصة رُوّاد بأن</p>
            <h1 className="relative text-2xl sm:text-5xl font-extrabold text-ruwad-navy my-2 sm:my-3" style={{ fontFamily: "'Cairo', sans-serif" }}>
              {studentName}
            </h1>
            <p className="relative text-ruwad-navy/60 text-xs sm:text-base max-w-xl">
              أتمّ بنجاحٍ متطلبات كورس <span className="font-bold text-ruwad-blue">"{courseTitle}"</span> بتقدير نهائي
            </p>

            <div className="relative flex items-center gap-2 bg-ruwad-navy text-white rounded-full px-5 sm:px-7 py-1.5 sm:py-2 mt-3 sm:mt-4 shadow-ruwad">
              <span className="text-lg sm:text-2xl font-extrabold text-ruwad-lime">{Number(cert.score)}%</span>
              <span className="text-[10px] sm:text-xs opacity-70">العلامة النهائية</span>
            </div>

            <div className="relative w-full flex items-end justify-between mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-ruwad-gray/50">
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-ruwad-navy/40">تاريخ الإصدار</p>
                <p className="text-xs sm:text-sm font-semibold text-ruwad-navy">{new Date(cert.issued_at).toLocaleDateString('ar')}</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold text-ruwad-navy" style={{ fontFamily: "'Cairo', sans-serif" }}>{trainerName}</p>
                <div className="w-20 sm:w-28 h-px bg-ruwad-navy/30 mx-auto mt-1" />
                <p className="text-[10px] sm:text-xs text-ruwad-navy/40 mt-1">المدرّب</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="رمز التحقق" className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-ruwad-gray/50" />
                <p className="text-[8px] sm:text-[10px] font-mono text-ruwad-navy/40">{cert.certificate_code}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrintCertificateButton />
    </main>
  )
}
