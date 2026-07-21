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

export async function GET() {
  try {
    // Quest completions with student + quest info
    const { data: quests, error: qErr } = await supabase
      .from('QuestProgress')
      .select(`
        id,
        completedAt,
        student:Student(name, studentId),
        quest:Quest(title, points)
      `)
      .eq('status', 'completed')
      .order('completedAt', { ascending: false })
      .limit(FEED_LIMIT)

    if (qErr) throw qErr

    // Scan logs (NPC / fun-fact scans). The timestamp column is `scannedAt` —
    // this query asked for `createdAt`, which does not exist on ScanLog, so
    // every scan errored out and the graceful-degradation branch below silently
    // dropped all of them from the feed.
    const { data: scans, error: sErr } = await supabase
      .from('ScanLog')
      .select(`
        id,
        scannedAt,
        pointsAwarded,
        student:Student(name, studentId),
        npc:NPC("committeeName")
      `)
      .order('scannedAt', { ascending: false })
      .limit(FEED_LIMIT)

    if (sErr) console.error('leaderboard feed: scan log fetch failed:', sErr)

    // Merge & sort by time (scans may fail if schema differs — degrade gracefully)
    const questEvents = (quests ?? []).map((q: any) => ({
      id: `q-${q.id}`,
      type: 'quest',
      label: q.quest?.title ?? 'Quest',
      // Quest.type was retired when every quest became QR-completed; the feed
      // just needs one icon for all of them.
      questType: 'quest',
      points: q.quest?.points ?? 0,
      studentName: q.student?.name ?? 'Unknown',
      studentId: q.student?.studentId ?? '',
      at: q.completedAt,
    }))

    const scanEvents = sErr ? [] : (scans ?? []).map((s: any) => ({
      id: `s-${s.id}`,
      type: 'scan',
      label: s.npc?.committeeName ? `Scanned ${s.npc.committeeName}` : 'NPC Scan',
      questType: 'scan',
      points: s.pointsAwarded ?? 0,
      studentName: s.student?.name ?? 'Unknown',
      studentId: s.student?.studentId ?? '',
      at: s.scannedAt,
    }))

    const feed = [...questEvents, ...scanEvents].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    ).slice(0, FEED_LIMIT)

    return NextResponse.json({ feed })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
