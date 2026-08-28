'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Wrench, Target, Check } from 'lucide-react'

// محرّر المهارات والتخصصات على بروفايل الطالب نفسه
export function SkillsEditor({
  initialSkills,
  initialSpecialties,
}: {
  initialSkills: string[]
  initialSpecialties: string[]
}) {
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [specialties, setSpecialties] = useState<string[]>(initialSpecialties)
  const [skillInput, setSkillInput] = useState('')
  const [specInput, setSpecInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const add = (list: string[], setList: (v: string[]) => void, value: string, clear: () => void) => {
    const v = value.trim()
    if (v && !list.includes(v) && list.length < 20) setList([...list, v])
    clear()
    setSaved(false)
  }
  const remove = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.filter((x) => x !== value))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ skills, specialties }).eq('id', user!.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5">
      <h3 className="font-extrabold text-ruwad-navy">مهاراتي وتخصصاتي</h3>

      {/* التخصصات */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy"><Target size={15} className="text-ruwad-blue" /> التخصصات</label>
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <span key={s} className="flex items-center gap-1 bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-full pr-3 pl-2 py-1">
              {s}
              <button onClick={() => remove(specialties, setSpecialties, s)} aria-label="حذف" className="hover:bg-ruwad-blue/20 rounded-full p-0.5"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(specialties, setSpecialties, specInput, () => setSpecInput('')) } }}
            placeholder="أضف تخصصاً (مثال: تصميم الجرافيك)"
            className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition"
          />
          <button onClick={() => add(specialties, setSpecialties, specInput, () => setSpecInput(''))} className="bg-ruwad-blue/10 text-ruwad-blue rounded-ruwad-sm px-3 hover:bg-ruwad-blue/20 transition"><Plus size={16} /></button>
        </div>
      </div>

      {/* المهارات */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy"><Wrench size={15} className="text-ruwad-blue" /> المهارات</label>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="flex items-center gap-1 bg-ruwad-gray/40 text-ruwad-navy text-sm font-semibold rounded-full pr-3 pl-2 py-1">
              {s}
              <button onClick={() => remove(skills, setSkills, s)} aria-label="حذف" className="hover:bg-ruwad-navy/10 rounded-full p-0.5"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(skills, setSkills, skillInput, () => setSkillInput('')) } }}
            placeholder="أضف مهارة (مثال: Photoshop)"
            className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition"
          />
          <button onClick={() => add(skills, setSkills, skillInput, () => setSkillInput(''))} className="bg-ruwad-blue/10 text-ruwad-blue rounded-ruwad-sm px-3 hover:bg-ruwad-blue/20 transition"><Plus size={16} /></button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="self-start flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-bold px-6 py-2.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {saved ? <><Check size={15} /> حُفظت</> : saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </div>
  )
}
