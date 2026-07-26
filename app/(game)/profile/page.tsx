// app/(game)/profile/page.tsx
// Figma Me-page redesign: forest background, wood-plank player banner,
// 2×2 parchment stat cards (total points, fun facts, quests completed, house),
// wood-plank achievements section with rows, wood-plank activity log rows.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/layout/PageWrapper'
import PageIntro from '@/components/onboarding/PageIntro'
import { parseAvatarConfig } from '@/lib/avatar'
import { levelProgress } from '@/lib/leveling'
import PlayerBanner from '@/components/profile/PlayerBanner'
import StatCard from '@/components/profile/StatCard'
import HouseBanner from '@/components/profile/HouseBanner'
import SectionHeading from '@/components/profile/SectionHeading'
import AchievementStrip from '@/components/profile/AchievementStrip'

const MASCOTS = new Set([
  'chimera','faerie','fenrir','griffin','harpy','kitsune','kraken',
  'minotaur','nymph','pegasus','phoenix','siren','sphinx','unicorn','wyvern',
])
function mascotSrc(name: string | undefined): string | null {
  if (!name) return null
  let key = name.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (key === 'nympth') key = 'nymph'
  return MASCOTS.has(key) ? `/images/group/${key}.png` : null
}

async function getProfileData(studentId: string, studentDbId?: string) {
  const [{ data: student }, { count: totalNPCs }] = await Promise.all([
    supabase
      .from('Student')
      .select('*, group:Group(*)')
      .or(studentDbId ? `id.eq."${studentDbId}",studentId.eq."${studentId}"` : `studentId.eq."${studentId}"`)
      .maybeSingle(),
    supabase
      .from('NPC')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true),
  ])

  if (student) {
    const [scanLogs, questProgress] = await Promise.all([
      supabase
        .from('ScanLog')
        .select('*, npc:NPC(*)')
        .eq('studentId', student.id)
        .order('scannedAt', { ascending: false })
        .limit(8),
      supabase
        .from('QuestProgress')
        .select('*, quest:Quest(*)')
        .eq('studentId', student.id)
        .eq('status', 'completed'),
    ])
    student.scanLogs = scanLogs.data ?? []
    student.questProgress = questProgress.data ?? []
  }

  return { student, totalNPCs: totalNPCs ?? 0 }
}

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

/* ── Level display names ────────────────────────────────────────────────── */
const LEVEL_TITLES = [
  '', 'Freshman', 'Explorer', 'Veteran', 'Champion', 'Legend'
]
function levelTitle(level: number) {
  return LEVEL_TITLES[level] ?? `LVL ${level}`
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { student, totalNPCs } =
    await getProfileData(session.user.studentId, session.user.id)

  if (!student) redirect('/login')

  const achievements = await getAchievements(student.id)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const { level, into, span } = levelProgress(student.xp)
  const completedQuests = student.questProgress?.length ?? 0

  const groupName = student.group?.name ?? null
  const mascotImg = mascotSrc(groupName ?? '')

  const av = parseAvatarConfig(student.avatarConfig)

  return (
    <PageWrapper>
      {/* ── Fixed forest background ── */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <PageIntro page="profile" />

      <div className="game-column pt-3 sm:pt-5 pb-28 sm:pb-32 md:pb-12 flex flex-col gap-3.5 sm:gap-4 md:gap-5">

        <PlayerBanner
          name={student.name}
          level={level}
          title={levelTitle(level)}
          into={into}
          span={span}
          avatar={av}
        />

        {/* ── Stats: three stacked cards beside the house pennant ── */}
        <div className="flex items-start gap-2.5" data-tour="profile-stats">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <StatCard
              label="Total Points"
              value={String(student.points)}
              valueClassName={student.points < 0 ? 'text-[#d6101d]' : ''}
            />
            <StatCard label="Quests Completed" value={String(completedQuests)} />
            <StatCard
              label="Funfacts Collected"
              value={String(student.funFactsCollected)}
              sub={String(totalNPCs)}
            />
          </div>

          <HouseBanner
            groupName={groupName}
            groupColor={student.group?.color ?? null}
            mascotSrc={mascotImg}
          />
        </div>

        {/* ── Achievements ── */}
        <section data-tour="profile-achievements">
          <SectionHeading
            icon="/images/profile/medal.png"
            title="Achievements"
            right={
              <span
                className="font-bytebounce text-[17px] leading-none text-[#e0b391]"
                style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
              >
                {unlockedCount}/{achievements.length}
              </span>
            }
          />
          <AchievementStrip achievements={achievements} />
        </section>

        {/* ── Activity log ── */}
        <div className="flex flex-col gap-2" data-tour="profile-activity">
          <div className="wood-plank px-4 py-2.5 flex items-center gap-3">
            <span className="text-[22px]">📋</span>
            <h2
              className="font-bytebounce text-[26px] leading-none text-[#ffd23f]"
              style={{ textShadow: '2.5px 2.5px 0 #3e2723' }}
            >
              Activity Log
            </h2>
          </div>
          {student.scanLogs?.length > 0 ? (
            student.scanLogs.map((log: any) => (
              <div
                key={log.id}
                className="rounded border-2 border-[#3a2418] bg-[#fdf6e3] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bytebounce text-[18px] leading-tight text-[#3e2723] truncate font-bold">
                    ✅ {log.npc?.committeeName ?? 'Committee'}
                  </p>
                  <p className="font-bytebounce text-[14px] leading-tight text-[#8a5a37] mt-0.5">
                    Fun Fact collected ·{' '}
                    {new Date(log.scannedAt).toLocaleDateString('en', {
                      month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="font-bytebounce text-[18px] text-[#b8860b] font-bold shrink-0">
                  +{log.pointsAwarded}pts
                </span>
              </div>
            ))
          ) : (
            <div className="rounded border-2 border-[#3a2418] bg-[#fdf6e3] p-3.5 text-center">
              <p className="font-bytebounce text-[16px] text-[#8a5a37]">
                No scans yet — go scan a committee member!
              </p>
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  )
}