// app/api/qr/scan/route.ts
// Single entry point for every QR a student can scan. Verifies the signed token
// once, checks optional date-window claims (validFrom / validUntil — for daily
// QR codes), enforces single-use 1-time token nonces (jti), resolves the student,
// then dispatches to the per-kind handler.
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

    // ── Daily QR date-window check ──────────────────────────────────────────
    const now = Date.now()
    if (decoded.validFrom && now < new Date(decoded.validFrom).getTime()) {
      return NextResponse.json({
        success: false,
        error: `QR not active yet. Opens at ${new Date(decoded.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      })
    }
    if (decoded.validUntil && now > new Date(decoded.validUntil).getTime()) {
      return NextResponse.json({
        success: false,
        error: 'This QR code has expired for today.',
      })
    }

    // ── Single-use 1-time token check ───────────────────────────────────────
    if (decoded.jti) {
      try {
        const { data: usedToken } = await supabase
          .from('SingleUseToken')
          .select('jti')
          .eq('jti', decoded.jti)
          .maybeSingle()

        if (usedToken) {
          return NextResponse.json({
            success: false,
            error: 'This single-use QR code has already been scanned by someone else!',
          })
        }
      } catch {
        // Fallback if table not created yet
      }
    }

    // Resolve the public studentId to the internal row id both RPCs expect.
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', sessionStudentId)
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' })
    }

    const isDynamicToken = !!decoded.live || !!decoded.jti
    const outcome = decoded.questId
      ? await completeQuestScan(student.id, decoded.questId, token)
      : await completeNpcScan(student.id, decoded.npcId, decoded.points, token, isDynamicToken)

    // Mark single-use token as consumed upon success
    if (outcome.body?.success && decoded.jti) {
      try {
        await supabase.from('SingleUseToken').insert({
          jti: decoded.jti,
          scannedBy: student.id,
        })
      } catch {
        // Fallback if unmigrated
      }
    }

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
