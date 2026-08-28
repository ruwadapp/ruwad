'use client'
import { Download } from 'lucide-react'

// زر تحميل التقرير: يفتح نافذة الطباعة، ومنها يختار المستخدم "حفظ كـ PDF".
// هذا الأسلوب يضمن دعماً مثالياً للعربية والتصميم بدون أي مكتبات توليد PDF.
export function PrintReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-ruwad-blue text-white px-6 py-3.5 rounded-full font-bold shadow-ruwad-lg hover:opacity-90 transition"
    >
      <Download size={18} /> تحميل PDF
    </button>
  )
}
