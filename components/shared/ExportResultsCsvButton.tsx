'use client'
import { Download } from 'lucide-react'

interface ResultRow {
  name: string
  score: number
  total: number
  percentage: number
  passed: boolean
}

export function ExportResultsCsvButton({ rows, fileName }: { rows: ResultRow[]; fileName: string }) {
  function exportCsv() {
    const header = ['الطالب', 'الدرجة', 'من', 'النسبة', 'الحالة']
    const lines = [
      header,
      ...rows.map((r) => [r.name, String(r.score), String(r.total), `${r.percentage}%`, r.passed ? 'ناجح' : 'غير ناجح']),
    ]
    const csv = '\uFEFF' + lines.map((line) => line.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy/60 hover:text-ruwad-blue transition">
      <Download size={15} /> تصدير CSV
    </button>
  )
}
