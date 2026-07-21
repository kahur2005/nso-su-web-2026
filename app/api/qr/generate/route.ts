// app/api/qr/generate/route.ts
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { isDivisionId } from '@/lib/divisions'
import { normalizeInstagram } from '@/lib/instagram'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { npcId } = body

  let npc: any

  if (npcId) {
    // Generate (or regenerate) a QR for an existing committee member — e.g.
    // one added via /admin/committee, which has no QR until this route runs.
    // Update that row instead of inserting, so the person doesn't end up as
    // two NPC rows (one scannable, one permanently orphaned).
    const { data: existingNpc, error: fetchError } = await supabase
      .from('NPC')
      .select('*')
      .eq('id', npcId)
      .maybeSingle()

    if (fetchError) {
      console.error(fetchError)
      return NextResponse.json({ error: 'Could not look up NPC' }, { status: 500 })
    }
    if (!existingNpc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    }
    npc = existingNpc
  } else {
    const { committeeName, role, division, instagram, funFact, points } = body

    // division is required: /(game)/map/committee filters members by
    // `m.division === activeDivision`, so a null-division member would be
    // invisible to students. Reject a missing/empty value the same way an
    // invalid one is already rejected.
    if (!division || !isDivisionId(division)) {
      return NextResponse.json({ error: 'Division is required' }, { status: 400 })
    }

    // Create NPC
    const { data: createdNpc, error: createError } = await supabase
      .from('NPC')
      .insert({
        committeeName,
        role,
        division,
        instagram: normalizeInstagram(instagram),
        funFact,
        points,
      })
      .select()
      .single()

    if (createError || !createdNpc) {
      console.error(createError)
      return NextResponse.json({ error: 'Could not create NPC' }, { status: 500 })
    }
    npc = createdNpc
  }

  // Generate JWT token. Points come from the NPC row itself (not request
  // body) so a regenerate for an existing member always encodes the points
  // actually configured for them, not whatever a caller happened to send.
  const token = jwt.sign(
    { npcId: npc.id, points: npc.points },
    process.env.QR_SECRET_KEY!,
    { expiresIn: '7d' }
  )

  // Generate QR Code
  const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/scan?token=${token}`
  const qrCodeImage = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  })

  // Save token & QR. This also legitimately replaces any existing QR (e.g. a
  // lost printout) — regenerating simply overwrites qrToken/qrCode.
  const { data: updatedNpc, error: updateError } = await supabase
    .from('NPC')
    .update({ qrToken: token, qrCode: qrCodeImage })
    .eq('id', npc.id)
    .select()
    .single()

  if (updateError) {
    console.error(updateError)
    return NextResponse.json({ error: 'Could not save QR code' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    npc: updatedNpc ?? npc,
    qrCode: qrCodeImage,
    scanUrl
  })
}