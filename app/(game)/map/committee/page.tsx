// app/(game)/map/committee/page.tsx
// Committee introduction page (Figma node 338:91) — pixel scroll with
// division ribbon tabs, paginated member cards, and QR-gated fun facts.
'use client'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelAvatar from '@/components/ui/PixelAvatar'
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
  /** ribbon color */
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

const DIVISIONS: Division[] = [
  { id: 'mainboard', name: 'Mainboard', color: '#ab47bc' },
  { id: 'creative', name: 'Creative & Media', color: '#e91e63' },
  { id: 'event', name: 'Event', color: '#4caf50' },
  { id: 'publication', name: 'Publication', color: '#ff9800' },
  { id: 'logistics', name: 'Logi & IT', color: '#2196f3' },
]

const ROLES: Record<string, string[]> = {
  mainboard: ['Project Officer', 'Vice PO', 'Secretary', 'Treasurer'],
  creative: ['Division Head', 'Designer', 'Videographer', 'Animator'],
  event: ['Division Head', 'Stage Manager', 'Game Master', 'Crew'],
  publication: ['Division Head', 'Copywriter', 'Photographer', 'Editor'],
  logistics: ['Division Head', 'Equipment', 'IT Support', 'Runner'],
}

const SKINS = ['skin1', 'skin2', 'skin3']
const EYES = ['eyes1', 'eyes3', 'eyes5', 'eyes8']
const BROWS = ['brow1', 'brow2', 'brow4']
const HAIRS = ['hairb1', 'hairb2', 'hairb1.2', undefined]

// 4 placeholder members per division → 2 pages at 3 per page.
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
    isScanned: i % 2 === 0, // demo both states
    avatar: {
      skin: SKINS[(d + i) % SKINS.length],
      eyes: EYES[(d * 2 + i) % EYES.length],
      brow: BROWS[(d + i) % BROWS.length],
      hair: HAIRS[(d + i * 3) % HAIRS.length],
    },
  }))
)

const PER_PAGE = 3

export default function CommitteePage() {
  const [activeDivision, setActiveDivision] = useState(DIVISIONS[0].id)
  const [currentPage, setCurrentPage] = useState(0)

  const divisionMembers = MEMBERS.filter((m) => m.divisionId === activeDivision)
  const pageCount = Math.max(1, Math.ceil(divisionMembers.length / PER_PAGE))
  const pageMembers = divisionMembers.slice(
    currentPage * PER_PAGE,
    currentPage * PER_PAGE + PER_PAGE
  )
  const active = DIVISIONS.find((d) => d.id === activeDivision)!

  const selectDivision = (id: string) => {
    setActiveDivision(id)
    setCurrentPage(0)
  }

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-md px-3 py-2 lg:max-w-lg">
        {/* Header */}
        <h1 className="text-center font-bytebounce text-[clamp(2.5rem,13vw,3.5rem)] leading-none text-[#d7a717]">
          NSO&rsquo;26 COMMITTEE
        </h1>
        <p className="mx-auto mt-1 max-w-[280px] text-center font-bytebounce text-[17px] leading-tight text-[#7d5a3d]">
          The team behind NSO 2026 — {active.name}
        </p>

        {/* Parchment scroll */}
        <div className="relative mt-2">
          <img src="/images/map/scroll.png" alt="" aria-hidden className="w-full" />

          {/* Division ribbon tabs */}
          <div
            className="absolute -right-1 top-[15%] z-20 flex flex-col gap-2"
            role="tablist"
            aria-label="Divisions"
          >
            {DIVISIONS.map((division) => {
              const isActive = division.id === activeDivision
              return (
                <button
                  key={division.id}
                  role="tab"
                  aria-selected={isActive}
                  title={division.name}
                  onClick={() => selectDivision(division.id)}
                  className={`rounded-l-md border-2 border-r-0 border-[#4e342e] py-1.5 pl-2 pr-1 text-left font-bytebounce text-[13px] leading-none text-white transition-all ${
                    isActive ? 'w-28 brightness-110' : 'w-16 opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: division.color,
                    textShadow: '1.5px 1.5px 0 #4e342e',
                  }}
                >
                  {isActive ? division.name : division.name.split(' ')[0]}
                </button>
              )
            })}
          </div>

          {/* Scroll content: member cards + pagination */}
          <div className="absolute bottom-[13%] left-[13%] right-[13%] top-[13%] flex flex-col">
            <div className="flex flex-1 flex-col justify-start gap-3 overflow-hidden">
              {pageMembers.map((member) => (
                <article
                  key={member.id}
                  className="rounded-md border-2 border-[#4e342e] bg-[#f9ecc5] p-2 shadow-[2px_2px_0_#4e342e66]"
                >
                  {/* Name row */}
                  <div className="wood-plank relative flex items-center gap-2 rounded p-1.5 pr-9">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="size-12 rounded border border-[#4e342e] object-cover"
                      />
                    ) : (
                      <PixelAvatar
                        skin={member.avatar.skin}
                        eyes={member.avatar.eyes}
                        brow={member.avatar.brow}
                        hair={member.avatar.hair}
                        size={48}
                      />
                    )}
                    <div className="min-w-0">
                      <p
                        className="truncate font-bytebounce text-[20px] leading-tight text-[#ffe9c9]"
                        style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}
                      >
                        {member.name}
                      </p>
                      <p
                        className="truncate font-bytebounce text-[14px] leading-none"
                        style={{ color: active.color, textShadow: '1px 1px 0 #4e342e' }}
                      >
                        {member.role}
                      </p>
                    </div>
                    {/* Instagram button (placeholder URL for now) */}
                    <a
                      href={member.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on Instagram`}
                      className="absolute right-1.5 top-1.5 rounded border border-[#4e342e] bg-[#f9ecc5] p-1 text-[#4e342e] transition-transform hover:scale-110 active:scale-95"
                    >
                      <Camera size={14} strokeWidth={2.5} />
                    </a>
                  </div>

                  {/* Fun fact — hidden until this member's QR is scanned */}
                  <p
                    className={`mt-1.5 min-h-9 rounded border border-dashed border-[#a8875f] bg-[#fff8e1] px-2 py-1 font-bytebounce text-[14px] leading-tight ${
                      member.isScanned ? 'text-[#5d4330]' : 'text-center text-[#b09a77]'
                    }`}
                  >
                    {member.isScanned ? member.funFact : '? ? ?'}
                  </p>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-2 flex items-center justify-center gap-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous page"
                className="w-11 transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <img src="/images/login/back-button.png" alt="" className="w-full" />
              </button>
              <span className="font-bytebounce text-[20px] text-[#7d5a3d]">
                {currentPage + 1}/{pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage >= pageCount - 1}
                aria-label="Next page"
                className="w-11 transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <img
                  src="/images/login/back-button.png"
                  alt=""
                  className="w-full -scale-x-100"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
