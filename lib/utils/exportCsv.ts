// أداة عامة لتصدير أي بيانات كملف CSV متوافق مع Excel (يدعم العربية عبر UTF-8 BOM)

export function exportToCsv(fileName: string, headers: string[], rows: (string | number)[][]) {
  const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`
  const lines = [headers, ...rows].map((line) => line.map(escape).join(','))
  const csv = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
