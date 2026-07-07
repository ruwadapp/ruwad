import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ShieldCheck } from 'lucide-react'

export default async function StudentCertificatesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, course:courses(title)')
    .eq('student_id', user!.id)
    .order('issued_at', { ascending: false })

  return (
    <>
      <Header title="شهاداتي" />
      <main className="p-6 flex flex-col gap-6">

        <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex items-center gap-3 text-white">
          <ShieldCheck size={26} />
          <div>
            <p className="text-sm opacity-80">شهاداتي</p>
            <p className="text-2xl font-bold">{certificates?.length ?? 0}</p>
          </div>
        </div>

        <section className="bg-white rounded-ruwad shadow-card p-6">
          {!certificates || certificates.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-8 text-center">لا توجد شهادات حتى الآن. أكمل أحد الكورسات لتحصل على شهادتك الأولى.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((c) => (
                <Link
                  key={c.id}
                  href={`/certificates/${c.id}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-ruwad-sm border-2 border-ruwad-lime bg-ruwad-lime/10 hover:bg-ruwad-lime/20 transition"
                >
                  <div>
                    <p className="font-bold text-ruwad-navy">{c.course?.title}</p>
                    <p className="text-xs text-ruwad-navy/50">{new Date(c.issued_at).toLocaleDateString('ar')}</p>
                  </div>
                  <span className="text-lg font-bold text-ruwad-navy">{Number(c.score)}%</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
