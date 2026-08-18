import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

interface RawMember {
  id: string
  name: string
  points: number
  funFactsCollected: number
  instagram: string | null
  avatarConfig: unknown
  isAdmin: boolean
}

interface RawGroup {
  id: string
  name: string
  emblem: string
  emblemUrl: string | null
  color: string
  totalPoints: number
  members: RawMember[]
}

interface RawStudent {
  id: string
  name: string
  studentId: string
  points: number
  funFactsCollected: number
  avatarConfig: unknown
  isAdmin: boolean
  group: { name: string; emblem: string; emblemUrl: string | null; color: string } | null
}

export async function GET() {
  try {
    const [groupsRes, studentsRes] = await Promise.all([
      supabase
        .from('Group')
        .select('*, members:Student(id, name, points, funFactsCollected, instagram, avatarConfig, isAdmin)')
        .order('totalPoints', { ascending: false }),
      supabase
        .from('Student')
        .select('id, name, studentId, points, funFactsCollected, avatarConfig, isAdmin, group:Group(name, emblem, emblemUrl, color)')
        .eq('isAdmin', false)
        .order('points', { ascending: false })
        .limit(10),
    ])

    if (groupsRes.error) throw groupsRes.error
    if (studentsRes.error) throw studentsRes.error

    const groups = ((groupsRes.data as unknown as RawGroup[]) ?? [])
      .map((g) => {
        const members = [...(g.members ?? [])]
          .filter((m) => !m.isAdmin)
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        const totalPoints = members.reduce(
          (sum: number, m) => sum + (m.points ?? 0),
          0
        )
        return { ...g, totalPoints, members, _count: { members: members.length } }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)

    const topStudents = (studentsRes.data as unknown as RawStudent[]) ?? []

    return NextResponse.json({ groups, topStudents })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
