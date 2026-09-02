export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col items-center justify-center gap-3" dir="rtl">
      <div className="w-10 h-10 rounded-full border-4 border-ruwad-blue border-t-transparent animate-spin" />
      <p className="text-sm font-bold text-ruwad-navy/60">جارٍ معالجة الكود...</p>
    </div>
  )
}
