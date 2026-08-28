'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CVData, CVEducation, CVWork, CVTraining, CVLanguage, CVReference } from '@/lib/cv'
import { LANGUAGE_LEVELS } from '@/lib/cv'
import {
  GraduationCap, Briefcase, BookOpen, Languages, Users2, Plus, Trash2,
  Check, FileDown, UserRound, Globe, Wrench, X,
} from 'lucide-react'

const inputCls = 'border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition w-full bg-white'

function Section({ icon: Icon, title, hint, children }: { icon: typeof Plus; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy">
          <span className="w-9 h-9 rounded-ruwad-sm bg-ruwad-blue/10 flex items-center justify-center"><Icon size={17} className="text-ruwad-blue" /></span>
          {title}
        </h2>
        {hint && <p className="text-xs text-ruwad-navy/50 mt-1.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="self-start flex items-center gap-1.5 text-sm font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-ruwad-sm px-4 py-2 hover:bg-ruwad-blue/20 transition">
      <Plus size={14} /> {label}
    </button>
  )
}

function EntryCard({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="relative border border-ruwad-gray/60 rounded-ruwad-sm p-4 pt-5 flex flex-col gap-3 bg-[#FAFBFF]">
      <button onClick={onRemove} aria-label="حذف" className="absolute top-2 left-2 text-ruwad-navy/30 hover:text-red-500 transition p-1"><Trash2 size={14} /></button>
      {children}
    </div>
  )
}

export function CVBuilder({ initial, initialSkills }: { initial: CVData; initialSkills: string[] }) {
  const [lang, setLang] = useState<'ar' | 'en'>(initial.lang ?? 'ar')
  const [title, setTitle] = useState(initial.title ?? '')
  const [summary, setSummary] = useState(initial.summary ?? '')
  const [email, setEmail] = useState(initial.email ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [education, setEducation] = useState<CVEducation[]>(initial.education ?? [])
  const [work, setWork] = useState<CVWork[]>(initial.work ?? [])
  const [trainings, setTrainings] = useState<CVTraining[]>(initial.trainings ?? [])
  const [languages, setLanguages] = useState<CVLanguage[]>(initial.languages ?? [])
  const [references, setReferences] = useState<CVReference[]>(initial.references ?? [])
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const upd = <T,>(list: T[], set: (v: T[]) => void, i: number, patch: Partial<T>) => {
    set(list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
    setSaved(false)
  }
  const rm = <T,>(list: T[], set: (v: T[]) => void, i: number) => { set(list.filter((_, idx) => idx !== i)); setSaved(false) }

  async function save(openPreview = false) {
    setSaving(true)
    const cv: CVData = { lang, title, summary, email, phone, education, work, trainings, languages, references }
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ cv_data: cv, skills }).eq('id', user!.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      router.refresh()
      if (openPreview) router.push('/cv/preview')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ===== لغة السيرة + معلومات أساسية ===== */}
      <Section icon={UserRound} title="المعلومات الأساسية">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-ruwad-blue" />
          <span className="text-sm font-semibold text-ruwad-navy ml-2">لغة السيرة الذاتية:</span>
          {(['ar', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setSaved(false) }}
              className={`text-sm font-bold px-4 py-1.5 rounded-full transition ${lang === l ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/30 text-ruwad-navy/60 hover:bg-ruwad-gray/50'}`}
            >
              {l === 'ar' ? 'العربية' : 'English'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false) }} placeholder={lang === 'ar' ? 'المسمّى المهني (مثال: مصمم جرافيك)' : 'Professional title (e.g. Graphic Designer)'} className={inputCls} />
          <input value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false) }} placeholder={lang === 'ar' ? 'البريد الإلكتروني للتواصل' : 'Contact email'} className={inputCls} dir="ltr" />
          <input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false) }} placeholder={lang === 'ar' ? 'رقم الجوال' : 'Phone number'} className={inputCls} dir="ltr" />
        </div>
        <textarea value={summary} onChange={(e) => { setSummary(e.target.value); setSaved(false) }} rows={3} placeholder={lang === 'ar' ? 'نبذة تعريفية مختصرة عنك وعن طموحك المهني...' : 'A short professional summary about you...'} className={`${inputCls} resize-none`} />
      </Section>

      {/* ===== التحصيل العلمي ===== */}
      <Section icon={GraduationCap} title="التحصيل العلمي" hint="أضف شهاداتك الجامعية أو المدرسية — الدرجة، الجامعة/المؤسسة، وسنوات الدراسة.">
        {education.map((e, i) => (
          <EntryCard key={i} onRemove={() => rm(education, setEducation, i)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={e.degree} onChange={(ev) => upd(education, setEducation, i, { degree: ev.target.value })} placeholder={lang === 'ar' ? 'الدرجة والتخصص (بكالوريوس هندسة برمجيات)' : 'Degree & major'} className={inputCls} />
              <input value={e.institution} onChange={(ev) => upd(education, setEducation, i, { institution: ev.target.value })} placeholder={lang === 'ar' ? 'الجامعة / المؤسسة' : 'University / Institution'} className={inputCls} />
              <input value={e.start} onChange={(ev) => upd(education, setEducation, i, { start: ev.target.value })} placeholder={lang === 'ar' ? 'سنة البدء (2021)' : 'Start year'} className={inputCls} />
              <input value={e.end} onChange={(ev) => upd(education, setEducation, i, { end: ev.target.value })} placeholder={lang === 'ar' ? 'سنة التخرج — اتركه فارغاً إن كنت ما زلت تدرس' : 'Graduation year — leave empty if ongoing'} className={inputCls} />
            </div>
          </EntryCard>
        ))}
        <AddBtn onClick={() => setEducation([...education, { degree: '', institution: '', start: '', end: '' }])} label={lang === 'ar' ? 'إضافة تحصيل علمي' : 'Add education'} />
      </Section>

      {/* ===== المهارات ===== */}
      <Section icon={Wrench} title="المهارات" hint="اكتب المهارة واضغط Enter — تظهر كوسوم جذابة في سيرتك.">
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="flex items-center gap-1 bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-full pr-3 pl-2 py-1">
              {s}
              <button onClick={() => { setSkills(skills.filter((x) => x !== s)); setSaved(false) }} aria-label="حذف" className="hover:bg-ruwad-blue/20 rounded-full p-0.5"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = skillInput.trim(); if (v && !skills.includes(v)) { setSkills([...skills, v]); setSaved(false) } setSkillInput('') } }}
            placeholder={lang === 'ar' ? 'مثال: Photoshop، إدارة مشاريع، التصوير...' : 'e.g. Photoshop, Project Management...'}
            className={inputCls}
          />
          <button onClick={() => { const v = skillInput.trim(); if (v && !skills.includes(v)) { setSkills([...skills, v]); setSaved(false) } setSkillInput('') }} className="bg-ruwad-blue/10 text-ruwad-blue rounded-ruwad-sm px-3 hover:bg-ruwad-blue/20 transition shrink-0"><Plus size={16} /></button>
        </div>
      </Section>

      {/* ===== الخبرة العملية ===== */}
      <Section icon={Briefcase} title="الخبرة العملية" hint="المنصب، جهة العمل، الفترة، ووصف اختياري لمهامك وإنجازاتك.">
        {work.map((w, i) => (
          <EntryCard key={i} onRemove={() => rm(work, setWork, i)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={w.position} onChange={(ev) => upd(work, setWork, i, { position: ev.target.value })} placeholder={lang === 'ar' ? 'المنصب (مصمم جرافيك)' : 'Position'} className={inputCls} />
              <input value={w.org} onChange={(ev) => upd(work, setWork, i, { org: ev.target.value })} placeholder={lang === 'ar' ? 'جهة العمل' : 'Company / Organization'} className={inputCls} />
              <input value={w.start} onChange={(ev) => upd(work, setWork, i, { start: ev.target.value })} placeholder={lang === 'ar' ? 'من (2022)' : 'From'} className={inputCls} />
              <input value={w.end} onChange={(ev) => upd(work, setWork, i, { end: ev.target.value })} placeholder={lang === 'ar' ? 'إلى — اتركه فارغاً إن كنت ما زلت تعمل' : 'To — leave empty if current'} className={inputCls} />
            </div>
            <textarea value={w.description ?? ''} onChange={(ev) => upd(work, setWork, i, { description: ev.target.value })} rows={2} placeholder={lang === 'ar' ? 'وصف اختياري لمهامك وإنجازاتك...' : 'Optional description...'} className={`${inputCls} resize-none`} />
          </EntryCard>
        ))}
        <AddBtn onClick={() => setWork([...work, { position: '', org: '', start: '', end: '', description: '' }])} label={lang === 'ar' ? 'إضافة خبرة عملية' : 'Add work experience'} />
      </Section>

      {/* ===== التدريبات ===== */}
      <Section icon={BookOpen} title="التدريبات والدورات" hint="دورات حضرتها خارج رُوّاد — أما شهاداتك الموثّقة في رُوّاد فتُضاف تلقائياً لسيرتك مع رموز QR للتحقق. ✨">
        {trainings.map((t, i) => (
          <EntryCard key={i} onRemove={() => rm(trainings, setTrainings, i)}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={t.title} onChange={(ev) => upd(trainings, setTrainings, i, { title: ev.target.value })} placeholder={lang === 'ar' ? 'اسم التدريب' : 'Training title'} className={inputCls} />
              <input value={t.org} onChange={(ev) => upd(trainings, setTrainings, i, { org: ev.target.value })} placeholder={lang === 'ar' ? 'الجهة' : 'Provider'} className={inputCls} />
              <input value={t.year} onChange={(ev) => upd(trainings, setTrainings, i, { year: ev.target.value })} placeholder={lang === 'ar' ? 'السنة' : 'Year'} className={inputCls} />
            </div>
          </EntryCard>
        ))}
        <AddBtn onClick={() => setTrainings([...trainings, { title: '', org: '', year: '' }])} label={lang === 'ar' ? 'إضافة تدريب' : 'Add training'} />
      </Section>

      {/* ===== اللغات ===== */}
      <Section icon={Languages} title="اللغات">
        {languages.map((l, i) => (
          <EntryCard key={i} onRemove={() => rm(languages, setLanguages, i)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={l.name} onChange={(ev) => upd(languages, setLanguages, i, { name: ev.target.value })} placeholder={lang === 'ar' ? 'اللغة (الإنجليزية)' : 'Language'} className={inputCls} />
              <select value={l.level} onChange={(ev) => upd(languages, setLanguages, i, { level: ev.target.value })} className={inputCls}>
                <option value="">{lang === 'ar' ? 'المستوى...' : 'Level...'}</option>
                {LANGUAGE_LEVELS[lang].map((lv) => <option key={lv} value={lv}>{lv}</option>)}
              </select>
            </div>
          </EntryCard>
        ))}
        <AddBtn onClick={() => setLanguages([...languages, { name: '', level: '' }])} label={lang === 'ar' ? 'إضافة لغة' : 'Add language'} />
      </Section>

      {/* ===== الجهات المرجعية ===== */}
      <Section icon={Users2} title="الجهات المرجعية" hint="أشخاص أو جهات يمكن الرجوع إليهم للتزكية — الاسم، الجهة، ووسيلة التواصل.">
        {references.map((r, i) => (
          <EntryCard key={i} onRemove={() => rm(references, setReferences, i)}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={r.name} onChange={(ev) => upd(references, setReferences, i, { name: ev.target.value })} placeholder={lang === 'ar' ? 'الاسم' : 'Name'} className={inputCls} />
              <input value={r.org} onChange={(ev) => upd(references, setReferences, i, { org: ev.target.value })} placeholder={lang === 'ar' ? 'الجهة / المنصب' : 'Organization / Role'} className={inputCls} />
              <input value={r.contact} onChange={(ev) => upd(references, setReferences, i, { contact: ev.target.value })} placeholder={lang === 'ar' ? 'وسيلة التواصل' : 'Contact'} className={inputCls} dir="ltr" />
            </div>
          </EntryCard>
        ))}
        <AddBtn onClick={() => setReferences([...references, { name: '', org: '', contact: '' }])} label={lang === 'ar' ? 'إضافة جهة مرجعية' : 'Add reference'} />
      </Section>

      {/* ===== أزرار الحفظ والمعاينة ===== */}
      <div className="sticky bottom-20 md:bottom-4 z-30 bg-white rounded-ruwad shadow-ruwad-lg p-4 flex items-center gap-3">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="flex items-center gap-1.5 bg-ruwad-navy text-white text-sm font-bold px-6 py-3 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {saved ? <><Check size={15} /> حُفظت</> : saving ? 'جارٍ الحفظ...' : 'حفظ'}
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-ruwad-blue text-white font-bold px-6 py-3 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad disabled:opacity-50"
        >
          <FileDown size={17} /> معاينة وتحميل PDF
        </button>
      </div>
    </div>
  )
}
