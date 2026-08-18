import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { completeNpcScan } from '@/lib/scan/npc'
import { completeQuestScan } from '@/lib/scan/quest'
import { APP_TIME_ZONE_LABEL, formatJakartaTime } from '@/lib/time'

interface QrJwtPayload {
  questId?: string
  npcId?: string
  points?: number
  live?: boolean
  jti?: string
  validFrom?: string
  validUntil?: string
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Please login first!' }, { status: 401 })
  }

  const { token } = await request.json()

  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY!) as QrJwtPayload

    // Validate active time window.
    const now = Date.now()
    if (decoded.validFrom && now < new Date(decoded.validFrom).getTime()) {
      return NextResponse.json({
        success: false,
        error: `QR not active yet. Opens at ${formatJakartaTime(decoded.validFrom)} ${APP_TIME_ZONE_LABEL}`,
      })
    }
    if (decoded.validUntil && now > new Date(decoded.validUntil).getTime()) {
      return NextResponse.json({
        success: false,
        error: 'This QR code has expired for today.',
      })
    }

    // Validate single-use nonce if present.
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
        // Ignore table lookup errors if table does not exist.
      }
    }

    let studentInternalId = session.user.id
    if (!studentInternalId && session.user.studentId) {
      const { data: student } = await supabase
        .from('Student')
        .select('id')
        .eq('studentId', session.user.studentId)
        .maybeSingle()
      studentInternalId = student?.id ?? ''
    }

    if (!studentInternalId) {
      return NextResponse.json({ success: false, error: 'Student not found' })
    }

    const isDynamicToken = !!decoded.live || !!decoded.jti
    const outcome = decoded.questId
      ? await completeQuestScan(studentInternalId, decoded.questId, token)
      : await completeNpcScan(studentInternalId, decoded.npcId ?? '', decoded.points ?? 10, token, isDynamicToken)

    if (outcome.body?.success && decoded.jti) {
      try {
        await supabase.from('SingleUseToken').insert({
          jti: decoded.jti,
          scannedBy: studentInternalId,
        })
      } catch {
        // Ignore insert errors.
      }
    }

    return NextResponse.json(outcome.body, { status: outcome.status ?? 200 })
  } catch (error: unknown) {
    const err = error as { name?: string }
    if (err?.name === 'JsonWebTokenError') {
      return NextResponse.json({ success: false, error: 'Invalid QR Code!' })
    }
    if (err?.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'QR Code expired!' })
    }
    console.error(error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
