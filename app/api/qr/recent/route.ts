// app/api/qr/recent/route.ts
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: student } = await supabase
    .from('Student')
    .select('id')
    .eq('studentId', session.user.studentId)
    .maybeSingle()

  if (!student) {
    return NextResponse.json({ scans: [] })
  }

  const { data: scans } = await supabase
    .from('ScanLog')
    .select('*, npc:NPC(committeeName, role, rarity)')
    .eq('studentId', student.id)
    .order('scannedAt', { ascending: false })
    .limit(20)

  return NextResponse.json({ scans: scans ?? [] })
}
