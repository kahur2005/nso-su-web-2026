// app/api/qr/scan/route.ts
// Single entry point for every QR a student can scan. Verifies the signed token
// once, resolves the student, then dispatches to the handler for that kind of
// code. The per-kind logic lives in lib/scan/* so this file stays a dispatcher.
//
// Dispatch is on the presence of `questId`, not on the `kind` claim: fun-fact
// QRs printed before quests existed carry no discriminator, and those printouts
// have to keep working.
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { completeNpcScan } from '@/lib/scan/npc'
import { completeQuestScan } from '@/lib/scan/quest'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Please login first!' }, { status: 401 })
  }

  const { token } = await request.json()
  const sessionStudentId = (session.user as any).studentId

  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY!) as any

    // Resolve the public studentId to the internal row id both RPCs expect.
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', sessionStudentId)
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' })
    }

    const outcome = decoded.questId
      ? await completeQuestScan(student.id, decoded.questId, token)
      : await completeNpcScan(student.id, decoded.npcId, decoded.points, token)

    return NextResponse.json(outcome.body, { status: outcome.status ?? 200 })
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ success: false, error: 'Invalid QR Code!' })
    }
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'QR Code expired!' })
    }
    console.error(error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
