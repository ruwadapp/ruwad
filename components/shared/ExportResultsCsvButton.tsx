'use client'
import { Download } from 'lucide-react'
import { exportToCsv } from '@/lib/utils/exportCsv'

interface ResultRow {
  name: string
  score: number
  total: number
  percentage: number
  passed: boolean
}

export function ExportResultsCsvButton({ rows, fileName }: { rows: ResultRow[]; fileName: string }) {
  function handleExport() {
    exportToCsv(
      fileName,
      ['الطالب', 'الدرجة', 'من', 'النسبة', 'الحالة'],
      rows.map((r) => [r.name, r.score, r.total, `${r.percentage}%`, r.passed ? 'ناجح' : 'غير ناجح']),
    )
  }

  return (
    <button onClick={handleExport} className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy/60 hover:text-ruwad-blue transition">
      <Download size={15} /> تصدير CSV
    </button>
  )
}
