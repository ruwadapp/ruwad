import { Trophy, Star, Sparkles, Award, Gem, Crown } from 'lucide-react'

export interface PointsBreakdown {
  exams: number
  challenges: number
  assignments: number
  certificates: number
  attendance: number
  badges: number
  total: number
}

// مستويات النقاط
const LEVELS = [
  { min: 0, name: 'مبتدئ', icon: Star, color: '#8A94B8' },
  { min: 500, name: 'ناشئ', icon: Sparkles, color: '#33A4FA' },
  { min: 1500, name: 'متقدّم', icon: Award, color: '#3A4EFB' },
  { min: 3500, name: 'محترف', icon: Trophy, color: '#a8c40f' },
  { min: 7000, name: 'خبير', icon: Gem, color: '#7C3AED' },
  { min: 12000, name: 'أسطورة', icon: Crown, color: '#F59E0B' },
]

export function getLevel(total: number) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (total >= LEVELS[i].min) idx = i
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next ? Math.round(((total - current.min) / (next.min - current.min)) * 100) : 100
  return { ...current, index: idx, next, progress, toNext: next ? next.min - total : 0 }
}

// بطاقة النقاط والمستوى — تُعرض على البروفايل
export function PointsCard({ points }: { points: PointsBreakdown }) {
  const level = getLevel(points.total)
  const LevelIcon = level.icon

  const rows = [
    { label: 'الامتحانات', value: points.exams, color: '#3A4EFB' },
    { label: 'التحديات', value: points.challenges, color: '#a8c40f' },
    { label: 'الواجبات', value: points.assignments, color: '#33A4FA' },
    { label: 'الشهادات', value: points.certificates, color: '#F59E0B' },
    { label: 'الحضور', value: points.attendance, color: '#252943' },
    { label: 'الشارات', value: points.badges, color: '#7C3AED' },
  ].filter((r) => r.value > 0)

  return (
    <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
      {/* رأس: المجموع والمستوى */}
      <div className="relative p-6 text-white overflow-hidden" style={{ background: `linear-gradient(135deg, ${level.color} 0%, #252943 130%)` }}>
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">مجموع النقاط</p>
            <p className="text-4xl font-extrabold mt-1">{points.total.toLocaleString('ar')}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-sm font-bold">
              <LevelIcon size={15} /> {level.name}
            </span>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
            <LevelIcon size={30} />
          </div>
        </div>
        {/* شريط التقدّم للمستوى التالي */}
        {level.next && (
          <div className="relative mt-4">
            <div className="flex justify-between text-[11px] opacity-80 mb-1">
              <span>{level.progress}% نحو {level.next.name}</span>
              <span>باقٍ {level.toNext.toLocaleString('ar')} نقطة</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-ruwad-lime rounded-full transition-all" style={{ width: `${level.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* تفصيل المصادر */}
      {rows.length > 0 && (
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col">
              <span className="text-lg font-extrabold" style={{ color: r.color }}>{r.value.toLocaleString('ar')}</span>
              <span className="text-[11px] text-ruwad-navy/50">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
