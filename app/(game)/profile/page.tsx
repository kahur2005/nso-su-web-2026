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
import ActivityLog, { type ActivityRow } from '@/components/profile/ActivityLog'
import { CHAPTER_TITLES } from '@/lib/guidebook/quiz'

const MASCOTS = new Set([
  'chimera','faerie','fenrir','griffin','harpy','kitsune','kraken',
  'minotaur','nymph','pegasus','phoenix','siren','sphinx','unicorn','wyvern',
])

function groupKey(name: string | null | undefined): string | null {
  if (!name) return null
  let key = name.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (key === 'nympth') key = 'nymph'
  return MASCOTS.has(key) ? key : null
}

function mascotSrc(name: string | undefined): string | null {
  const key = groupKey(name)
  return key ? `/images/group/${key}.png` : null
}

const BG_FILENAME: Record<string, string> = { nymph: 'nympth' }

function avatarBgSrc(name: string | null | undefined): string {
  const key = groupKey(name)
  if (!key) return '/images/profile/avatar-bg.png'
  return `/images/profile/${BG_FILENAME[key] ?? key}-bg.png`
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
    const [scanLogs, questProgress, quizClaims] = await Promise.all([
      supabase
        .from('ScanLog')
        .select('*, npc:NPC(*)')
        .eq('studentId', student.id)
        .order('scannedAt', { ascending: false })
        .limit(30),
      supabase
        .from('QuestProgress')
        .select('*, quest:Quest(*)')
        .eq('studentId', student.id)
        .eq('status', 'completed'),
      supabase
        .from('GuidebookQuizAttempt')
        .select('id, chapterId, pointsAwarded, claimedAt')
        .eq('studentId', student.id)
        .not('claimedAt', 'is', null),
    ])
    student.scanLogs = scanLogs.data ?? []
    student.questProgress = questProgress.data ?? []
    student.quizClaims = quizClaims.data ?? []
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
  const avatarBg = avatarBgSrc(groupName)

  const av = parseAvatarConfig(student.avatarConfig)

  // Merge scan logs and quiz claims into a single reverse-chronological feed.
  const activityRows: ActivityRow[] = [
    ...(student.scanLogs ?? []).map((log: any) => ({
      id: log.id,
      title: log.npc?.committeeName ?? 'Committee',
      points: log.pointsAwarded ?? 0,
      scannedAt: log.scannedAt,
      kind: 'scan' as const,
    })),
    ...(student.quizClaims ?? []).map((claim: any) => ({
      id: claim.id,
      title: CHAPTER_TITLES[claim.chapterId] ?? 'Guidebook chapter',
      points: claim.pointsAwarded ?? 0,
      scannedAt: claim.claimedAt,
      kind: 'guidebook' as const,
    })),
  ].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())

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
          avatarBg={avatarBg}
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
            icon="/images/profile/medal-achevement-logo.svg"
            title="Achievements"
            right={
              <span
                className="font-bytebounce text-fluid-base leading-none text-[#e0b391]"
                style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
              >
                {unlockedCount}/{achievements.length}
              </span>
            }
          />
          <AchievementStrip achievements={achievements} />
        </section>

        {/* ── Activity log ── */}
        <ActivityLog rows={activityRows} />

      </div>
    </PageWrapper>
  )
}