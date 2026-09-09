import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PlatformAdCardClient } from './PlatformAdCardClient'

// مكوّن سيرفر: يجلب إعلانات المستخدم الحالي ويمررها للعرض
export async function PlatformAdsBar() {
  const supabase = await createServerSupabaseClient()
  const { data: ads } = await supabase.rpc('get_my_ads')
  if (!ads || ads.length === 0) return null
  return <PlatformAdCardClient ads={ads as never} />
}
