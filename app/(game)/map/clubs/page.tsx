// app/(game)/map/clubs/page.tsx
// Superseded by /info/clubs; kept as a redirect for old links.
import { redirect } from 'next/navigation'

export default function MapClubsRedirectPage() {
  redirect('/info/clubs')
}
