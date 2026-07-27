// app/api/guidebook/quiz/claim/route.ts
// Awards the +2 for a chapter the student already answered correctly.
//
// Points go through the adjust_points RPC, never a bare .update() — the RPC is
// what keeps Student.points, Student.xp and Group.totalPoints in step (see
// CLAUDE.md; updating xp directly silently desyncs the level curve).
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { QUIZZES, POINTS_PER_CHAPTER } from '@/lib/guidebook/quiz'

const TABLE = 'GuidebookQuizAttempt'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const chapterId = body?.chapterId
  if (typeof chapterId !== 'string' || !QUIZZES[chapterId]) {
    return NextResponse.json({ error: 'Unknown chapter.' }, { status: 400 })
  }

  const user = session.user as any
  const { data: student } = await supabase
    .from('Student')
    .select('id, points')
    .or(`id.eq."${user.id}",studentId.eq."${user.studentId}"`)
    .maybeSingle()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Claim the right to award BEFORE awarding. The filters are the guard: the
  // row only flips while claimedAt is still null, so two clicks racing each
  // other can only ever match once and the points cannot be granted twice.
  const { data: claimed, error: claimError } = await supabase
    .from(TABLE)
    .update({ claimedAt: new Date().toISOString(), pointsAwarded: POINTS_PER_CHAPTER })
    .eq('studentId', student.id)
    .eq('chapterId', chapterId)
    .eq('isCorrect', true)
    .is('claimedAt', null)
    .select('id')

  if (claimError) {
    console.error('guidebook/claim update:', claimError)
    return NextResponse.json({ error: 'Could not claim these points.' }, { status: 500 })
  }

  if (!claimed || claimed.length === 0) {
    // Either never answered, answered wrong, or already claimed. All three are
    // "nothing to award here" — don't leak which.
    return NextResponse.json(
      { error: 'Nothing to claim for this chapter.', alreadyClaimed: true },
      { status: 409 },
    )
  }

  const { error: rpcError } = await supabase.rpc('adjust_points', {
    p_student_id: student.id,
    p_amount: POINTS_PER_CHAPTER,
  })

  if (rpcError) {
    // Hand the claim back so the student isn't charged an award they never
    // got. supabase-js has no multi-statement transaction, so this is the
    // compensating write rather than a rollback.
    console.error('guidebook/claim rpc:', rpcError)
    await supabase
      .from(TABLE)
      .update({ claimedAt: null, pointsAwarded: 0 })
      .eq('studentId', student.id)
      .eq('chapterId', chapterId)
    return NextResponse.json({ error: 'Could not award the points. Try again.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    pointsAwarded: POINTS_PER_CHAPTER,
    totalPoints: (student.points ?? 0) + POINTS_PER_CHAPTER,
  })
}
