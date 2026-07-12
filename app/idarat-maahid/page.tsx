import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Users2, FileCheck2, QrCode, Award, BarChart3 } from 'lucide-react'
import { LandingNav } from '@/components/marketing/LandingNav'

const TITLE = 'نظام إدارة معاهد تدريب — رُوّاد | لوحة تحكم موحّدة لكل مدربيك'
const DESCRIPTION =
  'نظام إدارة معاهد وتدريبات عربي متكامل: لوحة تحكم موحّدة لعدة مدربين، امتحانات ذكية، حضور رقمي، شهادات موثّقة بـQR، وتقارير أداء شاملة على مستوى المعهد بالكامل.'
const URL = 'https://www.ruwaad.app/idarat-maahid'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'نظام إدارة معاهد', 'نظام إدارة معاهد تدريب', 'برنامج إدارة معهد تدريبي',
    'إدارة عدة مدربين', 'لوحة تحكم معهد تدريبي',
  ],
  alternates: { canonical: '/idarat-maahid' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
}

const CAPABILITIES = [
  { icon: Users2, title: 'إدارة فريق مدربين كامل', desc: 'أضف عدد غير محدود من المدربين تحت مظلة معهدك، مع صلاحيات واضحة لكل واحد ورؤية شاملة لك أنت.' },
  { icon: FileCheck2, title: 'امتحانات وتصحيح تلقائي', desc: 'أربعة أنواع أسئلة، وتصحيح فوري للأسئلة الموضوعية — يوفر ساعات عمل أسبوعية لكل مدرب في معهدك.' },
  { icon: QrCode, title: 'حضور رقمي موحّد', desc: 'كل جلسات معهدك، لكل المدربين، بنظام حضور واحد بكود جلسة وموافقة فورية — بدل كشوف ورقية متفرقة.' },
  { icon: Award, title: 'شهادات موحّدة الهوية', desc: 'شهادات برمز QR قابل للتحقق، بهوية بصرية موحّدة تعكس علامة معهدك التجارية على كل شهادة يصدرها أي مدرب.' },
  { icon: BarChart3, title: 'تقارير أداء على مستوى المعهد', desc: 'نتائج الامتحانات، نسب الحضور، وعدد الطلاب النشطين لكل مدرب ولكل المعهد مجتمعين — في لوحة تحكم واحدة.' },
]

const WHATSAPP_NUMBER = '963998285483'

export default function InstituteManagementPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'رُوّاد — نظام إدارة معاهد',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description: DESCRIPTION,
    url: URL,
  }

  return (
    <main dir="rtl" className="bg-white min-h-screen">
      <LandingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="bg-ruwad-navy pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-snug mb-6">
            نظام إدارة معاهد تدريب — كل مدربيك، كل طلابك، في لوحة واحدة
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto mb-9">
            رُوّاد مصمّم خصيصاً لأصحاب المعاهد ومراكز التدريب اللي يديرون أكثر من مدرب: إدارة، أتمتة،
            ومتابعة كل تدريب يُنشر تحت مظلة معهدك — من مكان واحد وبالعربية بالكامل.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy">
              أنشئ حساب معهدك مجاناً
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، أرغب بمعرفة تفاصيل نظام إدارة المعاهد في رُوّاد')}`}
              target="_blank" rel="noopener noreferrer"
              className="border-2 border-white text-white font-bold px-9 py-4 rounded-ruwad-sm hover:bg-white hover:text-ruwad-navy transition"
            >
              تواصل معنا
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <h2 className="text-3xl font-extrabold text-ruwad-navy text-center mb-14">
          كل ما يحتاجه معهدك لإدارة التدريب باحترافية
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="bg-[#F5F6FA] rounded-ruwad p-7">
              <c.icon className="text-ruwad-blue mb-4" size={28} />
              <h3 className="font-extrabold text-ruwad-navy text-lg mb-2">{c.title}</h3>
              <p className="text-ruwad-navy/70 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-20">
        <div className="bg-ruwad-navy rounded-ruwad p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">جاهز تدير معهدك باحترافية أكبر؟</h2>
          <p className="text-white/70 mb-7">تسجيل مجاني خلال أقل من دقيقة، بلا بطاقة ائتمان.</p>
          <ul className="flex flex-wrap justify-center gap-4 mb-8 text-white/80 text-sm">
            {['بلا التزامات مخفية', 'دعم بالعربية', 'إعداد سريع'].map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-ruwad-lime" /> {f}
              </li>
            ))}
          </ul>
          <Link href="/register" className="inline-block bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy">
            ابدأ مجاناً الآن
          </Link>
        </div>
      </section>
    </main>
  )
}
