'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Send, Bell, BellOff, Users, Check, CheckCheck, AlertCircle, Paperclip, FileText, FileCheck, Zap, BookOpen, ClipboardList, Link2, ExternalLink, X, Trash2, MoreVertical, ShieldAlert } from 'lucide-react'
import { ChatAttachmentPicker, type ChatAttachment, type AttachmentType } from './ChatAttachmentPicker'
import { EmojiPicker } from './EmojiPicker'

export interface ChatMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
  attachment_type?: AttachmentType | null
  attachment_ref_id?: string | null
  attachment_title?: string | null
  attachment_url?: string | null
  // حالة محلية للرسائل المتفائلة
  _status?: 'sending' | 'failed'
}

export interface ChatMemberInfo {
  user_id: string
  full_name: string
  avatar_url: string | null
  role: string
}

const PAGE = 60


// أيقونة ولون كل نوع مرفق
const ATTACH_META: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  exam: { icon: FileText, label: 'امتحان', color: '#3A4EFB' },
  assignment: { icon: FileCheck, label: 'واجب', color: '#33A4FA' },
  challenge: { icon: Zap, label: 'تحدي', color: '#a8c40f' },
  course: { icon: BookOpen, label: 'كورس', color: '#252943' },
  survey: { icon: ClipboardList, label: 'استبيان', color: '#7C3AED' },
  link: { icon: Link2, label: 'رابط', color: '#0e9f6e' },
}

function AttachmentCard({ m, mine }: { m: ChatMessage; mine: boolean }) {
  if (!m.attachment_type) return null
  const meta = ATTACH_META[m.attachment_type]
  const Icon = meta.icon
  return (
    <Link
      href={m.attachment_url || '#'}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1.5 transition ${
        mine ? 'bg-white/15 hover:bg-white/20' : 'bg-[#F5F6FA] hover:bg-ruwad-gray/30'
      }`}
    >
      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: mine ? 'rgba(255,255,255,.2)' : `${meta.color}18` }}>
        <Icon size={17} style={{ color: mine ? '#fff' : meta.color }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[10px] font-bold ${mine ? 'text-white/70' : 'text-ruwad-navy/45'}`}>{meta.label}</span>
        <span className={`block text-[13px] font-bold truncate ${mine ? 'text-white' : 'text-ruwad-navy'}`}>{m.attachment_title}</span>
      </span>
      <ExternalLink size={13} className={mine ? 'text-white/60' : 'text-ruwad-navy/35'} />
    </Link>
  )
}


// يكتشف إن كانت الرسالة تتكوّن من إيموجي فقط (١-٦ رموز) لتكبيرها تلقائياً كواتساب/تليجرام
const EMOJI_RE = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u200d\ufe0f\u20e3])+$/u
function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (!EMOJI_RE.test(trimmed)) return false
  // عدّ الرموز الفعلية (لا الوحدات الثنائية UTF-16) لتحديد الحد الأقصى
  const graphemes = typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? [...new (Intl as unknown as { Segmenter: new (l: string, o: object) => { segment: (s: string) => Iterable<unknown> } }).Segmenter('ar', { granularity: 'grapheme' }).segment(trimmed)]
    : [...trimmed]
  return graphemes.length >= 1 && graphemes.length <= 6
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const that = new Date(d); that.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - that.getTime()) / 86400_000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'أمس'
  return d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' })
}
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })

// ألوان ثابتة لأسماء الأعضاء (كواتساب في المجموعات)
const NAME_COLORS = ['#3A4EFB', '#0e9f6e', '#d9480f', '#7c3aed', '#c2410c', '#0369a1', '#be185d', '#4d7c0f']
const colorFor = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return NAME_COLORS[h % NAME_COLORS.length] }

// ============================================================
// غرفة الدردشة — تصميم حديث (فقاعات، أيام، أوقات، حالات إرسال) وموثوقية عالية:
// إرسال متفائل + بث لحظي مع إزالة التكرار + إعادة اشتراك تلقائي + مزامنة دورية احتياطية
// ============================================================
export function ChatRoom({
  groupId,
  groupName,
  courseTitle,
  backHref,
  currentUserId,
  initialMessages,
  members,
  initialMuted,
  isManager = false,
}: {
  groupId: string
  groupName: string
  courseTitle: string
  backHref: string
  currentUserId: string
  initialMessages: ChatMessage[]
  members: ChatMemberInfo[]
  initialMuted: boolean
  isManager?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null)
  const [muted, setMuted] = useState(initialMuted)
  const [connected, setConnected] = useState(true)
  const [showMembers, setShowMembers] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const memberMap = new Map(members.map((m) => [m.user_id, m]))

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  }, [])

  // تعليم القراءة
  const markRead = useCallback(async () => {
    await supabase.from('chat_members').update({ last_read_at: new Date().toISOString() }).eq('group_id', groupId).eq('user_id', currentUserId)
  }, [supabase, groupId, currentUserId])

  // دمج رسائل جديدة بلا تكرار (تحل الرسالة الحقيقية محل المتفائلة بنفس المحتوى والمرسل)
  const mergeIncoming = useCallback((incoming: ChatMessage[]) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]))
      let changed = false
      for (const msg of incoming) {
        if (byId.has(msg.id)) continue
        // استبدال نسخة متفائلة مطابقة (نفس المرسل والنص) إن وجدت
        const optimisticIdx = prev.findIndex((m) => m._status === 'sending' && m.sender_id === msg.sender_id && m.content === msg.content)
        if (optimisticIdx !== -1) {
          prev = prev.map((m, i) => (i === optimisticIdx ? msg : m))
          byId.set(msg.id, msg)
          changed = true
          continue
        }
        byId.set(msg.id, msg)
        changed = true
      }
      if (!changed) return prev
      return [...byId.values()].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    })
  }, [])

  // جلب ما فات (مزامنة احتياطية)
  const syncLatest = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, group_id, sender_id, content, created_at, attachment_type, attachment_ref_id, attachment_title, attachment_url')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(PAGE)
    if (data) mergeIncoming(data.reverse())
  }, [supabase, groupId, mergeIncoming])

  // ===== البث اللحظي + إعادة الاشتراك + المزامنة الدورية =====
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false
    scrollToBottom(false)
    markRead()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || cancelled) return
      supabase.realtime.setAuth(session.access_token)
      const subscribe = () => {
        channel = supabase
          .channel(`chat:${groupId}:${Math.random().toString(36).slice(2)}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` }, (payload) => {
            mergeIncoming([payload.new as ChatMessage])
            markRead()
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') { setConnected(true); syncLatest() }
            if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !cancelled) {
              setConnected(false)
              if (channel) supabase.removeChannel(channel)
              setTimeout(() => { if (!cancelled) subscribe() }, 2000)
            }
          })
      }
      subscribe()
    })

    const poll = setInterval(() => { if (document.visibilityState === 'visible') syncLatest() }, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') { syncLatest(); markRead() } }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, groupId, mergeIncoming, syncLatest, markRead, scrollToBottom])

  // تمرير للأسفل عند وصول رسائل جديدة (إن كان المستخدم قرب الأسفل أو الرسالة منه)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    const last = messages[messages.length - 1]
    if (nearBottom || last?.sender_id === currentUserId) scrollToBottom()
  }, [messages, currentUserId, scrollToBottom])

  // ===== إرسال متفائل مع إعادة محاولة =====
  async function send(retryOf?: ChatMessage) {
    const content = (retryOf?.content ?? draft).trim()
    const attachment = retryOf
      ? (retryOf.attachment_type ? { type: retryOf.attachment_type, ref_id: retryOf.attachment_ref_id ?? null, title: retryOf.attachment_title ?? '', url: retryOf.attachment_url ?? '' } as ChatAttachment : null)
      : pendingAttachment
    if (!content && !attachment) return
    const tempId = retryOf?.id ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const optimistic: ChatMessage = {
      id: tempId, group_id: groupId, sender_id: currentUserId, content, created_at: new Date().toISOString(), _status: 'sending',
      attachment_type: attachment?.type ?? null, attachment_ref_id: attachment?.ref_id ?? null, attachment_title: attachment?.title ?? null, attachment_url: attachment?.url ?? null,
    }
    setMessages((prev) => (retryOf ? prev.map((m) => (m.id === tempId ? optimistic : m)) : [...prev, optimistic]))
    if (!retryOf) { setDraft(''); setPendingAttachment(null) }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: groupId, sender_id: currentUserId, content,
        attachment_type: attachment?.type ?? null, attachment_ref_id: attachment?.ref_id ?? null,
        attachment_title: attachment?.title ?? null, attachment_url: attachment?.url ?? null,
      })
      .select('id, group_id, sender_id, content, created_at, attachment_type, attachment_ref_id, attachment_title, attachment_url')
      .single()

    if (error || !data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _status: 'failed' } : m)))
      return
    }
    setMessages((prev) => {
      // إن سبق البثُّ الردَّ وأدرج الرسالة الحقيقية، احذف المتفائلة فقط
      if (prev.some((m) => m.id === data.id)) return prev.filter((m) => m.id !== tempId)
      return prev.map((m) => (m.id === tempId ? data : m))
    })
  }

  async function deleteMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  async function clearHistory() {
    setClearing(true)
    const { error } = await supabase.rpc('clear_chat_history', { p_group_id: groupId })
    setClearing(false)
    if (!error) {
      setMessages([])
      setConfirmClear(false)
      setMenuOpen(false)
    }
  }

  async function toggleMute() {
    const next = !muted
    setMuted(next)
    const { error } = await supabase.from('chat_members').update({ muted: next }).eq('group_id', groupId).eq('user_id', currentUserId)
    if (error) setMuted(!next)
  }

  // ===== تجميع الرسائل بالأيام =====
  const groups: { day: string; items: ChatMessage[] }[] = []
  for (const m of messages) {
    const day = dayLabel(m.created_at)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(m)
    else groups.push({ day, items: [m] })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#EEF0F7]" dir="rtl">
      {/* ===== الترويسة ===== */}
      <header className="bg-white/95 backdrop-blur border-b border-ruwad-gray/40 px-3 py-2.5 flex items-center gap-2 shadow-sm">
        <Link href={backHref} aria-label="رجوع" className="p-2 rounded-full hover:bg-ruwad-gray/30 text-ruwad-navy transition"><ArrowRight size={20} /></Link>
        <button onClick={() => setShowMembers(!showMembers)} className="flex items-center gap-3 flex-1 min-w-0 text-right">
          <span className="w-10 h-10 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold shrink-0">{groupName.charAt(0)}</span>
          <span className="min-w-0">
            <span className="block font-bold text-ruwad-navy text-sm truncate">{groupName}</span>
            <span className="block text-[11px] text-ruwad-navy/50 truncate">
              {connected ? `${members.length} عضو · ${courseTitle}` : 'جارٍ إعادة الاتصال...'}
            </span>
          </span>
        </button>
        <button
          onClick={toggleMute}
          aria-label={muted ? 'تشغيل إشعارات المجموعة' : 'كتم إشعارات المجموعة'}
          title={muted ? 'الإشعارات مكتومة — اضغط للتشغيل' : 'كتم إشعارات هذه المجموعة'}
          className={`p-2 rounded-full transition ${muted ? 'bg-ruwad-gray/40 text-ruwad-navy/50' : 'hover:bg-ruwad-gray/30 text-ruwad-navy'}`}
        >
          {muted ? <BellOff size={19} /> : <Bell size={19} />}
        </button>
        {isManager && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="خيارات" className="p-2 rounded-full hover:bg-ruwad-gray/30 text-ruwad-navy transition">
              <MoreVertical size={19} />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-11 z-20 bg-white rounded-ruwad-sm shadow-ruwad-lg border border-ruwad-gray/40 py-1 w-56">
                <button
                  onClick={() => { setConfirmClear(true); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition text-right"
                >
                  <Trash2 size={14} /> مسح سجل الدردشة
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ===== تأكيد مسح السجل ===== */}
      {confirmClear && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmClear(false)}>
          <div className="bg-white rounded-ruwad shadow-ruwad-lg p-5 max-w-sm w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-500"><ShieldAlert size={20} /><p className="font-extrabold">مسح سجل الدردشة نهائياً؟</p></div>
            <p className="text-sm text-ruwad-navy/60 leading-relaxed">ستُحذف كل الرسائل من قاعدة البيانات لكل الأعضاء بلا استرجاع. هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={clearHistory} disabled={clearing} className="flex-1 bg-red-500 text-white font-bold text-sm py-2.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50">{clearing ? 'جارٍ المسح...' : 'مسح نهائياً'}</button>
              <button onClick={() => setConfirmClear(false)} className="flex-1 bg-ruwad-gray/30 text-ruwad-navy font-bold text-sm py-2.5 rounded-ruwad-sm hover:bg-ruwad-gray/50 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== لوحة الأعضاء ===== */}
      {showMembers && (
        <div className="bg-white border-b border-ruwad-gray/40 px-4 py-3 max-h-48 overflow-y-auto">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ruwad-navy/50 mb-2"><Users size={13} /> الأعضاء ({members.length})</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span key={m.user_id} className="flex items-center gap-1.5 bg-[#F5F6FA] rounded-full pr-1 pl-3 py-1 text-xs font-semibold text-ruwad-navy">
                <span className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center overflow-hidden" style={{ background: colorFor(m.user_id) }}>
                  {m.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : m.full_name.charAt(0)}
                </span>
                {m.full_name}{m.role === 'admin' && <span className="text-[9px] text-ruwad-blue">مشرف</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== الرسائل ===== */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4" style={{ backgroundImage: 'radial-gradient(rgba(58,78,251,.06) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-ruwad-navy/45 gap-2">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-semibold">ابدأ المحادثة — كن أول من يرحّب بالمجموعة!</p>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.day} className="flex flex-col gap-1">
            <div className="flex justify-center my-3">
              <span className="text-[11px] font-bold text-ruwad-navy/55 bg-white/90 shadow-sm rounded-full px-3 py-1">{g.day}</span>
            </div>
            {g.items.map((m, i) => {
              const mine = m.sender_id === currentUserId
              const prev = g.items[i - 1]
              const firstOfRun = !prev || prev.sender_id !== m.sender_id
              const sender = memberMap.get(m.sender_id)
              const canDelete = (mine || isManager) && !m._status
              const jumbo = !m.attachment_type && isEmojiOnly(m.content)
              return (
                <div key={m.id} className={`group flex items-center gap-1.5 ${mine ? 'justify-start' : 'justify-end'} ${firstOfRun ? 'mt-2' : 'mt-0.5'}`}>
                  {mine && canDelete && (
                    <button onClick={() => deleteMessage(m.id)} aria-label="حذف الرسالة" className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-ruwad-navy/30 hover:text-red-500 transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className={`max-w-[78%] relative ${
                    jumbo
                      ? 'bg-transparent shadow-none px-1 py-0.5'
                      : `rounded-2xl px-3.5 py-2 shadow-sm ${
                          mine
                            ? `bg-ruwad-blue text-white ${firstOfRun ? 'rounded-tr-md' : ''}`
                            : `bg-white text-ruwad-navy ${firstOfRun ? 'rounded-tl-md' : ''}`
                        } ${m._status === 'failed' ? 'ring-2 ring-red-400' : ''}`
                  }`}>
                    {!mine && firstOfRun && !jumbo && (
                      <p className="text-[11px] font-extrabold mb-0.5" style={{ color: colorFor(m.sender_id) }}>{sender?.full_name ?? 'عضو'}</p>
                    )}
                    <AttachmentCard m={m} mine={mine} />
                    {m.content && (
                      jumbo
                        ? <p className="text-[52px] leading-none">{m.content}</p>
                        : <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${jumbo ? (mine ? 'justify-start' : 'justify-end') + ' text-ruwad-navy/40' : 'justify-end ' + (mine ? 'text-white/70' : 'text-ruwad-navy/40')}`}>
                      <span>{timeLabel(m.created_at)}</span>
                      {mine && (
                        m._status === 'sending' ? <Check size={12} className="opacity-60" />
                        : m._status === 'failed' ? <button onClick={() => send(m)} className="flex items-center gap-1 text-red-200 font-bold"><AlertCircle size={12} /> إعادة</button>
                        : <CheckCheck size={13} />
                      )}
                    </div>
                  </div>
                  {!mine && canDelete && isManager && (
                    <button onClick={() => deleteMessage(m.id)} aria-label="حذف الرسالة" className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-ruwad-navy/30 hover:text-red-500 transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ===== المؤلّف ===== */}
      <div className="relative bg-white border-t border-ruwad-gray/40 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {pickerOpen && <ChatAttachmentPicker onPick={(a) => { setPendingAttachment(a); setPickerOpen(false) }} onClose={() => setPickerOpen(false)} />}

        {pendingAttachment && (
          <div className="flex items-center gap-2 bg-ruwad-blue/5 border border-ruwad-blue/20 rounded-ruwad-sm px-3 py-2 mb-2">
            <span className="text-xs font-bold text-ruwad-blue flex-1 truncate">📎 {pendingAttachment.title}</span>
            <button onClick={() => setPendingAttachment(null)} aria-label="إزالة" className="text-ruwad-navy/40 hover:text-red-500"><X size={14} /></button>
          </div>
        )}

        <div className="flex items-end gap-2">
        <EmojiPicker onPick={(e) => setDraft((d) => d + e)} />
        {isManager && (
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            aria-label="إرفاق"
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition ${pickerOpen ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/30 text-ruwad-navy hover:bg-ruwad-gray/50'}`}
          >
            <Paperclip size={19} />
          </button>
        )}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="اكتب رسالة..."
          rows={1}
          className="flex-1 resize-none max-h-32 bg-[#F5F6FA] rounded-2xl px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-ruwad-blue/30 transition"
          style={{ height: 'auto' }}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px' }}
        />
        <button
          onClick={() => send()}
          disabled={!draft.trim() && !pendingAttachment}
          aria-label="إرسال"
          className="w-11 h-11 rounded-full bg-ruwad-blue text-white flex items-center justify-center shrink-0 shadow-ruwad hover:opacity-90 transition disabled:opacity-40 disabled:shadow-none"
        >
          <Send size={18} className="-scale-x-100" />
        </button>
        </div>
      </div>
    </div>
  )
}
