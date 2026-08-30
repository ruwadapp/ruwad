'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Lock, Check, Shield, FileCheck, Zap, GraduationCap, Gem, Star, PlayCircle,
} from 'lucide-react'

export interface JourneyNode {
  key: string
  kind: 'lecture' | 'assignment' | 'exam' | 'challenge' | 'certificate' | 'treasure'
  title: string
  href: string
  completed: boolean
  /** لكنوز الترتيب المخصص: معرّف عنصر الرحلة للمطالبة */
  treasureItemId?: string
}

const KIND_META = {
  lecture: { icon: BookOpen, label: 'محاضرة', size: 64 },
  assignment: { icon: FileCheck, label: 'واجب', size: 64 },
  exam: { icon: Shield, label: 'بوابة الامتحان', size: 78 },
  challenge: { icon: Zap, label: 'تحدي', size: 70 },
  certificate: { icon: GraduationCap, label: 'الشهادة', size: 88 },
} as const

const ROW_H = 118
const TREASURE_EVERY = 3 // كنز بعد كل 3 محطات حقيقية

interface RenderNode {
  type: 'station' | 'treasure'
  node?: JourneyNode
  index: number // فهرس العرض (يُستخدم كمعرّف للكنز)
  unlocked: boolean
  isCurrent: boolean
  claimed?: boolean
}

// ============================================================
// خريطة الرحلة: مسار متعرّج بعقد متسلسلة — محاضرات وبوابات وكنوز وقمة
// ============================================================
export function CourseJourneyMap({
  courseId,
  nodes,
  sequential,
  claimedIndexes,
  claimedItemIds = [],
  customOrder = false,
  preview = false,
}: {
  courseId: string
  nodes: JourneyNode[]
  sequential: boolean
  claimedIndexes: number[]
  claimedItemIds?: string[]
  /** ترتيب مخصص من المنظِّم: الكنوز عناصر صريحة داخل nodes ولا تُدرج تلقائياً */
  customOrder?: boolean
  preview?: boolean
}) {
  const [claimed, setClaimed] = useState<Set<number>>(new Set(claimedIndexes))
  const [claimedItems, setClaimedItems] = useState<Set<string>>(new Set(claimedItemIds))
  const [claiming, setClaiming] = useState<number | string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // ===== بناء تسلسل العرض: محطات حقيقية + كنوز مُدرجة بينها =====
  const renderNodes = useMemo(() => {
    const out: RenderNode[] = []
    let prevRealCompleted = true // أول محطة مفتوحة دائماً
    let realCount = 0
    let currentAssigned = false

    for (const n of nodes) {
      if (customOrder && n.kind === 'treasure') {
        out.push({
          type: 'treasure',
          node: n,
          index: out.length,
          unlocked: !sequential || prevRealCompleted,
          isCurrent: false,
          claimed: claimedItems.has(n.treasureItemId ?? ''),
        })
        continue
      }
      // كنز تلقائي قبل هذه المحطة؟ (الوضع التلقائي فقط)
      if (!customOrder && realCount > 0 && realCount % TREASURE_EVERY === 0 && n.kind !== 'certificate') {
        const idx = out.length
        out.push({
          type: 'treasure',
          index: idx,
          unlocked: !sequential || prevRealCompleted,
          isCurrent: false,
          claimed: claimed.has(idx),
        })
      }
      const unlocked = !sequential || prevRealCompleted
      const isCurrent = unlocked && !n.completed && !currentAssigned && n.kind !== 'certificate'
      if (isCurrent) currentAssigned = true
      out.push({ type: 'station', node: n, index: out.length, unlocked, isCurrent })
      prevRealCompleted = prevRealCompleted && n.completed
      realCount++
    }
    return out
  }, [nodes, sequential, claimed, claimedItems, customOrder])

  const stations = nodes.filter((n) => n.kind !== 'treasure')
  const doneCount = stations.filter((n) => n.completed).length
  const pct = stations.length ? Math.round((doneCount / stations.length) * 100) : 0

  // ===== هندسة المسار المتعرّج =====
  const W = 340
  const cx = (i: number) => (i % 2 === 0 ? W * 0.3 : W * 0.7)
  const cy = (i: number) => 70 + i * ROW_H
  const totalH = 70 + (renderNodes.length - 1) * ROW_H + 90

  const pathD = useMemo(() => {
    if (renderNodes.length < 2) return ''
    let d = `M ${cx(0)} ${cy(0)}`
    for (let i = 1; i < renderNodes.length; i++) {
      const x0 = cx(i - 1), y0 = cy(i - 1), x1 = cx(i), y1 = cy(i)
      const my = (y0 + y1) / 2
      d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`
    }
    return d
  }, [renderNodes.length])

  async function claimTreasure(rn: RenderNode) {
    if (preview || claiming !== null) return
    const itemId = rn.node?.treasureItemId
    const key = itemId ?? rn.index
    setClaiming(key)
    const { data, error } = itemId
      ? await supabase.rpc('claim_treasure_item', { p_item_id: itemId })
      : await supabase.rpc('claim_treasure', { p_course_id: courseId, p_node_index: rn.index })
    setClaiming(null)
    if (!error && (data === 'ok' || data === 'already_claimed')) {
      if (itemId) setClaimedItems((prev) => new Set(prev).add(itemId))
      else setClaimed((prev) => new Set(prev).add(rn.index))
      if (data === 'ok') router.refresh() // popup النقاط يصل عبر البث اللحظي تلقائياً
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ===== شريط تقدّم الرحلة ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-ruwad-gradient text-white flex items-center justify-center shrink-0">
          <Star size={18} className="fill-current" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-ruwad-navy">أنجزت {doneCount} من {stations.length} محطة</p>
          <div className="h-2.5 bg-ruwad-gray/40 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-ruwad-gradient rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="font-black text-ruwad-blue text-lg shrink-0">{pct}%</span>
      </div>

      {/* ===== الخريطة ===== */}
      <div className="relative bg-gradient-to-b from-[#EEF3FF] via-white to-ruwad-lime/10 rounded-ruwad shadow-card overflow-hidden">
        <div className="relative mx-auto" style={{ width: W, height: totalH }}>
          {/* المسار */}
          <svg width={W} height={totalH} className="absolute inset-0">
            <path d={pathD} fill="none" stroke="#DEE0ED" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 18" />
          </svg>

          {/* العقد */}
          {renderNodes.map((rn) => {
            const x = cx(rn.index), y = cy(rn.index)

            if (rn.type === 'treasure') {
              const canClaim = rn.unlocked && !rn.claimed
              return (
                <button
                  key={`t-${rn.index}`}
                  onClick={() => canClaim && claimTreasure(rn)}
                  disabled={!canClaim || claiming !== null}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-transform ${canClaim ? 'hover:scale-110 cursor-pointer' : ''}`}
                  style={{ left: x, top: y }}
                  aria-label="كنز مخفي"
                >
                  <span className={`w-12 h-12 rounded-2xl rotate-45 flex items-center justify-center shadow-ruwad transition-all ${
                    rn.claimed ? 'bg-ruwad-gray/50' : rn.unlocked ? 'bg-gradient-to-br from-amber-300 to-amber-500 animate-badge-float' : 'bg-ruwad-gray/40'
                  }`}>
                    <Gem size={20} className={`-rotate-45 ${rn.claimed ? 'text-ruwad-navy/30' : rn.unlocked ? 'text-white drop-shadow' : 'text-ruwad-navy/25'}`} />
                  </span>
                  <span className={`text-[10px] font-bold ${rn.claimed ? 'text-ruwad-navy/35' : rn.unlocked ? 'text-amber-600' : 'text-ruwad-navy/30'}`}>
                    {rn.claimed ? 'حصلت عليه ✓' : rn.unlocked ? (claiming !== null ? 'جارٍ الفتح...' : 'كنز! اضغط') : 'كنز مخفي'}
                  </span>
                </button>
              )
            }

            const n = rn.node!
            const meta = KIND_META[n.kind as Exclude<JourneyNode['kind'], 'treasure'>]
            const Icon = meta.icon
            const size = meta.size
            const isCert = n.kind === 'certificate'
            const gate = n.kind === 'exam' || n.kind === 'challenge'

            const circle = (
              <span
                className={`relative flex items-center justify-center rounded-full transition-all shadow-ruwad ${
                  n.completed
                    ? 'bg-ruwad-blue text-white'
                    : isCert
                    ? (rn.unlocked ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-white animate-badge-float' : 'bg-ruwad-gray/50 text-ruwad-navy/30')
                    : rn.isCurrent
                    ? 'bg-white text-ruwad-blue ring-4 ring-ruwad-blue'
                    : rn.unlocked
                    ? (gate ? 'bg-ruwad-navy text-ruwad-lime' : 'bg-white text-ruwad-navy/70 ring-2 ring-ruwad-gray')
                    : 'bg-ruwad-gray/40 text-ruwad-navy/30'
                }`}
                style={{ width: size, height: size }}
              >
                {rn.isCurrent && <span className="absolute inline-flex h-full w-full rounded-full bg-ruwad-blue/30 animate-ping" />}
                {n.completed ? <Check size={size * 0.42} strokeWidth={3} /> : rn.unlocked ? <Icon size={size * 0.42} /> : <Lock size={size * 0.36} />}
              </span>
            )

            const label = (
              <span className="flex flex-col items-center gap-0.5 max-w-[150px]">
                {rn.isCurrent && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2 py-0.5">
                    <PlayCircle size={10} /> أنت هنا
                  </span>
                )}
                <span className={`text-[11px] font-bold text-center leading-tight line-clamp-2 ${
                  rn.unlocked ? 'text-ruwad-navy' : 'text-ruwad-navy/35'
                }`}>
                  {n.title}
                </span>
                <span className={`text-[9px] font-semibold ${gate && rn.unlocked && !n.completed ? 'text-amber-600' : 'text-ruwad-navy/35'}`}>
                  {n.completed ? '✓ منجزة' : meta.label}
                </span>
              </span>
            )

            const content = (
              <span className="flex flex-col items-center gap-1.5">
                {circle}
                {label}
              </span>
            )

            return rn.unlocked && !preview ? (
              <Link
                key={n.key}
                href={n.href}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex hover:scale-105 transition-transform"
                style={{ left: x, top: y }}
              >
                {content}
              </Link>
            ) : (
              <span
                key={n.key}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex"
                style={{ left: x, top: y }}
                title={rn.unlocked ? undefined : 'أكمل المحطات السابقة أولاً'}
              >
                {content}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
