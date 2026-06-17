// app/(game)/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import Timeline from '@/components/dashboard/Timeline'
import Link from 'next/link'

async function getDashboardData(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: { group: true }
  })

  const topGroups = await prisma.group.findMany({
    orderBy: { totalPoints: 'desc' },
    take: 4
  })

  const activeQuests = await prisma.quest.findMany({
    where: { isActive: true, isHidden: false },
    take: 3
  })

  const announcements = await prisma.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 3
  })

  const totalNPCs = await prisma.nPC.count({ where: { isActive: true } })

  return { student, topGroups, activeQuests, announcements, totalNPCs }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { student, topGroups, activeQuests, announcements, totalNPCs } =
    await getDashboardData((session.user as any).studentId)

  if (!student) redirect('/login')

  const groupRank = topGroups.findIndex(g => g.id === student.groupId) + 1

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Welcome Banner */}
        <div className="rpg-dialog bg-gray-800 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-600 border-4 border-black
              flex items-center justify-center text-2xl flex-shrink-0"
              style={{ boxShadow: '4px 4px 0 #000' }}>
              {student.avatarUrl || '👤'}
            </div>
            <div className="flex-1">
              <p className="font-pixel text-xs text-gray-400">WELCOME BACK, PLAYER</p>
              <h2 className="font-pixel text-lg text-white mt-1">
                {student.name.split(' ')[0].toUpperCase()}!
              </h2>
              <div className="flex gap-4 mt-2 flex-wrap">
                <span className="font-pixel text-xs"
                  style={{ color: student.group?.color || '#4CAF50' }}>
                  {student.group?.emblem} {student.group?.name || 'UNASSIGNED'}
                </span>
                <span className="font-pixel text-xs text-yellow-400">
                  ⭐ {student.points} PTS
                </span>
                {groupRank > 0 && (
                  <span className="font-pixel text-xs text-blue-400">
                    RANK #{groupRank}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <ProgressBar
              value={student.xp}
              max={student.level * 100}
              color="#FFD700"
              label={`LVL ${student.level}`}
            />
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-6">
            <h3 className="font-pixel text-sm text-white mb-3">
              📢 ANNOUNCEMENTS
            </h3>
            <div className="space-y-2">
              {announcements.map((ann) => (
                <div key={ann.id}
                  className="rpg-dialog bg-blue-900/50 border-blue-500 p-3">
                  <p className="font-pixel text-xs text-blue-300">
                    🔔 {ann.title}
                  </p>
                  <p className="font-pixel text-xs text-gray-300 mt-1">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { href: '/scan', icon: '📱', label: 'SCAN QR', color: '#4CAF50', bg: 'bg-green-900/50' },
            { href: '/quests', icon: '⚔️', label: 'QUESTS', color: '#FFD700', bg: 'bg-yellow-900/50' },
            { href: '/codex', icon: '📖', label: 'CODEX', color: '#9C27B0', bg: 'bg-purple-900/50' },
            { href: '/map', icon: '🗺️', label: 'MAP', color: '#2196F3', bg: 'bg-blue-900/50' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <PixelCard
                className={`${action.bg} hover:scale-105 transition-transform cursor-pointer`}
                glowColor={action.color}
              >
                <div className="text-center py-2">
                  <div className="text-3xl mb-2 float inline-block">
                    {action.icon}
                  </div>
                  <p className="font-pixel text-xs" style={{ color: action.color }}>
                    {action.label}
                  </p>
                </div>
              </PixelCard>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Quests */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-pixel text-sm text-white">⚔️ ACTIVE QUESTS</h3>
              <Link href="/quests"
                className="font-pixel text-xs text-green-400 hover:text-green-300">
                VIEW ALL →
              </Link>
            </div>
            <div className="space-y-3">
              {activeQuests.map((quest) => (
                <PixelCard key={quest.id} className="bg-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-pixel text-xs text-white">
                        {quest.type === 'daily' ? '📋' : '⭐'} {quest.title}
                      </p>
                      <p className="font-pixel text-xs text-gray-400 mt-1">
                        {quest.description.substring(0, 40)}...
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <span className="font-pixel text-xs text-yellow-400">
                        +{quest.points}
                      </span>
                      <br />
                      <span className="font-pixel text-xs text-gray-500">
                        PTS
                      </span>
                    </div>
                  </div>
                </PixelCard>
              ))}
              {activeQuests.length === 0 && (
                <PixelCard className="bg-gray-800">
                  <p className="font-pixel text-xs text-gray-400 text-center py-4">
                    NO ACTIVE QUESTS
                  </p>
                </PixelCard>
              )}
            </div>
          </div>

          {/* Leaderboard Widget */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-pixel text-sm text-white">🏆 LEADERBOARD</h3>
              <Link href="/leaderboard"
                className="font-pixel text-xs text-green-400 hover:text-green-300">
                VIEW ALL →
              </Link>
            </div>
            <div className="space-y-2">
              {topGroups.map((group, index) => (
                <PixelCard
                  key={group.id}
                  className={`${group.id === student.groupId
                    ? 'bg-yellow-900/30 border-yellow-600'
                    : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-sm w-8"
                      style={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#fff' }}>
                      #{index + 1}
                    </span>
                    <span className="text-xl">{group.emblem}</span>
                    <div className="flex-1">
                      <p className="font-pixel text-xs text-white">{group.name}</p>
                      <ProgressBar
                        value={group.totalPoints}
                        max={topGroups[0]?.totalPoints || 1}
                        color={group.color}
                        showText={false}
                      />
                    </div>
                    <span className="font-pixel text-xs text-yellow-400">
                      {group.totalPoints}
                    </span>
                  </div>
                </PixelCard>
              ))}
            </div>
          </div>
        </div>

        {/* Codex Progress */}
        <div className="mt-6">
          <PixelCard className="bg-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-pixel text-sm text-white">📖 CODEX PROGRESS</h3>
              <Link href="/codex"
                className="font-pixel text-xs text-green-400">
                OPEN →
              </Link>
            </div>
            <ProgressBar
              value={student.funFactsCollected}
              max={totalNPCs}
              color="#9C27B0"
              label="FUN FACTS COLLECTED"
            />
          </PixelCard>
        </div>

        {/* Event Timeline */}
        <Timeline />

      </div>
    </PageWrapper>
  )
}