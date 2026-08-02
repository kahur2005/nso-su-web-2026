// app/(game)/leaderboard/page.tsx
// Leaderboard restyled to the Figma parchment design (node 258:520): a wooden
// "Current Leader" billboard up top, then a parchment scroll of ranked rows —
// trophies for the top 3, big numerals after, mascot icon, name, progress bar
// and points. Tapping a group row folds out its member roster with each
// member's point contribution; tapping a member's avatar opens the Instagram
// profile they gave at registration.
//
// Sprites live in `public/images/leaderboard/` (billboard, red banner, star —
// all white-knocked-out Figma exports). The progress-bar and row-frame sprites
// are no longer used: both are drawn in CSS now (see PixelBar and the
// `.pixel-frame` classes in globals.css);
// group mascots are the existing `public/images/group/*.png`; the parchment
// reuses the committee scroll sprites.
'use client'
import { useState, useEffect, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageWrapper from '@/components/layout/PageWrapper'
import PageIntro from '@/components/onboarding/PageIntro'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import GroupEmblem from '@/components/ui/GroupEmblem'
import PixelAvatar from '@/components/ui/PixelAvatar'
import { parseAvatarConfig, hairKey } from '@/lib/avatar'
import { groupLevel } from '@/lib/leveling'

type Tab = 'groups' | 'individual' | 'record'

interface Member {
  id: string
  name: string
  points: number
  funFactsCollected: number
  instagram?: string | null
  avatarConfig?: unknown
}

interface Group {
  id: string
  name: string
  emblem: string
  emblemUrl?: string | null
  color: string
  totalPoints: number
  members: Member[]
  _count: { members: number }
}

interface Student {
  id: string
  name: string
  studentId: string
  points: number
  funFactsCollected: number
  avatarConfig?: unknown
  group: { name: string; emblem: string; emblemUrl?: string | null; color: string } | null
}

const trophies = ['/images/trophy_1.png', '/images/trophy_2.png', '/images/trophy_3.png']

/* PLAYERS lists the top 10 and RECORD the 10 most recent points events. Both
 * API routes already cap at 10, but the cap is the UI's requirement, so it is
 * enforced here too — raising a limit server-side must not silently change what
 * these tabs show. GROUPS is deliberately uncapped: every group is listed. */
const TOP_PLAYERS = 10
const RECENT_RECORDS = 10

/* Design palette per rank (Figma 258:520): gold / silver / bronze for the
 * podium rows, parchment brown for everyone else. */
// `edge` is the podium trim drawn around the top three rows in both tabs (see
// `.pixel-frame--medal`); null for every rank past third, which gets no trim.
const RANK_STYLE = [
  { color: '#ffeb3b', shadow: '0px 2px 0px #ff5722', edge: '#ffc20e' }, // gold
  { color: '#bdbdbd', shadow: '0px 2px 0px #424242', edge: '#cfd4da' }, // silver
  { color: '#a15548', shadow: '0px 2px 0px #773b50', edge: '#b06a34' }, // bronze
]
const RANK_REST = { color: '#88684e', shadow: 'none', edge: null }

/** Class + CSS variable that paint rank `i`'s podium trim, if it has one. */
function medalTrim(i: number): { className: string; style?: CSSProperties } {
  const edge = RANK_STYLE[i]?.edge
  if (!edge) return { className: '' }
  return {
    className: 'pixel-frame--medal',
    style: { '--frame-edge': edge } as CSSProperties,
  }
}

/** Page title: golden yellow on a hard black pixel drop shadow. */
/* The fifteen mascot close-ups shipped in public/images/group/. */
const MASCOTS = new Set([
  'chimera', 'faerie', 'fenrir', 'griffin', 'harpy', 'kitsune', 'kraken',
  'minotaur', 'nymph', 'pegasus', 'phoenix', 'siren', 'sphinx', 'unicorn', 'wyvern',
])

function mascotSrc(name: string | undefined): string | null {
  if (!name) return null
  let key = name.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (key === 'nympth') key = 'nymph' // design spells it NYMPTH
  return MASCOTS.has(key) ? `/images/group/${key}.png` : null
}

/** Students store either a full profile URL or a bare handle; accept both. */
function instagramHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

/**
 * Pixel progress bar: gold fill in a plain black-bordered track.
 *
 * This used to overlay `progress-bar.png` on top of the fill, but the sprite's
 * own track art didn't line up with the fill underneath it and the two read as
 * overlapping. Drawn in CSS instead, so the track is always exactly the bar.
 */
function PixelBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className="h-[11px] w-full overflow-hidden border-2 border-black bg-[#f5e7c6]">
      <div className="h-full bg-[#fbc94c]" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Mascot / emblem cell shared by group and leader displays. */
function GroupIcon({ name, emblem, emblemUrl, className = '' }: {
  name: string
  emblem?: string
  emblemUrl?: string | null
  className?: string
}) {
  const src = mascotSrc(name)
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`object-contain ${className}`}
        style={{ imageRendering: 'pixelated' }}
      />
    )
  }
  return (
    <span className={`flex items-center justify-center ${className}`}>
      <GroupEmblem emblem={emblem} emblemUrl={emblemUrl} size={40} />
    </span>
  )
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [lb, fd] = await Promise.all([
        fetch('/api/leaderboard').then(r => r.json()),
        fetch('/api/leaderboard/feed').then(r => r.json()),
      ])
      setGroups(lb.groups || [])
      setStudents(lb.topStudents || [])
      setFeed(fd.feed || [])
      setLastUpdate(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Quest.type was retired when every quest became QR-completed, so the feed
  // now emits just two kinds of event.
  const typeIcon: Record<string, string> = {
    quest: '⚔️', scan: '📸',
  }

  const tabs: { key: Tab; label: string }[] = [
    // "Guild" is the player-facing word for a Group; the `groups` key, the
    // Group table and every API field keep the original name.
    { key: 'groups', label: 'GUILDS' },
    { key: 'individual', label: 'PLAYERS' },
    { key: 'record', label: 'RECORD' },
  ]

  if (loading) return <PageWrapper><LoadingSpinner text="LOADING SCORES..." /></PageWrapper>

  const leaderGroup = groups[0]
  const leaderStudent = students[0]
  const maxGroupPoints = groups[0]?.totalPoints || 1
  const maxStudentPoints = students[0]?.points || 1

  return (
    <PageWrapper>
      <PageIntro page="leaderboard" />

      {/* Leaderboard-only backdrop. Deliberately `absolute`, not `fixed` like
          PageWrapper's sky layer, so it scrolls away with the content instead
          of sitting still behind it. The negative insets cancel <main>'s
          px-2/4/6 padding so it reaches the viewport edges and covers the sky
          underneath; min-h-screen keeps it covering on short viewports. */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-2 -right-2 -z-10 sm:-left-4 sm:-right-4 md:-left-6 md:-right-6"
          style={{
            backgroundImage: 'url(/images/leaderboard-page-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />

      <div className="game-column pt-3 sm:pt-5 pb-28 sm:pb-32 md:pb-12">
        {/* LIVE status indicator */}
        <div className="mb-2 flex items-center justify-end gap-1.5 px-2" data-tour="lb-live">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bytebounce text-[13px] text-[#86efac] tracking-wide" style={{ textShadow: '1px 1px 0 #14532d' }}>
            LIVE 30s
          </span>
        </div>

        {/* ── Current Leader billboard ─────────────────────────────────── */}
        {activeTab !== 'record' && (activeTab === 'groups' ? leaderGroup : leaderStudent) && (
          <div className="relative mx-auto mb-4 w-[88%] max-w-[350px]" data-tour="lb-leader">
            <div className="relative aspect-[337/249]">
              {/* Wood panel — one 337x249 sprite (replaced the old
                  left/mid/right slice trio). */}
              <img
                src="/images/leaderboard/board.png"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-fill"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Stars flanking the title */}
              <img src="/images/leaderboard/star.png" alt="" aria-hidden
                className="absolute left-[9%] top-[7%] w-[11%]" />
              <img src="/images/leaderboard/star.png" alt="" aria-hidden
                className="absolute right-[9%] top-[7%] w-[11%]" />

              <p
                className="absolute inset-x-0 top-[6.5%] text-center font-bytebounce text-[clamp(18px,6vw,26px)] leading-none text-[#ffecb3]"
                style={{ textShadow: '2px 2px 0 #4e342e' }}
              >
                Current Leader
              </p>
              <p
                className="absolute inset-x-0 top-[15.5%] text-center font-bytebounce text-[clamp(18px,6vw,26px)] leading-none text-[#e0b391]"
                style={{ textShadow: '2px 2px 0 #4e342e' }}
              >
                {(activeTab === 'groups' ? leaderGroup.totalPoints : leaderStudent.points).toLocaleString()} Points
              </p>

              {/* Leader portrait: group mascot, or the top player's avatar.
                  The mascot is object-contain, so its rendered size is capped
                  by the SHORTER axis — resizing means changing BOTH numbers by
                  the same factor, since changing one alone may not move the
                  binding constraint. The pair below is the 62%/full box scaled
                  to 85%, which also keeps the mascot off the points line that
                  sits above it. */}
              <div className="absolute inset-x-0 top-[21%] flex h-[50%] items-center justify-center">
                {activeTab === 'groups' ? (
                  <GroupIcon
                    name={leaderGroup.name}
                    emblem={leaderGroup.emblem}
                    emblemUrl={leaderGroup.emblemUrl}
                    // Sits between the points line above and the red name
                    // ribbon below, with little room either side — the mascot
                    // sprites have no transparent padding at their base to hide
                    // an overlap. Note `translate-y` is a share of the mascot's
                    // own height, so resizing it also moves it: the offset was
                    // trimmed from 15% to 13.5% when the size went up, to hold
                    // the same centre.
                    className="h-[95%] w-[59%] translate-y-[13.5%]"
                  />
                ) : (
                  <PixelAvatar
                    {...(() => { const a = parseAvatarConfig(leaderStudent.avatarConfig); return { skin: a.skin, clothes: a.clothes ?? undefined, hair: hairKey(a) ?? undefined, hijab: a.hijab ?? undefined, eyes: a.eyes ?? undefined, brow: a.brows ?? undefined, mouth: a.mouth ?? undefined } })()}
                    size={118}
                  />
                )}
              </div>

              {/* Red ribbon with the leader's name */}
              <div className="absolute inset-x-[2%] top-[58%]">
                <img src="/images/leaderboard/banner-red.png" alt="" aria-hidden className="block w-full" />
                {/* banner-red.png is 318x101 and droops in the middle: at its
                    centre column the red body only spans rows 51..85, so the
                    name is centred at 67% — not on the sprite's midpoint, which
                    would float it above the ribbon in the tail area. */}
                <p className="title-gold absolute inset-x-0 top-[67%] -translate-y-1/2 truncate px-[16%] text-center font-bytebounce text-[clamp(21px,7.2vw,31px)] uppercase leading-none">
                  {activeTab === 'groups' ? leaderGroup.name : leaderStudent.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="mb-1 flex gap-2" data-tour="lb-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setOpenGroupId(null) }}
              className={`wood-plank flex-1 py-2.5 font-bytebounce text-[clamp(19px,6vw,26px)] leading-none transition-all ${
                activeTab === tab.key ? 'brightness-110' : 'opacity-70 hover:opacity-90'
              }`}
              style={{
                color: activeTab === tab.key ? '#ffd23f' : '#e0b391',
                textShadow: '2px 2px 0 #4e342e',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mb-1 text-center font-bytebounce text-[13px] text-[#e0b391]" style={{ textShadow: '1px 1px 0 #4e342e' }}>
          Updated {lastUpdate.toLocaleTimeString()}
          <button onClick={fetchData} className="ml-2 text-[#7aff06] hover:brightness-125">[refresh]</button>
        </p>

        {/* ── Parchment scroll ─────────────────────────────────────────── */}
        {/* Pulled wider than the text column: the negative margins cancel both
            game-column's padding (12/16/24/32px) and <main>'s (8/16/24/24px),
            so the parchment runs edge to edge. Widened here in local markup on
            purpose — the sprites sit in the shared /images/map/ folder next to
            the scroll.png that /info and /map render, so they are left alone
            rather than re-exported or restyled through a shared class. */}
        <div className="relative -mx-5 sm:-mx-8 md:-mx-12 lg:-mx-14">
          <div aria-hidden className="absolute inset-0 flex flex-col">
            <img src="/images/map/scroll-top.png" alt="" className="w-full" />
            <div
              className="-my-px flex-1"
              style={{
                backgroundImage: 'url(/images/map/scroll-mid.png)',
                backgroundRepeat: 'repeat-y',
                backgroundSize: '100% auto',
              }}
            />
            <img src="/images/map/scroll-bottom.png" alt="" className="w-full" />
          </div>

          {/* Padding is a percentage of WIDTH, matching how the sprites scale.
              In /images/map/scroll-top.png (747x300) the roll's dark bottom rule
              sits at y=144, i.e. 19.3% of the sprite width; scroll-bottom.png
              starts its roll 146px above its foot, i.e. 19.5%. Anything less
              than those and the content slides under a roll. */}
          <div className="relative" style={{ paddingTop: '22%', paddingBottom: '22%' }} data-tour="lb-list">
            {/* The record tab is an activity feed, not a ranking — no title. */}
            {activeTab !== 'record' && (
              <h1 className="title-gold text-center font-bytebounce text-[clamp(34px,11vw,46px)] leading-none">
                LEADERBOARD
              </h1>
            )}

            {/* ── Groups Tab ── */}
            {activeTab === 'groups' && (
              <div className="mx-auto w-[78%] space-y-[6px]">
                {groups.map((group, i) => {
                  const style = RANK_STYLE[i] ?? RANK_REST
                  const medal = medalTrim(i)
                  const isOpen = openGroupId === group.id
                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                        aria-expanded={isOpen}
                        className="block w-full text-left transition-transform active:translate-y-0.5"
                      >
                        <div
                          className={`pixel-frame flex items-center gap-[4%] px-[4%] py-[3.5%] ${medal.className} ${
                            isOpen ? 'pixel-frame--top' : ''
                          }`}
                          style={medal.style}
                        >
                          {/* Trophy for top 3, numeral after */}
                          <div className="flex w-[14%] flex-shrink-0 items-center justify-center">
                            {i < 3 ? (
                              <img src={trophies[i]} alt={`Rank ${i + 1}`} className="w-full object-contain"
                                style={{ imageRendering: 'pixelated' }} />
                            ) : (
                              <span className="font-bytebounce text-[clamp(26px,8.5vw,36px)] leading-none text-[#88684e]">
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <GroupIcon
                            name={group.name}
                            emblem={group.emblem}
                            emblemUrl={group.emblemUrl}
                            className="aspect-square w-[24%] flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate font-bytebounce text-[clamp(20px,6.8vw,29px)] uppercase leading-none"
                              style={{ color: style.color, textShadow: style.shadow }}
                            >
                              {group.name}
                            </p>
                            <p className="mt-[3px] font-bytebounce text-[clamp(13px,4.2vw,18px)] leading-none text-[#5d4330]">
                              LV {groupLevel(group.totalPoints)}
                            </p>
                            <div className="mt-[4px]">
                              <PixelBar value={group.totalPoints} max={maxGroupPoints} />
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right leading-none">
                            <span
                              className="font-bytebounce text-[clamp(22px,7vw,30px)]"
                              style={{ color: style.color !== '#ffeb3b' ? style.color : '#ffc20e' }}
                            >
                              {group.totalPoints.toLocaleString()}
                            </span>
                            <span className="ml-[2px] font-bytebounce text-[11px]" style={{ color: style.color !== '#ffeb3b' ? style.color : '#ffc20e' }}>
                              pts
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Collapsible member roster */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            /* Height only — no opacity fade. Fading reads as a
                               separate panel appearing; growing alone reads as
                               the row itself expanding. */
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div
                              className={`pixel-frame pixel-frame--bottom pixel-frame--roster px-3 pb-3 pt-2 ${medal.className}`}
                              style={medal.style}
                            >
                              {group.members.length === 0 ? (
                                <p className="py-2 text-center font-bytebounce text-[15px] text-[#8a7355]">
                                  No members yet.
                                </p>
                              ) : (
                                group.members.map((m) => {
                                  const href = instagramHref(m.instagram)
                                  const ma = parseAvatarConfig(m.avatarConfig)
                                  const avatar = (
                                    <PixelAvatar
                                      skin={ma.skin}
                                      clothes={ma.clothes ?? undefined}
                                      hair={hairKey(ma) ?? undefined}
                                      hijab={ma.hijab ?? undefined}
                                      eyes={ma.eyes ?? undefined}
                                      brow={ma.brows ?? undefined}
                                      mouth={ma.mouth ?? undefined}
                                      size={34}
                                    />
                                  )
                                  return (
                                    <div
                                      key={m.id}
                                      className="flex items-center gap-2 border-b border-[#c9a97b] py-[5px] last:border-0"
                                    >
                                      {href ? (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          aria-label={`${m.name} on Instagram`}
                                          title={`${m.name} on Instagram`}
                                          className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
                                        >
                                          {avatar}
                                        </a>
                                      ) : (
                                        <span className="flex-shrink-0" title="No Instagram linked">{avatar}</span>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-bytebounce text-[16px] leading-tight text-[#5d4330]">
                                          {m.name}
                                        </p>
                                        {m.instagram && (
                                          <p className="truncate font-bytebounce text-[12px] leading-none text-[#8a5a37]">
                                            @{m.instagram.replace(/^@/, '')}
                                          </p>
                                        )}
                                      </div>
                                      <p className="flex-shrink-0 font-bytebounce text-[16px] leading-none text-[#88684e] ml-1">
                                        {m.points.toLocaleString()} pts
                                      </p>
                                    </div>
                                  )
                                })
                              )}
                              <p className="mt-1 text-center font-bytebounce text-[11px] leading-none text-[#a58962]">
                                tap an avatar to open their instagram
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
                {groups.length === 0 && (
                  <p className="py-6 text-center font-bytebounce text-[18px] text-[#8a7355]">
                    No guilds yet.
                  </p>
                )}
              </div>
            )}

            {/* ── Players Tab ── */}
            {activeTab === 'individual' && (
              <div className="mx-auto w-[78%] space-y-[6px]">
                {students.slice(0, TOP_PLAYERS).map((student, i) => {
                  const style = RANK_STYLE[i] ?? RANK_REST
                  return (
                    <div
                      key={student.id}
                      className={`pixel-frame flex items-center gap-[4%] px-[4%] py-[3.5%] ${medalTrim(i).className}`}
                      style={medalTrim(i).style}
                    >
                      <div className="flex w-[14%] flex-shrink-0 items-center justify-center">
                        {i < 3 ? (
                          <img src={trophies[i]} alt={`Rank ${i + 1}`} className="w-full object-contain"
                            style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="font-bytebounce text-[clamp(26px,8.5vw,36px)] leading-none text-[#88684e]">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <PixelAvatar
                        {...(() => { const a = parseAvatarConfig(student.avatarConfig); return { skin: a.skin, clothes: a.clothes ?? undefined, hair: hairKey(a) ?? undefined, hijab: a.hijab ?? undefined, eyes: a.eyes ?? undefined, brow: a.brows ?? undefined, mouth: a.mouth ?? undefined } })()}
                        size={38}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-bytebounce text-[clamp(15px,5vw,21px)] leading-none"
                          style={{ color: style.color, textShadow: style.shadow }}
                        >
                          {student.name}
                        </p>
                        <p className="mt-[2px] truncate font-bytebounce text-[12px] leading-none text-[#88684e]">
                          {student.group?.name ?? '—'} · 📖 {student.funFactsCollected}
                        </p>
                        <div className="mt-[3px]">
                          <PixelBar value={student.points} max={maxStudentPoints} />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right leading-none">
                        <span
                          className="font-bytebounce text-[clamp(20px,6.5vw,28px)]"
                          style={{ color: style.color !== '#ffeb3b' ? style.color : '#ffc20e' }}
                        >
                          {student.points.toLocaleString()}
                        </span>
                        <span className="ml-[2px] font-bytebounce text-[11px]" style={{ color: style.color !== '#ffeb3b' ? style.color : '#ffc20e' }}>
                          pts
                        </span>
                      </div>
                    </div>
                  )
                })}
                {students.length === 0 && (
                  <p className="py-6 text-center font-bytebounce text-[18px] text-[#8a7355]">
                    No players yet.
                  </p>
                )}
              </div>
            )}

            {/* ── Record Tab ── */}
            {activeTab === 'record' && (
              <div className="mx-auto w-[78%] space-y-[6px]">
                <p className="text-center font-bytebounce text-[13px] text-[#5d4330]">
                  Latest points events
                </p>
                {feed.length === 0 && (
                  <p className="py-6 text-center font-bytebounce text-[18px] text-[#8a7355]">
                    No records yet.
                  </p>
                )}
                {feed.slice(0, RECENT_RECORDS).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2 border-2 border-[#b08a5e] bg-[#e9d3ab] px-3 py-2"
                  >
                    <span className="flex-shrink-0 text-lg">{typeIcon[ev.questType] ?? '📋'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bytebounce text-[15px] leading-tight text-[#3e2723]">{ev.studentName}</p>
                      <p className="truncate font-bytebounce text-[12px] leading-tight text-[#5d4330]">{ev.label}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bytebounce text-[15px] leading-none text-[#b8860b]">+{ev.points} pts</p>
                      <p className="mt-[2px] font-bytebounce text-[11px] leading-none text-[#a58962]">
                        {new Date(ev.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </PageWrapper>
  )
}
