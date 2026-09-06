import { Header } from '@/components/shared/Header'
import { BellRing } from 'lucide-react'

export default function InstituteNotificationSettingsPage() {
  return (
    <>
      <Header title="الإشعارات" />
      <main className="p-4 sm:p-6 max-w-xl mx-auto">
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center"><BellRing size={26} /></span>
          <p className="font-extrabold text-ruwad-navy">تخصيص الإشعارات قريباً</p>
          <p className="text-sm text-ruwad-navy/55 max-w-sm">
            حالياً تصلك كل الإشعارات المهمة (الطلبات، المستحقات، الرسائل) تلقائياً عبر جرس الإشعارات —
            وسنضيف هنا قريباً خيار تخصيص ما يصلك بالضبط.
          </p>
        </div>
      </main>
    </>
  )
}
