import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { resolveStudentDbId } from '@/lib/lunch-data'
import { SECRET_QUEST_TITLE } from '@/lib/secret'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: claim, error: claimError } = await supabase
    .from('SecretClaim')
    .select('id')
    .eq('studentId', studentDbId)
    .maybeSingle()

  if (claimError) {
    console.error('GET /api/secret claim lookup:', claimError)
    return NextResponse.json({ error: 'Could not load claim status' }, { status: 500 })
  }

  const claimed = Boolean(claim)
  if (!claimed) {
    return NextResponse.json({ claimed: false, qrCode: null })
  }

  const { data: quest, error: questError } = await supabase
    .from('Quest')
    .select('qrCode')
    .eq('title', SECRET_QUEST_TITLE)
    .eq('isDeleted', false)
    .maybeSingle()

  if (questError) {
    console.error('GET /api/secret quest lookup:', questError)
    return NextResponse.json({ error: 'Could not load quest QR' }, { status: 500 })
  }

  return NextResponse.json({
    claimed: true,
    qrCode: quest?.qrCode ?? null,
  })
}
