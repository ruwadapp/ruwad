'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShareManager } from '@/components/shared/ShareManager'
import type { TrainerInstitute } from '@/lib/utils/getTrainerInstitutes'
import {
  FileText, Users, Search, Pencil, Trash2, Link2, Check, BarChart3, BookOpen, Filter,
} from 'lucide-react'

export interface ExamGridItem {
  id: string
  title: string
  description: string | null
  is_active: boolean
  exam_code: string | null
  course_id: string | null
  created_at: string
  questionsCount: number
  submissionsCount: number
}

const ACCENTS = [
  { bar: '#3A4EFB', soft: 'rgba(58,78,251,.10)', text: '#3A4EFB' },
  { bar: '#33A4FA', soft: 'rgba(51,164,250,.12)', text: '#1d84d8' },
  { bar: '#252943', soft: 'rgba(37,41,67,.08)', text: '#252943' },
  { bar: '#a8c40f', soft: 'rgba(227,255,59,.35)', text: '#7d920b' },
]
function accentFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

// شبكة الامتحانات: فلاتر (بحث/كورس/حالة/ترتيب) + بطاقات فاتحة أنيقة بشريط لون جانبي
export function ExamsGrid({
  exams,
  courses,
  institutes,
  sharesMap,
}: {
  exams: ExamGridItem[]
  courses: { id: string; title: string }[]
  institutes: TrainerInstitute[]
  sharesMap: Record<string, string[]>
}) {
  const [q, setQ] = useState('')
  const [courseFilter, setCourseFilter] = useState<'all' | 'none' | string>('all')
  const [status, setStatus] = useState<'all' | 'active' | 'stopped'>('all')
  const [sort, setSort] = useState<'newest' | 'popular'>('newest')
  const router = useRouter()
  const supabase = createClient()
  const courseTitle = useMemo(() => new Map(courses.map((c) => [c.id, c.title])), [courses])

  const filtered = useMemo(() => {
    let list = exams
    if (q.trim()) {
      const needle = q.trim()
      list = list.filter((e) => e.title.includes(needle) || (e.description ?? '').includes(needle))
    }
    if (courseFilter === 'none') list = list.filter((e) => !e.course_id)
    else if (courseFilter !== 'all') list = list.filter((e) => e.course_id === courseFilter)
    if (status !== 'all') list = list.filter((e) => (status === 'active' ? e.is_active : !e.is_active))
    return [...list].sort((a, b) =>
      sort === 'popular'
        ? b.submissionsCount - a.submissionsCount
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [exams, q, courseFilter, status, sort])

  async function handleDelete(id: string) {
    if (!confirm('حذف الامتحان سيحذف معه كل أسئلته ونتائج الطلاب فيه نهائياً. متابعة؟')) return
    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) alert('حدث خطأ أثناء الحذف، حاول مرة أخرى')
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ===== شريط الفلاتر ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم الامتحان..."
              className="w-full border border-ruwad-gray rounded-ruwad-sm pr-9 pl-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition bg-white sm:w-56"
          >
            <option value="all">كل الكورسات</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            <option value="none">بلا كورس (عام)</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'popular')}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition bg-white sm:w-44"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="popular">الأكثر مشاركة</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-ruwad-navy/40" />
          {([['all', 'الكل'], ['active', 'نشط'], ['stopped', 'متوقف']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setStatus(v)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
                status === v ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/30 text-ruwad-navy/60 hover:bg-ruwad-gray/50'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-xs text-ruwad-navy/40 mr-auto">{filtered.length} امتحان</span>
        </div>
      </div>

      {/* ===== البطاقات ===== */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
          لا توجد امتحانات مطابقة لبحثك أو فلاترك.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((exam) => {
            const accent = accentFor(exam.id)
            const shared = sharesMap[exam.id] ?? []
            return (
              <div
                key={exam.id}
                className="group relative bg-white rounded-ruwad shadow-card hover:shadow-ruwad-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
              >
                {/* شريط اللون العلوي */}
                <div className="h-1.5" style={{ background: accent.bar }} />

                <Link href={`/exams/${exam.id}`} className="p-5 pb-3 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-11 h-11 rounded-ruwad-sm flex items-center justify-center shrink-0" style={{ background: accent.soft }}>
                      <FileText size={20} style={{ color: accent.text }} />
                    </span>
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      exam.is_active ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.is_active ? 'bg-green-500 animate-pulse' : 'bg-ruwad-navy/30'}`} />
                      {exam.is_active ? 'نشط' : 'متوقف'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-ruwad-navy leading-snug line-clamp-2 group-hover:text-ruwad-blue transition-colors">{exam.title}</h3>
                    {exam.description && <p className="text-xs text-ruwad-navy/50 line-clamp-2 mt-1.5 leading-relaxed">{exam.description}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-auto">
                    {exam.course_id && courseTitle.get(exam.course_id) && (
                      <span className="flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1" style={{ background: accent.soft, color: accent.text }}>
                        <BookOpen size={11} /> {courseTitle.get(exam.course_id)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1">
                      <FileText size={11} /> {exam.questionsCount} سؤال
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1">
                      <Users size={11} /> {exam.submissionsCount} مشارك
                    </span>
                  </div>
                </Link>

                {!exam.course_id && institutes.length > 0 && (
                  <div className="px-5 pb-2">
                    <ShareManager resourceType="exams" resourceId={exam.id} institutes={institutes} initialSharedInstituteIds={shared} />
                  </div>
                )}

                {/* شريط الإجراءات */}
                <div className="border-t border-ruwad-gray/40 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Link href={`/exams/${exam.id}`} aria-label="تعديل" className="p-2 rounded-ruwad-sm text-ruwad-blue hover:bg-ruwad-blue/10 transition"><Pencil size={15} /></Link>
                    <Link href={`/exams/${exam.id}/results`} aria-label="النتائج" className="p-2 rounded-ruwad-sm text-ruwad-navy hover:bg-ruwad-navy/10 transition"><BarChart3 size={15} /></Link>
                    {exam.exam_code && <CopyLinkButton code={exam.exam_code} />}
                  </div>
                  <button onClick={() => handleDelete(exam.id)} aria-label="حذف" className="p-2 rounded-ruwad-sm text-red-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/qr/${code}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      aria-label="نسخ رابط المشاركة"
      className={`p-2 rounded-ruwad-sm transition ${copied ? 'text-green-600 bg-green-50' : 'text-ruwad-navy/60 hover:bg-ruwad-gray/30'}`}
    >
      {copied ? <Check size={15} /> : <Link2 size={15} />}
    </button>
  )
}
