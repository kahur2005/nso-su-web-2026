// app/admin/announcements/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/admin/DataTable'
import { createAnnouncement, toggleAnnouncement } from '../actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

export default async function AdminAnnouncementsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: announcementsData } = await supabase
    .from('Announcement')
    .select('*')
    .order('createdAt', { ascending: false })

  const announcements = announcementsData ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">
          Broadcast short notices to the student dashboard. Toggle an announcement
          to hide it without deleting it.
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white p-5 h-fit">
        <h2 className="text-sm font-medium text-slate-900 mb-3">New announcement</h2>

        <form action={createAnnouncement} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Title</label>
            <input
              name="title"
              className={inputClass}
              placeholder="e.g. Lunch break extended!"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Content</label>
            <textarea
              name="content"
              rows={3}
              className={inputClass}
              placeholder="The message players will see on their dashboard"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium
              rounded-md px-4 py-2 transition-colors"
          >
            Broadcast
          </button>
        </form>
      </div>

      <DataTable headers={['Title', 'Content', 'Status', 'Created']}>
        {announcements.map((ann) => (
          <tr key={ann.id}>
            <td className="px-4 py-2.5 font-medium text-slate-800 align-top whitespace-nowrap">
              {ann.title}
            </td>
            <td className="px-4 py-2.5 text-slate-600 align-top max-w-md">
              <p className="line-clamp-2" title={ann.content}>
                {ann.content}
              </p>
            </td>
            <td className="px-4 py-2.5 align-top whitespace-nowrap">
              <form action={toggleAnnouncement.bind(null, ann.id)}>
                <button
                  type="submit"
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
                    ${ann.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                >
                  {ann.isActive ? 'Active' : 'Inactive'}
                </button>
              </form>
            </td>
            <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
              {new Date(ann.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}

        {announcements.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
              No announcements yet.
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
