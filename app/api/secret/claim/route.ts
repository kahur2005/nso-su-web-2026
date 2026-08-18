import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { resolveStudentDbId } from '@/lib/lunch-data'
import { SECRET_YOUTUBE_URL } from '@/lib/secret'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('SecretClaim')
    .select('id')
    .eq('studentId', studentDbId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      youtubeUrl: SECRET_YOUTUBE_URL,
      alreadyClaimed: true,
    })
  }

  const { error } = await supabase.from('SecretClaim').insert({
    studentId: studentDbId,
  })

  if (error && error.code !== '23505') {
    console.error('POST /api/secret/claim insert:', error)
    return NextResponse.json({ error: 'Could not save claim' }, { status: 500 })
  }

  return NextResponse.json({
    youtubeUrl: SECRET_YOUTUBE_URL,
    alreadyClaimed: Boolean(error && error.code === '23505'),
  })
}
