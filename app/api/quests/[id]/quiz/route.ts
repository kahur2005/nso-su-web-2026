// app/api/quests/[id]/quiz/route.ts
// Multiple-choice quiz for quiz-type quests. Correct answers lock; wrong answers
// retryable. Points only for newly correct answers via adjust_points RPC.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { assertQuestOpenForStudent } from '@/lib/quests-data'

type QuizOptionRow = {
  id: string
  questionId: string
  label: string
  isCorrect: boolean
  sortOrder: number
}

type QuizQuestionRow = {
  id: string
  prompt: string
  points: number
  sortOrder: number
}

type QuizAnswerRow = {
  questionId: string
  optionId: string
  isCorrect: boolean
  awardedPoints: number
}

export type QuizQuestionPayload = {
  id: string
  prompt: string
  points: number
  options: { id: string; label: string }[]
  locked: boolean
  selectedOptionId: string | null
}

export type QuizPayload = {
  questions: QuizQuestionPayload[]
  earnedPoints: number
  totalPoints: number
  isPerfect: boolean
}

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

async function loadQuizData(
  questId: string,
  studentDbId: string,
):
  Promise<
    | {
        ok: true
        questionRows: QuizQuestionRow[]
        optionRows: QuizOptionRow[]
        answerRows: QuizAnswerRow[]
      }
    | { ok: false; error: string; status: number }
  > {
  const { data: questions, error: qError } = await supabase
    .from('QuestQuestion')
    .select('id, prompt, points, sortOrder')
    .eq('questId', questId)
    .order('sortOrder', { ascending: true })

  if (qError) {
    console.error('quiz: questions fetch failed:', qError)
    return { ok: false, error: 'Could not load quiz', status: 500 }
  }

  const questionRows = (questions ?? []) as QuizQuestionRow[]
  const questionIds = questionRows.map((q) => q.id)

  if (questionIds.length === 0) {
    return {
      ok: true,
      questionRows,
      optionRows: [],
      answerRows: [],
    }
  }

  const [optionsRes, answersRes] = await Promise.all([
    supabase
      .from('QuestQuestionOption')
      .select('id, questionId, label, isCorrect, sortOrder')
      .in('questionId', questionIds)
      .order('sortOrder', { ascending: true }),
    supabase
      .from('QuestAnswer')
      .select('questionId, optionId, isCorrect, awardedPoints')
      .eq('studentId', studentDbId)
      .in('questionId', questionIds),
  ])

  if (optionsRes.error) {
    console.error('quiz: options fetch failed:', optionsRes.error)
    return { ok: false, error: 'Could not load quiz', status: 500 }
  }
  if (answersRes.error) {
    console.error('quiz: answers fetch failed:', answersRes.error)
    return { ok: false, error: 'Could not load quiz', status: 500 }
  }

  return {
    ok: true,
    questionRows,
    optionRows: (optionsRes.data ?? []) as QuizOptionRow[],
    answerRows: (answersRes.data ?? []) as QuizAnswerRow[],
  }
}

function buildQuizPayload(
  questionRows: QuizQuestionRow[],
  optionRows: QuizOptionRow[],
  answerRows: QuizAnswerRow[],
): QuizPayload {
  const optionsByQuestion = new Map<string, QuizOptionRow[]>()
  for (const opt of optionRows) {
    const list = optionsByQuestion.get(opt.questionId) ?? []
    list.push(opt)
    optionsByQuestion.set(opt.questionId, list)
  }

  const answersByQuestion = new Map(answerRows.map((a) => [a.questionId, a]))

  let earnedPoints = 0
  let correctCount = 0

  const questions: QuizQuestionPayload[] = questionRows.map((q) => {
    const answer = answersByQuestion.get(q.id)
    const locked = answer?.isCorrect === true
    if (locked) {
      earnedPoints += answer.awardedPoints
      correctCount += 1
    }

    const opts = (optionsByQuestion.get(q.id) ?? []).map((o) => ({
      id: o.id,
      label: o.label,
    }))

    return {
      id: q.id,
      prompt: q.prompt,
      points: q.points,
      options: opts,
      locked,
      selectedOptionId: answer?.optionId ?? null,
    }
  })

  const totalPoints = questionRows.reduce((sum, q) => sum + q.points, 0)
  const isPerfect =
    questionRows.length > 0 && correctCount === questionRows.length

  return { questions, earnedPoints, totalPoints, isPerfect }
}

async function buildResponse(
  questId: string,
  studentDbId: string,
): Promise<
  | { ok: true; payload: QuizPayload }
  | { ok: false; error: string; status: number }
> {
  const loaded = await loadQuizData(questId, studentDbId)
  if (!loaded.ok) {
    return { ok: false, error: loaded.error, status: loaded.status }
  }

  return {
    ok: true,
    payload: buildQuizPayload(
      loaded.questionRows,
      loaded.optionRows,
      loaded.answerRows,
    ),
  }
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { id } = await ctx.params

  const questGate = await assertQuestOpenForStudent(id)
  if (!questGate.ok) {
    return NextResponse.json({ error: questGate.error }, { status: questGate.status })
  }
  if (questGate.quest.type !== 'quiz') {
    return NextResponse.json({ error: 'Not a quiz quest' }, { status: 400 })
  }

  const result = await buildResponse(id, studentDbId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.payload)
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { id } = await ctx.params

  const questGate = await assertQuestOpenForStudent(id)
  if (!questGate.ok) {
    return NextResponse.json({ error: questGate.error }, { status: questGate.status })
  }
  if (questGate.quest.type !== 'quiz') {
    return NextResponse.json({ error: 'Not a quiz quest' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const rawAnswers = body?.answers
  if (!Array.isArray(rawAnswers)) {
    return NextResponse.json({ error: 'answers array required' }, { status: 400 })
  }

  const submittedAnswers: { questionId: string; optionId: string }[] = []
  for (const row of rawAnswers) {
    if (
      typeof row?.questionId !== 'string' ||
      typeof row?.optionId !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid answer entry' }, { status: 400 })
    }
    submittedAnswers.push({ questionId: row.questionId, optionId: row.optionId })
  }

  const loaded = await loadQuizData(id, studentDbId)
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  }

  const { questionRows, optionRows, answerRows } = loaded
  if (questionRows.length === 0) {
    return NextResponse.json({ error: 'This quiz has no questions yet.' }, { status: 400 })
  }

  const questionIds = new Set(questionRows.map((q) => q.id))
  const questionsById = new Map(questionRows.map((q) => [q.id, q]))
  const optionsById = new Map(optionRows.map((o) => [o.id, o]))
  const existingByQuestion = new Map(answerRows.map((a) => [a.questionId, a]))

  const unlockedIds = questionRows
    .filter((q) => existingByQuestion.get(q.id)?.isCorrect !== true)
    .map((q) => q.id)

  const isFirstAttempt = questionRows.every((q) => !existingByQuestion.has(q.id))
  const requiredIds = isFirstAttempt ? questionRows.map((q) => q.id) : unlockedIds

  const submittedByQuestion = new Map<string, string>()
  for (const a of submittedAnswers) {
    if (!questionIds.has(a.questionId)) {
      return NextResponse.json({ error: 'Unknown question' }, { status: 400 })
    }
    if (existingByQuestion.get(a.questionId)?.isCorrect === true) {
      continue
    }
    submittedByQuestion.set(a.questionId, a.optionId)
  }

  for (const qid of requiredIds) {
    if (!submittedByQuestion.has(qid)) {
      return NextResponse.json(
        { error: 'Answer every question before submitting.' },
        { status: 400 },
      )
    }
  }

  let awardedThisSubmit = 0

  for (const [questionId, optionId] of submittedByQuestion) {
    const existing = existingByQuestion.get(questionId)
    if (existing?.isCorrect === true) continue

    const option = optionsById.get(optionId)
    if (!option || option.questionId !== questionId) {
      return NextResponse.json({ error: 'Invalid option for question' }, { status: 400 })
    }

    const question = questionsById.get(questionId)!
    const isCorrect = option.isCorrect
    const awardedPoints = isCorrect ? question.points : 0

    const { error: upsertError } = await supabase.from('QuestAnswer').upsert(
      {
        studentId: studentDbId,
        questionId,
        optionId,
        isCorrect,
        awardedPoints,
        answeredAt: new Date().toISOString(),
      },
      { onConflict: 'studentId,questionId' },
    )

    if (upsertError) {
      console.error('quiz: answer upsert failed:', upsertError)
      return NextResponse.json({ error: 'Could not save answers' }, { status: 500 })
    }

    if (isCorrect) {
      awardedThisSubmit += question.points
    }
  }

  if (awardedThisSubmit > 0) {
    const { error: rpcError } = await supabase.rpc('adjust_points', {
      p_student_id: studentDbId,
      p_amount: awardedThisSubmit,
    })
    if (rpcError) {
      console.error('quiz: adjust_points failed:', rpcError)
      return NextResponse.json({ error: 'Could not award points' }, { status: 500 })
    }
  }

  const { data: existingProgress } = await supabase
    .from('QuestProgress')
    .select('completedAt')
    .eq('studentId', studentDbId)
    .eq('questId', id)
    .maybeSingle()

  const now = new Date().toISOString()
  const { error: progressError } = await supabase.from('QuestProgress').upsert(
    {
      studentId: studentDbId,
      questId: id,
      status: 'completed',
      completedAt: existingProgress?.completedAt ?? now,
    },
    { onConflict: 'studentId,questId' },
  )
  if (progressError) {
    console.error('quiz: progress upsert failed:', progressError)
    return NextResponse.json({ error: 'Could not update progress' }, { status: 500 })
  }

  const refreshed = await loadQuizData(id, studentDbId)
  if (!refreshed.ok) {
    return NextResponse.json({ error: refreshed.error }, { status: refreshed.status })
  }

  const payload = buildQuizPayload(
    refreshed.questionRows,
    refreshed.optionRows,
    refreshed.answerRows,
  )

  if (payload.isPerfect && questGate.quest.achievementId) {
    const { error: achError } = await supabase.from('StudentAchievement').upsert(
      { studentId: studentDbId, achievementId: questGate.quest.achievementId },
      { onConflict: 'studentId,achievementId', ignoreDuplicates: true },
    )
    if (achError) console.error('quiz: StudentAchievement upsert failed:', achError)
  }

  return NextResponse.json({ ...payload, awardedThisSubmit })
}
