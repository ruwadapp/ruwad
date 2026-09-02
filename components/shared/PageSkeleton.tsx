// هيكل تحميل موحّد بهوية المنصة — يظهر فوراً عند التنقّل بينما يجهّز الخادم الصفحة
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] animate-pulse" dir="rtl">
      <div className="bg-white shadow-card px-6 py-4 flex items-center justify-between">
        <div className="h-6 w-36 rounded-full bg-ruwad-gray/60" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-ruwad-gray/50" />
          <div className="w-10 h-10 rounded-full bg-ruwad-gray/50" />
        </div>
      </div>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-ruwad bg-white border-2 border-ruwad-gray/40" />
          ))}
        </div>
        <div className="h-64 rounded-ruwad bg-white border-2 border-ruwad-gray/40" />
        <div className="h-40 rounded-ruwad bg-white border-2 border-ruwad-gray/40" />
      </div>
    </div>
  )
}
