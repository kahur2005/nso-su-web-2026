// app/api/lunch/orders/[id]/route.ts
// One order, for the receipt / pay screen. Readable by the student who placed
// it and by admins; anyone else gets a 403 whether or not the order exists.
//
// The QRIS payload is re-rendered to a data URL here rather than stored as an
// image, matching how /api/qr/live and /api/qr/generate hand QR codes to the
// client. It is only attached while payment is still outstanding — once the
// order is submitted the code is spent and showing it again invites a second
// payment.
import QRCode from 'qrcode'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getOrder, resolveStudentDbId } from '@/lib/lunch-data'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const order = await getOrder(id)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const isAdmin = Boolean((session.user as any)?.isAdmin)
  const studentDbId = await resolveStudentDbId(session)
  if (!isAdmin && order.studentId !== studentDbId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let qrCodeImage: string | null = null
  if (order.status === 'pending_payment' && order.qrisPayload) {
    qrCodeImage = await QRCode.toDataURL(order.qrisPayload, {
      width: 512,
      margin: 2,
    })
  }

  return NextResponse.json({ order, qrCodeImage })
}
