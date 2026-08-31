import type { SupabaseClient } from '@supabase/supabase-js'
import type { GroupCard } from '@/components/shared/GroupsList'
import type { ChatMessage, ChatMemberInfo } from '@/components/shared/ChatRoom'

// ===== بيانات قائمة المجموعات (المتاحة للمستخدم بحسب RLS) مع آخر رسالة وغير المقروء =====
export async function loadGroupCards(supabase: SupabaseClient, userId: string): Promise<GroupCard[]> {
  const { data: groups } = await supabase
    .from('chat_groups')
    .select('id, name, description, course_id, course:courses(title)')
    .order('created_at', { ascending: false })
  if (!groups || groups.length === 0) return []

  const ids = groups.map((g) => g.id)
  const [{ data: myMemberships }, { data: counts }, { data: lastMsgs }] = await Promise.all([
    supabase.from('chat_members').select('group_id, muted, last_read_at').eq('user_id', userId).in('group_id', ids),
    supabase.from('chat_members').select('group_id').in('group_id', ids),
    supabase.from('chat_messages').select('group_id, content, created_at, sender:profiles!sender_id(full_name)').in('group_id', ids).order('created_at', { ascending: false }).limit(300),
  ])
  const mine = new Map((myMemberships ?? []).map((m) => [m.group_id, m]))
  const countMap = new Map<string, number>()
  for (const c of counts ?? []) countMap.set(c.group_id, (countMap.get(c.group_id) ?? 0) + 1)

  const lastByGroup = new Map<string, { content: string; sender: string; at: string }>()
  const unreadByGroup = new Map<string, number>()
  for (const m of lastMsgs ?? []) {
    if (!lastByGroup.has(m.group_id)) {
      lastByGroup.set(m.group_id, { content: m.content, sender: (m.sender as unknown as { full_name?: string })?.full_name ?? 'عضو', at: m.created_at })
    }
    const mem = mine.get(m.group_id)
    if (mem && new Date(m.created_at) > new Date(mem.last_read_at)) unreadByGroup.set(m.group_id, (unreadByGroup.get(m.group_id) ?? 0) + 1)
  }

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    course_id: g.course_id,
    courseTitle: (g.course as unknown as { title?: string })?.title ?? '',
    membersCount: countMap.get(g.id) ?? 0,
    isMember: mine.has(g.id),
    muted: mine.get(g.id)?.muted ?? false,
    unread: unreadByGroup.get(g.id) ?? 0,
    lastMessage: lastByGroup.get(g.id) ?? null,
  }))
}

// ===== بيانات غرفة الدردشة =====
export async function loadChatRoom(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data: group } = await supabase.from('chat_groups').select('id, name, course_id, course:courses(title)').eq('id', groupId).maybeSingle()
  if (!group) return null
  const { data: me } = await supabase.from('chat_members').select('muted').eq('group_id', groupId).eq('user_id', userId).maybeSingle()
  if (!me) return { group, isMember: false as const }

  const [{ data: messages }, { data: members }] = await Promise.all([
    supabase.from('chat_messages').select('id, group_id, sender_id, content, created_at, attachment_type, attachment_ref_id, attachment_title, attachment_url').eq('group_id', groupId).order('created_at', { ascending: false }).limit(60),
    supabase.from('chat_members').select('user_id, role, profile:profiles!user_id(full_name, avatar_url)').eq('group_id', groupId),
  ])
  return {
    group,
    isMember: true as const,
    muted: me.muted,
    isManager: (await supabase.from('chat_members').select('role').eq('group_id', groupId).eq('user_id', userId).single()).data?.role === 'admin',
    messages: ((messages ?? []) as ChatMessage[]).reverse(),
    members: (members ?? []).map((m) => {
      const p = m.profile as unknown as { full_name?: string; avatar_url?: string | null }
      return { user_id: m.user_id, role: m.role, full_name: p?.full_name ?? 'عضو', avatar_url: p?.avatar_url ?? null } as ChatMemberInfo
    }),
  }
}
