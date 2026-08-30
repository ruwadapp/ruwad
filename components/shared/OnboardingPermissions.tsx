'use client'
import { useEffect, useState } from 'react'
import { PushNotificationSetup } from './PushNotificationSetup'
import { LocationCapture } from './LocationCapture'
import { InstallAppButton } from './InstallAppButton'
import { Bell, MapPin, MonitorDown, Rocket, X } from 'lucide-react'

const STORAGE_KEY = 'ruwad-onboarding-v1'

// نافذة تهيئة تظهر فور أول دخول على الجهاز (وبالتالي فور إنشاء الحساب):
// تفعيل الإشعارات + الموقع الجغرافي + تثبيت التطبيق — بخطوات مرقّمة واضحة.
// تُعرض مرة واحدة لكل جهاز، ويمكن تخطّيها والعودة إليها من صفحة الحساب.
export function OnboardingPermissions({
  locationMode,
  instituteId,
  hasLocation,
  locationVisible = true,
}: {
  locationMode: 'user' | 'institute'
  instituteId?: string
  hasLocation: boolean
  locationVisible?: boolean
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch { /* بيئة بلا تخزين */ }
  }, [])

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, 'done') } catch { /* تجاهل */ }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-ruwad-navy/60 backdrop-blur-sm p-0 sm:p-6" dir="rtl">
      <div className="bg-[#F5F6FA] w-full sm:max-w-lg sm:rounded-ruwad rounded-t-ruwad shadow-ruwad-lg max-h-[92vh] overflow-y-auto">
        {/* ===== الترويسة ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient p-6 sm:rounded-t-ruwad">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-ruwad-lime/25 rounded-full blur-2xl" />
          <button onClick={finish} aria-label="تخطي" className="absolute top-4 left-4 text-white/60 hover:text-white p-1.5 transition">
            <X size={18} />
          </button>
          <h2 className="relative text-xl font-extrabold text-white">أهلاً بك في رُوّاد 🎉</h2>
          <p className="relative text-sm text-white/80 mt-1.5 leading-relaxed">
            ثلاث خطوات سريعة تجعل تجربتك مكتملة — تستغرق أقل من دقيقة.
          </p>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* ===== 1. الإشعارات ===== */}
          <div className="bg-white rounded-ruwad shadow-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-extrabold shrink-0">1</span>
              <div>
                <p className="flex items-center gap-1.5 font-bold text-ruwad-navy"><Bell size={15} className="text-ruwad-blue" /> فعّل الإشعارات</p>
                <p className="text-xs text-ruwad-navy/55 mt-0.5">ليصلك كل جديد فور حدوثه حتى والتطبيق مغلق.</p>
              </div>
            </div>
            <PushNotificationSetup variant="light" />
          </div>

          {/* ===== 2. الموقع ===== */}
          <div className="bg-white rounded-ruwad shadow-card p-5">
            <div className="flex items-center gap-3 mb-1">
              <span className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-extrabold shrink-0">2</span>
              <div>
                <p className="flex items-center gap-1.5 font-bold text-ruwad-navy"><MapPin size={15} className="text-ruwad-blue" /> فعّل موقعك</p>
                <p className="text-xs text-ruwad-navy/55 mt-0.5">لتستفيد من ميزة "بالقرب مني" — بخصوصية كاملة.</p>
              </div>
            </div>
            <div className="[&>div]:shadow-none [&>div]:p-0 [&>div]:pt-2">
              <LocationCapture mode={locationMode} instituteId={instituteId} hasLocation={hasLocation} visible={locationVisible} />
            </div>
          </div>

          {/* ===== 3. التثبيت ===== */}
          <div className="bg-white rounded-ruwad shadow-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-extrabold shrink-0">3</span>
              <div>
                <p className="flex items-center gap-1.5 font-bold text-ruwad-navy"><MonitorDown size={15} className="text-ruwad-blue" /> ثبّت التطبيق</p>
                <p className="text-xs text-ruwad-navy/55 mt-0.5">أيقونة على شاشتك، فتح أسرع، وإشعارات أفضل.</p>
              </div>
            </div>
            <InstallAppButton />
          </div>

          {/* ===== الإنهاء ===== */}
          <button
            onClick={finish}
            className="flex items-center justify-center gap-2 bg-ruwad-navy text-white font-bold px-6 py-3.5 rounded-ruwad hover:opacity-90 transition shadow-ruwad"
          >
            <Rocket size={17} className="text-ruwad-lime" /> تم، انطلق!
          </button>
          <p className="text-center text-[11px] text-ruwad-navy/40 -mt-1">
            يمكنك ضبط كل هذا لاحقاً من صفحة الحساب في أي وقت.
          </p>
        </div>
      </div>
    </div>
  )
}
