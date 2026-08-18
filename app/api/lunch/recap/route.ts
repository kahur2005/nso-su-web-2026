import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'
import { getAdminOrders } from '@/lib/lunch-data'
import {
  LUNCH_RECAP_SCOPES,
  buildLunchRecap,
  isLunchRecapScope,
  lunchDayMeta,
  recapToRows,
} from '@/lib/lunch'
import { buildXlsx } from '@/lib/xlsx'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const scopeParam = params.get('scope') ?? 'paid'
  const scope = isLunchRecapScope(scopeParam) ? scopeParam : 'paid'
  const dayKey = params.get('day') || undefined
  const restaurant = params.get('restaurant') || undefined

  const orders = await getAdminOrders({
    statuses: [...LUNCH_RECAP_SCOPES[scope].statuses],
    dayKey,
  })

  const filtered = restaurant
    ? orders.filter((o) => o.restaurantName === restaurant)
    : orders

  const recap = buildLunchRecap(filtered)
  const rows = recapToRows(recap)

  const dayLabel = dayKey ? (lunchDayMeta(dayKey)?.headerTitle ?? `Day ${dayKey}`) : 'All days'
  const caption = [
    `Lunch recap — ${dayLabel} — ${LUNCH_RECAP_SCOPES[scope].label}${
      restaurant ? ` — ${restaurant}` : ''
    }`,
  ]

  const file = buildXlsx([caption, [], ...rows], {
    name: 'Lunch recap',
    headerRow: true,
    columnWidths: [24, 34, 10, 14, 8, 14],
  })

  const slug = [
    'lunch-recap',
    dayKey ? `day${dayKey}` : 'all-days',
    restaurant ? restaurant.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null,
    scope,
  ]
    .filter(Boolean)
    .join('-')

  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${slug}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
