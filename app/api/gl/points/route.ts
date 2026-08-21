import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getLeaderboardSuspense } from '@/lib/app-settings'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any
  const isGL = user.role === 'gl' || user.role === 'committee' || user.isAdmin

  if (!isGL) {
    return NextResponse.json(
      { error: 'Only Group Leaders or Committee members can access this.' },
      { status: 403 }
    )
  }

  if (await getLeaderboardSuspense()) {
    return NextResponse.json(
      { error: 'Point assignment is paused until leaderboard reveal.' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { studentId, amount, reason } = body

  if (!studentId || typeof studentId !== 'string') {
    return NextResponse.json(
      { error: 'Student ID is required.' },
      { status: 400 }
    )
  }
  if (typeof amount !== 'number' || amount === 0 || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: 'A non-zero numeric amount is required.' },
      { status: 400 }
    )
  }

  const sanitisedId = String(studentId).trim()
  if (!/^[\w-]+$/.test(sanitisedId)) {
    return NextResponse.json({ error: 'Invalid student ID format.' }, { status: 400 })
  }

  let targetStudent: { id: string; name: string; groupId: string | null } | null = null

  const { data: byStudentId } = await supabase
    .from('Student')
    .select('id, name, groupId')
    .eq('studentId', sanitisedId)
    .maybeSingle()
  targetStudent = byStudentId

  if (!targetStudent) {
    const { data: byId } = await supabase
      .from('Student')
      .select('id, name, groupId')
      .eq('id', sanitisedId)
      .maybeSingle()
    targetStudent = byId
  }

  if (!targetStudent) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
  }

  const { error: rpcError } = await supabase.rpc('adjust_points', {
    p_student_id: targetStudent.id,
    p_amount: amount,
  })

  if (rpcError) {
    console.error('gl/points: RPC error:', rpcError)
    return NextResponse.json({ error: 'Failed to adjust points.' }, { status: 500 })
  }

  const auditReason = reason ? ` (${reason})` : ''
  await supabase.from('Announcement').insert({
    title: `Points ${amount > 0 ? 'Awarded' : 'Deducted'}`,
    content: `${amount > 0 ? '+' : ''}${amount} points ${amount > 0 ? 'awarded to' : 'deducted from'} ${targetStudent.name ?? 'a student'} by GL ${user.name || user.studentId}${auditReason}`,
    type: 'points',
  })

  return NextResponse.json({
    success: true,
    studentName: targetStudent.name,
    amount,
  })
}
