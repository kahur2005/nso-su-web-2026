// app/(game)/map/committee/page.tsx
// Superseded by /info/committee; kept as a redirect for old links.
import { redirect } from 'next/navigation'

export default function MapCommitteeRedirectPage() {
  redirect('/info/committee')
}
