// app/api/lunch/recap/route.ts
// Downloads the recap as an .xlsx. Admin only.
//
// It re-runs the same query and the same aggregation the page does rather than
// accepting a payload from the browser, so the file can never contain figures
// the server would not stand behind — and re-reads live, so a download is
// current even if the tab has been open a while.
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

  // A caption row so a file sitting in someone's Downloads folder still says
  // what it covers.
  const dayLabel = dayKey ? (lunchDayMeta(dayKey)?.headerTitle ?? `Day ${dayKey}`) : 'All days'
  const caption = [
    `Lunch recap — ${dayLabel} — ${LUNCH_RECAP_SCOPES[scope].label}${
      restaurant ? ` — ${restaurant}` : ''
    }`,
  ]

  const file = buildXlsx([caption, [], ...rows], {
    name: 'Lunch recap',
    // Row 1 is the caption; recapToRows' own header sits at row 3 and is left
    // unbolded rather than mis-bolding the caption.
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
