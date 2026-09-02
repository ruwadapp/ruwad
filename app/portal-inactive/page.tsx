// تُعرض على دومين المعهد عندما تكون بوابته موقوفة أو منتهية الاشتراك
export const metadata = { title: 'البوابة غير نشطة', robots: { index: false, follow: false } }
export default function PortalInactivePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8 text-center flex flex-col items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-[#DEE0ED]/60 flex items-center justify-center text-3xl">⏸️</span>
        <h1 className="text-xl font-extrabold text-[#252943]">هذه البوابة غير نشطة حالياً</h1>
        <p className="text-sm text-[#252943]/60 leading-relaxed">
          اشتراك هذا المعهد في البوابة موقوف أو منتهي. إذا كنت من إدارة المعهد،
          يرجى التواصل مع إدارة منصة رُوّاد لإعادة التفعيل.
        </p>
        <a href="https://www.ruwaad.app" className="mt-2 text-sm font-bold text-[#3A4EFB] hover:underline">
          الانتقال إلى منصة رُوّاد ←
        </a>
      </div>
    </main>
  )
}
