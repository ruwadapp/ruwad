'use client'
import { useEffect } from 'react'
import { realtimeManager } from '@/lib/realtime/manager'

// مزوّد يُشغّل المدير المركزي مرة واحدة لكل جلسة تطبيق
export function RealtimeProvider({ userId }: { userId: string }) {
  useEffect(() => {
    realtimeManager.init(userId)
    return () => realtimeManager.destroy()
  }, [userId])
  return null
}
