// app/api/leaderboard/feed/route.ts
// Returns a chronological log of points events (quest completions + scan logs)
// used by the leaderboard "RECORD" tab.
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Quest completions with student + quest info
    const { data: quests, error: qErr } = await supabase
      .from('QuestProgress')
      .select(`
        id,
        completedAt,
        student:Student(name, studentId),
        quest:Quest(title, points, type)
      `)
      .eq('status', 'completed')
      .order('completedAt', { ascending: false })
      .limit(50)

    if (qErr) throw qErr

    // Scan logs (NPC / fun-fact scans)
    const { data: scans, error: sErr } = await supabase
      .from('ScanLog')
      .select(`
        id,
        createdAt,
        pointsAwarded,
        student:Student(name, studentId),
        npc:NPC(name)
      `)
      .order('createdAt', { ascending: false })
      .limit(50)

    // Merge & sort by time (scans may fail if schema differs — degrade gracefully)
    const questEvents = (quests ?? []).map((q: any) => ({
      id: `q-${q.id}`,
      type: 'quest',
      label: q.quest?.title ?? 'Quest',
      questType: q.quest?.type ?? 'side',
      points: q.quest?.points ?? 0,
      studentName: q.student?.name ?? 'Unknown',
      studentId: q.student?.studentId ?? '',
      at: q.completedAt,
    }))

    const scanEvents = sErr ? [] : (scans ?? []).map((s: any) => ({
      id: `s-${s.id}`,
      type: 'scan',
      label: s.npc?.name ? `Scanned ${s.npc.name}` : 'NPC Scan',
      questType: 'scan',
      points: s.pointsAwarded ?? 0,
      studentName: s.student?.name ?? 'Unknown',
      studentId: s.student?.studentId ?? '',
      at: s.createdAt,
    }))

    const feed = [...questEvents, ...scanEvents].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    ).slice(0, 60)

    return NextResponse.json({ feed })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
