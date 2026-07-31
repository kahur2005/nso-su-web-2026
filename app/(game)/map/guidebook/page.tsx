// app/(game)/map/guidebook/page.tsx
// Superseded by /info/guidebook; kept as a redirect for old links.
import { redirect } from 'next/navigation'

export default function MapGuidebookRedirectPage() {
  redirect('/info/guidebook')
}
