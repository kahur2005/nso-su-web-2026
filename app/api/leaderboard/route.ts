// app/api/leaderboard/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Groups ordered by score, with their member roster embedded (the
    // leaderboard's collapsible rows show each member's contribution and
    // link their avatar to Instagram). Filter out admins from roster.
    const { data: rawGroups, error: groupsError } = await supabase
      .from('Group')
      .select('*, members:Student(id, name, points, funFactsCollected, instagram, avatarConfig, isAdmin)')
      .order('totalPoints', { ascending: false })

    if (groupsError) throw groupsError

    const groups = (rawGroups ?? [])
      .map((g: any) => {
        const members = [...(g.members ?? [])]
          .filter((m: any) => !m.isAdmin)
          .sort((a: any, b: any) => (b.points ?? 0) - (a.points ?? 0))
        const totalPoints = members.reduce(
          (sum: number, m: any) => sum + (m.points ?? 0),
          0
        )
        return { ...g, totalPoints, members, _count: { members: members.length } }
      })
      // Re-sort: the query ordered by the stale stored column.
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints)

    // Fetch top 10 students, excluding admins
    const { data: allStudents, error: studentsError } = await supabase
      .from('Student')
      .select('id, name, studentId, points, funFactsCollected, avatarConfig, isAdmin, group:Group(name, emblem, emblemUrl, color)')
      .order('points', { ascending: false })
      .limit(30)

    if (studentsError) throw studentsError

    const topStudents = (allStudents ?? [])
      .filter((s: any) => !s.isAdmin)
      .slice(0, 10)

    return NextResponse.json({ groups, topStudents })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
