// app/admin/groups/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/admin/DataTable'
import StudentPicker from '@/components/admin/StudentPicker'
import GroupEmblem from '@/components/ui/GroupEmblem'
import { assignStudentToGroup, unassignStudent } from '../actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default async function AdminGroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  /* Pull each member's points rather than just a count: the stored
   * `Group.totalPoints` is a denormalised counter that only `scan_npc` and
   * `adjust_points` maintain, so it misses any points a student already had
   * when they were assigned to the group — see app/api/leaderboard/route.ts.
   * Totalling the roster here is correct whatever order things happened in. */
  const { data: rawGroups } = await supabase
    .from('Group')
    .select('*, members:Student(points)')

  const groups = (rawGroups ?? [])
    .map((g: any) => {
      const { members, ...rest } = g
      const roster = members ?? []
      return {
        ...rest,
        totalPoints: roster.reduce((sum: number, m: any) => sum + (m.points ?? 0), 0),
        _count: { members: roster.length },
      }
    })
    .sort((a: any, b: any) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name))

  const { count: unassignedCount } = await supabase
    .from('Student')
    .select('*', { count: 'exact', head: true })
    .is('groupId', null)

  const { data: studentsData } = await supabase
    .from('Student')
    .select('studentId, name, email, groupId, group:Group(name)')
    .order('name', { ascending: true })

  const students = (studentsData ?? []).map((s: any) => ({
    studentId: s.studentId,
    name: s.name,
    email: s.email,
    groupId: s.groupId ?? null,
    groupName: s.group?.name ?? null,
  }))

  // Groups sorted by name for the logo grid (the ranking table below keeps
  // the points-descending order already applied by the query).
  const groupsByName = [...groups].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg bg-white p-5 text-center">
          <p className="text-xs font-medium text-slate-500">Groups</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{groups.length}</p>
        </div>
        <div className="border border-slate-200 rounded-lg bg-white p-5 text-center">
          <p className="text-xs font-medium text-slate-500">Unassigned students</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{unassignedCount ?? 0}</p>
        </div>
      </div>

      {/* Logo grid — the 15 fixed, pre-seeded groups. There is no create-group
          flow: the roster is fixed and every group already has a designed
          logo, so an ad-hoc 16th group would have no art. */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Groups</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {groupsByName.map((group) => (
            <div
              key={group.id}
              className="border border-slate-200 rounded-lg bg-white p-4 flex flex-col
                items-center text-center gap-2 border-l-4"
              style={{ borderLeftColor: group.color }}
            >
              <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={56} />
              <p className="text-sm font-medium text-slate-800 truncate w-full">{group.name}</p>
              <p className="text-xs text-slate-500">{group.totalPoints} pts</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Assign form */}
        <div className="border border-slate-200 rounded-lg bg-white p-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Assign student</h2>
          <form action={assignStudentToGroup} className="space-y-3">
            <div>
              <label className={labelClass}>Student name</label>
              <StudentPicker students={students} inputClass={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Group</label>
              <select name="groupId" className={inputClass} required>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full text-sm font-medium text-white bg-slate-900 hover:bg-slate-800
                rounded-md px-4 py-2 transition-colors"
            >
              Assign
            </button>
          </form>
        </div>

        {/* Ranking + member lists */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Group rankings</h2>
            <DataTable headers={['#', 'Group', 'Points', 'Members']}>
              {groups.map((group, index) => (
                <tr key={group.id}>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{index + 1}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={24} />
                      <span className="font-medium text-slate-800">{group.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{group.totalPoints}</td>
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                    {group._count.members}
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>

          <div className="space-y-3">
            {groups.map((group) => {
              const members = students.filter((s) => s.groupId === group.id)
              if (members.length === 0) return null
              return (
                <div key={group.id} className="border border-slate-200 rounded-lg bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={20} />
                    <p className="text-sm font-medium text-slate-800">{group.name}</p>
                  </div>
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div key={m.studentId} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 truncate">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.studentId}</p>
                        </div>
                        <form action={unassignStudent}>
                          <input type="hidden" name="studentId" value={m.studentId} />
                          <button
                            type="submit"
                            className="text-xs font-medium px-2.5 py-1 rounded-full border
                              border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {students.every((s) => !s.groupId) && (
              <div className="border border-slate-200 rounded-lg bg-white p-8 text-center">
                <p className="text-sm text-slate-500">No students are assigned to a group yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
