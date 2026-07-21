// app/admin/points/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PointsSearchableTable from '@/components/admin/PointsSearchableTable'

export default async function AdminPointsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: studentsData } = await supabase
    .from('Student')
    .select('studentId, name, email, points, group:Group(name, emblem, emblemUrl, color)')
    .order('name', { ascending: true })

  const students = (studentsData ?? []).map((s: any) => ({
    studentId: s.studentId,
    name: s.name,
    email: s.email,
    points: s.points,
    group: s.group ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Points</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search every registered player and click a row to add or subtract points.
          Adjustments also update the player&apos;s XP, level, and group total.
        </p>
      </div>

      <PointsSearchableTable students={students} />
    </div>
  )
}
