// app/api/quests/route.ts
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

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: quests } = await supabase
    .from('Quest')
    .select('*')
    .order('type', { ascending: true })
    .order('createdAt', { ascending: false })

  const { data: progressRows } = await supabase
    .from('QuestProgress')
    .select('*')
    .eq('studentId', student.id)

  const progressByQuest = new Map(
    (progressRows ?? []).map((p: any) => [p.questId, p])
  )

  const questsWithProgress = (quests ?? []).map((q: any) => ({
    ...q,
    progress: progressByQuest.get(q.id) || null,
  }))

  return NextResponse.json({ quests: questsWithProgress })
}
