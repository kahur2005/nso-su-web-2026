// app/api/gl/points/route.ts
// API route for Group Leaders (GL) and IT Logi/Admin to award points to students.
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

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

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { studentId, amount, reason } = body

  if (!studentId || typeof amount !== 'number' || amount === 0) {
    return NextResponse.json(
      { error: 'Student ID and a non-zero amount are required.' },
      { status: 400 }
    )
  }

  // Find target student
  const { data: targetStudent } = await supabase
    .from('Student')
    .select('id, name, groupId')
    .or(`studentId.eq.${studentId},id.eq.${studentId}`)
    .maybeSingle()

  if (!targetStudent) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
  }

  // Atomic point adjustment via RPC
  const { error: rpcError } = await supabase.rpc('adjust_points', {
    p_student_id: targetStudent.id,
    p_amount: amount,
  })

  if (rpcError) {
    console.error('gl/points: RPC error:', rpcError)
    return NextResponse.json({ error: 'Failed to adjust points.' }, { status: 500 })
  }

  // Record audit log
  await supabase.from('PointAdjustment').insert({
    studentId: targetStudent.id,
    amount,
    reason: reason || `Assigned by GL ${user.name || user.studentId}`,
  })

  return NextResponse.json({
    success: true,
    studentName: targetStudent.name,
    amount,
  })
}
