'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users2, ListChecks, Check, Circle, CalendarClock, Star, ChevronDown } from 'lucide-react'

interface Student { id: string; full_name: string; avatar_url: string | null }
interface Task { id: string; title: string; description: string | null; due_date: string | null; is_completed: boolean }
interface Group { id: string; name: string; description: string | null; color: string; members: Student[]; tasks: Task[] }

// عرض المجموعات للطالب: يرى كل مجموعات الكورس، ومجموعته مميّزة ومفتوحة تلقائياً،
// ويستطيع تعليم مهام مجموعته منجَزة إن كان أحد أعضائها
export function MyGroupsView({ groups, myStudentId }: { groups: Group[]; myStudentId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const myGroup = groups.find((g) => g.members.some((m) => m.id === myStudentId))
  const [expanded, setExpanded] = useState<string | null>(myGroup?.id ?? null)

  async function toggleTask(t: Task) {
    await supabase.from('project_group_tasks').update({ is_completed: !t.is_completed }).eq('id', t.id)
    router.refresh()
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 text-center flex flex-col items-center gap-3">
        <Users2 size={30} className="text-ruwad-blue/30" />
        <p className="text-sm text-ruwad-navy/50">لم يشكّل المدرب مجموعات لهذا التدريب بعد.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {myGroup && (
        <p className="text-xs font-extrabold text-ruwad-navy/50 flex items-center gap-1.5">
          <Star size={12} className="text-amber-400 fill-amber-400" /> مجموعتك: <span className="text-ruwad-navy">{myGroup.name}</span>
        </p>
      )}
      {groups.map((g) => {
        const mine = g.id === myGroup?.id
        const open = expanded === g.id
        const doneCount = g.tasks.filter((t) => t.is_completed).length
        return (
          <div key={g.id} className={`bg-white rounded-ruwad shadow-card overflow-hidden ${mine ? 'ring-2 ring-amber-300' : ''}`}>
            <div className="h-1.5 w-full" style={{ background: g.color }} />
            <button onClick={() => setExpanded(open ? null : g.id)} className="w-full p-4 flex items-center gap-3 text-right">
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-white" style={{ background: g.color }}>
                {g.members.length}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                  {g.name}
                  {mine && <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">مجموعتي</span>}
                </p>
                <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5">
                  {g.members.length} أعضاء{g.tasks.length > 0 && ` · ${doneCount}/${g.tasks.length} مهمة منجزة`}
                </p>
              </div>
              <ChevronDown size={16} className={`shrink-0 text-ruwad-navy/30 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="border-t border-ruwad-gray/50 p-4 flex flex-col gap-4">
                {g.description && <p className="text-xs font-bold text-ruwad-navy/55">{g.description}</p>}

                <div>
                  <p className="text-xs font-extrabold text-ruwad-navy mb-2 flex items-center gap-1.5"><Users2 size={13} /> الأعضاء</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.members.map((m) => (
                      <span key={m.id} className={`flex items-center gap-1.5 text-[11px] font-bold rounded-full pl-2.5 pr-1 py-1 ${m.id === myStudentId ? 'bg-amber-50 text-amber-700' : 'bg-[#F5F6FA] text-ruwad-navy'}`}>
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
                </div>

                <div>
                  <p className="text-xs font-extrabold text-ruwad-navy mb-2 flex items-center gap-1.5"><ListChecks size={13} /> المهام</p>
                  {g.tasks.length === 0 ? (
                    <p className="text-[11px] text-ruwad-navy/40">لا مهام بعد.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {g.tasks.map((t) => {
                        const late = !t.is_completed && t.due_date && t.due_date < new Date().toISOString().slice(0, 10)
                        return (
                          <div key={t.id} className={`flex items-start gap-2.5 rounded-ruwad-sm px-3 py-2.5 ${t.is_completed ? 'bg-green-50/70' : late ? 'bg-red-50' : 'bg-[#F5F6FA]'}`}>
                            <button onClick={() => mine && toggleTask(t)} disabled={!mine} className="shrink-0 mt-0.5">
                              {t.is_completed ? <Check size={16} className="text-green-600" /> : <Circle size={16} className={mine ? 'text-ruwad-navy/30' : 'text-ruwad-navy/15'} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-extrabold ${t.is_completed ? 'text-ruwad-navy/45 line-through' : 'text-ruwad-navy'}`}>{t.title}</p>
                              {t.description && <p className="text-[11px] text-ruwad-navy/55 mt-0.5">{t.description}</p>}
                              {t.due_date && (
                                <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${late ? 'text-red-500' : 'text-ruwad-navy/40'}`}>
                                  <CalendarClock size={9} /> {new Date(t.due_date).toLocaleDateString('ar')}{late ? ' · متأخرة' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
