// app/api/quests/route.ts
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
    where: { studentId }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const quests = await prisma.quest.findMany({
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    include: {
      progress: {
        where: { studentId: student.id }
      }
    }
  })

  const questsWithProgress = quests.map(q => ({
    ...q,
    progress: q.progress[0] || null
  }))

  return NextResponse.json({ quests: questsWithProgress })
}