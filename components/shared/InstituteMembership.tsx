'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Building2, Clock, XCircle, LogOut } from 'lucide-react'

interface Membership {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  institute: { name: string; institute_code: string } | null
}

export function InstituteMembership({ memberRole, userCode }: { memberRole: 'trainer' | 'student'; userCode: string }) {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('institute_members')
      .select('id, status, institute:institutes(name, institute_code)')
      .eq('user_id', user!.id)
      .maybeSingle()
    setMembership(data as unknown as Membership | null)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  function copyCode() {
    navigator.clipboard.writeText(userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function requestJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: institute, error: lookupError } = await supabase
      .from('institutes')
      .select('id')
      .eq('institute_code', code.trim().toUpperCase())
      .single()

    if (lookupError || !institute) {
      setError('لا يوجد معهد بهذا المعرّف')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('institute_members').insert({
      institute_id: institute.id,
      user_id: user!.id,
      member_role: memberRole,
      invited_by: 'self',
    })

    if (insertError) {
      setError('حدث خطأ أثناء إرسال الطلب (قد يكون لديك طلب سابق)')
      setSubmitting(false)
      return
    }

    setCode('')
    setSubmitting(false)
    load()
  }

  async function leaveOrCancel() {
    if (!membership) return
    if (!confirm(membership.status === 'approved' ? 'هل تريد مغادرة هذا المعهد؟' : 'إلغاء طلب الانضمام؟')) return
    await supabase.from('institute_members').delete().eq('id', membership.id)
    setMembership(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-ruwad shadow-card p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-ruwad-navy">معرّفك الخاص</p>
          <p className="text-xs text-ruwad-navy/50">شاركه مع مدير المعهد لينضمّك مباشرة لمعهده</p>
        </div>
        <div className="flex items-center gap-2 bg-ruwad-blue/5 px-4 py-2 rounded-ruwad-sm">
          <span className="text-xl font-mono font-bold text-ruwad-blue tracking-widest">{userCode}</span>
          <button onClick={copyCode} aria-label="نسخ">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
        </div>
      </div>

      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-ruwad-blue" /> عضويتي في معهد
        </h2>

        {loading ? (
          <p className="text-ruwad-navy/50 text-sm py-4 text-center">جارٍ التحميل...</p>
        ) : membership ? (
          <div className="flex flex-col gap-3">
            {membership.status === 'approved' && (
              <div className="flex items-center justify-between p-4 rounded-ruwad-sm bg-ruwad-lime/20">
                <div>
                  <p className="font-bold text-ruwad-navy">{membership.institute?.name}</p>
                  <p className="text-xs text-ruwad-navy/60">أنت عضو معتمد في هذا المعهد</p>
                </div>
                <button onClick={leaveOrCancel} className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
                  <LogOut size={15} /> مغادرة
                </button>
              </div>
            )}
            {membership.status === 'pending' && (
              <div className="flex items-center justify-between p-4 rounded-ruwad-sm bg-ruwad-gray/30">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-ruwad-navy/50" />
                  <div>
                    <p className="font-bold text-ruwad-navy">{membership.institute?.name}</p>
                    <p className="text-xs text-ruwad-navy/60">طلبك بانتظار موافقة مدير المعهد</p>
                  </div>
                </div>
                <button onClick={leaveOrCancel} className="text-sm font-semibold text-red-500">إلغاء الطلب</button>
              </div>
            )}
            {membership.status === 'rejected' && (
              <div className="flex items-center justify-between p-4 rounded-ruwad-sm bg-red-50">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-red-400" />
                  <p className="text-sm text-red-600">تم رفض طلب انضمامك لمعهد {membership.institute?.name}</p>
                </div>
                <button onClick={leaveOrCancel} className="text-sm font-semibold text-ruwad-navy/60">إغلاق</button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={requestJoin} className="flex flex-col gap-3 max-w-sm">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}
            <label className="text-sm font-medium text-ruwad-navy">معرّف المعهد</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="أدخل معرّف المعهد"
              className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition uppercase"
            />
            <button type="submit" disabled={submitting} className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50 w-fit">
              {submitting ? 'جارٍ الإرسال...' : 'طلب الانضمام'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
