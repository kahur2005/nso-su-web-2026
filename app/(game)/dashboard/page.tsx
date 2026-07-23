// app/(game)/dashboard/page.tsx
// Figma: full-screen pixel-art village dashboard with wood-plank name banner,
// 2×2 quick-tile grid, points + fun-facts counter, and active quest rows.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelAvatar from '@/components/ui/PixelAvatar'
import DashboardIntro from '@/components/dashboard/DashboardIntro'
import { levelProgress } from '@/lib/leveling'
import Link from 'next/link'

async function getDashboardData(studentId: string) {
  const { data: student } = await supabase
    .from('Student')
    .select('*, group:Group(*)')
    .eq('studentId', studentId)
    .maybeSingle()

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
    .limit(1)

  const { count: totalNPCs } = await supabase
    .from('NPC')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

  return {
    student,
    activeQuests: activeQuests ?? [],
    announcements: announcements ?? [],
    totalNPCs: totalNPCs ?? 0,
  }
}

/* ── Quick-action tiles (Figma 2×2 grid) ──────────────────────────────── */
const quickTiles = [
  { href: '/map/guidebook', img: '/images/map/tile-guidebook.png', label: 'Guidebook' },
  { href: '/map/timeline',  img: '/images/map/tile-timeline.png',  label: 'Timeline'  },
  { href: '/map',           img: '/images/map/tile-map.png',       label: 'Map'       },
  { href: '/map/clubs',     img: '/images/map/tile-clubs.png',     label: 'Food'      },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { student, activeQuests, announcements, totalNPCs } =
    await getDashboardData((session.user as any).studentId)

  if (!student) redirect('/login')

  const { level } = levelProgress(student.xp)
  const latestAnn = announcements[0]

  return (
    <PageWrapper>
      <DashboardIntro show={!student.hasSeenIntro} />

      {/* ── Full-screen village background (overrides PageWrapper sky-bg) ── */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      {/* ── Announcement ticker ── */}
      {latestAnn && (
        <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#f6e8a8]/90 backdrop-blur-sm border-b-2 border-[#c8a84b] px-4 py-1.5">
          <span className="text-base">🪙</span>
          <p className="font-bytebounce text-[15px] text-[#4e342e] leading-tight truncate">
            {latestAnn.title}
          </p>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="mx-auto max-w-md px-3 pt-3 pb-28 flex flex-col gap-3 lg:max-w-lg">

        {/* ── Player name banner (wood plank) ── */}
        <Link
          href="/profile"
          className="block w-full relative transition-transform active:translate-y-0.5"
          aria-label="View your profile"
        >
          <div className="wood-plank px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PixelAvatar
                skin={student.avatarSkin ?? 'skin1'}
                hair={student.avatarHair ?? undefined}
                eyes={student.avatarEyes ?? undefined}
                brow={student.avatarBrows ?? undefined}
                size={44}
                className="border-2 border-[#3e2723] shrink-0"
              />
              <div>
                <p className="font-bytebounce text-[22px] leading-tight text-[#fff3d9]"
                  style={{ textShadow: '2px 2px 0 #3e2723' }}>
                  {student.name.split(' ')[0]}
                </p>
                <p className="font-bytebounce text-[13px] leading-none text-[#e0b391]"
                  style={{ textShadow: '1px 1px 0 #3e2723' }}>
                  {student.group?.name ?? 'UNASSIGNED'} · LVL {level}
                </p>
              </div>
            </div>
            {/* Arrow sprite */}
            <span className="font-bytebounce text-[24px] text-[#ffd23f]"
              style={{ textShadow: '2px 2px 0 #3e2723' }}>
              ▶
            </span>
          </div>
        </Link>

        {/* ── 2×2 tiles + Points counter ── */}
        <div className="flex gap-2">
          {/* Left: 2×2 grid */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {quickTiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                aria-label={tile.label}
                className="block transition-transform duration-100 hover:scale-[1.04] hover:brightness-110 active:scale-[0.97]"
              >
                <img src={tile.img} alt={tile.label} className="w-full rounded" />
              </Link>
            ))}
          </div>

          {/* Right: Points + Fun Facts */}
          <div className="wood-plank flex flex-col items-center justify-center gap-1 px-3 py-3 w-[110px] shrink-0">
            <p className="font-bytebounce text-[13px] leading-snug text-center text-[#fff3d9]"
              style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}>
              You have<br />collected :
            </p>
            <p className="font-bytebounce text-[46px] leading-none text-[#3e2723]">
              {student.points}
            </p>
            <p className="font-bytebounce text-[16px] leading-none text-[#3e2723]">
              Points
            </p>
            <div className="w-full h-[2px] bg-[#7d5a3d] my-1 rounded" />
            <p className="font-bytebounce text-[20px] leading-none text-[#3e2723]">
              {student.funFactsCollected}/{totalNPCs}
            </p>
            <p className="font-bytebounce text-[13px] leading-snug text-center text-[#3e2723]">
              Fun Facts
            </p>
          </div>
        </div>

        {/* ── Active Quests section ── */}
        <div className="flex flex-col gap-2">
          {/* Section header — wood banner with icon */}
          <div className="wood-plank px-4 py-2.5 flex items-center gap-3">
            <span
              className="font-bytebounce text-[22px] leading-none"
              style={{ textShadow: '2px 2px 0 #3e2723' }}
            >
              📜
            </span>
            <h2
              className="font-bytebounce text-[26px] leading-none text-[#ffd23f]"
              style={{ textShadow: '2.5px 2.5px 0 #3e2723' }}
            >
              Active Quests
            </h2>
          </div>

          {/* Quest rows */}
          {activeQuests.length === 0 ? (
            <div className="wood-plank px-4 py-4 text-center">
              <p className="font-bytebounce text-[16px] text-[#e0b391]"
                style={{ textShadow: '1px 1px 0 #3e2723' }}>
                No active quests right now
              </p>
            </div>
          ) : (
            activeQuests.map((quest) => (
              <Link
                key={quest.id}
                href="/quests"
                className="block transition-transform active:translate-y-0.5"
              >
                <div className="wood-plank px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bytebounce text-[18px] leading-tight text-[#fff3d9] truncate"
                      style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
                    >
                      {quest.title}
                    </p>
                    <p
                      className="font-bytebounce text-[13px] leading-tight text-[#e0b391] truncate"
                      style={{ textShadow: '1px 1px 0 #3e2723' }}
                    >
                      {quest.description?.substring(0, 45)}
                    </p>
                  </div>
                  <span
                    className="font-bytebounce text-[20px] text-[#ffd23f] shrink-0"
                    style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
                  >
                    ▶
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </PageWrapper>
  )
}