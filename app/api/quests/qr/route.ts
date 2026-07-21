// app/api/quests/qr/route.ts
// Generate (or regenerate) the QR code for a quest. Admin only.
//
// The quest counterpart of /api/qr/generate, kept separate because that route
// is NPC-shaped — it creates committee members as a side effect of making a QR.
// Quests are created first in /admin/quests, so this route only ever attaches a
// code to a quest that already exists.
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

/* Fun-fact codes are signed for 7 days because committee members are handed
 * theirs during the event. A quest poster may be printed weeks ahead, so a
 * 7-day token would be dead before orientation starts. Expiry is not the
 * revocation mechanism here anyway: lib/scan/quest.ts rejects any token that
 * is not the one currently stored on the quest, so regenerating a code retires
 * the old print immediately regardless of how long it had left. */
const QUEST_TOKEN_TTL = '120d'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { questId } = await request.json()
  if (!questId) {
    return NextResponse.json({ error: 'questId is required' }, { status: 400 })
  }

  const { data: quest, error: fetchError } = await supabase
    .from('Quest')
    .select('id, title, isDeleted')
    .eq('id', questId)
    .maybeSingle()

  if (fetchError) {
    console.error('quests/qr: lookup failed:', fetchError)
    return NextResponse.json({ error: 'Could not look up quest' }, { status: 500 })
  }
  if (!quest || quest.isDeleted) {
    return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
  }

  // Only the quest id is signed. Points are read from the Quest row at scan
  // time (inside complete_quest), so editing a quest's points does not strand
  // already-printed codes on the old value.
  const token = jwt.sign({ kind: 'quest', questId: quest.id }, process.env.QR_SECRET_KEY!, {
    expiresIn: QUEST_TOKEN_TTL,
  })

  const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/scan?token=${token}`
  const qrCodeImage = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  // Overwriting qrToken is what supersedes any previous printout.
  const { data: updated, error: updateError } = await supabase
    .from('Quest')
    .update({ qrToken: token, qrCode: qrCodeImage })
    .eq('id', quest.id)
    .select()
    .single()

  if (updateError) {
    console.error('quests/qr: save failed:', updateError)
    return NextResponse.json({ error: 'Could not save QR code' }, { status: 500 })
  }

  return NextResponse.json({ success: true, quest: updated, qrCode: qrCodeImage, scanUrl })
}
