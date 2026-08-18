'use client'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
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

const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

const CARD_MIN_ASPECT = '46.94%'
const CARD_PORTRAIT = {
  left: '-2%',
  top: '-18cqw',
  bottom: '1.5cqw',
  width: '46%',
}
const CARD_PLAQUE = { left: '16%', top: '-0.40cqw', width: '61%', height: '18.5cqw' }
const CARD_PILL = { left: '14.5%', top: '13.8cqw', width: '62.5%', height: '11.5cqw' }
const CARD_IG = { left: '76.14%', top: '-0.62cqw', width: '15.78%', height: '14.50cqw' }
const CARD_NAME = { left: '18%', right: '27%', top: '8.6cqw' }
const CARD_ROLE = { left: '16%', right: '27%', top: '18.8cqw' }
const CARD_FACT = {
  left: '40%',
  right: '5%',
  top: '26cqw',
  bottom: '12cqw',
}
const CARD_FACT_EXPANDED = {
  marginLeft: '40%',
  marginRight: '5%',
  paddingTop: '26cqw',
  paddingBottom: '14cqw',
}
const CARD_EXPAND_BTN = {
  right: '3.5%',
  bottom: '3.2%',
  width: '8cqw',
  minWidth: 24,
}

const CARD_FRAME = {
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderWidth: '12.65cqw 10.20cqw 10.61cqw 5.71cqw',
  borderImageSource: 'url(/images/committee/card-frame.png)',
  borderImageSlice: '31 25 26 14 fill',
  borderImageRepeat: 'stretch',
  filter:
    'drop-shadow(2px 0 0 #FAC875) drop-shadow(-2px 0 0 #FAC875) drop-shadow(0 2px 0 #FAC875) drop-shadow(0 -2px 0 #FAC875)',
} as const

const SCROLL_ART_BLEED = '18.59%'
const RIBBON = { left: '3.64%', width: '94.14%' }
const CARD_COLUMN = { marginLeft: '3%', width: '94%', marginTop: '-3.43%' }
const SCROLL_PAD_TOP = '22.04%'
const SCROLL_PAD_BOTTOM = '20.58%'
const RIBBON_TITLE_CENTRE = '38.1%'

const SCROLL_MARGIN_LEFT = '2.6%'
const SCROLL_MARGIN_RIGHT = '11.5%'

function instagramHref(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

function CommitteeMemberCard({
  member,
  divisionId,
}: {
  member: CommitteeMember
  divisionId: DivisionId
}) {
  const [expanded, setExpanded] = useState(false)
  const href = instagramHref(member.instagram)
  const portrait = member.imageUrl ?? '/images/committee/portrait-placeholder.png'
  const canExpand = member.isScanned

  return (
    <article className="@container relative z-0 grid w-full overflow-visible">
      <div
        aria-hidden
        className="col-start-1 row-start-1 w-0"
        style={{ paddingTop: CARD_MIN_ASPECT }}
      />

      <div aria-hidden className="absolute inset-0" style={CARD_FRAME} />

      {expanded && canExpand ? (
        <div
          className="relative z-[1] col-start-1 row-start-1 flex flex-col justify-center"
          style={CARD_FACT_EXPANDED}
        >
          <p className="w-full pr-[10%] text-center font-bytebounce text-[18px] leading-[0.5] text-[#5d4330]">
            {member.funFact}
          </p>
        </div>
      ) : (
        <div
          className="absolute z-[1] flex items-center justify-center overflow-hidden"
          style={CARD_FACT}
        >
          <p
            className={`w-full text-center font-bytebounce text-[18px] leading-[0.5] ${
              member.isScanned ? 'text-[#5d4330]' : 'text-[#b3a184]'
            } ${canExpand ? 'line-clamp-2 pr-[10%]' : ''}`}
          >
            {member.isScanned ? member.funFact : '? ? ?'}
          </p>
        </div>
      )}

      {canExpand && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Hide full fun fact for ${member.name}`
              : `Show full fun fact for ${member.name}`
          }
          onClick={() => setExpanded((v) => !v)}
          className="absolute z-20 flex items-center justify-center transition-transform active:translate-y-0.5"
          style={CARD_EXPAND_BTN}
        >
          {/* page-next points right; rotate to a down / up chevron */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/committee/page-next.png"
            alt=""
            className="w-full transition-transform duration-150"
            style={{
              transform: expanded ? 'rotate(-90deg)' : 'rotate(90deg)',
              imageRendering: 'pixelated',
            }}
          />
        </button>
      )}

      <div className="pointer-events-none absolute z-[15]" style={CARD_PORTRAIT}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait}
          alt={member.name}
          className="h-full w-full object-contain object-bottom drop-shadow-[2px_3px_0_rgba(62,39,35,0.35)]"
        />
      </div>

      {/* Ribbons sit under the portrait so the cut-out reads as popping out. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/committee/plaque-${divisionId}.png`}
        alt=""
        aria-hidden
        className="absolute z-[8]"
        style={CARD_PLAQUE}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/committee/division-pill.png"
        alt=""
        aria-hidden
        className="absolute z-[8]"
        style={CARD_PILL}
      />
      <div
        className="absolute z-[9] -translate-y-1/2 truncate font-bytebounce text-[24px] leading-none text-[#ffeccf]"
        style={{ ...CARD_NAME, textShadow: '2px 2px 0 #3e2723' }}
      >
        {member.name}
      </div>
      <div
        className="absolute z-[9] -translate-y-1/2 truncate text-center font-bytebounce text-[24px] leading-none text-[#ffd23f]"
        style={{ ...CARD_ROLE, textShadow: '1px 1px 0 #3a2418' }}
      >
        {member.role}
      </div>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} on Instagram`}
          className="absolute z-20 transition-transform hover:scale-110 active:scale-95"
          style={CARD_IG}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/committee/ig-button.png" alt="" className="h-full w-full" />
        </a>
      ) : (
        <span aria-hidden className="absolute z-20 opacity-45" style={CARD_IG}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/committee/ig-button.png" alt="" className="h-full w-full" />
        </span>
      )}
    </article>
  )
}

export default function CommitteePage() {
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
        {/* Header */}
        <h1 className="title-gold text-center font-bytebounce text-[clamp(2.6rem,13vw,3.4rem)] leading-[0.85]">
          COMMITTEE
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[24px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          The team behind NSO 2026
        </p>

        {/* Parchment scroll */}
        <div
          className="relative mt-2"
          style={{ marginLeft: SCROLL_MARGIN_LEFT, marginRight: SCROLL_MARGIN_RIGHT }}
        >
          <div
            aria-hidden
            className="absolute inset-y-0 flex flex-col"
            style={{ left: `-${SCROLL_ART_BLEED}`, right: `-${SCROLL_ART_BLEED}` }}
          >
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
            className="absolute left-full top-[25.7%] z-20 flex flex-col gap-[10px]"
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
          <div className="relative" style={{ paddingTop: SCROLL_PAD_TOP, paddingBottom: SCROLL_PAD_BOTTOM }}>
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
              <p className="relative z-10 mt-8 text-center font-bytebounce text-[24px] text-[#8a7355]">
                No members listed yet.
              </p>
            ) : (
              <div
                className="relative z-10 flex flex-col gap-[8%] overflow-visible"
                style={CARD_COLUMN}
              >
                {pageMembers.map((member) => (
                  <CommitteeMemberCard
                    key={member.id}
                    member={member}
                    divisionId={active.id}
                  />
                ))}
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
                <span className="font-bytebounce text-[24px] leading-none text-[#6b4a2d]">
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
              <p className="mt-[2%] text-center font-bytebounce text-[24px] leading-none text-[#8a7355]">
                {collected}/{divisionMembers.length} collected
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
