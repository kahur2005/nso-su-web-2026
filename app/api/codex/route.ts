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

  const studentId = (session.user as any).studentId

  const { data: student } = await supabase
    .from('Student')
    .select('id')
    .eq('studentId', studentId)
    .maybeSingle()

  const { data: scanLogs } = student
    ? await supabase
        .from('ScanLog')
        .select('npcId, scannedAt')
        .eq('studentId', student.id)
    : { data: [] as any[] }

  const { data: allNPCs } = await supabase
    .from('NPC')
    .select('*')
    .eq('isActive', true)
    .order('createdAt', { ascending: true })

  const scans = scanLogs ?? []
  const collectedIds = new Set(scans.map((s: any) => s.npcId))

  const entries = (allNPCs ?? []).map((npc: any, index: number) => {
    const scanLog = scans.find((s: any) => s.npcId === npc.id)
    return {
      id: npc.id,
      npcId: npc.id,
      committeeName: npc.committeeName,
      role: npc.role,
      funFact: npc.funFact,
      rarity: npc.rarity,
      points: npc.points,
      avatarUrl: npc.avatarUrl,
      collected: collectedIds.has(npc.id),
      collectedAt: scanLog?.scannedAt || null,
      index: index + 1,
    }
  })

  return NextResponse.json({ entries })
}
