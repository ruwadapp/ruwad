import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/shared/ChatRoom'
import { loadChatRoom } from '@/lib/groups'

export const dynamic = 'force-dynamic'

export default async function GroupRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const room = await loadChatRoom(supabase, id, user!.id)
  if (!room || !room.isMember) redirect('/groups')

  return (
    <ChatRoom
      groupId={id}
      groupName={room.group.name}
      courseTitle={(room.group.course as unknown as { title?: string })?.title ?? ''}
      backHref="/my-groups"
      currentUserId={user!.id}
      initialMessages={room.messages}
      members={room.members}
      initialMuted={room.muted}
    />
  )
}
