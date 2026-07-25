// app/api/leaderboard/feed/route.ts
// Returns a chronological log of points events (quest completions + scan logs)
// used by the leaderboard "RECORD" tab.
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/* The RECORD tab shows the 10 most recent points events. Both source queries
 * are capped at the same number rather than something larger: an event that
 * lands in the merged top 10 by time is necessarily within its own source's
 * most-recent 10, so fetching deeper cannot change the result. */
const FEED_LIMIT = 10

interface RawStudentRef {
  name: string
  studentId: string
  isAdmin: boolean
}

interface RawQuestItem {
  id: string
  completedAt: string
  student: RawStudentRef | null
  quest: { title: string; points: number } | null
}

interface RawScanItem {
  id: string
  scannedAt: string
  pointsAwarded: number
  student: RawStudentRef | null
  npc: { committeeName: string } | null
}

export async function GET() {
  try {
    const [questsRes, scansRes] = await Promise.all([
      supabase
        .from('QuestProgress')
        .select(`
          id,
          completedAt,
          student:Student(name, studentId, isAdmin),
          quest:Quest(title, points)
        `)
        .eq('status', 'completed')
        .order('completedAt', { ascending: false })
        .limit(FEED_LIMIT * 2),
      supabase
        .from('ScanLog')
        .select(`
          id,
          scannedAt,
          pointsAwarded,
          student:Student(name, studentId, isAdmin),
          npc:NPC("committeeName")
        `)
        .order('scannedAt', { ascending: false })
        .limit(FEED_LIMIT * 2),
    ])

    if (questsRes.error) throw questsRes.error
    if (scansRes.error) console.error('leaderboard feed: scan log fetch failed:', scansRes.error)

    const questEvents = ((questsRes.data as unknown as RawQuestItem[]) ?? [])
      .filter((q) => !q.student?.isAdmin)
      .map((q) => ({
        id: `q-${q.id}`,
        type: 'quest',
        label: q.quest?.title ?? 'Quest',
        questType: 'quest',
        points: q.quest?.points ?? 0,
        studentName: q.student?.name ?? 'Unknown',
        studentId: q.student?.studentId ?? '',
        at: q.completedAt,
      }))

    const scanEvents = scansRes.error
      ? []
      : ((scansRes.data as unknown as RawScanItem[]) ?? [])
          .filter((s) => !s.student?.isAdmin)
          .map((s) => ({
            id: `s-${s.id}`,
            type: 'scan',
            label: s.npc?.committeeName ? `Scanned ${s.npc.committeeName}` : 'NPC Scan',
            questType: 'scan',
            points: s.pointsAwarded ?? 0,
            studentName: s.student?.name ?? 'Unknown',
            studentId: s.student?.studentId ?? '',
            at: s.scannedAt,
          }))

    const feed = [...questEvents, ...scanEvents]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, FEED_LIMIT)

    return NextResponse.json({ feed })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
