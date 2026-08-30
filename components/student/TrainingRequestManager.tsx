'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, MapPin, Send, X, CheckCircle2, Clock } from 'lucide-react'

export interface MyRequest {
  id: string
  topic: string
  details: string | null
  city: string | null
  mode: string
  status: string
  created_at: string
  offersCount: number
}

const MODES = [
  { v: 'any', label: 'أي طريقة' },
  { v: 'in_person', label: 'حضوري' },
  { v: 'remote', label: 'عن بُعد' },
] as const
export const MODE_LABEL: Record<string, string> = { any: 'حضوري أو عن بُعد', in_person: 'حضوري', remote: 'عن بُعد' }

const inputCls = 'border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition w-full bg-white'

// نشر طلب تدريب + إدارة طلبات الطالب القائمة
export function TrainingRequestManager({ initial }: { initial: MyRequest[] }) {
  const [requests, setRequests] = useState(initial)
  const [formOpen, setFormOpen] = useState(initial.filter((r) => r.status === 'open').length === 0)
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [city, setCity] = useState('')
  const [mode, setMode] = useState<string>('any')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function publish() {
    setError(null)
    if (!topic.trim()) { setError('اكتب ما الذي تريد تعلمه.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('training_requests')
      .insert({
        student_id: user!.id,
        topic: topic.trim(),
        details: details.trim() || null,
        city: city.trim() || null,
        mode,
      })
      .select()
      .single()
    setSaving(false)
    if (err || !data) { setError('تعذّر نشر الطلب، حاول مجدداً.'); return }
    setRequests([{ ...data, offersCount: 0 }, ...requests])
    setTopic(''); setDetails(''); setCity(''); setMode('any')
    setFormOpen(false)
    router.refresh()
  }

  async function close(id: string) {
    const { error: err } = await supabase
      .from('training_requests')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
    if (!err) {
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'closed' } : r)))
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ===== نموذج الطلب ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy">
            <span className="w-9 h-9 rounded-ruwad-sm bg-ruwad-lime/40 flex items-center justify-center"><Megaphone size={17} className="text-ruwad-navy" /></span>
            اطلب تدريباً
          </h2>
          {!formOpen && (
            <button onClick={() => setFormOpen(true)} className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition">
              طلب جديد
            </button>
          )}
        </div>
        <p className="text-xs text-ruwad-navy/50 mb-4">
          اكتب ما تريد تعلّمه وسيراه كل مدربي ومعاهد رُوّاد — من يستطيع تدريبك سيرسل لك دعوة لكورس مناسب تقبلها فتلتحق مباشرة.
        </p>

        {formOpen && (
          <div className="flex flex-col gap-3">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-2.5">{error}</div>}
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="ما الذي تريد تعلمه؟ (مثال: مونتاج الفيديو باستخدام بريمير)" className={inputCls} />
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} placeholder="تفاصيل اختيارية: مستواك الحالي، هدفك، الأوقات المناسبة..." className={`${inputCls} resize-none`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="مدينتك (اختياري — يساعد المدربين القريبين)" className={inputCls} />
              <div className="flex items-center gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setMode(m.v)}
                    className={`flex-1 text-xs font-bold px-3 py-2.5 rounded-ruwad-sm transition ${mode === m.v ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/30 text-ruwad-navy/60 hover:bg-ruwad-gray/50'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={publish} disabled={saving} className="self-start flex items-center gap-1.5 bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition disabled:opacity-50">
              <Send size={14} /> {saving ? 'جارٍ النشر...' : 'نشر الطلب'}
            </button>
          </div>
        )}
      </div>

      {/* ===== طلباتي ===== */}
      {requests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-ruwad-navy/60">طلباتك ({requests.length})</h3>
          {requests.map((r) => (
            <div key={r.id} className={`bg-white rounded-ruwad shadow-card p-5 ${r.status === 'closed' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold text-ruwad-navy leading-snug">{r.topic}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${r.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/50'}`}>
                      {r.status === 'open' ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> مفتوح</> : <><CheckCircle2 size={11} /> مغلق</>}
                    </span>
                    {r.city && <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1"><MapPin size={11} /> {r.city}</span>}
                    <span className="text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1">{MODE_LABEL[r.mode]}</span>
                    <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${r.offersCount > 0 ? 'bg-ruwad-lime/40 text-ruwad-navy' : 'bg-ruwad-gray/30 text-ruwad-navy/40'}`}>
                      {r.offersCount > 0 ? `🎯 ${r.offersCount} ${r.offersCount === 1 ? 'استجابة' : 'استجابات'}` : 'بانتظار الاستجابات'}
                    </span>
                  </div>
                </div>
                {r.status === 'open' && (
                  <button onClick={() => close(r.id)} className="flex items-center gap-1 text-[11px] font-bold text-ruwad-navy/50 hover:text-red-500 px-2.5 py-1.5 rounded-full hover:bg-red-50 transition shrink-0">
                    <X size={12} /> إغلاق الطلب
                  </button>
                )}
              </div>
              {r.offersCount > 0 && r.status === 'open' && (
                <p className="flex items-center gap-1.5 text-xs text-ruwad-navy/55 mt-3 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2">
                  <Clock size={13} className="text-ruwad-blue" /> وصلتك دعوات التحاق من المستجيبين — تجدها في إشعاراتك وأعلى صفحة "تدريباتي".
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
