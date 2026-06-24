// app/admin/points/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/layout/AdminHeader'
import PixelCard from '@/components/ui/PixelCard'
import StudentPicker from '@/components/admin/StudentPicker'
import GroupEmblem from '@/components/ui/GroupEmblem'
import { adjustPoints } from '../actions'

const inputClass = `w-full bg-gray-900 border-2 border-black text-white
  font-pixel text-xs p-3 focus:outline-none focus:border-orange-500`

export default async function AdminPointsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: topStudentsData } = await supabase
    .from('Student')
    .select('*, group:Group(name, emblem, emblemUrl, color)')
    .order('points', { ascending: false })
    .limit(15)

  const topStudents = topStudentsData ?? []

  const { data: studentsData } = await supabase
    .from('Student')
    .select('studentId, name, email, group:Group(name)')
    .order('name', { ascending: true })

  const students = (studentsData ?? []).map((s: any) => ({
    studentId: s.studentId,
    name: s.name,
    email: s.email,
    groupName: s.group?.name ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      <AdminHeader title="⭐ MANAGE POINTS" subtitle="MANUAL POINT ADJUSTMENT" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Adjustment form */}
          <div>
            <PixelCard className="bg-gray-800">
              <h2 className="font-pixel text-sm text-white mb-4">
                ⚖️ ADJUST PLAYER POINTS
              </h2>

              <form action={adjustPoints} className="space-y-3">
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    STUDENT NAME
                  </label>
                  <StudentPicker students={students} inputClass={inputClass} />
                </div>

                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    AMOUNT (USE NEGATIVE TO SUBTRACT)
                  </label>
                  <input name="amount" type="number" className={inputClass}
                    placeholder="e.g. 50 or -25" required />
                </div>

                <button type="submit"
                  className="pixel-btn w-full bg-yellow-400 hover:bg-yellow-300
                    text-black font-pixel text-sm px-6 py-3 rounded-none">
                  ⚡ APPLY ADJUSTMENT
                </button>
              </form>

              <div className="mt-4 p-3 bg-yellow-900/50 border-2 border-yellow-600">
                <p className="font-pixel text-[8px] text-yellow-300 leading-relaxed">
                  ⚠️ ADJUSTMENTS ALSO UPDATE THE PLAYER&apos;S GROUP TOTAL.
                  POSITIVE AMOUNTS GRANT XP TOO. USE FOR EVENT REWARDS
                  OR PENALTY CORRECTIONS.
                </p>
              </div>
            </PixelCard>
          </div>

          {/* Top students reference */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-pixel text-sm text-white">🏆 TOP PLAYERS</h2>
            </div>

            <div className="space-y-2">
              {topStudents.map((student, index) => (
                <PixelCard key={student.id} className="bg-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-xs w-8 text-gray-400">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-xs text-white truncate">
                        {student.name}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="font-pixel text-[8px] text-gray-500">
                          {student.studentId}
                        </span>
                        {student.group && (
                          <span className="font-pixel text-[8px] inline-flex items-center gap-1"
                            style={{ color: student.group.color }}>
                            <GroupEmblem emblem={student.group.emblem} emblemUrl={student.group.emblemUrl} size={12} />
                            {student.group.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-pixel text-xs text-yellow-400">
                      ⭐ {student.points}
                    </span>
                  </div>
                </PixelCard>
              ))}

              {topStudents.length === 0 && (
                <PixelCard className="bg-gray-800 text-center py-8">
                  <span className="text-4xl">👥</span>
                  <p className="font-pixel text-xs text-gray-400 mt-4">
                    NO PLAYERS REGISTERED YET
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
