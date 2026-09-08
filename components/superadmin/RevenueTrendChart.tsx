'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenuePoint {
  label: string
  value: number
}

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  if (data.every((d) => d.value === 0)) {
    return <p className="text-ruwad-navy/50 text-sm py-16 text-center">لا توجد مدفوعات مسجّلة بعد لعرض الاتجاه.</p>
  }

  return (
    <div className="h-64" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3A4EFB" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3A4EFB" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'الإيراد']} />
          <Area type="monotone" dataKey="value" stroke="#3A4EFB" strokeWidth={2.5} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
