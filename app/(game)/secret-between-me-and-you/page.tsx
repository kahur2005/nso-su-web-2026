// app/(game)/secret-between-me-and-you/page.tsx
// Unlisted easter-egg page: claim once → YouTube; later visits show the quest QR.
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import SecretPageClient from './SecretPageClient'

export default async function SecretBetweenMeAndYouPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return <SecretPageClient />
}
