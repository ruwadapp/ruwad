'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Snowflake, Play, Trash2, Plus } from 'lucide-react'

const PRICES = { trainer: { monthly: 4.99, yearly: 49.99 }, institute: { monthly: 9.99, yearly: 99.99 } }

interface SubRow {
  id: string
  billing_cycle: 'monthly' | 'yearly'
  price: number
  status: 'active' | 'frozen' | 'cancelled'
  expires_at: string | null
}

interface EntityRow {
  id: string
  name: string
  subtitle?: string
  subscription: SubRow | null
  coveredBy?: string | null
}

export function SubscriptionsManager({
  entityType,
  initial,
}: {
  entityType: 'trainer' | 'institute'
  initial: EntityRow[]
}) {
  const [rows, setRows] = useState(initial)
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function addInterval(date: Date, billingCycle: 'monthly' | 'yearly') {
    const d = new Date(date)
    if (billingCycle === 'monthly') d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    return d
  }

  async function createSubscription(entityId: string) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const price = PRICES[entityType][cycle]
    const expiresAt = addInterval(new Date(), cycle).toISOString()

    const payload: Record<string, unknown> = {
      billing_cycle: cycle, price, status: 'active', expires_at: expiresAt, created_by: user?.id,
    }
    payload[entityType === 'trainer' ? 'trainer_id' : 'institute_id'] = entityId

    const { data, error } = await supabase.from('subscriptions').insert(payload).select().single()
    if (!error && data) {
      setRows((prev) => prev.map((r) => (r.id === entityId ? { ...r, subscription: data } : r)))
    }
    setCreatingFor(null)
    setLoading(false)
  }

  async function toggleStatus(entityId: string, subId: string, newStatus: 'active' | 'frozen') {
    await supabase.from('subscriptions').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', subId)
    setRows((prev) => prev.map((r) => (r.id === entityId && r.subscription ? { ...r, subscription: { ...r.subscription, status: newStatus } } : r)))
  }

  async function deleteSubscription(entityId: string, subId: string) {
    if (!confirm('حذف الاشتراك سيُلغي وصول هذا الحساب فوراً. متابعة؟')) return
    await supabase.from('subscriptions').delete().eq('id', subId)
    setRows((prev) => prev.map((r) => (r.id === entityId ? { ...r, subscription: null } : r)))
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-3 p-4 rounded-ruwad-sm border border-ruwad-gray/60 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <p className="font-medium text-ruwad-navy">{row.name}</p>
            {row.subtitle && <p className="text-xs text-ruwad-navy/50">{row.subtitle}</p>}
          </div>

          {row.coveredBy ? (
            <span className="text-xs font-semibold bg-ruwad-blue/10 text-ruwad-blue px-3 py-1.5 rounded-full">
              مغطّى عبر معهد {row.coveredBy}
            </span>
          ) : row.subscription ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                row.subscription.status === 'active' ? 'bg-ruwad-lime text-ruwad-navy' :
                row.subscription.status === 'frozen' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
              }`}>
                {row.subscription.status === 'active' ? 'نشط' : row.subscription.status === 'frozen' ? 'مجمَّد' : 'مُلغى'}
              </span>
              <span className="text-xs text-ruwad-navy/60">
                ${row.subscription.price} / {row.subscription.billing_cycle === 'monthly' ? 'شهرياً' : 'سنوياً'}
              </span>
              {row.subscription.expires_at && (
                <span className="text-xs text-ruwad-navy/40">ينتهي: {new Date(row.subscription.expires_at).toLocaleDateString('ar')}</span>
              )}

              {row.subscription.status === 'active' ? (
                <button onClick={() => toggleStatus(row.id, row.subscription!.id, 'frozen')} className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 px-2.5 py-1.5 rounded-ruwad-sm transition">
                  <Snowflake size={13} /> تجميد
                </button>
              ) : (
                <button onClick={() => toggleStatus(row.id, row.subscription!.id, 'active')} className="flex items-center gap-1 text-xs font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-2.5 py-1.5 rounded-ruwad-sm transition">
                  <Play size={13} /> تنشيط
                </button>
              )}
              <button onClick={() => deleteSubscription(row.id, row.subscription!.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition">
                <Trash2 size={14} />
              </button>
            </div>
          ) : creatingFor === row.id ? (
            <div className="flex items-center gap-2">
              <select value={cycle} onChange={(e) => setCycle(e.target.value as 'monthly' | 'yearly')} className="border border-ruwad-gray rounded-ruwad-sm px-2 py-1.5 text-sm outline-none bg-white">
                <option value="monthly">شهري (${PRICES[entityType].monthly})</option>
                <option value="yearly">سنوي (${PRICES[entityType].yearly})</option>
              </select>
              <button onClick={() => createSubscription(row.id)} disabled={loading} className="bg-ruwad-blue text-white text-xs font-semibold px-3 py-1.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50">
                {loading ? '...' : 'تأكيد'}
              </button>
              <button onClick={() => setCreatingFor(null)} className="text-xs text-ruwad-navy/50">إلغاء</button>
            </div>
          ) : (
            <button onClick={() => setCreatingFor(row.id)} className="flex items-center gap-1.5 text-xs font-semibold bg-ruwad-navy text-white px-3 py-1.5 rounded-ruwad-sm hover:opacity-90 transition">
              <Plus size={13} /> إنشاء اشتراك
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
