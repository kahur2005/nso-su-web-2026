import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLeaderboardSuspense } from '@/lib/app-settings'
import { redactFeedPayload } from '@/lib/leaderboard-redact'

const FEED_LIMIT = 10

const CHAPTER_LABELS: Record<string, string> = {
  talking: 'Talking to Lecturers',
  'dos-donts': "Do's & Don'ts",
  'cv-interview': 'CV & Interview',
  facilities: 'Campus Facilities',
  academics: 'Academics & Life',
}

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

interface RawQuizItem {
  id: string
  chapterId: string
  pointsAwarded: number
  claimedAt: string
  student: RawStudentRef | null
}

export async function GET() {
  try {
    const suspense = await getLeaderboardSuspense()
    const session = await getServerSession(authOptions)
    const isAdmin = Boolean(session?.user?.isAdmin)

    if (suspense && !isAdmin) {
      return NextResponse.json({ ...redactFeedPayload(), suspense: true })
    }

    const [questsRes, scansRes, quizRes] = await Promise.all([
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
      supabase
        .from('GuidebookQuizAttempt')
        .select(`
          id,
          chapterId,
          pointsAwarded,
          claimedAt,
          student:Student(name, studentId, isAdmin)
        `)
        .eq('isCorrect', true)
        .not('claimedAt', 'is', null)
        .order('claimedAt', { ascending: false })
        .limit(FEED_LIMIT * 2),
    ])

    if (questsRes.error) throw questsRes.error
    if (scansRes.error) console.error('leaderboard feed: scan log fetch failed:', scansRes.error)
    if (quizRes.error) console.error('leaderboard feed: quiz attempts fetch failed:', quizRes.error)

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

    const quizEvents = quizRes.error
      ? []
      : ((quizRes.data as unknown as RawQuizItem[]) ?? [])
          .filter((qz) => !qz.student?.isAdmin)
          .map((qz) => {
            const chapterTitle = CHAPTER_LABELS[qz.chapterId] || qz.chapterId
            return {
              id: `qz-${qz.id}`,
              type: 'quiz',
              label: `Guidebook Quiz: ${chapterTitle}`,
              questType: 'quiz',
              points: qz.pointsAwarded ?? 2,
              studentName: qz.student?.name ?? 'Unknown',
              studentId: qz.student?.studentId ?? '',
              at: qz.claimedAt,
            }
          })

    const feed = [...questEvents, ...scanEvents, ...quizEvents]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, FEED_LIMIT)

    return NextResponse.json({ feed, suspense })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
