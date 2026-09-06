'use client'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

// زر رجوع عام — يعيد المستخدم إلى الصفحة التي أتى منها (بحث، قائمة طلاب، إشعار...)
// بدل إجباره على استخدام رجوع المتصفح أو التنقل اليدوي من القوائم
export function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      aria-label="رجوع"
      className={`inline-flex items-center gap-1.5 text-sm font-extrabold text-ruwad-navy/70 hover:text-ruwad-navy bg-white shadow-card rounded-full pl-4 pr-3 py-2 transition ${className}`}
    >
      <ArrowRight size={16} /> رجوع
    </button>
  )
}
