import type { createServerSupabaseClient } from '@/lib/supabase/server'

type SupabaseServer = Awaited<ReturnType<typeof createServerSupabaseClient>>

/** يرجع معهد المدرب المعتمد (إن وجد) لعرض خيار "مشاركة مع المعهد". */
export async function getTrainerInstitute(supabase: SupabaseServer, trainerId: string) {
  const { data } = await supabase
    .from('institute_members')
    .select('institute:institutes(id, name)')
    .eq('user_id', trainerId)
    .eq('member_role', 'trainer')
    .eq('status', 'approved')
    .maybeSingle()

  const institute = data?.institute as unknown as { id: string; name: string } | null
  return institute ?? null
}
