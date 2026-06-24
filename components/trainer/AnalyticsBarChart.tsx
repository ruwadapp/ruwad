'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartDatum {
  label: string
  value: number
}

export function AnalyticsBarChart({ data, color, unit }: { data: ChartDatum[]; color: string; unit?: string }) {
  if (data.length === 0) {
    return <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد بيانات كافية بعد.</p>
  }

  return (
    <div className="h-60" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [`${value}${unit ?? ''}`, '']} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
