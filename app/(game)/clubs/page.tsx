// app/(game)/clubs/page.tsx
// Canonical redirect to the Guild Hall parchment page at /info/clubs
import { redirect } from 'next/navigation'

export default function ClubsRedirectPage() {
  redirect('/info/clubs')
}
