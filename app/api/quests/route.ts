// app/api/quests/route.ts
// The student's quest library. Every active quest that is currently available
// (availableFrom <= now AND now <= availableUntil, if those fields are set) is
// listed. Quests with a future availableFrom are shown with an "opens at" label
// so students can plan; quests whose window has closed are hidden.
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let studentDbId = session.user.id
  if (!studentDbId && session.user.studentId) {
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', session.user.studentId)
      .maybeSingle()
    studentDbId = student?.id ?? ''
  }

  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const [questsRes, progressRes] = await Promise.all([
    supabase
      .from('Quest')
      .select('id, title, description, points, availableFrom, availableUntil, achievement:Achievement(name, description, imageUrl)')
      .eq('isDeleted', false)
      .eq('isActive', true)
      .order('createdAt', { ascending: false }),
    supabase
      .from('QuestProgress')
      .select('questId, completedAt')
      .eq('studentId', studentDbId),
  ])

  if (questsRes.error) {
    console.error('quests: fetch failed:', questsRes.error)
    return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 })
  }
  if (progressRes.error) {
    console.error('quests: progress fetch failed:', progressRes.error)
  }

  const quests = questsRes.data ?? []
  const progressRows = progressRes.data ?? []

  const completedAt = new Map(
    progressRows.map((p) => [p.questId, p.completedAt])
  )

  const now = new Date()

  const questsWithProgress = (quests ?? [])
    .map((q: any) => {
      const from = q.availableFrom ? new Date(q.availableFrom) : null
      const until = q.availableUntil ? new Date(q.availableUntil) : null
      // Window closed → hide completely
      const expired = until && now > until
      // Window not yet open
      const notYet = from && now < from

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        points: q.points,
        achievement: q.achievement ?? null,
        isCompleted: completedAt.has(q.id),
        completedAt: completedAt.get(q.id) ?? null,
        // Time-gate metadata for the UI
        availableFrom: q.availableFrom ?? null,
        availableUntil: q.availableUntil ?? null,
        isLocked: !!notYet,    // true = show "opens at X", disable scan button
        isExpired: !!expired,  // true = window closed, hide from board
      }
    })
    // Drop quests whose window has passed
    .filter((q) => !q.isExpired)

  return NextResponse.json({
    quests: questsWithProgress,
    completed: questsWithProgress.filter((q) => q.isCompleted).length,
  })
}
