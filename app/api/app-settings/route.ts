import { NextResponse } from 'next/server'
import { getLeaderboardSuspense } from '@/lib/app-settings'

export async function GET() {
  const leaderboardSuspense = await getLeaderboardSuspense()
  return NextResponse.json({ leaderboardSuspense })
}
