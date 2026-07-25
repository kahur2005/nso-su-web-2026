// app/api/codex/route.ts
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let studentDbId = session.user.id
  if (!studentDbId && session.user.studentId) {
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', session.user.studentId)
      .maybeSingle()
    studentDbId = student?.id ?? ''
  }

  const [scanLogsRes, npcsRes] = await Promise.all([
    studentDbId
      ? supabase
          .from('ScanLog')
          .select('npcId, scannedAt')
          .eq('studentId', studentDbId)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('NPC')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: true }),
  ])

  const scans = (scanLogsRes.data ?? []) as Array<{ npcId: string; scannedAt: string }>
  const scanMap = new Map(scans.map((s) => [s.npcId, s.scannedAt]))
  const allNPCs = npcsRes.data ?? []

  const entries = allNPCs.map((npc, index) => {
    const scannedAt = scanMap.get(npc.id)
    return {
      id: npc.id,
      npcId: npc.id,
      committeeName: npc.committeeName,
      role: npc.role,
      funFact: npc.funFact,
      points: npc.points,
      avatarUrl: npc.avatarUrl,
      collected: scanMap.has(npc.id),
      collectedAt: scannedAt || null,
      index: index + 1,
    }
  })

  return NextResponse.json({ entries })
}
