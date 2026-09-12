// ===== مدير Realtime مركزي =====
// قناة واحدة لكل جلسة بدل قناة لكل مكوّن — يحل تجمد iOS الناتج عن
// تراكم قنوات WebSocket متعددة تحاول إعادة الاشتراك في وقت واحد

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type EventType = 'notification' | 'point_event' | 'chat_message' | 'enrollment'
type Callback = (payload: unknown) => void

interface Subscription { table: string; filter?: string; callbacks: Map<string, Callback> }

class RealtimeManager {
  private channel: RealtimeChannel | null = null
  private subs = new Map<EventType, Subscription>()
  private userId: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private active = false

  register(type: EventType, id: string, cb: Callback) { this.subs.get(type)?.callbacks.set(id, cb) }
  unregister(type: EventType, id: string) { this.subs.get(type)?.callbacks.delete(id) }

  async init(userId: string) {
    if (this.userId === userId && this.active) return
    this.userId = userId; this.active = true
    this.subs.set('notification', { table: 'notifications', filter: `user_id=eq.${userId}`, callbacks: new Map() })
    this.subs.set('point_event', { table: 'point_events', filter: `student_id=eq.${userId}`, callbacks: new Map() })
    this.subs.set('chat_message', { table: 'chat_messages', filter: undefined, callbacks: new Map() })
    this.subs.set('enrollment', { table: 'enrollments', filter: `student_id=eq.${userId}`, callbacks: new Map() })
    await this._connect()
    document.addEventListener('visibilitychange', this._onVisible)
  }

  private _onVisible = () => {
    if (document.visibilityState === 'visible' && this.active) {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this.reconnectTimer = setTimeout(() => this._connect(), 300)
    }
  }

  private async _connect() {
    const supabase = createClient()
    if (this.channel) { await supabase.removeChannel(this.channel); this.channel = null }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !this.active) return
    supabase.realtime.setAuth(session.access_token)
    let ch = supabase.channel(`ruwad:${this.userId}:${Date.now()}`)
    for (const sub of this.subs.values()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cfg: any = { event: 'INSERT', schema: 'public', table: sub.table }
      if (sub.filter) cfg.filter = sub.filter
      ch = ch.on('postgres_changes', cfg, (payload: unknown) => {
        sub.callbacks.forEach((cb) => cb(payload))
      })
    }
    this.channel = ch.subscribe((status) => {
      if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && this.active) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
        this.reconnectTimer = setTimeout(() => this._connect(), 2000)
      }
    })
  }

  destroy() {
    this.active = false
    document.removeEventListener('visibilitychange', this._onVisible)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    const supabase = createClient()
    if (this.channel) { supabase.removeChannel(this.channel); this.channel = null }
  }
}

export const realtimeManager = new RealtimeManager()
