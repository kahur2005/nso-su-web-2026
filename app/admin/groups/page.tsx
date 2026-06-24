// app/admin/groups/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/layout/AdminHeader'
import PixelCard from '@/components/ui/PixelCard'
import { createGroup, assignStudentToGroup } from '../actions'

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
              <h2 className="font-pixel text-sm text-white mb-4">➕ NEW GROUP</h2>
              <form action={createGroup} className="space-y-3">
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    GROUP NAME
                  </label>
                  <input name="name" className={inputClass}
                    placeholder="e.g. Crimson Dragons" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-pixel text-xs text-gray-400 block mb-1">
                      EMBLEM (EMOJI)
                    </label>
                    <input name="emblem" className={inputClass}
                      placeholder="🐉" defaultValue="🛡️" maxLength={4} />
                  </div>
                  <div>
                    <label className="font-pixel text-xs text-gray-400 block mb-1">
                      COLOR
                    </label>
                    <input name="color" type="color" defaultValue="#4CAF50"
                      className="w-full h-10 bg-gray-900 border-2 border-black cursor-pointer" />
                  </div>
                </div>
                <button type="submit"
                  className="pixel-btn w-full bg-blue-500 hover:bg-blue-400
                    text-white font-pixel text-sm px-6 py-3 rounded-none">
                  ⚡ CREATE GROUP
                </button>
              </form>
            </PixelCard>

            <PixelCard className="bg-gray-800">
              <h2 className="font-pixel text-sm text-white mb-4">🎯 ASSIGN STUDENT</h2>
              <form action={assignStudentToGroup} className="space-y-3">
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    STUDENT ID
                  </label>
                  <input name="studentId" className={inputClass}
                    placeholder="e.g. 2026010101" required />
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
              {groups.map((group, index) => (
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
                      justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${group.color}33` }}>
                      {group.emblem}
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
                </PixelCard>
              ))}

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
