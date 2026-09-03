import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Wallet, CalendarClock, Receipt, Printer, CheckCircle2, AlertTriangle } from 'lucide-react'

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const fmt = (n: number) => Number(n).toLocaleString('ar')

// أقساطي: مستحقات الطالب ودفعاته عبر كل المعاهد (RLS تريه قيوده فقط)
export default async function StudentPaymentsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: entries } = await supabase
    .from('finance_ledger')
    .select('*, institute:institutes(name), course:courses(title)')
    .order('occurred_at', { ascending: false })
    .limit(300)

  const all = entries ?? []
  const dues = all.filter((e) => e.entry_type === 'due')
  const payments = all.filter((e) => e.entry_type === 'income')
  const paidFor = (dueId: string) => payments.filter((p) => p.due_link === dueId).reduce((s, p) => s + Number(p.amount), 0)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <Header title="أقساطي" />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
        {all.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center flex flex-col items-center gap-3">
            <Wallet size={32} className="text-ruwad-blue/40" />
            <p className="text-sm text-ruwad-navy/50 font-medium">لا مستحقات أو دفعات مسجّلة لك حالياً.</p>
          </div>
        ) : (
          <>
            {dues.length > 0 && (
              <div className="bg-white rounded-ruwad shadow-card p-4">
                <p className="text-sm font-extrabold text-ruwad-navy mb-3 flex items-center gap-1.5">
                  <CalendarClock size={15} className="text-amber-500" /> مستحقاتي
                </p>
                <div className="flex flex-col gap-2">
                  {dues.map((d) => {
                    const paid = paidFor(d.id)
                    const remaining = Math.max(Number(d.amount) - paid, 0)
                    const pct = Math.min(Math.round((paid / Number(d.amount)) * 100), 100)
                    const late = remaining > 0 && d.due_date && d.due_date < today
                    const done = remaining <= 0
                    return (
                      <div key={d.id} className={`rounded-ruwad-sm px-3.5 py-3 ${done ? 'bg-green-50/70' : late ? 'bg-red-50 ring-1 ring-red-200' : 'bg-[#F5F6FA]'}`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-ruwad-navy truncate">
                              {(d.course as never as { title: string } | null)?.title ?? 'مستحق مالي'}
                              <span className="text-[11px] font-bold text-ruwad-navy/45"> — {(d.institute as never as { name: string })?.name}</span>
                            </p>
                            <p className="text-[11px] font-bold text-ruwad-navy/50 mt-0.5">
                              {d.due_date && <>الاستحقاق {new Date(d.due_date).toLocaleDateString('ar')} · </>}
                              مدفوع {fmt(paid)} من {fmt(d.amount)} {CUR[d.currency]}
                            </p>
                          </div>
                          {done ? (
                            <span className="flex items-center gap-1 text-[11px] font-extrabold text-green-600"><CheckCircle2 size={13} /> مسدَّد</span>
                          ) : late ? (
                            <span className="flex items-center gap-1 text-[11px] font-extrabold text-red-500"><AlertTriangle size={13} /> متأخر — متبقٍ {fmt(remaining)}</span>
                          ) : (
                            <span className="text-[11px] font-extrabold text-amber-600">متبقٍ {fmt(remaining)}</span>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-white overflow-hidden mt-2">
                          <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-ruwad shadow-card p-4">
              <p className="text-sm font-extrabold text-ruwad-navy mb-3 flex items-center gap-1.5">
                <Receipt size={15} className="text-ruwad-blue" /> دفعاتي وإيصالاتي
              </p>
              {payments.length === 0 ? (
                <p className="text-xs text-ruwad-navy/45 py-2">لا دفعات بعد.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {payments.map((p) => (
                    <Link key={p.id} href={`/org/finance/receipt/${p.id}`} target="_blank"
                      className="flex items-center justify-between text-xs bg-[#F5F6FA] hover:bg-ruwad-gray/40 rounded-lg px-3 py-2.5 transition">
                      <span className="font-bold text-ruwad-navy/70">
                        {new Date(p.occurred_at).toLocaleDateString('ar')} · {(p.institute as never as { name: string })?.name}
                        {p.receipt_code && <span dir="ltr"> · {p.receipt_code}</span>}
                      </span>
                      <span className="flex items-center gap-1.5 font-extrabold text-green-700">
                        {fmt(p.amount)} {CUR[p.currency]} <Printer size={12} className="text-ruwad-navy/35" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  )
}
