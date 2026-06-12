// app/api/leaderboard/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { totalPoints: 'desc' },
      include: { _count: { select: { members: true } } }
    })

    const topStudents = await prisma.student.findMany({
      orderBy: { points: 'desc' },
      take: 20,
      include: {
        group: {
          select: { name: true, emblem: true, color: true }
        }
      }
    })

    return NextResponse.json({ groups, topStudents })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}