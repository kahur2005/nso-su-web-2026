// app/(game)/map/page.tsx
// The /map hub was superseded by /info. Kept as a redirect so bookmarked or
// printed /map URLs still land somewhere useful.
import { redirect } from 'next/navigation'

export default function MapRedirectPage() {
  redirect('/info')
}
