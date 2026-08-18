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
