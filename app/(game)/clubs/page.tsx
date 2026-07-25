// app/(game)/clubs/page.tsx
// Canonical redirect to the Guild Hall parchment page at /map/clubs
import { redirect } from 'next/navigation'

export default function ClubsRedirectPage() {
  redirect('/info/clubs')
}
