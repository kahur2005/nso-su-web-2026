// app/api/qr/recent/route.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const student = await prisma.student.findUnique({
    where: { studentId: session.user.studentId }
  })

  if (!student) {
    return NextResponse.json({ scans: [] })
  }

  const scans = await prisma.scanLog.findMany({
    where: { studentId: student.id },
    include: {
      npc: {
        select: { committeeName: true, role: true, rarity: true }
      }
    },
    orderBy: { scannedAt: 'desc' },
    take: 20
  })

  return NextResponse.json({ scans })
}
