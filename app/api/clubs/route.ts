// Public read of the club directory shown at /map/clubs.
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('Club')
    .select('id, name, category, description, images, instagram, registrationUrl, iconUrl')
    .order('name')

  if (error) {
    console.error('clubs fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load clubs' }, { status: 500 })
  }

  const clubs = (data ?? []).map((c) => ({
    ...c,
    images: c.images ?? [],
  }))

  return NextResponse.json({ clubs })
}
