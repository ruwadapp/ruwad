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

const LEVELS = [
  { min: 0, name: 'مبتدئ', icon: Star, color: '#8A94B8', glow: 'rgba(138,148,184,.5)' },
  { min: 500, name: 'ناشئ', icon: Sparkles, color: '#33A4FA', glow: 'rgba(51,164,250,.55)' },
  { min: 1500, name: 'متقدّم', icon: Award, color: '#3A4EFB', glow: 'rgba(58,78,251,.55)' },
  { min: 3500, name: 'محترف', icon: Trophy, color: '#a8c40f', glow: 'rgba(168,196,15,.55)' },
  { min: 7000, name: 'خبير', icon: Gem, color: '#7C3AED', glow: 'rgba(124,58,237,.55)' },
  { min: 12000, name: 'أسطورة', icon: Crown, color: '#F59E0B', glow: 'rgba(245,158,11,.6)' },
]

export function getLevel(total: number) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (total >= LEVELS[i].min) idx = i
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next ? Math.round(((total - current.min) / (next.min - current.min)) * 100) : 100
  return { ...current, index: idx, next, progress, toNext: next ? next.min - total : 0 }
}

// نجوم متلألئة موزّعة في الخلفية
function Stars() {
  const pts = [
    { top: '12%', left: '8%', s: 10, d: '0s' },
    { top: '26%', left: '88%', s: 7, d: '.6s' },
    { top: '62%', left: '15%', s: 8, d: '1.1s' },
    { top: '18%', left: '54%', s: 6, d: '.3s' },
    { top: '72%', left: '78%', s: 9, d: '.9s' },
    { top: '45%', left: '94%', s: 6, d: '1.4s' },
    { top: '82%', left: '40%', s: 7, d: '.2s' },
  ]
  return (
    <>
      {pts.map((p, i) => (
        <Star key={i} size={p.s} className="absolute text-white animate-star-twinkle fill-white" style={{ top: p.top, left: p.left, animationDelay: p.d }} />
      ))}
    </>
  )
}

export function PointsCard({ points, compact = false }: { points: PointsBreakdown; compact?: boolean }) {
  const level = getLevel(points.total)
  const LevelIcon = level.icon

  const rows = [
    { label: 'الامتحانات', value: points.exams, icon: '📝' },
    { label: 'التحديات', value: points.challenges, icon: '🔥' },
    { label: 'الواجبات', value: points.assignments, icon: '✅' },
    { label: 'الشهادات', value: points.certificates, icon: '🎓' },
    { label: 'الحضور', value: points.attendance, icon: '📅' },
    { label: 'الشارات', value: points.badges, icon: '🏅' },
  ].filter((r) => r.value > 0)

  return (
    <div className="rounded-ruwad overflow-hidden shadow-ruwad-lg" style={{ boxShadow: `0 12px 40px ${level.glow}` }}>
      {/* ===== اللوحة الرئيسية ===== */}
      <div className="relative p-6 text-white overflow-hidden" style={{ background: `linear-gradient(135deg, ${level.color} 0%, #1a1e33 135%)` }}>
        <Stars />
        {/* شعاع لمعان يمرّ ===== */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent via-white/25 to-transparent animate-points-shine" />
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs opacity-85"><Sparkles size={13} /> مجموع نقاطك</p>
            <p className="text-5xl font-black mt-1 tracking-tight animate-count-pop drop-shadow-lg">{points.total.toLocaleString('ar')}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur rounded-full px-3.5 py-1.5 text-sm font-extrabold shadow">
              <LevelIcon size={16} /> {level.name}
            </span>
          </div>
          {/* الميدالية */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full blur-xl" style={{ background: level.glow }} />
            <div className="relative w-20 h-20 rounded-full bg-white/15 backdrop-blur flex items-center justify-center ring-2 ring-white/30 animate-badge-float">
              <LevelIcon size={38} className="drop-shadow" />
            </div>
          </div>
        </div>

        {/* شريط التقدّم للمستوى التالي */}
        {level.next && (
          <div className="relative mt-5">
            <div className="flex justify-between text-[11px] opacity-90 mb-1.5">
              <span className="flex items-center gap-1 font-semibold"><level.next.icon size={11} /> {level.next.name}</span>
              <span>باقٍ {level.toNext.toLocaleString('ar')} نقطة</span>
            </div>
            <div className="h-2.5 bg-black/25 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${Math.max(level.progress, 4)}%`, background: 'linear-gradient(90deg,#E3FF3B,#fff)' }}>
                <div className="absolute inset-0 bg-white/40 animate-points-shine" />
              </div>
            </div>
          </div>
        )}
        {!level.next && (
          <p className="relative mt-5 text-center text-sm font-bold text-ruwad-lime">🎉 بلغتَ أعلى مستوى — أسطورة رُوّاد!</p>
        )}
      </div>

      {/* ===== تفصيل المصادر ===== */}
      {!compact && rows.length > 0 && (
        <div className="bg-white p-5 grid grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-0.5 p-3 rounded-ruwad-sm bg-[#F5F6FA]">
              <span className="text-lg">{r.icon}</span>
              <span className="text-base font-extrabold text-ruwad-navy">{r.value.toLocaleString('ar')}</span>
              <span className="text-[10px] text-ruwad-navy/50">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
