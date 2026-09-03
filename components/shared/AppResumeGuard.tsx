'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/*
  حارس العودة من الخلفية:
  عند تعليق التطبيق في الخلفية طويلاً، قد يعلق قفل تجديد الجلسة في supabase-js
  (navigator.locks) فتتجمد كل الطلبات بعد العودة. الحارس يفحص عند كل عودة:
  - يسابق getSession مع مهلة قصيرة — إن لم يستجب: إعادة تحميل كاملة تفك التجمد
  - غياب طويل: تحديث بيانات الصفحة لتعود طازجة
  - استرجاع من bfcache: إعادة تحميل (الحالة المجمدة غير موثوقة)
*/
export function AppResumeGuard() {
  const router = useRouter()
  const hiddenAt = useRef<number | null>(null)
  const checking = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    async function onVisible() {
      if (checking.current) return
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0
      hiddenAt.current = null
      if (away < 15_000) return // غياب قصير — لا شيء يُخشى
      checking.current = true
      try {
        const alive = await Promise.race([
          supabase.auth.getSession().then(() => true),
          new Promise<false>((res) => setTimeout(() => res(false), 3500)),
        ])
        if (!alive) {
          // الجلسة معلّقة (قفل ميت) — إعادة التحميل هي الفكاك الوحيد
          window.location.reload()
          return
        }
        // حي: أنعش بيانات الصفحة إن طال الغياب
        if (away > 3 * 60_000) router.refresh()
      } finally {
        checking.current = false
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now()
      else onVisible()
    }
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload() // عودة من bfcache بحالة مجمدة
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [router])

  return null
}
