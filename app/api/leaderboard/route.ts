// app/api/leaderboard/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Groups ordered by score, with their member roster embedded (the
    // leaderboard's collapsible rows show each member's contribution and
    // link their avatar to Instagram). _count keeps the shape the client
    // had under Prisma.
    const { data: rawGroups, error: groupsError } = await supabase
      .from('Group')
      .select('*, members:Student(id, name, points, funFactsCollected, instagram, avatarSkin, avatarHair, avatarEyes, avatarBrows)')
      .order('totalPoints', { ascending: false })

    if (groupsError) throw groupsError

    /* `Group.totalPoints` is a denormalised counter that only `scan_npc` and
     * `adjust_points` maintain, and only at the instant points change — so it
     * silently desyncs whenever membership changes afterwards. Assigning a
     * student who already has points never adds them to the group (the RPC saw
     * a null groupId at scan time); unassigning never removes them; editing
     * points in the Supabase Table Editor bypasses it entirely.
     *
     * The roster is already fetched here with every member's points, so derive
     * the total instead. That is correct by construction, whatever order the
     * points and the group assignment happened in. */
    const groups = (rawGroups ?? [])
      .map((g: any) => {
        const members = [...(g.members ?? [])].sort(
          (a: any, b: any) => (b.points ?? 0) - (a.points ?? 0)
        )
        const totalPoints = members.reduce(
          (sum: number, m: any) => sum + (m.points ?? 0),
          0
        )
        return { ...g, totalPoints, members, _count: { members: members.length } }
      })
      // Re-sort: the query ordered by the stale stored column.
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints)

    // The PLAYERS tab shows a top 10, and this route has no other consumer, so
    // there is nothing to gain from fetching deeper.
    const { data: topStudents, error: studentsError } = await supabase
      .from('Student')
      .select('id, name, studentId, points, funFactsCollected, avatarSkin, avatarHair, avatarEyes, avatarBrows, group:Group(name, emblem, emblemUrl, color)')
      .order('points', { ascending: false })
      .limit(10)

    if (studentsError) throw studentsError

    return NextResponse.json({ groups, topStudents: topStudents ?? [] })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
