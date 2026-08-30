'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Plus, Trash2, ExternalLink, CalendarDays, Building2, Pencil } from 'lucide-react'

export interface JobOpp {
  id: string
  position_title: string
  employer_name: string
  description: string | null
  apply_url: string
  deadline: string | null
  created_at: string
}

const inputCls = 'border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition w-full bg-white'

// نشر وإدارة فرص العمل — للمدرب والمعهد
export function JobsManager({ initialJobs }: { initialJobs: JobOpp[] }) {
  const [jobs, setJobs] = useState(initialJobs)
  const [formOpen, setFormOpen] = useState(initialJobs.length === 0)
  const [position, setPosition] = useState('')
  const [employer, setEmployer] = useState('')
  const [description, setDescription] = useState('')
  const [applyUrl, setApplyUrl] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function startEdit(j: JobOpp) {
    setEditingId(j.id)
    setPosition(j.position_title)
    setEmployer(j.employer_name)
    setDescription(j.description ?? '')
    setApplyUrl(j.apply_url)
    setDeadline(j.deadline ?? '')
    setError(null)
    setFormOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setPosition(''); setEmployer(''); setDescription(''); setApplyUrl(''); setDeadline('')
    setError(null)
  }

  async function publish() {
    setError(null)
    if (!position.trim() || !employer.trim() || !applyUrl.trim()) {
      setError('المنصب والجهة الموظِّفة ورابط التقديم حقول مطلوبة.')
      return
    }
    let url = applyUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    try { new URL(url) } catch { setError('رابط التقديم غير صالح.'); return }

    setSaving(true)
    const fields = {
      position_title: position.trim(),
      employer_name: employer.trim(),
      description: description.trim() || null,
      apply_url: url,
      deadline: deadline || null,
    }
    if (editingId) {
      const { data, error: updErr } = await supabase
        .from('job_opportunities')
        .update(fields)
        .eq('id', editingId)
        .select()
        .single()
      setSaving(false)
      if (updErr || !data) { setError('تعذّر حفظ التعديلات، حاول مجدداً.'); return }
      setJobs(jobs.map((j) => (j.id === editingId ? data : j)))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: insertErr } = await supabase
        .from('job_opportunities')
        .insert({ publisher_id: user!.id, ...fields })
        .select()
        .single()
      setSaving(false)
      if (insertErr || !data) { setError('تعذّر نشر الفرصة، حاول مجدداً.'); return }
      setJobs([data, ...jobs])
    }
    resetForm()
    setFormOpen(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه الفرصة نهائياً؟')) return
    const { error: delErr } = await supabase.from('job_opportunities').delete().eq('id', id)
    if (!delErr) setJobs(jobs.filter((j) => j.id !== id))
  }

  const expired = (d: string | null) => d != null && new Date(d) < new Date(new Date().toDateString())

  return (
    <div className="flex flex-col gap-5">
      {/* ===== نموذج النشر ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy">
            <span className="w-9 h-9 rounded-ruwad-sm bg-ruwad-blue/10 flex items-center justify-center"><Briefcase size={17} className="text-ruwad-blue" /></span>
            {editingId ? 'تعديل الفرصة' : 'نشر فرصة عمل'}
          </h2>
          {!formOpen && (
            <button onClick={() => setFormOpen(true)} className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition flex items-center gap-1.5">
              <Plus size={15} /> فرصة جديدة
            </button>
          )}
        </div>
        <p className="text-xs text-ruwad-navy/50 mb-4">تظهر الفرصة لكل طلاب رُوّاد فور نشرها، مع تنبيه على شاشتهم الرئيسية.</p>

        {formOpen && (
          <div className="flex flex-col gap-3">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-2.5">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="المنصب المطلوب (مصمم جرافيك)" className={inputCls} />
              <input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="الجهة الموظِّفة (شركة النور للدعاية)" className={inputCls} />
              <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="رابط التقديم (https://...)" className={inputCls} dir="ltr" />
              <div className="flex flex-col gap-1">
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
                <span className="text-[10px] text-ruwad-navy/40 pr-1">تاريخ انتهاء التقديم (اختياري)</span>
              </div>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="وصف مختصر اختياري: المتطلبات، الدوام، المدينة..." className={`${inputCls} resize-none`} />
            <div className="flex items-center gap-2">
              <button onClick={publish} disabled={saving} className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5">
                <Briefcase size={15} /> {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'نشر الفرصة'}
              </button>
              {(jobs.length > 0 || editingId) && (
                <button onClick={() => { resetForm(); setFormOpen(false) }} className="text-sm font-semibold text-ruwad-navy/50 px-3 py-2.5 hover:text-ruwad-navy transition">إلغاء</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== فرصي المنشورة ===== */}
      {jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-ruwad-navy/60">فرصك المنشورة ({jobs.length})</h3>
          {jobs.map((j) => (
            <div key={j.id} className={`bg-white rounded-ruwad shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${expired(j.deadline) ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-ruwad-navy leading-snug">{j.position_title}</p>
                <p className="flex items-center gap-1.5 text-xs text-ruwad-navy/55 mt-1"><Building2 size={12} /> {j.employer_name}</p>
                {j.deadline && (
                  <p className={`flex items-center gap-1.5 text-[11px] mt-1 font-semibold ${expired(j.deadline) ? 'text-red-500' : 'text-ruwad-navy/45'}`}>
                    <CalendarDays size={11} /> {expired(j.deadline) ? 'انتهى التقديم' : `آخر موعد: ${new Date(j.deadline).toLocaleDateString('ar')}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={j.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-ruwad-sm px-3 py-2 hover:bg-ruwad-blue/20 transition">
                  <ExternalLink size={13} /> رابط التقديم
                </a>
                <button
                  onClick={() => startEdit(j)}
                  aria-label="تعديل"
                  title="تعديل الفرصة"
                  className={`p-2 rounded-ruwad-sm transition ${editingId === j.id ? 'bg-ruwad-blue text-white' : 'text-ruwad-blue hover:bg-ruwad-blue/10'}`}
                ><Pencil size={15} /></button>
                <button onClick={() => remove(j.id)} aria-label="حذف" className="p-2 rounded-ruwad-sm text-red-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
