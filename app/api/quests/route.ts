// app/api/quests/route.ts
// The student's quest library. Every active quest is listed whether or not the
// student has done it — /quests is a mission board, so a quest they haven't
// completed still has to tell them what to go and do.
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentId = (session.user as any).studentId

  const { data: student } = await supabase
    .from('Student')
    .select('id')
    .eq('studentId', studentId)
    .maybeSingle()

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Soft-deleted and inactive quests are hidden: an inactive quest's QR is
  // refused by lib/scan/quest.ts, so listing it would advertise a mission that
  // cannot be completed.
  const { data: quests, error } = await supabase
    .from('Quest')
    .select('id, title, description, points, achievement:Achievement(name, description, imageUrl)')
    .eq('isDeleted', false)
    .eq('isActive', true)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('quests: fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 })
  }

  const { data: progressRows, error: progressError } = await supabase
    .from('QuestProgress')
    .select('questId, completedAt')
    .eq('studentId', student.id)

  if (progressError) {
    console.error('quests: progress fetch failed:', progressError)
  }

  const completedAt = new Map(
    (progressRows ?? []).map((p: any) => [p.questId, p.completedAt])
  )

  const questsWithProgress = (quests ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    points: q.points,
    achievement: q.achievement ?? null,
    isCompleted: completedAt.has(q.id),
    completedAt: completedAt.get(q.id) ?? null,
  }))

  return NextResponse.json({
    quests: questsWithProgress,
    completed: questsWithProgress.filter((q) => q.isCompleted).length,
  })
}
