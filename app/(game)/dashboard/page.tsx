// app/(game)/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import GroupEmblem from '@/components/ui/GroupEmblem'
import Avatar from '@/components/ui/Avatar'
import Timeline from '@/components/dashboard/Timeline'
import { levelProgress } from '@/lib/leveling'
import Link from 'next/link'

async function getDashboardData(studentId: string) {
  const { data: student } = await supabase
    .from('Student')
    .select('*, group:Group(*)')
    .eq('studentId', studentId)
    .maybeSingle()

  const { data: topGroups } = await supabase
    .from('Group')
    .select('*')
    .order('totalPoints', { ascending: false })
    .limit(4)

  const { data: activeQuests } = await supabase
    .from('Quest')
    .select('*')
    .eq('isActive', true)
    .eq('isHidden', false)
    .limit(3)

  const { data: announcements } = await supabase
    .from('Announcement')
    .select('*')
    .eq('isActive', true)
    .order('createdAt', { ascending: false })
    .limit(3)

  const { count: totalNPCs } = await supabase
    .from('NPC')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

  return {
    student,
    topGroups: topGroups ?? [],
    activeQuests: activeQuests ?? [],
    announcements: announcements ?? [],
    totalNPCs: totalNPCs ?? 0,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { student, topGroups, activeQuests, announcements, totalNPCs } =
    await getDashboardData((session.user as any).studentId)

  if (!student) redirect('/login')

  const groupRank = topGroups.findIndex(g => g.id === student.groupId) + 1
  const { level, into, span } = levelProgress(student.xp)

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Welcome Banner */}
        <div className="rpg-dialog bg-gray-800 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-600 border-4 border-black
              flex items-center justify-center text-2xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: '4px 4px 0 #000' }}>
              <Avatar avatarUrl={student.avatarUrl} fallback="👤" />
            </div>
            <div className="flex-1">
              <p className="font-pixel text-xs text-gray-400">WELCOME BACK, PLAYER</p>
              <h2 className="font-pixel text-lg text-white mt-1">
                {student.name.split(' ')[0].toUpperCase()}!
              </h2>
              <div className="flex gap-4 mt-2 flex-wrap">
                <span className="font-pixel text-xs flex items-center gap-1"
                  style={{ color: student.group?.color || '#4CAF50' }}>
                  <GroupEmblem emblem={student.group?.emblem} emblemUrl={student.group?.emblemUrl} size={16} />
                  {student.group?.name || 'UNASSIGNED'}
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
              value={into}
              max={span}
              color="#FFD700"
              label={`LVL ${level} · ${into}/${span} XP`}
            />
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-6">
            <h3 className="font-pixel text-sm text-yellow-400 pixel-text-shadow mb-3">
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
              <h3 className="font-pixel text-sm text-yellow-400 pixel-text-shadow">⚔️ ACTIVE QUESTS</h3>
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
              <h3 className="font-pixel text-sm text-yellow-400 pixel-text-shadow">🏆 LEADERBOARD</h3>
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
                    {index < 3 ? (
                      <img
                        src={`/images/thropy_leaderboard_${index + 1}.png`}
                        alt={`Rank ${index + 1}`}
                        className="w-8 h-8 object-contain flex-shrink-0"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="font-pixel text-sm w-8 text-center text-white">
                        #{index + 1}
                      </span>
                    )}
                    <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={24} />
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
              <h3 className="font-pixel text-sm text-yellow-400 pixel-text-shadow">📖 CODEX PROGRESS</h3>
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