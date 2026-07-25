// app/(game)/info/committee/page.tsx
// Committee introduction page — pixel parchment scroll with colour-coded division bookmarks,
// ribbon banners, name plaques, fun-fact progress, and Instagram links.
'use client'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { DIVISIONS, type DivisionId } from '@/lib/divisions'

interface CommitteeMember {
  id: string
  name: string
  role: string
  division: string | null
  imageUrl: string | null
  instagram: string | null
  funFact: string
  isScanned: boolean
}

const PER_PAGE = 3

/** Gold display text with the design's brown pixel outline. */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

const CARD_PORTRAIT = { left: '3.16%', top: '-4.08%', width: '35.82%', height: '96.79%' }
const CARD_PLAQUE = { left: '16.94%', top: '-0.86%', width: '60.40%', height: '33.12%' }
const CARD_PILL = { left: '5.16%', top: '24.28%', width: '62.61%', height: '19.52%' }
const CARD_IG = { left: '76.14%', top: '-1.32%', width: '15.78%', height: '30.89%' }
const CARD_NAME = { left: '26.52%', right: '34.43%', top: '16.13%' }
const CARD_ROLE = { left: '18.17%', right: '35.89%', top: '32.34%' }

const RIBBON = { left: '16.46%', width: '68.63%' }
const CARD_COLUMN = { marginLeft: '22.45%', width: '58.29%', marginTop: '-2.5%' }
const SCROLL_PAD_TOP = '16.07%'
const RIBBON_TITLE_CENTRE = '38.1%'

function instagramHref(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

export default function CommitteePage() {
  const router = useRouter()
  const [activeDivision, setActiveDivision] = useState<DivisionId>(DIVISIONS[0].id)
  const [currentPage, setCurrentPage] = useState(0)
  const [members, setMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    fetch('/api/committee')
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  const active = DIVISIONS.find((d) => d.id === activeDivision)!
  const divisionMembers = members.filter((m) => m.division === activeDivision)
  const pageCount = Math.max(1, Math.ceil(divisionMembers.length / PER_PAGE))
  const pageMembers = divisionMembers.slice(
    currentPage * PER_PAGE,
    currentPage * PER_PAGE + PER_PAGE
  )
  const collected = divisionMembers.filter((m) => m.isScanned).length

  const selectDivision = (id: DivisionId) => {
    setActiveDivision(id)
    setCurrentPage(0)
  }

  return (
    <PageWrapper>
      <div className="relative game-column pb-4 pt-12">
        {/* Back to info station */}
        <button
          type="button"
          onClick={() => router.push('/info')}
          aria-label="Back to info station"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        {/* Header */}
        <h1
          className="text-center font-bytebounce text-[clamp(2.6rem,13vw,3.4rem)] leading-[0.85]"
          style={OUTLINE_GOLD}
        >
          COMMITTEE
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[19px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          The team behind NSO 2026
        </p>

        {/* Parchment scroll */}
        <div className="relative mt-2">
          <div aria-hidden className="absolute inset-0 flex flex-col">
            <img src="/images/committee/scroll-top.png" alt="" className="w-full" />
            <div
              className="-my-px flex-1"
              style={{
                backgroundImage: 'url(/images/committee/scroll-mid.png)',
                backgroundRepeat: 'repeat-y',
                backgroundSize: '100% auto',
              }}
            />
            <img src="/images/committee/scroll-bottom.png" alt="" className="w-full" />
          </div>

          {/* Division bookmarks */}
          <div
            className="absolute left-[86.67%] top-[25.7%] z-20 flex flex-col gap-[10px]"
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
                  className={`block h-[19px] transition-[width,filter] duration-150 ${
                    isActive
                      ? 'w-[52px] brightness-110'
                      : 'w-[34px] brightness-[0.82] hover:w-[41px] hover:brightness-100'
                  }`}
                >
                  <img
                    src={`/images/committee/bookmark-${division.id}.png`}
                    alt=""
                    className="h-full w-full"
                  />
                </button>
              )
            })}
          </div>

          {/* Scroll contents */}
          <div className="relative" style={{ paddingTop: SCROLL_PAD_TOP, paddingBottom: '15%' }}>
            <div className="relative z-0" style={{ marginLeft: RIBBON.left, width: RIBBON.width }}>
              <img
                src={`/images/committee/banner-${active.id}.png`}
                alt=""
                aria-hidden
                className="block w-full"
              />
              <h2
                className="absolute inset-x-0 -translate-y-1/2 truncate px-[14%] text-center font-bytebounce text-[clamp(17px,5.5vw,25px)] uppercase leading-none tracking-[1px]"
                style={{ top: RIBBON_TITLE_CENTRE, ...OUTLINE_GOLD, textShadow: '2px 2px 0 #3e2723' }}
              >
                {active.name}
              </h2>
            </div>

            {loading ? (
              <div className="relative z-10 py-10">
                <LoadingSpinner />
              </div>
            ) : divisionMembers.length === 0 ? (
              <p className="relative z-10 mt-8 text-center font-bytebounce text-[18px] text-[#8a7355]">
                No members listed yet.
              </p>
            ) : (
              <div
                className="relative z-10 flex flex-col gap-[5%]"
                style={CARD_COLUMN}
              >
                {pageMembers.map((member) => {
                  const href = instagramHref(member.instagram)
                  const portrait = member.imageUrl ?? '/images/committee/portrait-placeholder.png'
                  return (
                    <article key={member.id} className="relative aspect-[245/115] w-full">
                      <img
                        src="/images/committee/card-frame.png"
                        alt=""
                        aria-hidden
                        className="absolute inset-0 h-full w-full"
                      />

                      <div className="absolute bottom-[6%] left-[41%] right-[5%] top-[45%] flex items-center justify-center">
                        <p
                          className={`text-center font-bytebounce text-[13px] leading-[1.05] ${
                            member.isScanned ? 'text-[#5d4330]' : 'text-[#b3a184]'
                          }`}
                        >
                          {member.isScanned ? `“${member.funFact}”` : '? ? ?'}
                        </p>
                      </div>

                      <img
                        src={`/images/committee/plaque-${active.id}.png`}
                        alt=""
                        aria-hidden
                        className="absolute"
                        style={CARD_PLAQUE}
                      />
                      <img
                        src="/images/committee/division-pill.png"
                        alt=""
                        aria-hidden
                        className="absolute"
                        style={CARD_PILL}
                      />
                      <div
                        className="absolute -translate-y-1/2 truncate font-bytebounce text-[17px] leading-none text-[#ffeccf]"
                        style={{ ...CARD_NAME, textShadow: '2px 2px 0 #3e2723' }}
                      >
                        {member.name}
                      </div>
                      <div
                        className="absolute -translate-y-1/2 truncate text-center font-bytebounce text-[12px] leading-none text-[#ffd23f]"
                        style={{ ...CARD_ROLE, textShadow: '1px 1px 0 #3a2418' }}
                      >
                        {member.role}
                      </div>

                      <img
                        src={portrait}
                        alt={member.name}
                        className="absolute object-cover object-top"
                        style={CARD_PORTRAIT}
                      />

                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on Instagram`}
                          className="absolute transition-transform hover:scale-110 active:scale-95"
                          style={CARD_IG}
                        >
                          <img src="/images/committee/ig-button.png" alt="" className="h-full w-full" />
                        </a>
                      ) : (
                        <span aria-hidden className="absolute opacity-45" style={CARD_IG}>
                          <img src="/images/committee/ig-button.png" alt="" className="h-full w-full" />
                        </span>
                      )}
                    </article>
                  )
                })}
              </div>
            )}

            <div className="relative z-10 mt-[6%]">
              <div className="flex items-center justify-center gap-[3%]">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                  className="w-[5.3%] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <img src="/images/committee/page-prev.png" alt="" className="w-full" />
                </button>
                <span className="font-bytebounce text-[20px] leading-none text-[#6b4a2d]">
                  {currentPage + 1}/{pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={currentPage >= pageCount - 1}
                  aria-label="Next page"
                  className="w-[5.3%] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <img src="/images/committee/page-next.png" alt="" className="w-full" />
                </button>
              </div>
              <p className="mt-[2%] text-center font-bytebounce text-[17px] leading-none text-[#8a7355]">
                {collected}/{divisionMembers.length} collected
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
