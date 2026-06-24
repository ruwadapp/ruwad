'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  label: string
  percentage: number
}

export function ExamProgressChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد امتحانات مكتملة بعد لعرض الرسم البياني.</p>
  }

  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [`${value}%`, 'النسبة']} />
          <Line type="monotone" dataKey="percentage" stroke="#3A4EFB" strokeWidth={3} dot={{ fill: '#3A4EFB', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
