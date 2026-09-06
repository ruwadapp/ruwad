'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Target, Loader2, CheckCircle2, UserPlus, LogIn } from 'lucide-react'

// نموذج التقاط اهتمام عام من الصفحة الرئيسية — بلا حاجة لحساب.
// يصل مباشرة إلى "الرادار" عند كل مدرب ومعهد، ويدعو الزائر لإنشاء حساب طالب
export function InterestLeadForm() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [trainingType, setTrainingType] = useState('')
  const [notes, setNotes] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'busy') return
    if (fullName.trim().length < 2 || phone.trim().length < 6 || trainingType.trim().length < 2) { setState('error'); return }
    setState('busy')
    const { error } = await supabase.rpc('submit_interest_lead', {
      p_full_name: fullName.trim(), p_phone: phone.trim(), p_training_type: trainingType.trim(), p_notes: notes.trim() || null,
    })
    setState(error ? 'error' : 'done')
  }

  if (state === 'done') {
    return (
      <div className="w-full max-w-md bg-white rounded-ruwad shadow-ruwad-lg p-8 flex flex-col items-center gap-4 text-center">
        <span className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={30} /></span>
        <div>
          <h1 className="text-xl font-extrabold text-ruwad-navy">وصل اهتمامك! 🎯</h1>
          <p className="text-sm text-ruwad-navy/60 mt-1.5">سيتصفح المدربون والمعاهد طلبك الآن وقد يتواصل أحدهم معك مباشرة.</p>
        </div>
        <div className="w-full border-t-2 border-dashed border-ruwad-gray my-1" />
        <p className="text-sm font-extrabold text-ruwad-navy">أنشئ حساب طالب مجاناً لمتابعة طلبك واستقبال العروض</p>
        <Link href="/register" className="w-full flex items-center justify-center gap-2 bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 transition">
          <UserPlus size={17} /> إنشاء حساب طالب
        </Link>
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-bold text-ruwad-navy/50 hover:text-ruwad-navy">
          <LogIn size={14} /> لدي حساب بالفعل، تسجيل الدخول
        </Link>
      </div>
    )
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <form onSubmit={submit} className="w-full max-w-md bg-white rounded-ruwad shadow-ruwad-lg p-6 sm:p-8 flex flex-col gap-4">
      <div className="text-center mb-1">
        <span className="w-14 h-14 rounded-full bg-ruwad-gradient text-white flex items-center justify-center mx-auto mb-3"><Target size={24} /></span>
        <h1 className="text-xl font-extrabold text-ruwad-navy">أنا مهتم بتدريب</h1>
        <p className="text-sm text-ruwad-navy/55 mt-1.5">اترك بياناتك وسيصلك عرض من أقدر المدربين والمعاهد المناسبين لك.</p>
      </div>

      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسمك الكامل *" className={inputCls} />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم هاتفك (واتساب) *" dir="ltr" className={inputCls + ' text-right'} />
      <input required value={trainingType} onChange={(e) => setTrainingType(e.target.value)} placeholder="نوع التدريب الذي تريده *" className={inputCls} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000}
        placeholder="ملاحظات إضافية (اختياري)" className={inputCls + ' resize-none'} />

      {state === 'error' && (
        <p className="text-xs font-bold text-red-600 bg-red-50 rounded-ruwad-sm px-3 py-2">تأكد من تعبئة الحقول المطلوبة ثم أعد المحاولة.</p>
      )}
      <button type="submit" disabled={state === 'busy'}
        className="bg-ruwad-blue text-white font-extrabold py-3.5 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {state === 'busy' ? <Loader2 size={17} className="animate-spin" /> : <Target size={17} />} أرسل اهتمامي
      </button>
      <p className="text-center text-xs text-ruwad-navy/40">
        لديك حساب طالب بالفعل؟ <Link href="/request-training" className="text-ruwad-blue font-bold hover:underline">اطلب تدريباً من هنا</Link> بدلاً من ذلك.
      </p>
    </form>
  )
}
