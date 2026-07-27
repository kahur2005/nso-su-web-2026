// app/api/guidebook/quiz/route.ts
// GET  — every attempt this student has made, so the guidebook can lock the
//        chapters they have already answered before rendering anything.
// POST — grade and lock one chapter. Writing the row IS the lock: the table's
//        unique (studentId, chapterId) rejects a second submit, so a student
//        gets exactly one try whether they were right or wrong.
//
// No points are awarded here. Claiming is a separate action the student takes
// from the popup — see ./claim/route.ts.
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { QUIZZES } from '@/lib/guidebook/quiz'
import { gradeChapter } from '@/lib/guidebook/answers'

const TABLE = 'GuidebookQuizAttempt'

/** Resolve the session onto a Student row, returning its internal id. */
async function resolveStudent(session: any) {
  const user = session.user as any
  const { data } = await supabase
    .from('Student')
    .select('id')
    .or(`id.eq."${user.id}",studentId.eq."${user.studentId}"`)
    .maybeSingle()
  return data?.id as string | undefined
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = await resolveStudent(session)
  if (!studentId) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const { data, error } = await supabase
    .from(TABLE)
    .select('chapterId, isCorrect, pointsAwarded, claimedAt')
    .eq('studentId', studentId)

  // The table is created by supabase/migrations/20260727_guidebook_quiz.sql.
  // Until that is applied this 500s rather than pretending every chapter is
  // unattempted — silently returning [] would let a student re-answer forever.
  if (error) {
    console.error('guidebook/quiz GET:', error)
    return NextResponse.json({ error: 'Quiz storage unavailable.' }, { status: 500 })
  }

  return NextResponse.json({ attempts: data ?? [] })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const chapterId = body?.chapterId
  const answers = body?.answers

  if (typeof chapterId !== 'string' || !QUIZZES[chapterId]) {
    return NextResponse.json({ error: 'Unknown chapter.' }, { status: 400 })
  }
  // Both questions must be answered before the attempt is spent.
  if (!Array.isArray(answers) || answers.length !== 2 || answers.some((a) => a === null)) {
    return NextResponse.json({ error: 'Answer both questions first.' }, { status: 400 })
  }

  const studentId = await resolveStudent(session)
  if (!studentId) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const isCorrect = gradeChapter(chapterId, answers)

  const { error } = await supabase
    .from(TABLE)
    .insert({ studentId, chapterId, isCorrect, pointsAwarded: 0 })

  if (error) {
    // 23505 = unique_violation — they already used their one attempt. Report
    // it as a conflict so the client can re-sync instead of showing a result.
    if ((error as any).code === '23505') {
      return NextResponse.json(
        { error: 'You have already answered this chapter.', alreadyAttempted: true },
        { status: 409 },
      )
    }
    console.error('guidebook/quiz POST:', error)
    return NextResponse.json({ error: 'Could not save your answers.' }, { status: 500 })
  }

  return NextResponse.json({ isCorrect, claimable: isCorrect })
}
