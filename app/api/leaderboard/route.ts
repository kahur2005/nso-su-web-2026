// app/api/leaderboard/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Groups ordered by score, with a member count. PostgREST returns the
    // embedded count as members: [{ count }] — reshape it to _count.members
    // so the client keeps the shape it had under Prisma.
    const { data: rawGroups, error: groupsError } = await supabase
      .from('Group')
      .select('*, members:Student(count)')
      .order('totalPoints', { ascending: false })

    if (groupsError) throw groupsError

    const groups = (rawGroups ?? []).map((g: any) => {
      const { members, ...rest } = g
      return { ...rest, _count: { members: members?.[0]?.count ?? 0 } }
    })

    const { data: topStudents, error: studentsError } = await supabase
      .from('Student')
      .select('id, name, studentId, points, funFactsCollected, avatarSkin, avatarHair, group:Group(name, emblem, emblemUrl, color)')
      .order('points', { ascending: false })
      .limit(20)

    if (studentsError) throw studentsError

    return NextResponse.json({ groups, topStudents: topStudents ?? [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
