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
    .select('*, npc:NPC(committeeName, role)')
    .eq('studentId', student.id)
    .order('scannedAt', { ascending: false })
    .limit(20)

  // All-time scan count (the list above is capped at 20)
  const { count } = await supabase
    .from('ScanLog')
    .select('*', { count: 'exact', head: true })
    .eq('studentId', student.id)

  return NextResponse.json({ scans: scans ?? [], total: count ?? 0 })
}
