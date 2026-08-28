// شاشة تحميل هيكلية تظهر فور الضغط على أيقونة الحساب،
// فيشعر المستخدم باستجابة لحظية بينما تُجلب البيانات في الخلفية
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#F5F6FA]" dir="rtl">
      <div className="bg-ruwad-gradient px-6 pt-10 pb-16 flex flex-col items-center gap-3 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-white/25" />
        <div className="w-20 h-5 rounded-full bg-white/20" />
        <div className="w-44 h-7 rounded-ruwad-sm bg-white/25" />
        <div className="w-56 h-4 rounded-full bg-white/15" />
      </div>
      <div className="mx-4 sm:mx-6 flex flex-col gap-4 py-5">
        <div className="-mt-14 h-48 rounded-ruwad bg-white shadow-card animate-pulse" />
        <div className="h-28 rounded-ruwad bg-white shadow-card animate-pulse" />
        <div className="h-56 rounded-ruwad bg-white shadow-card animate-pulse" />
      </div>
    </div>
  )
}
