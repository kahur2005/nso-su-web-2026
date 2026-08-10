// app/api/quests/route.ts
// The student's quest library. Every active quest that is currently available
// (availableFrom <= now AND now <= availableUntil, if those fields are set) is
// listed. Quests with a future availableFrom are shown with an "opens at" label
// so students can plan; quests whose window has closed are hidden.
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { isQuestType, type QuestSubmissionStatus } from '@/lib/quests'

async function resolveStudentDbId(session: {
  user: { id?: string; studentId?: string }
}): Promise<string | null> {
  let studentDbId = session.user.id
  if (!studentDbId && session.user.studentId) {
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', session.user.studentId)
      .maybeSingle()
    studentDbId = student?.id ?? ''
  }
  return studentDbId || null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const [questsRes, progressRes, submissionsRes, quizQuestionsRes] = await Promise.all([
    supabase
      .from('Quest')
      .select(
        'id, title, description, points, type, availableFrom, availableUntil, achievement:Achievement(name, description, imageUrl)',
      )
      .eq('isDeleted', false)
      .eq('isActive', true)
      .order('createdAt', { ascending: false }),
    supabase
      .from('QuestProgress')
      .select('questId, status, completedAt')
      .eq('studentId', studentDbId),
    supabase
      .from('QuestSubmission')
      .select('questId, status, createdAt')
      .eq('studentId', studentDbId)
      .order('createdAt', { ascending: false }),
    supabase.from('QuestQuestion').select('id, questId'),
  ])

  if (questsRes.error) {
    console.error('quests: fetch failed:', questsRes.error)
    return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 })
  }
  if (progressRes.error) {
    console.error('quests: progress fetch failed:', progressRes.error)
  }
  if (submissionsRes.error) {
    console.error('quests: submissions fetch failed:', submissionsRes.error)
  }
  if (quizQuestionsRes.error) {
    console.error('quests: quiz questions fetch failed:', quizQuestionsRes.error)
  }

  const quests = questsRes.data ?? []
  const progressRows = progressRes.data ?? []

  const quizQuestionIdsByQuest = new Map<string, string[]>()
  for (const q of quizQuestionsRes.data ?? []) {
    const list = quizQuestionIdsByQuest.get(q.questId) ?? []
    list.push(q.id)
    quizQuestionIdsByQuest.set(q.questId, list)
  }

  const allQuizQuestionIds = (quizQuestionsRes.data ?? []).map((q) => q.id)
  let quizCorrectByQuest = new Map<string, number>()

  if (allQuizQuestionIds.length > 0) {
    const { data: correctAnswers, error: correctError } = await supabase
      .from('QuestAnswer')
      .select('questionId, isCorrect')
      .eq('studentId', studentDbId)
      .eq('isCorrect', true)
      .in('questionId', allQuizQuestionIds)

    if (correctError) {
      console.error('quests: quiz answers fetch failed:', correctError)
    } else {
      const questionToQuest = new Map<string, string>()
      for (const [questId, qids] of quizQuestionIdsByQuest) {
        for (const qid of qids) questionToQuest.set(qid, questId)
      }
      for (const row of correctAnswers ?? []) {
        const questId = questionToQuest.get(row.questionId)
        if (questId) {
          quizCorrectByQuest.set(questId, (quizCorrectByQuest.get(questId) ?? 0) + 1)
        }
      }
    }
  }

  const progressByQuest = new Map(progressRows.map((p) => [p.questId, p]))

  const latestSubByQuest = new Map<string, { status: QuestSubmissionStatus }>()
  for (const s of submissionsRes.data ?? []) {
    if (!latestSubByQuest.has(s.questId)) {
      latestSubByQuest.set(s.questId, { status: s.status as QuestSubmissionStatus })
    }
  }

  const now = new Date()

  const questsWithProgress = (quests ?? [])
    .map((q: any) => {
      const from = q.availableFrom ? new Date(q.availableFrom) : null
      const until = q.availableUntil ? new Date(q.availableUntil) : null
      const expired = until && now > until
      const notYet = from && now < from

      const progress = progressByQuest.get(q.id)
      const latestSub = latestSubByQuest.get(q.id)
      const questType = isQuestType(q.type) ? q.type : 'qr'
      const quizQids = quizQuestionIdsByQuest.get(q.id)
      const quizTotal =
        questType === 'quiz' && quizQids ? quizQids.length : null
      const quizCorrectCount =
        questType === 'quiz' && quizTotal != null && quizTotal > 0
          ? (quizCorrectByQuest.get(q.id) ?? 0)
          : null

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        points: q.points,
        type: questType,
        achievement: q.achievement ?? null,
        progressStatus: progress?.status ?? null,
        submissionStatus: latestSub?.status ?? null,
        isCompleted: progress?.status === 'completed',
        completedAt: progress?.completedAt ?? null,
        availableFrom: q.availableFrom ?? null,
        availableUntil: q.availableUntil ?? null,
        isLocked: !!notYet,
        isExpired: !!expired,
        quizCorrectCount,
        quizTotal,
      }
    })
    .filter((q) => !q.isExpired)

  return NextResponse.json({
    quests: questsWithProgress,
    completed: questsWithProgress.filter((q) => q.isCompleted).length,
  })
}
