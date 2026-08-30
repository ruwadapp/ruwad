'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// بمجرد فتح صفحة الفرص تُعلَّم كلها مُشاهدة — فيختفي تنبيه الرئيسية
export function MarkJobsViewed({ jobIds }: { jobIds: string[] }) {
  const supabase = createClient()
  useEffect(() => {
    if (!jobIds.length) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('job_opportunity_views').upsert(
        jobIds.map((id) => ({ opportunity_id: id, student_id: user.id })),
        { onConflict: 'opportunity_id,student_id', ignoreDuplicates: true }
      ).then(() => {})
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
