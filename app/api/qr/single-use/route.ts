// app/api/qr/single-use/route.ts
// Generates a unique, 1-time single-use QR link and image for a committee member
// or quest. Perfect for sending a direct QR to an individual student who asks for
// a missing fun fact. Consumed once upon scan — cannot be shared or re-scanned.
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { isAdmin?: boolean; role?: string }
  const isAuthorized =
    user.isAdmin === true || user.role === 'gl' || user.role === 'committee'

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Only Committee Members, GLs, or Admins can generate single-use QRs.' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { npcId, questId } = body

  if (!npcId && !questId) {
    return NextResponse.json({ error: 'NPC ID or Quest ID is required.' }, { status: 400 })
  }

  let points = 3
  let label = 'Committee Fun Fact'

  if (npcId) {
    const { data: npc } = await supabase
      .from('NPC')
      .select('committeeName, points')
      .eq('id', npcId)
      .maybeSingle()
    if (!npc) return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    points = npc.points
    label = npc.committeeName
  } else if (questId) {
    const { data: quest } = await supabase
      .from('Quest')
      .select('title, points')
      .eq('id', questId)
      .maybeSingle()
    if (!quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    points = quest.points
    label = quest.title
  }

  // Mint a unique single-use token with jti UUID valid for 24h
  const jti = `1-TIME-${randomUUID().slice(0, 8).toUpperCase()}`
  const token = jwt.sign(
    {
      npcId: npcId || undefined,
      questId: questId || undefined,
      points,
      jti,
      singleUse: true,
    },
    process.env.QR_SECRET_KEY!,
    { expiresIn: '24h' }
  )

  const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/scan?token=${token}`
  const qrCodeImage = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  return NextResponse.json({
    success: true,
    scanUrl,
    qrCode: qrCodeImage,
    jti,
    label,
    points,
  })
}
