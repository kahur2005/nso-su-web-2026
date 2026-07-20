// app/admin/groups/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/layout/AdminHeader'
import PixelCard from '@/components/ui/PixelCard'
import StudentPicker from '@/components/admin/StudentPicker'
import GroupEmblem from '@/components/ui/GroupEmblem'
import { assignStudentToGroup, unassignStudent } from '../actions'

const inputClass = `w-full bg-gray-900 border-2 border-black text-white
  font-pixel text-xs p-3 focus:outline-none focus:border-blue-500`

export default async function AdminGroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: rawGroups } = await supabase
    .from('Group')
    .select('*, members:Student(count)')
    .order('totalPoints', { ascending: false })

  const groups = (rawGroups ?? []).map((g: any) => {
    const { members, ...rest } = g
    return { ...rest, _count: { members: members?.[0]?.count ?? 0 } }
  })

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

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      <AdminHeader title="🛡️ MANAGE GROUPS" subtitle="STUDENT GUILDS & TEAMS" />

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <PixelCard className="bg-gray-800 text-center">
            <p className="font-pixel text-xs text-gray-400">GROUPS</p>
            <p className="font-pixel text-2xl text-blue-400 mt-1">{groups.length}</p>
          </PixelCard>
          <PixelCard className="bg-gray-800 text-center">
            <p className="font-pixel text-xs text-gray-400">UNASSIGNED PLAYERS</p>
            <p className="font-pixel text-2xl text-red-400 mt-1">{unassignedCount}</p>
          </PixelCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Forms */}
          <div className="space-y-6">
            <PixelCard className="bg-gray-800">
              <h2 className="font-pixel text-sm text-white mb-4">🎯 ASSIGN STUDENT</h2>
              <form action={assignStudentToGroup} className="space-y-3">
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    STUDENT NAME
                  </label>
                  <StudentPicker students={students} inputClass={inputClass} />
                </div>
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    GROUP
                  </label>
                  <select name="groupId" className={inputClass} required>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.emblem} {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit"
                  className="pixel-btn w-full bg-green-500 hover:bg-green-400
                    text-white font-pixel text-sm px-6 py-3 rounded-none">
                  ✅ ASSIGN
                </button>
              </form>
            </PixelCard>
          </div>

          {/* Group list */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-pixel text-sm text-white">🏆 GROUP RANKINGS</h2>
            </div>

            <div className="space-y-3">
              {groups.map((group, index) => {
                const members = students.filter((s) => s.groupId === group.id)
                return (
                <PixelCard key={group.id} className="bg-gray-800" glowColor={group.color}>
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-sm w-8"
                      style={{
                        color: index === 0 ? '#FFD700'
                          : index === 1 ? '#C0C0C0'
                          : index === 2 ? '#CD7F32' : '#fff'
                      }}>
                      #{index + 1}
                    </span>
                    <div className="w-12 h-12 border-2 border-black flex items-center
                      justify-center overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: `${group.color}33` }}>
                      <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={44} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-xs" style={{ color: group.color }}>
                        {group.name}
                      </p>
                      <p className="font-pixel text-[8px] text-gray-400 mt-1">
                        👥 {group._count.members} MEMBERS
                      </p>
                    </div>
                    <span className="font-pixel text-xs text-yellow-400">
                      {group.totalPoints} PTS
                    </span>
                  </div>

                  {/* Members — remove to unassign (reassign via the form above) */}
                  {members.length > 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-gray-700 space-y-1">
                      {members.map((m) => (
                        <div key={m.studentId}
                          className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-pixel text-[10px] text-white truncate">
                              {m.name}
                            </p>
                            <p className="font-pixel text-[8px] text-gray-500">
                              {m.studentId}
                            </p>
                          </div>
                          <form action={unassignStudent}>
                            <input type="hidden" name="studentId" value={m.studentId} />
                            <button type="submit"
                              className="font-pixel text-[8px] px-2 py-1 border-2 border-black
                                bg-red-800 text-white hover:bg-red-700 transition-colors"
                              style={{ boxShadow: '2px 2px 0 #000' }}>
                              ✕ REMOVE
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </PixelCard>
                )
              })}

              {groups.length === 0 && (
                <PixelCard className="bg-gray-800 text-center py-8">
                  <span className="text-4xl">🛡️</span>
                  <p className="font-pixel text-xs text-gray-400 mt-4">
                    NO GROUPS YET — FOUND THE FIRST GUILD!
                  </p>
                </PixelCard>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
