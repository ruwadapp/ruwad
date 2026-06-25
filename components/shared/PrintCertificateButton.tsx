'use client'
import { Printer } from 'lucide-react'

export function PrintCertificateButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad mx-auto"
    >
      <Printer size={18} /> طباعة / حفظ كـ PDF
    </button>
  )
}
