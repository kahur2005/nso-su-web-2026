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
    .select('id, committeeName, role, division, funFact, points, scanCount, avatarUrl, qrCode, isActive')
    .order('committeeName', { ascending: true })

  const members = membersData ?? []

  // Sort head of division to top within each division
  members.sort((a: any, b: any) => {
    if (a.division === b.division) {
      const aIsHead = /head|ketua/i.test(a.role ?? '')
      const bIsHead = /head|ketua/i.test(b.role ?? '')
      if (aIsHead !== bIsHead) return aIsHead ? -1 : 1
    }
    return 0
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Committee Info</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage committee members, personal fun-fact QR codes, roles, and divisions (shown at /map/committee).
          Add new members, edit details, generate or print QR codes, and manage active status.
        </p>
      </div>

      <CommitteeForm />

      <CommitteeSearchableList members={members} />
    </div>
  )
}
