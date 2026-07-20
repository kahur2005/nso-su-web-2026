// app/admin/qr/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NpcForm from '@/components/admin/NpcForm'
import NpcSearchableTable from '@/components/admin/NpcSearchableTable'

export default async function AdminQrPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: npcsData } = await supabase
    .from('NPC')
    .select('id, committeeName, role, division, funFact, points, qrCode, isActive, scanCount')
    .order('committeeName', { ascending: true })

  const npcs = npcsData ?? []

  return (
    <div className="space-y-6">
      <NpcForm />
      <NpcSearchableTable npcs={npcs} />
    </div>
  )
}
