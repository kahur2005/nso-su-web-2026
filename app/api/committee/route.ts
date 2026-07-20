// Public read of the committee roster. Fun facts are gated: `isScanned` tells
// the client whether this student has scanned that member's QR, and the real
// funFact is only included when they have.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { isDivisionId } from '@/lib/divisions'

const LOCKED_FACT = 'Scan this member’s QR to unlock their fun fact!'

export async function GET() {
  const session = await getServerSession(authOptions)
  const studentId = (session?.user as { studentId?: string } | undefined)?.studentId

  const { data: npcs, error } = await supabase
    .from('NPC')
    .select('id, committeeName, role, division, funFact, avatarUrl, instagram')
    .eq('isActive', true)
    .order('committeeName')

  if (error) {
    console.error('committee fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load committee' }, { status: 500 })
  }

  // Which of these members has the current student already scanned?
  const scanned = new Set<string>()
  if (studentId) {
    const { data: student, error: studentError } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', studentId)
      .maybeSingle()

    if (student) {
      const { data: logs, error: logsError } = await supabase
        .from('ScanLog')
        .select('npcId')
        .eq('studentId', student.id)
      // This route is a deliberately public read and must keep working for
      // logged-out visitors, so a failure here degrades to "locked" rather
      // than failing the whole request — but it must still be logged, since
      // otherwise a real outage in the unlock path looks like normal
      // behaviour (everyone just appears unscanned). Do not turn this into
      // a 500.
      if (logsError) {
        console.error(`committee scan-log fetch failed for student ${student.id}:`, logsError)
      }
      for (const log of logs ?? []) scanned.add(log.npcId)
    } else if (studentError) {
      console.error(`committee student lookup failed for studentId ${studentId}:`, studentError)
    }
  }

  const members = (npcs ?? []).map((n) => {
    const isScanned = scanned.has(n.id)
    let division: string | null = null
    if (isDivisionId(n.division)) {
      division = n.division
    } else if (n.division) {
      console.warn(`committee member ${n.id} has unrecognised division: ${n.division}`)
    }
    return {
      id: n.id,
      name: n.committeeName,
      role: n.role,
      division,
      imageUrl: n.avatarUrl,
      instagram: n.instagram,
      funFact: isScanned ? n.funFact : LOCKED_FACT,
      isScanned,
    }
  })

  return NextResponse.json({ members })
}
