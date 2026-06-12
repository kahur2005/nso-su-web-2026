// app/api/qr/scan/route.ts
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Please login first!' }, { status: 401 })
  }

  const { token } = await request.json()
  const sessionStudentId = (session.user as any).studentId

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY!) as any
    const { npcId, points } = decoded

    // Get student
    const student = await prisma.student.findUnique({
      where: { studentId: sessionStudentId },
      include: { group: true }
    })

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' })
    }

    // Check duplicate
    const alreadyScanned = await prisma.scanLog.findFirst({
      where: { studentId: student.id, npcId }
    })

    if (alreadyScanned) {
      return NextResponse.json({
        success: false,
        error: 'You already collected this fun fact!',
        alreadyCollected: true
      })
    }

    // Get NPC
    const npc = await prisma.nPC.findUnique({ where: { id: npcId } })
    if (!npc) {
      return NextResponse.json({ success: false, error: 'Invalid QR Code!' })
    }

    // Transaction: award points
    await prisma.$transaction([
      prisma.scanLog.create({
        data: {
          studentId: student.id,
          npcId,
          pointsAwarded: points
        }
      }),
      prisma.student.update({
        where: { id: student.id },
        data: {
          points: { increment: points },
          funFactsCollected: { increment: 1 },
          xp: { increment: points }
        }
      }),
      ...(student.groupId ? [
        prisma.group.update({
          where: { id: student.groupId },
          data: { totalPoints: { increment: points } }
        })
      ] : []),
      prisma.nPC.update({
        where: { id: npcId },
        data: { scanCount: { increment: 1 } }
      })
    ])

    return NextResponse.json({
      success: true,
      npcName: npc.committeeName,
      npcRole: npc.role,
      funFact: npc.funFact,
      rarity: npc.rarity,
      pointsAwarded: points,
    })

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