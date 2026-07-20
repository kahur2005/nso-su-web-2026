// app/admin/clubs/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/admin/DataTable'
import ClubForm from '@/components/admin/ClubForm'
import DeleteClubButton from '@/components/admin/DeleteClubButton'

export default async function AdminClubsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: clubsData } = await supabase
    .from('Club')
    .select('id, name, category, images, instagram, registrationUrl')
    .order('name', { ascending: true })

  const clubs = clubsData ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Clubs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage the student society directory shown at /map/clubs. New clubs
          appear there immediately.
        </p>
      </div>

      <ClubForm />

      <DataTable headers={['Club', 'Category', 'Images', 'Instagram', 'Registration', '']}>
        {clubs.map((club) => (
          <tr key={club.id}>
            <td className="px-4 py-2.5 font-medium text-slate-800 align-top whitespace-nowrap">
              {club.name}
            </td>
            <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
              {club.category}
            </td>
            <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
              {(club.images ?? []).length}
            </td>
            <td className="px-4 py-2.5 align-top whitespace-nowrap">
              {club.instagram ? (
                <a
                  href={club.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Link
                </a>
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </td>
            <td className="px-4 py-2.5 align-top whitespace-nowrap">
              {club.registrationUrl ? (
                <a
                  href={club.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Link
                </a>
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </td>
            <td className="px-4 py-2.5 align-top whitespace-nowrap">
              <DeleteClubButton id={club.id} name={club.name} />
            </td>
          </tr>
        ))}

        {clubs.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
              No clubs yet.
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
