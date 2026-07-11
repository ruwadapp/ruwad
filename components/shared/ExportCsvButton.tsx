'use client'
import { Download } from 'lucide-react'
import { exportToCsv } from '@/lib/utils/exportCsv'

interface ExportCsvButtonProps {
  fileName: string
  headers: string[]
  rows: (string | number)[][]
  label?: string
}

export function ExportCsvButton({ fileName, headers, rows, label = 'تصدير CSV' }: ExportCsvButtonProps) {
  return (
    <button
      onClick={() => exportToCsv(fileName, headers, rows)}
      disabled={rows.length === 0}
      className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy/60 hover:text-ruwad-blue transition disabled:opacity-40 disabled:pointer-events-none"
    >
      <Download size={15} /> {label}
    </button>
  )
}
