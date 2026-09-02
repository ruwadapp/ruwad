'use client'
import { Printer } from 'lucide-react'

export function PrintReceiptButton() {
  return (
    <button onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 bg-ruwad-blue text-white font-extrabold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
      <Printer size={16} /> طباعة الإيصال
    </button>
  )
}
