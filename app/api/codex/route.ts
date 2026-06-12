// app/api/codex/route.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentId = (session.user as any).studentId

  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      scanLogs: {
        select: { npcId: true, scannedAt: true, npc: true }
      }
    }
  })

  const allNPCs = await prisma.nPC.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  })

  const collectedIds = new Set(student?.scanLogs.map(s => s.npcId) || [])

  const entries = allNPCs.map((npc, index) => {
    const scanLog = student?.scanLogs.find(s => s.npcId === npc.id)
    return {
      id: npc.id,
      npcId: npc.id,
      committeeName: npc.committeeName,
      role: npc.role,
      funFact: npc.funFact,
      rarity: npc.rarity,
      points: npc.points,
      avatarUrl: npc.avatarUrl,
      collected: collectedIds.has(npc.id),
      collectedAt: scanLog?.scannedAt || null,
      index: index + 1
    }
  })

  return NextResponse.json({ entries })
}