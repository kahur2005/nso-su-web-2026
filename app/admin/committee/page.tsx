// app/admin/committee/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CommitteeForm from '@/components/admin/CommitteeForm'
import CommitteeSearchableList from '@/components/admin/CommitteeSearchableList'

export default async function AdminCommitteePage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: membersData } = await supabase
    .from('NPC')
    .select('id, committeeName, role, division, funFact, avatarUrl, qrCode')
    .order('committeeName', { ascending: true })

  const members = membersData ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Committee</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage the committee roster shown at /map/committee, grouped by division.
          A member added here has no QR code until one is generated in QR &amp; Fun Facts.
        </p>
      </div>

      <CommitteeForm />

      <CommitteeSearchableList members={members} />
    </div>
  )
}
