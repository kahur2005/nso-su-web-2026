// app/(game)/profile/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import GroupEmblem from '@/components/ui/GroupEmblem'
import Avatar from '@/components/ui/Avatar'
import ProfileSettings from './ProfileSettings'
import { levelProgress } from '@/lib/leveling'

// Build a usable href from either a full URL or a bare @handle.
function instagramHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  return `https://instagram.com/${value.replace(/^@/, '')}`
}

async function getProfileData(studentId: string) {
  const { data: student } = await supabase
    .from('Student')
    .select('*, group:Group(*)')
    .eq('studentId', studentId)
    .maybeSingle()

  if (student) {
    const [achievements, scanLogs, questProgress] = await Promise.all([
      supabase
        .from('StudentAchievement')
        .select('*, achievement:Achievement(*)')
        .eq('studentId', student.id),
      supabase
        .from('ScanLog')
        .select('*, npc:NPC(*)')
        .eq('studentId', student.id)
        .order('scannedAt', { ascending: false })
        .limit(10),
      supabase
        .from('QuestProgress')
        .select('*, quest:Quest(*)')
        .eq('studentId', student.id)
        .eq('status', 'completed'),
    ])
    student.achievements = achievements.data ?? []
    student.scanLogs = scanLogs.data ?? []
    student.questProgress = questProgress.data ?? []
  }

  const { data: allStudentsRanked } = await supabase
    .from('Student')
    .select('studentId')
    .order('points', { ascending: false })

  const globalRank =
    (allStudentsRanked ?? []).findIndex((s: any) => s.studentId === studentId) + 1

  const { count: totalNPCs } = await supabase
    .from('NPC')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

  return { student, globalRank, totalNPCs: totalNPCs ?? 0 }
}

/* Achievements come from the Achievement table now, not a hardcoded list
 * matched by name string. Every badge an admin has created is shown; the ones
 * this student has unlocked (by completing a quest that grants them) render
 * their art, the rest render locked. */
async function getAchievements(studentInternalId: string) {
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase
      .from('Achievement')
      .select('id, name, description, imageUrl')
      .order('createdAt', { ascending: true }),
    supabase
      .from('StudentAchievement')
      .select('achievementId, unlockedAt')
      .eq('studentId', studentInternalId),
  ])

  const unlockedAt = new Map((mine ?? []).map((r: any) => [r.achievementId, r.unlockedAt]))

  return (all ?? []).map((a: any) => ({
    ...a,
    unlocked: unlockedAt.has(a.id),
    unlockedAt: unlockedAt.get(a.id) ?? null,
  }))
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { student, globalRank, totalNPCs } =
    await getProfileData((session.user as any).studentId)

  if (!student) redirect('/login')

  const achievements = await getAchievements(student.id)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const { level, into, span } = levelProgress(student.xp)
  const completedQuests = student.questProgress.length

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Profile Header */}
        <PixelCard className="bg-gray-800 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-green-700 border-4 border-black
              flex items-center justify-center text-3xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: '4px 4px 0 #000' }}>
              <Avatar avatarUrl={student.avatarUrl} fallback="🧑‍🎓" />
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
                <p className="font-pixel text-xs mt-1 flex items-center gap-1"
                  style={{ color: student.group.color }}>
                  <GroupEmblem emblem={student.group.emblem} emblemUrl={student.group.emblemUrl} size={16} />
                  {student.group.name}
                </p>
              )}
              {student.instagram && (
                <a href={instagramHref(student.instagram)} target="_blank" rel="noreferrer"
                  className="font-pixel text-xs text-pink-400 mt-1 inline-block hover:underline">
                  📸 {student.instagram}
                </a>
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
              value={into}
              max={span}
              color="#FFD700"
              label={`LEVEL ${level} · ${into}/${span} XP`}
            />
          </div>
        </PixelCard>

        {/* Edit profile */}
        <ProfileSettings
          name={student.name}
          instagram={student.instagram || ''}
          avatarUrl={student.avatarUrl}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '⭐', label: 'TOTAL PTS', value: student.points.toLocaleString(), color: '#FFD700' },
            { icon: '📖', label: 'FUN FACTS', value: `${student.funFactsCollected}/${totalNPCs}`, color: '#9C27B0' },
            { icon: '⚔️', label: 'QUESTS', value: String(completedQuests), color: '#4CAF50' },
            { icon: '🏆', label: 'LEVEL', value: String(level), color: '#2196F3' },
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
          <h3 className="font-pixel text-sm text-yellow-400 pixel-text-shadow mb-3">
            🏅 ACHIEVEMENTS {achievements.length > 0 && `(${unlockedCount}/${achievements.length})`}
          </h3>
          {achievements.length === 0 ? (
            <p className="font-pixel text-[10px] text-gray-400">
              No achievements available yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`
                    pixel-card text-center py-3 px-2 border-2 border-black
                    ${ach.unlocked ? 'bg-yellow-900/50 border-yellow-600' : 'bg-gray-900 opacity-40'}
                  `}
                  title={
                    ach.unlocked
                      ? ach.description
                      : 'Locked — complete the quest that grants this badge'
                  }
                >
                  <div className="mb-1 flex h-8 items-center justify-center">
                    {ach.unlocked ? (
                      ach.imageUrl ? (
                        <img
                          src={ach.imageUrl}
                          alt=""
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <span className="text-2xl">🏅</span>
                      )
                    ) : (
                      <span className="text-2xl">🔒</span>
                    )}
                  </div>
                  <p
                    className="font-pixel text-[8px] leading-tight"
                    style={{ color: ach.unlocked ? '#FFD700' : '#666' }}
                  >
                    {ach.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="font-pixel text-sm text-yellow-400 pixel-text-shadow mb-3">📋 ACTIVITY LOG</h3>
          <div className="space-y-2">
            {student.scanLogs.map((log: any) => (
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