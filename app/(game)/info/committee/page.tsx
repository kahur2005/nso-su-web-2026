// app/(game)/info/committee/page.tsx
// Committee introduction page — pixel parchment scroll with colour-coded division bookmarks,
// ribbon banners, name plaques, fun-fact progress, and Instagram links.
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

/** Gold display text with the design's brown pixel outline. */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

// Card metrics. The card is no longer a fixed 245:115 box — it grows downward
// to fit its fun fact, which runs anywhere from 11 to 260 characters and used
// to overflow the frame and draw over the member below. Everything here was
// originally a percentage of the card's *height*, which drifts once the height
// is content-driven, so vertical values are `cqw` instead: 1cqw = 1% of the
// card's width, which is what the art actually scales with. To convert an old
// value: oldPercentOfHeight * 115 / 245.
const CARD_MIN_ASPECT = '46.94%' // 115/245 — the frame's drawn proportions, now a floor
// Anchored top *and* bottom rather than given a height, so the portrait
// stretches with the card instead of floating at a fixed size on a tall one:
// the head stays tucked under the name plaque, the feet stay on the card's
// floor, and the person scales up with everything else. The committee photos
// are near-square cut-outs (640x640) whose subject sits in a tall centre strip
// with 17-45% of the width transparent, so `object-cover` scales them by the
// box height and eats that empty margin rather than the person.
const CARD_PORTRAIT = { left: '1.5%', top: '-1.92cqw', bottom: '3.42cqw', width: '32%' }
const CARD_PLAQUE = { left: '28%', top: '-0.40cqw', width: '47%', height: '15.55cqw' }
const CARD_PILL = { left: '26.5%', top: '11.40cqw', width: '48.5%', height: '9.16cqw' }
const CARD_IG = { left: '76.14%', top: '-0.62cqw', width: '15.78%', height: '14.50cqw' }
const CARD_NAME = { left: '30%', right: '27%', top: '7.57cqw' }
const CARD_ROLE = { left: '27.5%', right: '27%', top: '15.18cqw' }
// The fun fact is the one thing in normal flow, so it is what sets the height.
// The top padding clears the name plaque and division pill above it. The bottom
// padding is 7cqw rather than the old 6%-of-height, because the original box
// ended *inside* the frame's 14px bottom border — harmless when the text was
// short and vertically centred, but now that a long fact fills the box to the
// last line, that last line would sit on the border.
const CARD_FACT = { marginLeft: '29%', marginRight: '5%', paddingTop: '21.12cqw', paddingBottom: '7cqw' }

// `card-frame.png` 9-sliced, so the card can be any height without the border
// stretching. Slices are source px, in CSS order top/right/bottom/left: 31 is
// the 17px transparent strip above the frame plus its 8px border, 4px gap and
// 2px inner line; 14 is that same border/gap/line on the left. Right and bottom
// are larger (25/26) on purpose — the little triangle ornament sits at
// x=220..230, y=89..95, so those slices pull it into the bottom-right *corner*
// piece, which is drawn at a fixed size, instead of leaving it in an edge piece
// that stretches. Border widths are cqw so the frame keeps its pixel
// proportions at every card size.
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

// The scroll art is mostly transparent padding: `scroll-mid.png` is 420px wide
// but its parchment body is only x=58..364 of that, 73%. Rendered at the block
// width, that wasted ~27% is why the parchment looked narrow on a phone — the
// block was already 350px on a 390px screen, the parchment just drew 255px of
// it. So the art layer is stretched past the block by SCROLL_ART_BLEED on each
// side, sized so the *parchment body* lines up with the block edges instead:
// 100 / 72.86 = 1.3717x wider, i.e. 18.59% beyond each edge.
//
// Everything below is therefore a percentage of the parchment, not of the
// image. Converting an old value: (old% - 13.81) / 72.86 * 100. The vertical
// paddings scale by the same 1.3717, because they exist to clear the top and
// bottom rolls, and those rolls grew with the art.
const SCROLL_ART_BLEED = '18.59%'
const RIBBON = { left: '3.64%', width: '94.14%' }
const CARD_COLUMN = { marginLeft: '11.86%', width: '80.04%', marginTop: '-3.43%' }
const SCROLL_PAD_TOP = '22.04%'
const SCROLL_PAD_BOTTOM = '20.58%'
const RIBBON_TITLE_CENTRE = '38.1%'

// Room the scroll has to leave itself, as a share of the game column. The art
// overhangs the parchment on both sides and neither overhang scales with it:
// the bottom roll's curl sticks out 7.8% of the parchment width to the left,
// and the division bookmarks are a fixed 52px hanging off the right edge. The
// two edges are set by different viewports: the bookmarks are tightest on the
// narrowest phone (360px, where they land ~4px clear of the screen), the curl
// is tightest at 448px, where the game column stops growing but its own offset
// from the screen edge does not yet.
const SCROLL_MARGIN_LEFT = '2.6%'
const SCROLL_MARGIN_RIGHT = '11.5%'

function instagramHref(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
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
          className="mt-1 text-center font-bytebounce text-[19px] leading-tight text-white"
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
            // `left-full` — the parchment now ends at the block's right edge,
            // and these tabs hang off it exactly as before.
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
                    // `grid` with both flow children in the same cell: the row is
                    // as tall as the taller of the two, so the spacer sets a
                    // floor and the fun fact pushes past it when it needs to.
                    // `@container` makes the card the reference for every cqw
                    // inside it.
                    <article key={member.id} className="@container relative grid w-full">
                      {/* Height floor. Percentage padding resolves against this
                          card's width, so it is an aspect ratio, not a fixed
                          height — short fun facts keep the original card. */}
                      <div
                        aria-hidden
                        className="col-start-1 row-start-1 w-0"
                        style={{ paddingTop: CARD_MIN_ASPECT }}
                      />

                      <div aria-hidden className="absolute inset-0" style={CARD_FRAME} />

                      {/* `relative` is load-bearing: the frame beside it is
                          positioned, so an unpositioned sibling would paint
                          underneath the frame's `fill` and the fact would
                          disappear behind the parchment. */}
                      <div
                        className="relative col-start-1 row-start-1 flex flex-col justify-center"
                        style={CARD_FACT}
                      >
                        <p
                          className={`text-center font-bytebounce text-[13px] leading-[1.05] ${
                            member.isScanned ? 'text-[#5d4330]' : 'text-[#b3a184]'
                          }`}
                        >
                          {member.isScanned ? `“${member.funFact}”` : '? ? ?'}
                        </p>
                      </div>

                      {/* Portrait cutout rendered underneath plaque & text */}
                      <div className="absolute z-0" style={CARD_PORTRAIT}>
                        <img
                          src={portrait}
                          alt={member.name}
                          className="h-full w-full object-contain object-bottom"
                        />
                      </div>

                      <img
                        src={`/images/committee/plaque-${active.id}.png`}
                        alt=""
                        aria-hidden
                        className="absolute z-10"
                        style={CARD_PLAQUE}
                      />
                      <img
                        src="/images/committee/division-pill.png"
                        alt=""
                        aria-hidden
                        className="absolute z-10"
                        style={CARD_PILL}
                      />
                      <div
                        className="absolute z-10 -translate-y-1/2 truncate font-bytebounce text-[17px] leading-none text-[#ffeccf]"
                        style={{ ...CARD_NAME, textShadow: '2px 2px 0 #3e2723' }}
                      >
                        {member.name}
                      </div>
                      <div
                        className="absolute z-10 -translate-y-1/2 truncate text-center font-bytebounce text-[12px] leading-none text-[#ffd23f]"
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
                          className="absolute z-10 transition-transform hover:scale-110 active:scale-95"
                          style={CARD_IG}
                        >
                          <img src="/images/committee/ig-button.png" alt="" className="h-full w-full" />
                        </a>
                      ) : (
                        <span aria-hidden className="absolute z-10 opacity-45" style={CARD_IG}>
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
