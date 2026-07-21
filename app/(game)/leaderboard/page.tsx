// app/(game)/leaderboard/page.tsx
// Leaderboard restyled to the Figma parchment design (node 258:520): a wooden
// "Current Leader" billboard up top, then a parchment scroll of ranked rows —
// trophies for the top 3, big numerals after, mascot icon, name, progress bar
// and points. Tapping a group row folds out its member roster with each
// member's point contribution; tapping a member's avatar opens the Instagram
// profile they gave at registration.
//
// Sprites live in `public/images/leaderboard/` (billboard slices, red banner,
// star, row frame, progress-bar track — all white-knocked-out Figma exports);
// group mascots are the existing `public/images/group/*.png`; the parchment
// reuses the committee scroll sprites.
'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import GroupEmblem from '@/components/ui/GroupEmblem'
import PixelAvatar from '@/components/ui/PixelAvatar'

type Tab = 'groups' | 'individual' | 'record'

interface Member {
  id: string
  name: string
  points: number
  funFactsCollected: number
  instagram?: string | null
  avatarSkin?: string | null
  avatarHair?: string | null
  avatarEyes?: string | null
  avatarBrows?: string | null
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
  avatarSkin?: string | null
  avatarHair?: string | null
  avatarEyes?: string | null
  avatarBrows?: string | null
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
const RANK_STYLE = [
  { color: '#ffeb3b', shadow: '0px 2px 0px #ff5722' },
  { color: '#bdbdbd', shadow: '0px 2px 0px #424242' },
  { color: '#a15548', shadow: '0px 2px 0px #773b50' },
]
const RANK_REST = { color: '#88684e', shadow: 'none' }

/** Gold display text with the design's brown pixel outline (committee page). */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

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

/** Pixel progress bar: gold fill clipped inside the Figma track sprite. */
function PixelBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className="relative h-[11px] w-full">
      <div className="absolute inset-[2px] bg-[#f5e7c6]" />
      <div className="absolute bottom-[2px] left-[2px] top-[2px] bg-[#fbc94c]" style={{ width: `${pct}%` }} />
      <img
        src="/images/leaderboard/progress-bar.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: 'pixelated' }}
      />
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
      <div className="mx-auto w-full max-w-md px-3 pb-4 pt-3 lg:max-w-lg">

        {/* ── Current Leader billboard ─────────────────────────────────── */}
        {activeTab !== 'record' && (activeTab === 'groups' ? leaderGroup : leaderStudent) && (
          <div className="relative mx-auto mb-4 w-[88%] max-w-[350px]">
            <div className="relative aspect-[337/248]">
              {/* Wood panel, sliced left/mid/right exactly as in Figma */}
              <div aria-hidden className="absolute inset-0 flex">
                <img src="/images/leaderboard/board-left.png" alt="" className="h-full w-[34.1%] object-fill" />
                <img src="/images/leaderboard/board-mid.png" alt="" className="h-full w-[31.8%] object-fill" />
                <img src="/images/leaderboard/board-right.png" alt="" className="h-full w-[34.1%] object-fill" />
              </div>

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
                  by the SHORTER axis — widening alone does nothing, the height
                  has to grow with it. */}
              <div className="absolute inset-x-0 top-[21%] flex h-[50%] items-center justify-center">
                {activeTab === 'groups' ? (
                  <GroupIcon
                    name={leaderGroup.name}
                    emblem={leaderGroup.emblem}
                    emblemUrl={leaderGroup.emblemUrl}
                    className="h-full w-[62%]"
                  />
                ) : (
                  <PixelAvatar
                    skin={leaderStudent.avatarSkin ?? 'skin1'}
                    hair={leaderStudent.avatarHair ?? undefined}
                    eyes={leaderStudent.avatarEyes ?? undefined}
                    brow={leaderStudent.avatarBrows ?? undefined}
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
                <p
                  className="absolute inset-x-0 top-[67%] -translate-y-1/2 truncate px-[16%] text-center font-bytebounce text-[clamp(21px,7.2vw,31px)] uppercase leading-none"
                  style={OUTLINE_GOLD}
                >
                  {activeTab === 'groups' ? leaderGroup.name : leaderStudent.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="mb-1 flex gap-2">
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
        <div className="relative">
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
          <div className="relative" style={{ paddingTop: '22%', paddingBottom: '22%' }}>
            <h1 className="text-center font-bytebounce text-[clamp(34px,11vw,46px)] leading-none text-[#3e2723]">
              LEADERBOARD
            </h1>

            {/* ── Groups Tab ── */}
            {activeTab === 'groups' && (
              <div className="mx-auto w-[78%] space-y-[6px]">
                {groups.map((group, i) => {
                  const style = RANK_STYLE[i] ?? RANK_REST
                  const isOpen = openGroupId === group.id
                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                        aria-expanded={isOpen}
                        className="block w-full text-left transition-transform active:translate-y-0.5"
                      >
                        <div
                          className="flex items-center gap-[4%] px-[4%] py-[3.5%]"
                          style={{
                            backgroundImage: 'url(/images/leaderboard/row-frame.png)',
                            backgroundSize: '100% 100%',
                          }}
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
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-[3%] border-2 border-t-0 border-[#b08a5e] bg-[#e9d3ab] px-3 py-2">
                              {group.members.length === 0 ? (
                                <p className="py-2 text-center font-bytebounce text-[15px] text-[#8a7355]">
                                  No members yet.
                                </p>
                              ) : (
                                group.members.map((m) => {
                                  const href = instagramHref(m.instagram)
                                  const avatar = (
                                    <PixelAvatar
                                      skin={m.avatarSkin ?? 'skin1'}
                                      hair={m.avatarHair ?? undefined}
                                      eyes={m.avatarEyes ?? undefined}
                                      brow={m.avatarBrows ?? undefined}
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
                                      <p className="min-w-0 flex-1 truncate font-bytebounce text-[16px] leading-none text-[#5d4330]">
                                        {m.name}
                                      </p>
                                      <p className="flex-shrink-0 font-bytebounce text-[16px] leading-none text-[#88684e]">
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
                      className="flex items-center gap-[4%] px-[4%] py-[3.5%]"
                      style={{
                        backgroundImage: 'url(/images/leaderboard/row-frame.png)',
                        backgroundSize: '100% 100%',
                      }}
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
                        skin={student.avatarSkin ?? 'skin1'}
                        hair={student.avatarHair ?? undefined}
                        eyes={student.avatarEyes ?? undefined}
                        brow={student.avatarBrows ?? undefined}
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
                <p className="text-center font-bytebounce text-[13px] text-[#8a7355]">
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
                      <p className="truncate font-bytebounce text-[15px] leading-tight text-[#5d4330]">{ev.studentName}</p>
                      <p className="truncate font-bytebounce text-[12px] leading-tight text-[#8a7355]">{ev.label}</p>
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
    </PageWrapper>
  )
}
