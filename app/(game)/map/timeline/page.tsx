// app/(game)/map/timeline/page.tsx
// Superseded by /info/timeline; kept as a redirect for old links.
import { redirect } from 'next/navigation'

export default function MapTimelineRedirectPage() {
  redirect('/info/timeline')
}
