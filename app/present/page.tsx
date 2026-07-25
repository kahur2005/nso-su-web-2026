// app/present/page.tsx
// Redirect to canonical admin presenter page at /admin/present
import { redirect } from 'next/navigation'

export default function PresentRedirectPage() {
  redirect('/admin/present')
}
