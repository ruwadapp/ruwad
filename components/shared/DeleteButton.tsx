'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export function DeleteButton({
  table,
  id,
  redirectTo,
  confirmText = 'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.',
  label = 'حذف',
}: {
  table: string
  id: string
  redirectTo?: string
  confirmText?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(confirmText)) return
    setLoading(true)
    const { error } = await supabase.from(table).delete().eq('id', id)
    setLoading(false)
    if (!error) {
      if (redirectTo) router.push(redirectTo)
      router.refresh()
    } else {
      alert('حدث خطأ أثناء الحذف، حاول مرة أخرى')
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 px-4 py-2 rounded-ruwad-sm transition disabled:opacity-50 shrink-0"
    >
      <Trash2 size={16} /> {loading ? 'جارٍ الحذف...' : label}
    </button>
  )
}
