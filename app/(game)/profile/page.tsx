// app/(game)/profile/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'

async function getProfileData(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      group: true,
      achievements: { include: { achievement: true } },
      scanLogs: {
        include: { npc: true },
        orderBy: { scannedAt: 'desc' },
        take: 10
      },
      questProgress: {
        include: { quest: true },
        where: { status: 'completed' }
      }
    }
  })

  const allStudentsRanked = await prisma.student.findMany({
    orderBy: { points: 'desc' },
    select: { studentId: true }
  })

  const globalRank = allStudentsRanked.findIndex(s => s.studentId === studentId) + 1
  const totalNPCs = await prisma.nPC.count({ where: { isActive: true } })

  return { student, globalRank, totalNPCs }
}

const achievements = [
  { icon: '🥇', name: 'First Blood', desc: 'First scan' },
  { icon: '📚', name: 'Lore Master', desc: 'All fun facts' },
  { icon: '🗺️', name: 'Explorer', desc: 'Full campus' },
  { icon: '⚔️', name: 'Quest Hero', desc: 'All quests done' },
  { icon: '👑', name: 'Guild Champ', desc: 'Group #1' },
  { icon: '⭐', name: 'Overachiever', desc: '500+ pts' },
]

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { student, globalRank, totalNPCs } =
    await getProfileData((session.user as any).studentId)

  if (!student) redirect('/login')

  const xpToNext = student.level * 100
  const completedQuests = student.questProgress.length

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Profile Header */}
        <PixelCard className="bg-gray-800 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-green-700 border-4 border-black
              flex items-center justify-center text-3xl flex-shrink-0"
              style={{ boxShadow: '4px 4px 0 #000' }}>
              {student.avatarUrl || '🧑‍🎓'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="font-pixel text-xs text-gray-400">PLAYER</p>
              <h2 className="font-pixel text-lg text-white mt-1">{student.name}</h2>
              <p className="font-pixel text-xs text-gray-400 mt-1">
                {student.studentId}
              </p>
              {student.faculty && (
                <p className="font-pixel text-xs text-blue-400 mt-1">
                  🏛️ {student.faculty}
                </p>
              )}
              {student.group && (
                <p className="font-pixel text-xs mt-1"
                  style={{ color: student.group.color }}>
                  {student.group.emblem} {student.group.name}
                </p>
              )}
            </div>

            {/* Rank */}
            <div className="text-center flex-shrink-0">
              <p className="font-pixel text-xs text-gray-400">RANK</p>
              <p className="font-pixel text-2xl text-yellow-400">
                #{globalRank}
              </p>
            </div>
          </div>

          {/* Level & XP */}
          <div className="mt-4">
            <ProgressBar
              value={student.xp % xpToNext}
              max={xpToNext}
              color="#FFD700"
              label={`LEVEL ${student.level}`}
            />
          </div>
        </PixelCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '⭐', label: 'TOTAL PTS', value: student.points.toLocaleString(), color: '#FFD700' },
            { icon: '📖', label: 'FUN FACTS', value: `${student.funFactsCollected}/${totalNPCs}`, color: '#9C27B0' },
            { icon: '⚔️', label: 'QUESTS', value: String(completedQuests), color: '#4CAF50' },
            { icon: '🏆', label: 'LEVEL', value: String(student.level), color: '#2196F3' },
          ].map((stat) => (
            <PixelCard key={stat.label} className="bg-gray-800 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="font-pixel text-xs text-gray-400">{stat.label}</p>
              <p className="font-pixel text-lg mt-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </PixelCard>
          ))}
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <h3 className="font-pixel text-sm text-white mb-3">🏅 ACHIEVEMENTS</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {achievements.map((ach, i) => {
              const unlocked = student.achievements.some(
                a => a.achievement.name === ach.name
              )
              return (
                <div
                  key={i}
                  className={`
                    pixel-card text-center py-3 px-2 border-2 border-black
                    ${unlocked ? 'bg-yellow-900/50 border-yellow-600' : 'bg-gray-900 opacity-40'}
                  `}
                  title={ach.desc}
                >
                  <div className="text-2xl mb-1">
                    {unlocked ? ach.icon : '🔒'}
                  </div>
                  <p className="font-pixel text-[8px] leading-tight"
                    style={{ color: unlocked ? '#FFD700' : '#666' }}>
                    {ach.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="font-pixel text-sm text-white mb-3">📋 ACTIVITY LOG</h3>
          <div className="space-y-2">
            {student.scanLogs.map((log) => (
              <PixelCard key={log.id} className="bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-pixel text-xs text-white">
                      ✅ Scanned {log.npc.committeeName}
                    </p>
                    <p className="font-pixel text-xs text-gray-400 mt-1">
                      📖 Fun Fact Collected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-pixel text-xs text-yellow-400">
                      +{log.pointsAwarded} pts
                    </p>
                    <p className="font-pixel text-xs text-gray-500">
                      {new Date(log.scannedAt).toLocaleString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </PixelCard>
            ))}

            {student.scanLogs.length === 0 && (
              <PixelCard className="bg-gray-800">
                <p className="font-pixel text-xs text-gray-500 text-center py-4">
                  NO ACTIVITY YET — START SCANNING!
                </p>
              </PixelCard>
            )}
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}