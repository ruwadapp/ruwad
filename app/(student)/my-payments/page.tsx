import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Wallet, CalendarClock, Receipt, Printer, CheckCircle2 } from 'lucide-react'

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const fmt = (n: number) => Number(n).toLocaleString('ar')

// أقساطي: خطط دفع الطالب عبر كل المعاهد — قراءة وإيصالات فقط (RLS تضمن رؤيته لخططه حصراً)
export default async function StudentPaymentsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: plans } = await supabase
    .from('payment_plans')
    .select(`id, currency, total_amount,
             institute:institutes(name),
             enrollment:enrollments(course:courses(title)),
             installments:payment_installments(id, seq, amount, due_date),
             records:payment_records(id, amount, paid_at, receipt_code)`)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <Header title="أقساطي" />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
        {!plans || plans.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center flex flex-col items-center gap-3">
            <Wallet size={32} className="text-ruwad-blue/40" />
            <p className="text-sm text-ruwad-navy/50 font-medium">لا خطط أقساط مسجّلة لك حالياً.</p>
          </div>
        ) : (
          plans.map((p) => {
            const paid = (p.records ?? []).reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0)
            const total = Number(p.total_amount)
            const pct = Math.min(Math.round((paid / total) * 100), 100)
            const cur = CUR[p.currency] ?? p.currency
            const inst = (p.institute as never as { name: string })?.name
            const course = (p.enrollment as never as { course: { title: string } })?.course?.title
            let cum = 0
            return (
              <div key={p.id} className="bg-white rounded-ruwad shadow-card overflow-hidden">
                <div className="p-4 border-b border-ruwad-gray/40">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-extrabold text-ruwad-navy">{course}</p>
                      <p className="text-[11px] font-bold text-ruwad-navy/45">{inst}</p>
                    </div>
                    {pct >= 100 && (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-green-600 bg-green-50 rounded-full px-2.5 py-1">
                        <CheckCircle2 size={12} /> مسدَّد بالكامل
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-2.5 rounded-full bg-ruwad-gray/40 overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-ruwad-blue'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-extrabold text-ruwad-navy/60 shrink-0">{fmt(paid)} / {fmt(total)} {cur}</span>
                  </div>
                </div>

                <div className="p-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-extrabold text-ruwad-navy mb-2 flex items-center gap-1"><CalendarClock size={13} /> الأقساط</p>
                    <div className="flex flex-col gap-1.5">
                      {(p.installments ?? []).sort((a: { seq: number }, b: { seq: number }) => a.seq - b.seq).map((i: { id: string; seq: number; amount: number; due_date: string }) => {
                        cum += Number(i.amount)
                        const covered = paid >= cum
                        const late = !covered && i.due_date < today
                        return (
                          <div key={i.id} className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${covered ? 'bg-green-50/70' : late ? 'bg-red-50' : 'bg-[#F5F6FA]'}`}>
                            <span className="font-bold text-ruwad-navy/70">
                              قسط {i.seq} · {new Date(i.due_date).toLocaleDateString('ar')}
                            </span>
                            <span className={`font-extrabold ${covered ? 'text-green-600' : late ? 'text-red-500' : 'text-ruwad-navy'}`}>
                              {covered ? '✓ ' : ''}{fmt(i.amount)} {cur}{late ? ' · متأخر' : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-ruwad-navy mb-2 flex items-center gap-1"><Receipt size={13} /> دفعاتي</p>
                    {(p.records ?? []).length === 0 ? (
                      <p className="text-xs text-ruwad-navy/45 py-2">لا دفعات بعد.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {(p.records as { id: string; amount: number; paid_at: string; receipt_code: string }[])
                          .slice().sort((a, b) => b.paid_at.localeCompare(a.paid_at)).map((r) => (
                          <Link key={r.id} href={`/org/finance/receipt/${r.id}`} target="_blank"
                            className="flex items-center justify-between text-xs bg-[#F5F6FA] hover:bg-ruwad-gray/40 rounded-lg px-3 py-2 transition">
                            <span className="font-bold text-ruwad-navy/70">{new Date(r.paid_at).toLocaleDateString('ar')} · <span dir="ltr">{r.receipt_code}</span></span>
                            <span className="flex items-center gap-1.5 font-extrabold text-ruwad-navy">{fmt(r.amount)} {cur} <Printer size={12} className="text-ruwad-navy/35" /></span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>
    </>
  )
}
