import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { LandingNav } from '@/components/marketing/LandingNav'

const TITLE = 'رُوّاد مقابل الإدارة اليدوية للمعهد — مقارنة شاملة'
const DESCRIPTION =
  'مقارنة تفصيلية بين إدارة معهد التدريب بالطرق التقليدية (إكسل، واتساب، ورق) وبين استخدام نظام رُوّاد المتكامل لإدارة المعاهد والتدريبات.'
const URL = 'https://www.ruwaad.app/ruwad-vs-manual'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['مقارنة أنظمة إدارة معاهد', 'أفضل بديل للإدارة اليدوية للمعهد', 'رُوّاد مقابل إكسل'],
  alternates: { canonical: '/ruwad-vs-manual' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
}

const ROWS: { feature: string; manual: string | boolean; ruwad: string | boolean }[] = [
  { feature: 'تصحيح الامتحانات', manual: 'يدوي بالكامل، يستغرق ساعات', ruwad: 'تلقائي وفوري للأسئلة الموضوعية' },
  { feature: 'تسجيل الحضور', manual: 'ورقي أو ملف إكسل منفصل', ruwad: true },
  { feature: 'إدارة عدة مدربين', manual: 'ملفات وحسابات متفرقة لكل مدرب', ruwad: 'لوحة تحكم موحّدة لكل المعهد' },
  { feature: 'إصدار الشهادات', manual: 'PDF يدوي قابل للتزوير', ruwad: 'برمز QR قابل للتحقق' },
  { feature: 'تقارير الأداء', manual: 'تجميع يدوي من مصادر متعددة', ruwad: 'تقرير فوري بضغطة واحدة' },
  { feature: 'إشعارات الطلاب', manual: 'رسائل واتساب يدوية', ruwad: 'إشعارات لحظية تلقائية' },
  { feature: 'واجهة عربية بالكامل', manual: true, ruwad: true },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="text-ruwad-blue mx-auto" size={20} />
  if (value === false) return <X className="text-red-400 mx-auto" size={20} />
  return <span>{value}</span>
}

export default function ComparisonPage() {
  return (
    <main dir="rtl" className="bg-white min-h-screen">
      <LandingNav />
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-32 pb-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mb-4">
          رُوّاد مقابل الإدارة اليدوية للمعهد
        </h1>
        <p className="text-ruwad-navy/60 leading-relaxed max-w-2xl mx-auto">
          كثير من المعاهد تبدأ بإكسل وواتساب — وهذا طبيعي في البداية. لكن مع كل مدرب وكل دفعة طلاب جديدة،
          يتضاعف الجهد اليدوي. هذي مقارنة صريحة توضح الفرق.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-20 overflow-x-auto">
        <table className="w-full border-collapse text-sm sm:text-base">
          <thead>
            <tr className="border-b-2 border-ruwad-navy/10">
              <th className="text-right py-4 font-extrabold text-ruwad-navy">الميزة</th>
              <th className="py-4 font-extrabold text-ruwad-navy/50">الإدارة اليدوية</th>
              <th className="py-4 font-extrabold text-ruwad-blue">رُوّاد</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.feature} className="border-b border-ruwad-navy/5">
                <td className="py-4 font-semibold text-ruwad-navy">{r.feature}</td>
                <td className="py-4 text-center text-ruwad-navy/50">
                  <Cell value={r.manual} />
                </td>
                <td className="py-4 text-center text-ruwad-navy font-semibold">
                  <Cell value={r.ruwad} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-24 text-center">
        <div className="bg-ruwad-navy rounded-ruwad p-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">جرّب الفرق بنفسك</h2>
          <p className="text-white/70 mb-7">تسجيل مجاني، بلا بطاقة ائتمان، إعداد أول تدريب خلال دقائق.</p>
          <Link href="/register" className="inline-block bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy">
            ابدأ مجاناً الآن
          </Link>
        </div>
      </section>
    </main>
  )
}
