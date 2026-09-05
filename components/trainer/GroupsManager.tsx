'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, Loader2, Users2, ListChecks, Trash2, ChevronDown, UserPlus,
  Check, Circle, CalendarClock, Pencil,
} from 'lucide-react'

/* ================================================================
   مجموعات المشاريع — المدرب ينظّم طلابه في مجموعات لكورس/مشروع،
   يضيف أعضاء لكل مجموعة، ويعيّن مهاماً (Tasks) تتبعها المجموعة
   ================================================================ */

interface Student { id: string; full_name: string; avatar_url: string | null }
interface Task { id: string; title: string; description: string | null; due_date: string | null; is_completed: boolean }
interface Group { id: string; name: string; description: string | null; color: string; members: Student[]; tasks: Task[] }

const COLORS = ['#3A4EFB', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0d9488', '#0284c7', '#db2777']

export function GroupsManager({ courseId, initialGroups, roster }: { courseId: string; initialGroups: Group[]; roster: Student[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [membersModal, setMembersModal] = useState<Group | null>(null)
  const [taskModal, setTaskModal] = useState<{ group: Group; task: Task | null } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(initialGroups[0]?.id ?? null)

  async function deleteGroup(g: Group) {
    if (!confirm(`حذف مجموعة "${g.name}" نهائياً؟ ستُحذف كل مهامها معها.`)) return
    await supabase.from('project_groups').delete().eq('id', g.id)
    router.refresh()
  }
  async function deleteTask(t: Task) {
    if (!confirm(`حذف مهمة "${t.title}"؟`)) return
    await supabase.from('project_group_tasks').delete().eq('id', t.id)
    router.refresh()
  }
  async function toggleTask(t: Task) {
    await supabase.from('project_group_tasks').update({ is_completed: !t.is_completed }).eq('id', t.id)
    router.refresh()
  }

  const assignedIds = new Set(initialGroups.flatMap((g) => g.members.map((m) => m.id)))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ruwad-navy/60">{initialGroups.length} مجموعة · {roster.length} طالباً في الكورس</p>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 shadow-ruwad transition">
          <Plus size={16} /> مجموعة جديدة
        </button>
      </div>

      {initialGroups.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-12 text-center flex flex-col items-center gap-3">
          <Users2 size={34} className="text-ruwad-blue/30" />
          <p className="text-sm text-ruwad-navy/50">لا مجموعات بعد — أنشئ أول مجموعة ونظّم طلابك للمشروع.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {initialGroups.map((g) => {
            const open = expanded === g.id
            const doneCount = g.tasks.filter((t) => t.is_completed).length
            return (
              <div key={g.id} className="bg-white rounded-ruwad shadow-card overflow-hidden">
                <div className="h-1.5 w-full" style={{ background: g.color }} />
                <button onClick={() => setExpanded(open ? null : g.id)} className="w-full p-4 flex items-center gap-3 text-right">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-white" style={{ background: g.color }}>
                    {g.members.length}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate">{g.name}</p>
                    <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5">
                      {g.members.length} أعضاء · {g.tasks.length} مهمة{g.tasks.length > 0 && ` (${doneCount} منجَزة)`}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`shrink-0 text-ruwad-navy/30 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="border-t border-ruwad-gray/50 p-4 flex flex-col gap-4">
                    {g.description && <p className="text-xs font-bold text-ruwad-navy/55">{g.description}</p>}

                    {/* الأعضاء */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-extrabold text-ruwad-navy flex items-center gap-1.5"><Users2 size={13} /> الأعضاء</p>
                        <button onClick={() => setMembersModal(g)} className="text-[11px] font-extrabold text-ruwad-blue hover:underline flex items-center gap-1"><UserPlus size={12} /> إدارة الأعضاء</button>
                      </div>
                      {g.members.length === 0 ? (
                        <p className="text-[11px] text-ruwad-navy/40">لا أعضاء بعد.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {g.members.map((m) => (
                            <span key={m.id} className="flex items-center gap-1.5 text-[11px] font-bold text-ruwad-navy bg-[#F5F6FA] rounded-full pl-2.5 pr-1 py-1">
                              {m.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-ruwad-gradient text-white text-[9px] font-black flex items-center justify-center">{m.full_name.charAt(0)}</span>
                              )}
                              {m.full_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* المهام */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-extrabold text-ruwad-navy flex items-center gap-1.5"><ListChecks size={13} /> المهام</p>
                        <button onClick={() => setTaskModal({ group: g, task: null })} className="text-[11px] font-extrabold text-ruwad-blue hover:underline flex items-center gap-1"><Plus size={12} /> مهمة جديدة</button>
                      </div>
                      {g.tasks.length === 0 ? (
                        <p className="text-[11px] text-ruwad-navy/40">لا مهام بعد.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {g.tasks.map((t) => {
                            const late = !t.is_completed && t.due_date && t.due_date < new Date().toISOString().slice(0, 10)
                            return (
                              <div key={t.id} className={`flex items-center gap-2.5 rounded-ruwad-sm px-3 py-2.5 ${t.is_completed ? 'bg-green-50/70' : late ? 'bg-red-50' : 'bg-[#F5F6FA]'}`}>
                                <button onClick={() => toggleTask(t)} className="shrink-0">
                                  {t.is_completed ? <Check size={16} className="text-green-600" /> : <Circle size={16} className="text-ruwad-navy/30" />}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-extrabold truncate ${t.is_completed ? 'text-ruwad-navy/45 line-through' : 'text-ruwad-navy'}`}>{t.title}</p>
                                  {t.due_date && (
                                    <p className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${late ? 'text-red-500' : 'text-ruwad-navy/40'}`}>
                                      <CalendarClock size={9} /> {new Date(t.due_date).toLocaleDateString('ar')}{late ? ' · متأخرة' : ''}
                                    </p>
                                  )}
                                </div>
                                <button onClick={() => setTaskModal({ group: g, task: t })} className="shrink-0 text-ruwad-navy/25 hover:text-ruwad-blue"><Pencil size={12} /></button>
                                <button onClick={() => deleteTask(t)} className="shrink-0 text-ruwad-navy/25 hover:text-red-500"><Trash2 size={12} /></button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <button onClick={() => deleteGroup(g)}
                      className="self-start flex items-center gap-1.5 text-[11px] font-extrabold text-red-500 hover:bg-red-50 rounded-full px-3 py-1.5 transition">
                      <Trash2 size={12} /> حذف المجموعة
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <GroupModal courseId={courseId} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh() }} />
      )}
      {membersModal && (
        <MembersModal group={membersModal} roster={roster} assignedIds={assignedIds}
          onClose={() => setMembersModal(null)} onSaved={() => { setMembersModal(null); router.refresh() }} />
      )}
      {taskModal && (
        <TaskModal group={taskModal.group} task={taskModal.task}
          onClose={() => setTaskModal(null)} onSaved={() => { setTaskModal(null); router.refresh() }} />
      )}
    </div>
  )
}

const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white z-10">
          <h3 className="font-extrabold text-ruwad-navy">{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}

/* ================= إنشاء مجموعة ================= */

function GroupModal({ courseId, onClose, onSaved }: { courseId: string; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (name.trim().length < 1) { setError('اكتب اسم المجموعة'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error: err } = await supabase.from('project_groups').insert({
      course_id: courseId, trainer_id: session!.user.id, name: name.trim(), description: description.trim() || null, color,
    })
    setSaving(false)
    if (err) { setError(err.code === '23505' ? 'يوجد مجموعة بهذا الاسم في الكورس' : 'تعذّر الإنشاء'); return }
    onSaved()
  }

  return (
    <ModalShell title="مجموعة جديدة" onClose={onClose}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المجموعة *" className={inputCls} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المشروع (اختياري)" rows={2} className={inputCls + ' resize-none'} />
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={c}
            className="w-8 h-8 rounded-full transition ring-offset-2" style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }} />
        ))}
      </div>
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <button onClick={save} disabled={saving} className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving && <Loader2 size={15} className="animate-spin" />} إنشاء المجموعة
      </button>
    </ModalShell>
  )
}

/* ================= إدارة الأعضاء ================= */

function MembersModal({ group, roster, assignedIds, onClose, onSaved }: {
  group: Group; roster: Student[]; assignedIds: Set<string>; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [busy, setBusy] = useState<string | null>(null)
  const currentIds = useMemo(() => new Set(group.members.map((m) => m.id)), [group.members])

  async function toggle(student: Student) {
    setBusy(student.id)
    if (currentIds.has(student.id)) {
      await supabase.from('project_group_members').delete().eq('group_id', group.id).eq('student_id', student.id)
    } else {
      await supabase.from('project_group_members').insert({ group_id: group.id, student_id: student.id })
    }
    setBusy(null)
    onSaved()
  }

  return (
    <ModalShell title={`أعضاء ${group.name}`} onClose={onClose}>
      <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
        {roster.map((s) => {
          const inThis = currentIds.has(s.id)
          const inOther = !inThis && assignedIds.has(s.id)
          return (
            <div key={s.id} className={`flex items-center gap-2.5 rounded-ruwad-sm px-3 py-2.5 ${inThis ? 'bg-ruwad-blue/5' : 'bg-[#F5F6FA]'}`}>
              {s.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-ruwad-gradient text-white text-xs font-black flex items-center justify-center shrink-0">{s.full_name.charAt(0)}</span>
              )}
              <span className="text-sm font-bold text-ruwad-navy truncate flex-1">{s.full_name}</span>
              {inOther && <span className="text-[10px] font-bold text-ruwad-navy/35 shrink-0">في مجموعة أخرى</span>}
              <button onClick={() => toggle(s)} disabled={busy === s.id}
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition ${inThis ? 'bg-ruwad-blue text-white' : 'border-2 border-ruwad-gray text-ruwad-navy/30 hover:border-ruwad-blue'}`}>
                {busy === s.id ? <Loader2 size={12} className="animate-spin" /> : inThis ? <Check size={13} /> : <Plus size={13} />}
              </button>
            </div>
          )
        })}
      </div>
    </ModalShell>
  )
}

/* ================= إضافة/تعديل مهمة ================= */

function TaskModal({ group, task, onClose, onSaved }: { group: Group; task: Task | null; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (title.trim().length < 1) { setError('اكتب عنوان المهمة'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const payload = { title: title.trim(), description: description.trim() || null, due_date: dueDate || null }
    const { error: err } = task
      ? await supabase.from('project_group_tasks').update(payload).eq('id', task.id)
      : await supabase.from('project_group_tasks').insert({ ...payload, group_id: group.id, created_by: session!.user.id })
    setSaving(false)
    if (err) { setError('تعذّر الحفظ'); return }
    onSaved()
  }

  return (
    <ModalShell title={task ? 'تعديل المهمة' : `مهمة جديدة — ${group.name}`} onClose={onClose}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المهمة *" className={inputCls} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="تفاصيل المهمة (اختياري)" rows={3} className={inputCls + ' resize-none'} />
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">موعد التسليم (اختياري)</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></label>
      {!task && <p className="text-[11px] font-bold text-ruwad-navy/50 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2">سيصل إشعار فوري لكل أعضاء المجموعة.</p>}
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <button onClick={save} disabled={saving} className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving && <Loader2 size={15} className="animate-spin" />} {task ? 'حفظ التعديلات' : 'إضافة المهمة'}
      </button>
    </ModalShell>
  )
}
