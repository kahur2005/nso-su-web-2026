// app/api/onboarding/complete/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase
    .from('Student')
    .update({ hasSeenIntro: true })
    .eq('studentId', session.user.studentId)

  return NextResponse.json({ success: true })
}
