import type { createServerSupabaseClient } from '@/lib/supabase/server'

type SupabaseServer = Awaited<ReturnType<typeof createServerSupabaseClient>>

export interface TrainerInstitute { id: string; name: string }

/** يرجع كل معاهد المدرب المعتمدة (قد تكون أكثر من واحد) لعرض خيارات "مشاركة مع المعهد". */
export async function getTrainerInstitutes(supabase: SupabaseServer, trainerId: string): Promise<TrainerInstitute[]> {
  const { data } = await supabase
    .from('institute_members')
    .select('institute:institutes(id, name)')
    .eq('user_id', trainerId)
    .eq('member_role', 'trainer')
    .eq('status', 'approved')

  return ((data ?? []) as unknown as { institute: TrainerInstitute | null }[])
    .map((row) => row.institute)
    .filter((i): i is TrainerInstitute => !!i)
}

export interface InstituteTrainer { id: string; name: string }

/** يرجع كل المدربين المعتمدين لدى معهد معيّن (لاستخدامهم كأهداف مشاركة استبيان مثلاً). */
export async function getInstituteTrainers(supabase: SupabaseServer, instituteId: string): Promise<InstituteTrainer[]> {
  const { data } = await supabase
    .from('institute_members')
    .select('trainer:profiles!user_id(id, full_name)')
    .eq('institute_id', instituteId)
    .eq('member_role', 'trainer')
    .eq('status', 'approved')

  return ((data ?? []) as unknown as { trainer: { id: string; full_name: string } | null }[])
    .map((row) => row.trainer)
    .filter((t): t is { id: string; full_name: string } => !!t)
    .map((t) => ({ id: t.id, name: t.full_name }))
}

export type ShareResourceType = 'courses' | 'exams' | 'assignments' | 'challenges'

/** يرجع معرّفات المعاهد التي شارك معها المدرب عنصراً واحداً بعينه. */
export async function getResourceShares(supabase: SupabaseServer, resourceType: ShareResourceType, resourceId: string): Promise<string[]> {
  const { data } = await supabase
    .from('resource_institute_shares')
    .select('institute_id')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)

  return (data ?? []).map((r) => r.institute_id)
}

/** يرجع خريطة resource_id → معرّفات المعاهد لمجموعة عناصر دفعة واحدة (لصفحات القوائم). */
export async function getResourceSharesMap(
  supabase: SupabaseServer,
  resourceType: ShareResourceType,
  resourceIds: string[]
): Promise<Record<string, string[]>> {
  if (resourceIds.length === 0) return {}
  const { data } = await supabase
    .from('resource_institute_shares')
    .select('resource_id, institute_id')
    .eq('resource_type', resourceType)
    .in('resource_id', resourceIds)

  const map: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!map[row.resource_id]) map[row.resource_id] = []
    map[row.resource_id].push(row.institute_id)
  }
  return map
}
