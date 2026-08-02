// app/(game)/map/zones/page.tsx
// Superseded by /info/maps, which carries the same zone data in the current
// parchment/wood design. Kept as a redirect for old links.
import { redirect } from 'next/navigation'

export default function MapZonesRedirectPage() {
  redirect('/info/maps')
}
