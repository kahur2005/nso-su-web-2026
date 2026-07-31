// app/api/lunch/menu/route.ts
// The student-facing read for /lunch.
//
//   GET /api/lunch/menu                    -> days + restaurants
//   GET /api/lunch/menu?restaurantId=xyz   -> the above plus that restaurant's
//                                             menu items and their add-ons
//
// Only active, non-deleted rows are returned, so a restaurant switched off in
// admin disappears from the student app immediately. Day open/closed state
// travels with the response for the UI to grey out — but the binding check is
// in POST /api/lunch/orders, not here.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'
import { getLunchDays, getRestaurants, getRestaurantMenu } from '@/lib/lunch-data'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const restaurantId = request.nextUrl.searchParams.get('restaurantId')

  const [days, restaurants] = await Promise.all([
    getLunchDays(),
    getRestaurants(),
  ])

  const restaurant = restaurantId
    ? await getRestaurantMenu(restaurantId)
    : null

  if (restaurantId && !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  return NextResponse.json({ days, restaurants, restaurant })
}
