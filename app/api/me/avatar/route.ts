// app/api/me/avatar/route.ts
// Returns the logged-in student's avatarConfig JSONB, used by the
// bottom nav "Me" tab and desktop Navbar to render their customised avatar.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('Student')
    .select('avatarConfig')
    .eq('studentId', session.user.studentId)
    .maybeSingle()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 })
  }

  return NextResponse.json({ avatar: data?.avatarConfig ?? null })
}
