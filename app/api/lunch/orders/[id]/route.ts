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
