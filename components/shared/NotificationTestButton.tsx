'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'

export function NotificationTestButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function sendTest() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      if (data.sent > 0) {
        setMsg('✓ تم إرسال إشعار تجريبي — يجب أن يصلك خلال ثوانٍ')
      } else if (data.reason === 'no_subscriptions') {
        setMsg('لا يوجد اشتراك مفعّل لهذا الحساب على هذا الجهاز. فعّل إشعارات الجهاز أولاً من الأعلى.')
      } else if (data.error === 'missing_vapid') {
        setMsg('تعذّر الإرسال: إعدادات الخادم غير مكتملة. تواصل مع الدعم.')
      } else {
        setMsg('تعذّر إرسال الإشعار. قد يكون اشتراكك انتهى — أعد تفعيل الإشعارات من الأعلى ثم جرّب مجدداً.')
      }
    } catch {
      setMsg('حدث خطأ في الاتصال، حاول مرة أخرى')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-2 border-t border-ruwad-gray/40 pt-4">
      <button
        onClick={sendTest}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-navy bg-ruwad-lime/30 hover:bg-ruwad-lime/50 px-3 py-2 rounded-ruwad-sm transition disabled:opacity-50 w-fit"
      >
        <Send size={14} /> {loading ? 'جارٍ الإرسال...' : 'إرسال إشعار تجريبي لي'}
      </button>
      {msg && <p className="text-xs text-ruwad-navy/60 leading-relaxed">{msg}</p>}
    </div>
  )
}
