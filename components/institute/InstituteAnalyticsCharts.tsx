'use client'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts'

const BLUE = '#3A4EFB'
const BLUE_LIGHT = '#33A4FA'
const LIME = '#a8c40f'
const NAVY = '#252943'

const tooltipStyle = {
  direction: 'rtl' as const,
  background: '#fff',
  border: '1px solid #DEE0ED',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(58,78,251,.12)',
}

// ===== منحنى النمو الأسبوعي (تسجيلات / تسليمات امتحانات / حضور) =====
export function GrowthChart({ data }: { data: { week: string; تسجيلات: number; تسليمات: number; حضور: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gEnroll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSubs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE_LIGHT} stopOpacity={0.3} />
            <stop offset="100%" stopColor={BLUE_LIGHT} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIME} stopOpacity={0.35} />
            <stop offset="100%" stopColor={LIME} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF7" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: `${NAVY}88` }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: `${NAVY}88` }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="تسجيلات" stroke={BLUE} strokeWidth={2.5} fill="url(#gEnroll)" />
        <Area type="monotone" dataKey="تسليمات" stroke={BLUE_LIGHT} strokeWidth={2.5} fill="url(#gSubs)" />
        <Area type="monotone" dataKey="حضور" stroke={LIME} strokeWidth={2.5} fill="url(#gAtt)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ===== مقارنة المدربين =====
export function TrainerComparisonChart({ data }: { data: { name: string; طلاب: number; 'متوسط الامتحانات': number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF7" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: `${NAVY}88` }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: `${NAVY}88` }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(58,78,251,.05)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="طلاب" fill={BLUE} radius={[8, 8, 0, 0]} maxBarSize={38} />
        <Bar dataKey="متوسط الامتحانات" fill={BLUE_LIGHT} radius={[8, 8, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ===== مؤشرات دائرية (نِسَب) =====
export function RateGauge({ value, label, color = BLUE }: { value: number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={130} height={130}>
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={20} fill={color} background={{ fill: '#EDEFF7' }} />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 22, fontWeight: 800, fill: NAVY }}>
            {value}%
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-xs font-semibold text-ruwad-navy/60 -mt-2 text-center">{label}</p>
    </div>
  )
}
