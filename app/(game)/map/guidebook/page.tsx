// app/(game)/map/guidebook/page.tsx
// Figma guidebook: parchment scroll + sticky-note tab selection on the right,
// 3-page system per subchapter with prev/next sprites, font-bytebounce throughout.
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'

/* ── Content ──────────────────────────────────────────────────────────────
 * Each entry: 3 pages of content. Add real copy here when ready.
 * ──────────────────────────────────────────────────────────────────────── */
type GuideEntry = {
  icon: string
  title: string
  noteColor: string     // sticky-note background color
  pages: string[][]     // pages[pageIndex] = array of paragraphs
}

const guide: GuideEntry[] = [
  {
    icon: '💬',
    title: 'How to Talk to People in SU',
    noteColor: '#f5e47b',
    pages: [
      [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Start with a smile and a simple greeting — most seniors are happy to help newcomers.',
        'Ask open questions about their course, clubs, and favourite spots on campus. Listen more than you speak.',
      ],
      [
        'Donec euismod, nisi vel consectetur euismod, nunc nisi aliquam nunc, vitae aliquam nisi nunc vitae nisi.',
        'Viverra nam libero justo laoreet sit amet cursus. Urna duis convallis convallis tellus id interdum velit laoreet.',
      ],
      [
        'At risus viverra adipiscing at in tellus integer feugiat. Varius morbi enim nunc faucibus a pellentesque sit.',
        'Tempus urna et pharetra pharetra massa massa ultricies mi quis. Eget velit aliquet sagittis id consectetur purus.',
      ],
    ],
  },
  {
    icon: '✅',
    title: "Do's and Don'ts as an SU Student",
    noteColor: '#a8d8a8',
    pages: [
      [
        "DO: Attend your orientation sessions, keep your student ID with you, and respect campus facilities.",
        "DON'T: Skip safety briefings, share your login with others, or litter around campus zones.",
      ],
      [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
      ],
      [
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      ],
    ],
  },
  {
    icon: '📄',
    title: 'CV and Interview',
    noteColor: '#f5b8a8',
    pages: [
      [
        'Keep your CV to one page during your first year. Highlight activities, volunteering, and any club leadership.',
        'For interviews: research the role, prepare two or three questions, and practise a 30-second self-introduction.',
      ],
      [
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
      ],
      [
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Sunt in culpa qui officia deserunt mollit anim id est laborum. Excepteur sint occaecat cupidatat non proident.',
      ],
    ],
  },
  {
    icon: '🏛️',
    title: 'Campus Life at SU',
    noteColor: '#b8d4f5',
    pages: [
      [
        'Sampoerna University is located in South Jakarta. The campus has a library, cafeteria, labs, and a main auditorium.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
      ],
      [
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      ],
      [
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.',
      ],
    ],
  },
]

const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

export default function GuideBookPage() {
  const router = useRouter()
  const [activeIdx, setActiveIdx] = useState(0)
  const [pageIdx, setPageIdx] = useState(0)
  // Which sticky notes have been dismissed
  const [dismissed, setDismiss] = useState<Set<number>>(new Set())

  const active = guide[activeIdx]
  const totalPages = active.pages.length
  const pageContent = active.pages[pageIdx] ?? []

  const selectChapter = (idx: number) => {
    setActiveIdx(idx)
    setPageIdx(0)
  }

  const dismiss = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDismiss((prev) => {
      const next = new Set(prev)
      next.add(idx)
      return next
    })
    // If dismissing the active chapter, pick the next visible one
    if (idx === activeIdx) {
      const next = guide.findIndex((_, i) => i !== idx && !dismissed.has(i))
      if (next !== -1) selectChapter(next)
    }
  }

  return (
    <PageWrapper>
      <div className="relative mx-auto w-full max-w-md px-3 pb-4 pt-12 lg:max-w-lg">

        {/* Back button sprite */}
        <button
          type="button"
          onClick={() => router.push('/map')}
          aria-label="Back to info station"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        {/* Title */}
        <h1
          className="text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85]"
          style={OUTLINE_GOLD}
        >
          GUIDE BOOK
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[18px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          Survival tips for SU life
        </p>

        {/* ── Book layout: parchment left + sticky notes right ── */}
        <div className="relative mt-4">
          {/* Parchment scroll background */}
          <div aria-hidden className="absolute inset-0 flex flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/committee/scroll-top.png" alt="" className="w-full" />
            <div
              className="-my-px flex-1"
              style={{
                backgroundImage: 'url(/images/committee/scroll-mid.png)',
                backgroundRepeat: 'repeat-y',
                backgroundSize: '100% auto',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/committee/scroll-bottom.png" alt="" className="w-full" />
          </div>

          {/* Sticky notes on the right edge (same approach as division bookmarks) */}
          <div
            className="absolute left-[86%] top-[14%] z-20 flex flex-col gap-[8px]"
            role="tablist"
            aria-label="Guide book chapters"
          >
            {guide.map((entry, idx) => {
              if (dismissed.has(idx)) return null
              const isActive = idx === activeIdx
              return (
                <div key={idx} className="relative">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    aria-label={entry.title}
                    onClick={() => selectChapter(idx)}
                    className={`flex items-center justify-center text-lg rounded-l-sm border-2 border-r-0 border-[#b08a5e] transition-all duration-150 ${
                      isActive
                        ? 'w-[52px] h-[38px] brightness-110'
                        : 'w-[38px] h-[38px] brightness-90 hover:w-[45px] hover:brightness-100'
                    }`}
                    style={{ backgroundColor: entry.noteColor, boxShadow: '-2px 0 0 #b08a5e' }}
                  >
                    {entry.icon}
                  </button>
                  {/* Dismiss ✕ button */}
                  <button
                    onClick={(e) => dismiss(idx, e)}
                    aria-label={`Dismiss ${entry.title}`}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7d3a2e] border border-[#3e2723] text-white flex items-center justify-center leading-none hover:bg-[#a04040] transition-colors"
                    style={{ fontSize: '9px' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>

          {/* Scroll content */}
          <div className="relative" style={{ paddingTop: '16%', paddingBottom: '15%' }}>
            <div className="px-[14%]">
              {/* Chapter title */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{active.icon}</span>
                <h2
                  className="font-bytebounce text-[clamp(17px,5.5vw,22px)] leading-tight text-[#3e2723]"
                >
                  {active.title}
                </h2>
              </div>

              {/* Page content */}
              <div className="space-y-3 min-h-[140px]">
                {pageContent.map((para, i) => (
                  <p
                    key={i}
                    className="font-bytebounce text-[14px] leading-snug text-[#5d4330]"
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                  disabled={pageIdx === 0}
                  aria-label="Previous page"
                  className="w-[8%] min-w-[28px] transition-transform active:translate-y-0.5 disabled:opacity-30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/committee/page-prev.png" alt="" className="w-full" />
                </button>
                <span className="font-bytebounce text-[18px] leading-none text-[#6b4a2d]">
                  {pageIdx + 1}/{totalPages}
                </span>
                <button
                  onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIdx >= totalPages - 1}
                  aria-label="Next page"
                  className="w-[8%] min-w-[28px] transition-transform active:translate-y-0.5 disabled:opacity-30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/committee/page-next.png" alt="" className="w-full" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
