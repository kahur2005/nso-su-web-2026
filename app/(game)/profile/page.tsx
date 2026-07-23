// app/(game)/profile/page.tsx
// Figma Me-page redesign: forest background, wood-plank player banner,
// 2×2 parchment stat cards (total points, fun facts, quests completed, house),
// wood-plank achievements section with rows, wood-plank activity log rows.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelAvatar from '@/components/ui/PixelAvatar'
import ProfileSettings from './ProfileSettings'
import { levelProgress } from '@/lib/leveling'

// Build a usable href from either a full URL or a bare @handle.
function instagramHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  return `https://instagram.com/${value.replace(/^@/, '')}`
}

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

async function getProfileData(studentId: string) {
  const { data: student } = await supabase
    .from('Student')
    .select('*, group:Group(*)')
    .eq('studentId', studentId)
    .maybeSingle()

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

  const { count: totalNPCs } = await supabase
    .from('NPC')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

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

/* ── Shared text shadow values (match leaderboard / committee) ─────────── */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
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
    await getProfileData((session.user as any).studentId)

  if (!student) redirect('/login')

  const achievements = await getAchievements(student.id)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const { level, into, span } = levelProgress(student.xp)
  const completedQuests = student.questProgress?.length ?? 0
  const xpPct = Math.max(0, Math.min(100, (into / (span || 1)) * 100))

  const groupName = student.group?.name ?? null
  const groupColor = student.group?.color ?? '#e0b391'
  const mascotImg = mascotSrc(groupName ?? '')

  return (
    <PageWrapper>
      {/* ── Forest background ── */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="mx-auto max-w-md px-3 pt-3 pb-28 flex flex-col gap-3 lg:max-w-lg">

        {/* ── Player header banner (wood plank) ── */}
        <div className="wood-plank px-4 py-3 flex items-center gap-4">
          <div className="shrink-0 border-2 border-[#3e2723]">
            <PixelAvatar
              skin={student.avatarSkin ?? 'skin1'}
              hair={student.avatarHair ?? undefined}
              eyes={student.avatarEyes ?? undefined}
              brow={student.avatarBrows ?? undefined}
              size={64}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-bytebounce text-[14px] leading-none text-[#e0b391]"
              style={{ textShadow: '1px 1px 0 #3e2723' }}
            >
              WELCOME BACK, PLAYER
            </p>
            <h1
              className="font-bytebounce text-[clamp(1.8rem,10vw,2.6rem)] leading-tight truncate"
              style={OUTLINE_GOLD}
            >
              {student.name.split(' ')[0].toUpperCase()} !
            </h1>
            <p
              className="font-bytebounce text-[15px] leading-none text-[#fff3d9]"
              style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
            >
              LEVEL {level} — {levelTitle(level)}
            </p>
            {/* XP bar */}
            <div className="mt-1.5 relative h-[10px] w-full rounded-sm overflow-hidden border border-[#3e2723]">
              <div className="absolute inset-0 bg-[#5d3a1a]" />
              <div
                className="absolute inset-y-0 left-0 bg-[#ffd23f]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p
              className="font-bytebounce text-[11px] leading-none text-[#e0b391] mt-0.5"
              style={{ textShadow: '1px 1px 0 #3e2723' }}
            >
              {into}/{span} XP
            </p>
          </div>
        </div>

        {/* ── 2×2 stat cards (parchment) ── */}
        <div className="grid grid-cols-2 gap-2">

          {/* Total Points */}
          <div className="rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-3 py-3 flex flex-col items-center">
            <p
              className="font-bytebounce text-[13px] leading-none text-[#7d5a3d] text-center"
              style={{ textShadow: '1px 1px 0 #c8a97b' }}
            >
              TOTAL POINTS
            </p>
            <p
              className="font-bytebounce text-[clamp(2.5rem,14vw,3.5rem)] leading-none text-[#3e2723] mt-1"
            >
              {student.points}
            </p>
          </div>

          {/* Fun Facts */}
          <div className="rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-3 py-3 flex flex-col items-center">
            <p
              className="font-bytebounce text-[13px] leading-none text-[#7d5a3d] text-center"
              style={{ textShadow: '1px 1px 0 #c8a97b' }}
            >
              FUNFACTS COLLECTED
            </p>
            <p
              className="font-bytebounce text-[clamp(2rem,11vw,2.8rem)] leading-none text-[#3e2723] mt-1"
            >
              {student.funFactsCollected}
            </p>
            <p
              className="font-bytebounce text-[clamp(1.2rem,6vw,1.6rem)] leading-none text-[#88684e]"
            >
              /{totalNPCs}
            </p>
          </div>

          {/* Quests Completed */}
          <div className="rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-3 py-3 flex flex-col items-center">
            <p
              className="font-bytebounce text-[13px] leading-none text-[#7d5a3d] text-center"
              style={{ textShadow: '1px 1px 0 #c8a97b' }}
            >
              QUESTS COMPLETED
            </p>
            <p
              className="font-bytebounce text-[clamp(2.5rem,14vw,3.5rem)] leading-none text-[#3e2723] mt-1"
            >
              {completedQuests}
            </p>
          </div>

          {/* House (group) */}
          <div className="rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-3 py-3 flex flex-col items-center justify-center gap-1">
            <p
              className="font-bytebounce text-[13px] leading-none text-[#7d5a3d] text-center"
              style={{ textShadow: '1px 1px 0 #c8a97b' }}
            >
              HOUSE
            </p>
            {mascotImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mascotImg}
                alt={groupName ?? ''}
                className="w-16 h-16 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <span className="text-4xl">🛡️</span>
            )}
            <p
              className="font-bytebounce text-[17px] leading-tight text-center"
              style={{ color: groupColor, textShadow: '1px 1px 0 #3e2723' }}
            >
              {groupName ?? 'Unassigned'}
            </p>
          </div>
        </div>

        {/* ── Instagram link (if set) ── */}
        {student.instagram && (
          <a
            href={instagramHref(student.instagram)}
            target="_blank"
            rel="noreferrer"
            className="wood-plank px-4 py-2.5 flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="text-xl">📸</span>
            <span
              className="font-bytebounce text-[17px] leading-none text-[#fff3d9] flex-1 truncate"
              style={{ textShadow: '1px 1px 0 #3e2723' }}
            >
              {student.instagram}
            </span>
            <span
              className="font-bytebounce text-[18px] text-[#ffd23f]"
              style={{ textShadow: '1px 1px 0 #3e2723' }}
            >
              ▶
            </span>
          </a>
        )}

        {/* ── Achievements section ── */}
        <div className="flex flex-col gap-2">
          {/* Section header */}
          <div className="wood-plank px-4 py-2.5 flex items-center gap-3">
            <span className="text-[22px]">🏅</span>
            <h2
              className="font-bytebounce text-[26px] leading-none text-[#ffd23f]"
              style={{ textShadow: '2.5px 2.5px 0 #3e2723' }}
            >
              Achievements
            </h2>
            <span
              className="ml-auto font-bytebounce text-[16px] text-[#e0b391]"
              style={{ textShadow: '1px 1px 0 #3e2723' }}
            >
              {unlockedCount}/{achievements.length}
            </span>
          </div>

          {achievements.length === 0 ? (
            <div className="wood-plank px-4 py-4 text-center">
              <p
                className="font-bytebounce text-[16px] text-[#e0b391]"
                style={{ textShadow: '1px 1px 0 #3e2723' }}
              >
                No achievements yet
              </p>
            </div>
          ) : (
            achievements.map((ach) => (
              <div
                key={ach.id}
                className="wood-plank px-4 py-3 flex items-center gap-3"
                style={{ opacity: ach.unlocked ? 1 : 0.5 }}
              >
                {/* Badge icon */}
                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded border-2 border-[#3e2723] bg-[#5d3a1a]">
                  {ach.unlocked ? (
                    ach.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ach.imageUrl} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xl">🏅</span>
                    )
                  ) : (
                    <span className="text-xl">🔒</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bytebounce text-[18px] leading-tight text-[#fff3d9] truncate"
                    style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
                  >
                    {ach.name}
                  </p>
                  <p
                    className="font-bytebounce text-[13px] leading-tight text-[#e0b391] truncate"
                    style={{ textShadow: '1px 1px 0 #3e2723' }}
                  >
                    {ach.description}
                  </p>
                </div>
                {ach.unlocked && (
                  <span
                    className="font-bytebounce text-[18px] text-[#ffd23f] shrink-0"
                    style={{ textShadow: '1px 1px 0 #3e2723' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Activity log ── */}
        {student.scanLogs?.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="wood-plank px-4 py-2.5 flex items-center gap-3">
              <span className="text-[22px]">📋</span>
              <h2
                className="font-bytebounce text-[26px] leading-none text-[#ffd23f]"
                style={{ textShadow: '2.5px 2.5px 0 #3e2723' }}
              >
                Activity Log
              </h2>
            </div>
            {student.scanLogs.map((log: any) => (
              <div
                key={log.id}
                className="wood-plank px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bytebounce text-[17px] leading-tight text-[#fff3d9] truncate"
                    style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
                  >
                    ✅ {log.npc?.committeeName ?? 'Committee'}
                  </p>
                  <p
                    className="font-bytebounce text-[13px] leading-tight text-[#e0b391]"
                    style={{ textShadow: '1px 1px 0 #3e2723' }}
                  >
                    Fun Fact collected ·{' '}
                    {new Date(log.scannedAt).toLocaleDateString('en', {
                      month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className="font-bytebounce text-[17px] text-[#ffd23f] shrink-0"
                  style={{ textShadow: '1px 1px 0 #3e2723' }}
                >
                  +{log.pointsAwarded}pts
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Edit profile (collapsed by default) ── */}
        <ProfileSettings
          name={student.name}
          instagram={student.instagram || ''}
          avatarSkin={student.avatarSkin}
          avatarHair={student.avatarHair}
          avatarEyes={student.avatarEyes}
          avatarBrows={student.avatarBrows}
        />

      </div>
    </PageWrapper>
  )
}