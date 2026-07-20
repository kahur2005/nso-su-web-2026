// Public read of the committee roster. Fun facts are gated: `isScanned` tells
// the client whether this student has scanned that member's QR, and the real
// funFact is only included when they have.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', studentId)
      .maybeSingle()

    if (student) {
      const { data: logs } = await supabase
        .from('ScanLog')
        .select('npcId')
        .eq('studentId', student.id)
      for (const log of logs ?? []) scanned.add(log.npcId)
    }
  }

  const members = (npcs ?? []).map((n) => {
    const isScanned = scanned.has(n.id)
    return {
      id: n.id,
      name: n.committeeName,
      role: n.role,
      division: n.division,
      imageUrl: n.avatarUrl,
      instagram: n.instagram,
      funFact: isScanned ? n.funFact : LOCKED_FACT,
      isScanned,
    }
  })

  return NextResponse.json({ members })
}
