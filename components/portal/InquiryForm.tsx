'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'

// نموذج "استفسر الآن" على بوابة المعهد — يصب مباشرة في CRM المعهد
export function InquiryForm({ instituteId, portalId, courses }: {
  instituteId: string
  portalId: string
  courses: { id: string; title: string }[]
}) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [courseId, setCourseId] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    if (name.trim().length < 2 || phone.trim().length < 6) { setState('error'); return }
    setState('busy')
    const { error } = await supabase.rpc('submit_institute_inquiry', {
      p_institute_id: instituteId,
      p_full_name: name.trim(),
      p_phone: phone.trim(),
      p_message: message.trim() || null,
      p_course_id: courseId || null,
      p_portal_id: portalId,
    })
    setState(error ? 'error' : 'done')
  }

  if (state === 'done') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-8 text-center flex flex-col items-center gap-3">
        <span className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={26} /></span>
        <p className="font-extrabold text-ruwad-navy">وصل استفسارك!</p>
        <p className="text-sm text-ruwad-navy/60">سيتواصل معك فريق المعهد قريباً على رقمك.</p>
      </div>
    )
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <form onSubmit={submit} className="bg-white rounded-ruwad shadow-card p-5 sm:p-6 flex flex-col gap-3.5">
      <div className="grid sm:grid-cols-2 gap-3.5">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل *" className={inputCls} />
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم هاتفك (واتساب) *" dir="ltr" className={inputCls + ' text-right'} />
      </div>
      {courses.length > 0 && (
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
          <option value="">التدريب الذي يهمك (اختياري)</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={1000}
        placeholder="سؤالك أو ما تريد معرفته (اختياري)" className={inputCls + ' resize-none'} />
      {state === 'error' && (
        <p className="text-xs font-bold text-red-600 bg-red-50 rounded-ruwad-sm px-3 py-2">تأكد من الاسم والرقم ثم أعد المحاولة.</p>
      )}
      <button type="submit" disabled={state === 'busy'}
        className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {state === 'busy' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} أرسل استفسارك
      </button>
    </form>
  )
}
