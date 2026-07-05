'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Send, Users, BookOpen, AlertTriangle, Info } from 'lucide-react'

interface Course { id: string; title: string }

type Tone = 'urgent' | 'important'

const TONES: { id: Tone; label: string; hint: string; icon: typeof AlertTriangle; activeClasses: string; idleClasses: string }[] = [
  {
    id: 'urgent',
    label: 'عاجل (أحمر)',
    hint: 'للتنبيهات المهمة العاجلة — كإلغاء محاضرة أو تغيير موعد امتحان',
    icon: AlertTriangle,
    activeClasses: 'bg-red-500 text-white border-red-500',
    idleClasses: 'bg-white text-red-500 border-red-200',
  },
  {
    id: 'important',
    label: 'مهم (أصفر)',
    hint: 'للتنبيهات المهمة غير العاجلة — كتذكير بواجب أو موعد',
    icon: Info,
    activeClasses: 'bg-ruwad-lime text-ruwad-navy border-ruwad-lime',
    idleClasses: 'bg-white text-ruwad-navy border-ruwad-gray',
  },
]

export function AnnouncementComposer({ courses }: { courses: Course[] }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<Tone>('important')
  const [audience, setAudience] = useState<'all' | 'course'>('all')
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) { setError('العنوان ونص الرسالة مطلوبان'); return }
    if (audience === 'course' && !courseId) { setError('اختر الكورس المستهدف'); return }
    setLoading(true)
    setError(null)
    setResult(null)

    const { data, error: rpcError } = await supabase.rpc('send_trainer_announcement', {
      p_title: title.trim(),
      p_message: message.trim(),
      p_tone: tone,
      p_audience: audience,
      p_course_id: audience === 'course' ? courseId : null,
    })

    setLoading(false)
    if (rpcError) { setError('حدث خطأ أثناء الإرسال، حاول مرة أخرى'); return }

    setResult(`تم إرسال الإشعار إلى ${data ?? 0} طالب ✓`)
    setTitle('')
    setMessage('')
  }

  const selectedTone = TONES.find((t) => t.id === tone)!

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-7 text-white flex items-center gap-3" style={{ backgroundImage: 'linear-gradient(135deg, #3A4EFB 0%, #33A4FA 100%)' }}>
        <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
        <Megaphone size={28} className="relative shrink-0" />
        <div className="relative">
          <h2 className="font-bold text-lg">إرسال إشعار مباشر للطلاب</h2>
          <p className="text-sm text-white/75">تنبيه فوري يصل لهواتف طلابك حتى وهم خارج التطبيق.</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}
        {result && <div className="bg-ruwad-lime/20 text-ruwad-navy text-sm rounded-ruwad-sm px-4 py-3">{result}</div>}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">إلى من تريد إرسال الإشعار؟</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAudience('all')}
              className={`flex items-center justify-center gap-2 rounded-ruwad-sm py-2.5 font-medium text-sm transition border-2 ${
                audience === 'all' ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
              }`}
            >
              <Users size={15} /> جميع طلابي
            </button>
            <button
              type="button"
              onClick={() => setAudience('course')}
              disabled={courses.length === 0}
              className={`flex items-center justify-center gap-2 rounded-ruwad-sm py-2.5 font-medium text-sm transition border-2 disabled:opacity-40 ${
                audience === 'course' ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
              }`}
            >
              <BookOpen size={15} /> طلاب كورس معيّن
            </button>
          </div>
          {audience === 'course' && (
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition mt-1"
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">درجة الأهمية</label>
          <div className="grid grid-cols-2 gap-3">
            {TONES.map((t) => {
              const Icon = t.icon
              const active = tone === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`flex items-center justify-center gap-2 rounded-ruwad-sm py-2.5 font-semibold text-sm transition border-2 ${active ? t.activeClasses : t.idleClasses}`}
                >
                  <Icon size={15} /> {t.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-ruwad-navy/50">{selectedTone.hint}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">عنوان الإشعار</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تنبيه هام بخصوص المحاضرة القادمة"
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">نص الرسالة</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك للطلاب هنا..."
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-1 w-fit"
        >
          <Send size={17} /> {loading ? 'جارٍ الإرسال...' : 'إرسال الإشعار الآن'}
        </button>
      </form>
    </div>
  )
}
