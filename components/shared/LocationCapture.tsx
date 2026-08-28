'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, LocateFixed, Trash2, Eye, EyeOff } from 'lucide-react'

// التقاط الموقع من المتصفح بموافقة صريحة وحفظه:
// - mode="user": في user_locations (طالب/مدرب) — لا يقرؤه غيره أبداً كإحداثيات
// - mode="institute": في institutes مباشرة (موقع علني دقيق)
export function LocationCapture({
  mode,
  instituteId,
  hasLocation,
  visible = true,
}: {
  mode: 'user' | 'institute'
  instituteId?: string
  hasLocation: boolean
  visible?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function capture() {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError('متصفحك لا يدعم تحديد الموقع.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const { data: { user } } = await supabase.auth.getUser()
        const { error: dbError } =
          mode === 'institute'
            ? await supabase.from('institutes').update({ latitude, longitude }).eq('id', instituteId!)
            : await supabase.from('user_locations').upsert({ user_id: user!.id, latitude, longitude, updated_at: new Date().toISOString() })
        setBusy(false)
        if (dbError) setError('تعذّر حفظ الموقع، حاول مجدداً.')
        else router.refresh()
      },
      (geoErr) => {
        setBusy(false)
        setError(geoErr.code === geoErr.PERMISSION_DENIED ? 'رفضتَ إذن الموقع — فعّله من إعدادات المتصفح ثم أعد المحاولة.' : 'تعذّر تحديد موقعك، حاول مجدداً.')
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  async function remove() {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (mode === 'institute') await supabase.from('institutes').update({ latitude: null, longitude: null }).eq('id', instituteId!)
    else await supabase.from('user_locations').delete().eq('user_id', user!.id)
    setBusy(false)
    router.refresh()
  }

  async function toggleVisible() {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('user_locations').update({ visible: !visible }).eq('user_id', user!.id)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
      <p className="flex items-center gap-2 font-bold text-ruwad-navy text-sm">
        <MapPin size={16} className="text-ruwad-blue" />
        {mode === 'institute' ? 'موقع المعهد على الخريطة' : 'موقعي الجغرافي'}
      </p>
      <p className="text-xs text-ruwad-navy/55 leading-relaxed">
        {mode === 'institute'
          ? 'موقع المعهد يظهر للطلاب بدقة (المسافة والاتجاهات) ليسهل وصولهم إليك.'
          : 'موقعك لا يُعرض لأي أحد كنقطة على خريطة — يظهر للآخرين كنطاق قرب تقريبي فقط (مثل "2 – 5 كم")، ويمكنك إخفاؤه أو حذفه متى شئت.'}
      </p>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={capture}
          disabled={busy}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-semibold px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50"
        >
          <LocateFixed size={15} /> {busy ? 'جارٍ التحديد...' : hasLocation ? 'تحديث موقعي' : 'استخدم موقعي الحالي'}
        </button>
        {hasLocation && mode === 'user' && (
          <button
            onClick={toggleVisible}
            disabled={busy}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-ruwad-sm border border-ruwad-gray text-ruwad-navy hover:bg-ruwad-gray/20 transition disabled:opacity-50"
          >
            {visible ? <><EyeOff size={15} /> إخفاء من "بالقرب"</> : <><Eye size={15} /> إظهار في "بالقرب"</>}
          </button>
        )}
        {hasLocation && (
          <button
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-ruwad-sm text-red-500 hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 size={15} /> حذف الموقع
          </button>
        )}
        {hasLocation && (
          <span className="text-xs text-green-600 bg-green-50 rounded-full px-3 py-1 font-semibold">✓ الموقع محدَّد</span>
        )}
      </div>
    </div>
  )
}
