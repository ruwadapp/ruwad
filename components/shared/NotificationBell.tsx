'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, BookOpen, FileText, Zap, FileCheck, UserPlus, Award, ShieldCheck, CheckCheck, Megaphone, Mail, Check, X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  reference_id: string | null
  is_read: boolean
  created_at: string
  tone?: 'urgent' | 'important' | null
}

const TYPE_ICON: Record<string, { icon: typeof Bell; color: string }> = {
  lecture: { icon: BookOpen, color: 'bg-ruwad-blue/10 text-ruwad-blue' },
  exam: { icon: FileText, color: 'bg-ruwad-blue/10 text-ruwad-blue' },
  challenge: { icon: Zap, color: 'bg-ruwad-lime/30 text-ruwad-navy' },
  assignment: { icon: FileCheck, color: 'bg-ruwad-navy/10 text-ruwad-navy' },
  enrollment: { icon: UserPlus, color: 'bg-ruwad-lime/30 text-ruwad-navy' },
  badge: { icon: Award, color: 'bg-ruwad-lime/30 text-ruwad-navy' },
  certificate: { icon: ShieldCheck, color: 'bg-ruwad-lime/30 text-ruwad-navy' },
  course: { icon: BookOpen, color: 'bg-ruwad-gray/40 text-ruwad-navy' },
  attendance: { icon: CheckCheck, color: 'bg-ruwad-gray/40 text-ruwad-navy' },
  announcement: { icon: Megaphone, color: 'bg-ruwad-gray/40 text-ruwad-navy' },
  general: { icon: Bell, color: 'bg-ruwad-gray/40 text-ruwad-navy' },
  course_invitation: { icon: Mail, color: 'bg-ruwad-lime/40 text-ruwad-navy' },
  course_promo: { icon: Megaphone, color: 'bg-ruwad-blue/10 text-ruwad-blue' },
  course_invitation_accepted: { icon: CheckCheck, color: 'bg-green-100 text-green-600' },
}

// درجة الأهمية تطغى على لون الأيقونة الافتراضي حسب النوع — أحمر=عاجل، أصفر/ليموني=مهم
const TONE_COLOR: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-500',
  important: 'bg-ruwad-lime/40 text-ruwad-navy',
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} د`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} س`
  const days = Math.floor(hours / 24)
  return `منذ ${days} ي`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [role, setRole] = useState<string>('student')
  const [open, setOpen] = useState(false)
  const [inviteBusy, setInviteBusy] = useState<string | null>(null)
  const [inviteDone, setInviteDone] = useState<Record<string, 'accepted' | 'declined' | 'gone'>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data }, { data: profile }] = await Promise.all([
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
    ])
    if (data) setNotifications(data)
    if (profile) setRole(profile.role)
  }, [supabase])

  useEffect(() => {
    load()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || cancelled) return
      // حاسم للوصول الفوري: تمرير رمز جلسة المستخدم لقناة الـ WebSocket صراحةً.
      // بدونه قد يشترك العميل كمجهول، ومع سياسات RLS يرفض الخادم تسليم أي حدث بصمت،
      // فلا تظهر الإشعارات إلا عند إعادة تحميل الصفحة.
      supabase.realtime.setAuth(session.access_token)

      const subscribeChannel = () => {
        // اسم قناة فريد لكل تركيب يمنع خطأ "cannot add postgres_changes callbacks after subscribe()"
        channel = supabase
          .channel(`notifications:${session.user.id}:${Math.random().toString(36).slice(2)}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, (payload) => {
            setNotifications((prev) => (prev.some((n) => n.id === (payload.new as Notification).id) ? prev : [payload.new as Notification, ...prev]))
          })
          .subscribe((status) => {
            // انقطاع الاتصال (نوم الجهاز، تبديل الشبكة): إعادة اشتراك تلقائية بعد لحظة
            if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !cancelled) {
              if (channel) supabase.removeChannel(channel)
              setTimeout(() => { if (!cancelled) subscribeChannel() }, 2000)
            }
          })
      }
      subscribeChannel()
    })

    // شبكة أمان: مزامنة دورية خفيفة كل 20 ثانية (والصفحة ظاهرة فقط) —
    // تضمن وصولاً شبه فوري حتى لو حُجب الـ WebSocket في بعض الشبكات
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 20000)
    // وعند العودة للتبويب بعد غياب: مزامنة فورية
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel) supabase.removeChannel(channel)
    }
  }, [load, supabase])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  function destinationFor(n: Notification): string {
    const isTrainer = role === 'trainer'
    switch (n.type) {
      case 'lecture': return isTrainer ? '/courses' : '/my-courses'
      case 'exam': return isTrainer ? `/exams/${n.reference_id}` : `/my-exams/${n.reference_id}`
      case 'challenge': return isTrainer ? `/challenges/${n.reference_id}` : '/my-challenges'
      case 'assignment': return isTrainer ? `/assignments/${n.reference_id}` : '/my-assignments'
      case 'enrollment': return isTrainer ? '/students' : '/my-courses'
      case 'attendance': return isTrainer ? '/attendance' : '/my-attendance'
      case 'finance': return '/my-payments'
      case 'badge': return isTrainer ? '/badges' : '/my-achievements?tab=badges'
      case 'certificate': return isTrainer ? '/students' : '/my-achievements'
      case 'announcement': return isTrainer ? '/dashboard' : '/home'
      case 'course_invitation': return '/my-courses'
      case 'course_promo': return '/home'
      case 'course_invitation_accepted': return isTrainer ? '/students' : '/org/students'
      default: return isTrainer ? '/dashboard' : '/home'
    }
  }

  async function respondInvitation(n: Notification, accept: boolean) {
    if (!n.reference_id) return
    setInviteBusy(n.id)
    const { data: inv } = await supabase
      .from('course_invitations')
      .select('id')
      .eq('course_id', n.reference_id)
      .eq('status', 'pending')
      .maybeSingle()
    if (!inv) {
      setInviteDone((prev) => ({ ...prev, [n.id]: 'gone' }))
      setInviteBusy(null)
      return
    }
    const { error } = await supabase.rpc('respond_course_invitation', { p_invitation_id: inv.id, p_accept: accept })
    setInviteBusy(null)
    if (!error) {
      setInviteDone((prev) => ({ ...prev, [n.id]: accept ? 'accepted' : 'declined' }))
      if (!n.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      }
      router.refresh()
    }
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }
    setOpen(false)
    router.push(destinationFor(n))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        className="relative w-10 h-10 rounded-full bg-ruwad-gray/40 flex items-center justify-center hover:bg-ruwad-gray transition"
      >
        <Bell size={20} className="text-ruwad-navy" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-ruwad shadow-ruwad-lg border border-ruwad-gray/40 z-50 overflow-hidden" dir="rtl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ruwad-gray/40 bg-ruwad-gray/10">
            <h3 className="font-bold text-ruwad-navy text-sm">الإشعارات</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-ruwad-blue hover:opacity-70 transition">
                <CheckCheck size={13} /> تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-ruwad-navy/40 text-sm py-10 text-center">لا توجد إشعارات بعد.</p>
            ) : (
              notifications.map((n) => {
                const { icon: Icon, color } = TYPE_ICON[n.type] ?? TYPE_ICON.general
                const toneColor = n.tone ? TONE_COLOR[n.tone] : null
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleClick(n) }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-right border-b border-ruwad-gray/20 hover:bg-ruwad-gray/10 transition cursor-pointer ${
                      !n.is_read ? 'bg-ruwad-blue/5' : ''
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${toneColor ?? color}`}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-ruwad-navy">{n.title}</span>
                        {n.tone === 'urgent' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">عاجل</span>}
                        {n.tone === 'important' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ruwad-lime text-ruwad-navy">مهم</span>}
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-ruwad-blue shrink-0" />}
                      </span>
                      <p className="text-xs text-ruwad-navy/60 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-ruwad-navy/35 mt-1">{timeAgo(n.created_at)}</p>
                      {n.type === 'course_invitation' && (
                        inviteDone[n.id] ? (
                          <span className={`inline-block text-[11px] font-bold rounded-full px-2.5 py-1 mt-2 ${
                            inviteDone[n.id] === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/60'
                          }`}>
                            {inviteDone[n.id] === 'accepted' ? '✓ التحقت بالتدريب' : inviteDone[n.id] === 'declined' ? 'رُفضت الدعوة' : 'انتهت هذه الدعوة'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); respondInvitation(n, true) }}
                              disabled={inviteBusy === n.id}
                              className="flex items-center gap-1 bg-ruwad-blue text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition disabled:opacity-50"
                            >
                              <Check size={11} /> {inviteBusy === n.id ? 'جارٍ...' : 'قبول والالتحاق'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); respondInvitation(n, false) }}
                              disabled={inviteBusy === n.id}
                              className="flex items-center gap-1 text-[11px] font-bold text-ruwad-navy/50 px-2.5 py-1.5 rounded-full hover:bg-ruwad-gray/30 transition disabled:opacity-50"
                            >
                              <X size={11} /> رفض
                            </button>
                          </span>
                        )
                      )}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
