// app/(game)/map/committee/page.tsx
// Committee introduction page (Figma node 338:91) — a pixel parchment scroll
// with colour-coded division bookmarks down the right edge, a division banner,
// a fun-fact collection counter, paginated member cards, and QR-gated facts.
'use client'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelAvatar from '@/components/ui/PixelAvatar'
// lucide-react dropped brand glyphs; Camera matches the Figma icon closely.
import { Camera } from 'lucide-react'
import { useState } from 'react'

/* ────────────────────────────────────────────────────────────────────────
 * MOCK DATA — placeholder until wired to the codex/scan system.
 * `isScanned` will come from the student's ScanLog; `funFact`, `imageUrl`,
 * and `instagramUrl` will come from the NPC/committee tables.
 * ──────────────────────────────────────────────────────────────────────── */
interface Division {
  id: string
  name: string
  /** bookmark + banner colour, sampled from the Figma ribbon tabs */
  color: string
}

interface CommitteeMember {
  id: string
  name: string
  role: string
  imageUrl: string | null
  instagramUrl: string
  funFact: string
  divisionId: string
  isScanned: boolean
  /** placeholder pixel-avatar parts, used while imageUrl is null */
  avatar: { skin: string; eyes: string; brow: string; hair?: string }
}

// Order + colours follow the Figma bookmark ribbon, top to bottom.
// Mainboard is always first.
const DIVISIONS: Division[] = [
  { id: 'mainboard', name: 'Mainboards', color: '#a83fbf' },
  { id: 'itlog', name: 'IT & Logistics', color: '#331f8f' },
  { id: 'pubdoc', name: 'PubDoc', color: '#22998f' },
  { id: 'event', name: 'Event', color: '#cc0505' },
  { id: 'creative', name: 'Creative', color: '#f5187a' },
  { id: 'groupleader', name: 'Group Leader', color: '#7fa510' },
]

const ROLES: Record<string, string[]> = {
  mainboard: ['Project Officer', 'Vice PO', 'Secretary', 'Treasurer', 'Advisor', 'Liaison'],
  itlog: ['Division Head', 'Equipment', 'IT Support', 'Runner'],
  pubdoc: ['Division Head', 'Copywriter', 'Photographer', 'Editor'],
  event: ['Division Head', 'Stage Manager', 'Game Master', 'Crew'],
  creative: ['Division Head', 'Designer', 'Videographer', 'Animator'],
  groupleader: ['Head of Leaders', 'Group Leader', 'Group Leader', 'Group Leader'],
}

const SKINS = ['skin1', 'skin2', 'skin3']
const EYES = ['eyes1', 'eyes3', 'eyes5', 'eyes8']
const BROWS = ['brow1', 'brow2', 'brow4']
const HAIRS = ['hairb1', 'hairb2', 'hairb1.2', undefined]

const MEMBERS: CommitteeMember[] = DIVISIONS.flatMap((division, d) =>
  ROLES[division.id].map((role, i) => ({
    id: `${division.id}-${i + 1}`,
    name: `Member ${i + 1}`,
    role,
    imageUrl: null,
    instagramUrl: 'https://instagram.com',
    funFact:
      'Placeholder fun fact — scan this member’s QR to unlock the real one!',
    divisionId: division.id,
    isScanned: i % 3 === 0, // demo both states
    avatar: {
      skin: SKINS[(d + i) % SKINS.length],
      eyes: EYES[(d * 2 + i) % EYES.length],
      brow: BROWS[(d + i) % BROWS.length],
      hair: HAIRS[(d + i * 3) % HAIRS.length],
    },
  }))
)

const PER_PAGE = 3

/** Gold display text with the design's brown pixel outline. */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

export default function CommitteePage() {
  const [activeDivision, setActiveDivision] = useState(DIVISIONS[0].id)
  const [currentPage, setCurrentPage] = useState(0)

  const active = DIVISIONS.find((d) => d.id === activeDivision)!
  const divisionMembers = MEMBERS.filter((m) => m.divisionId === activeDivision)
  const pageCount = Math.max(1, Math.ceil(divisionMembers.length / PER_PAGE))
  const pageMembers = divisionMembers.slice(
    currentPage * PER_PAGE,
    currentPage * PER_PAGE + PER_PAGE
  )
  // Fun-fact progress for the division currently on screen.
  const collected = divisionMembers.filter((m) => m.isScanned).length

  const selectDivision = (id: string) => {
    setActiveDivision(id)
    setCurrentPage(0)
  }

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-md px-3 pb-4 pt-1 lg:max-w-lg">
        {/* Header */}
        <h1 className="text-center font-bytebounce leading-[0.85]">
          <span
            className="block text-[clamp(1.9rem,9vw,2.5rem)]"
            style={OUTLINE_GOLD}
          >
            NSO SU 2026
          </span>
          <span
            className="block text-[clamp(2.6rem,13vw,3.4rem)]"
            style={OUTLINE_GOLD}
          >
            COMMITTEE
          </span>
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[19px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          The team behind NSO 2026
        </p>

        {/* ── Parchment scroll ────────────────────────────────────────── */}
        <div className="relative mt-2">
          {/* Bookmarks: one per division, notched tabs down the right edge */}
          <div
            className="absolute right-[-14px] top-[110px] z-20 flex flex-col gap-[6px]"
            role="tablist"
            aria-label="Committee divisions"
          >
            {DIVISIONS.map((division) => {
              const isActive = division.id === activeDivision
              return (
                <button
                  key={division.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={division.name}
                  title={division.name}
                  onClick={() => selectDivision(division.id)}
                  className={`h-[26px] transition-all ${
                    isActive
                      ? 'w-[44px] brightness-110'
                      : 'w-[34px] brightness-90 hover:w-[40px] hover:brightness-105'
                  }`}
                  style={{
                    backgroundColor: division.color,
                    clipPath:
                      'polygon(0 0, 100% 0, 100% 30%, 62% 50%, 100% 70%, 100% 100%, 0 100%)',
                  }}
                />
              )
            })}
          </div>

          <img
            src="/images/map/scroll-top.png"
            alt=""
            aria-hidden
            className="block w-full"
          />

          {/* Scroll interior — repeats the parchment strip, so it grows with
              however many cards the current page holds. */}
          <div className="scroll-body px-[12%] pb-2">
            {/* Division banner */}
            <div className="relative mx-auto w-[88%] pt-1">
              {/* folded tails behind the banner body */}
              <span
                aria-hidden
                className="absolute -left-[7%] top-[14px] h-[34px] w-[13%]"
                style={{
                  backgroundColor: active.color,
                  filter: 'brightness(0.75)',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 68%, 0 100%)',
                }}
              />
              <span
                aria-hidden
                className="absolute -right-[7%] top-[14px] h-[34px] w-[13%]"
                style={{
                  backgroundColor: active.color,
                  filter: 'brightness(0.75)',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 68%, 0 100%)',
                }}
              />
              <h2
                className="committee-banner relative truncate px-3 py-[7px] text-center font-bytebounce text-[clamp(18px,6vw,26px)] uppercase leading-none tracking-[2px]"
                style={{ backgroundColor: active.color, ...OUTLINE_GOLD, textShadow: '2px 2px 0 #4e342e' }}
              >
                {active.name}
              </h2>
            </div>

            {/* Fun-fact progress for this division */}
            <p className="mt-2 text-center font-bytebounce text-[17px] leading-none text-[#8a7355]">
              {collected}/{divisionMembers.length} collected
            </p>

            {/* Member cards */}
            <div className="mt-3 flex flex-col gap-5">
              {pageMembers.map((member) => (
                <article key={member.id} className="relative pt-[14px]">
                  <div className="committee-frame rounded-[3px] p-[7px]">
                    <div className="flex h-[104px] overflow-hidden rounded-[2px] border-2 border-[#2f1c10] bg-[#fdf6e3]">
                      {/* Portrait */}
                      <div className="flex w-[38%] shrink-0 items-end justify-center bg-[#efe3c6]">
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PixelAvatar
                            skin={member.avatar.skin}
                            eyes={member.avatar.eyes}
                            brow={member.avatar.brow}
                            hair={member.avatar.hair}
                            size={86}
                          />
                        )}
                      </div>

                      {/* Fun fact — hidden until this member's QR is scanned */}
                      <div className="relative flex flex-1 items-center justify-center px-2 pb-1 pt-7">
                        <p
                          className={`text-center font-bytebounce text-[15px] leading-[1.05] ${
                            member.isScanned ? 'text-[#5d4330]' : 'text-[#b3a184]'
                          }`}
                        >
                          {member.isScanned ? `“${member.funFact}”` : '? ? ?'}
                        </p>
                        <span
                          aria-hidden
                          className="absolute bottom-1 right-1.5 text-[11px] leading-none text-[#a89170]"
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Name plaque — overlaps the top of the frame */}
                  <div className="absolute left-[14%] top-0 flex max-w-[62%] items-center">
                    <div
                      className="relative py-[3px] pl-3 pr-4 font-bytebounce text-[20px] leading-none text-[#ffeccf]"
                      style={{
                        backgroundColor: active.color,
                        boxShadow: '0 0 0 3px #3a2418, inset 0 0 0 2px #ffd83d',
                        textShadow: '2px 2px 0 #4e342e',
                        clipPath:
                          'polygon(0 0, 100% 0, 88% 50%, 100% 100%, 0 100%)',
                      }}
                    >
                      <span className="block truncate">{member.name}</span>
                    </div>
                  </div>

                  {/* Role pill, tucked under the plaque */}
                  <div
                    className="absolute left-[16%] top-[36px] rounded-[2px] border-2 border-[#3a2418] px-2 py-[1px] font-bytebounce text-[13px] leading-none text-[#ffd23f]"
                    style={{
                      background: 'linear-gradient(180deg,#8a5a37,#6b4224)',
                      textShadow: '1px 1px 0 #3a2418',
                    }}
                  >
                    {member.role}
                  </div>

                  {/* Instagram link (placeholder URL for now) */}
                  <a
                    href={member.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on Instagram`}
                    className="absolute right-[10%] top-0 rounded-[4px] border-[3px] border-[#3a2418] bg-[#fdf6e3] p-[3px] text-[#3a2418] transition-transform hover:scale-110 active:scale-95"
                  >
                    <Camera size={18} strokeWidth={2.5} />
                  </a>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous page"
                className="font-bytebounce text-[22px] leading-none text-[#6b4a2d] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ◀▌
              </button>
              <span className="font-bytebounce text-[22px] leading-none text-[#6b4a2d]">
                {currentPage + 1}/{pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage >= pageCount - 1}
                aria-label="Next page"
                className="font-bytebounce text-[22px] leading-none text-[#6b4a2d] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ▐▶
              </button>
            </div>
          </div>

          <img
            src="/images/map/scroll-bottom.png"
            alt=""
            aria-hidden
            className="-mt-px block w-full"
          />
        </div>
      </div>
    </PageWrapper>
  )
}
