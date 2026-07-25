// app/(game)/info/guidebook/page.tsx
// Figma guidebook: parchment scroll + permanent sticky-note bookmark tabs on the right,
// rendering content on a yellow sticky-note sheet with 3-page pagination per chapter.
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'

type GuideEntry = {
  icon: string
  title: string
  noteColor: string     // sticky-note tab background color
  pages: string[][]     // pages[pageIndex] = array of paragraphs
}

const guide: GuideEntry[] = [
  {
    icon: '💬',
    title: 'How to Talk to People in SU',
    noteColor: '#f5e47b',
    pages: [
      [
        'Start with a smile and a simple greeting — most seniors are happy to help newcomers.',
        'Ask open questions about their course, clubs, and favourite spots on campus. Listen more than you speak.',
      ],
      [
        'Don’t be afraid to introduce yourself to group members and committee NPCs around campus.',
        'Collect fun facts and exchange advice on surviving orientation week!',
      ],
      [
        'Keep an eye out for group events and campus challenges to bond with your guild.',
        'Networking early helps you form study groups and lasting friendships.',
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
        "DO: Scan QR codes on committee members to collect fun facts and earn XP for your guild.",
        "DON'T: Forget to log in daily and complete available quests before their deadlines.",
      ],
      [
        "DO: Ask questions when lost — committee members and mentors are here to guide you.",
        "DON'T: Panic! Orientation is designed to be fun and help you transition smoothly.",
      ],
    ],
  },
  {
    icon: '📄',
    title: 'CV and Interview Tips',
    noteColor: '#f5b8a8',
    pages: [
      [
        'Keep your CV to one page during your first year. Highlight activities, volunteering, and any club leadership.',
        'For interviews: research the role, prepare two or three questions, and practise a 30-second self-introduction.',
      ],
      [
        'Tailor your experience to match the position or club you are applying for.',
        'Focus on key achievements and specific outcomes rather than just listing responsibilities.',
      ],
      [
        'Dress appropriately and arrive 10 minutes early for any interview or committee screening.',
        'Send a brief thank-you note or message afterwards to leave a positive impression.',
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
        'Explore all zones during NSO 2026 to discover secret scan spots and complete landmark quests.',
      ],
      [
        'The Cafeteria is the prime spot for socializing and meeting committee NPCs during lunch hours.',
        'The Library offers quiet study areas and research materials for your academic journey.',
      ],
      [
        'Visit the Student Center to learn about UKM clubs, sports teams, and creative organizations.',
        'Check out the Auditorium for orientation ceremonies, guest lectures, and student performances.',
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

  const active = guide[activeIdx]
  const totalPages = active.pages.length
  const pageContent = active.pages[pageIdx] ?? []

  const selectChapter = (idx: number) => {
    setActiveIdx(idx)
    setPageIdx(0)
  }

  return (
    <PageWrapper>
      <div className="relative game-column pb-4 pt-12">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/info')}
          aria-label="Back to info station"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
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

        {/* Book layout */}
        <div className="relative mt-4">
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

          {/* Sticky-note tabs */}
          <div
            className="absolute left-[86.6%] top-[16%] z-20 flex flex-col gap-[10px]"
            role="tablist"
            aria-label="Guide book chapters"
          >
            {guide.map((entry, idx) => {
              const isActive = idx === activeIdx
              return (
                <button
                  key={idx}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={entry.title}
                  title={entry.title}
                  onClick={() => selectChapter(idx)}
                  className={`flex items-center justify-center text-xl rounded-l border-2 border-r-0 border-[#3e2723] transition-all duration-150 ${
                    isActive
                      ? 'w-[52px] h-[40px] brightness-110 shadow-[-3px_2px_0_#3e2723]'
                      : 'w-[36px] h-[40px] brightness-90 hover:w-[44px] hover:brightness-100'
                  }`}
                  style={{ backgroundColor: entry.noteColor }}
                >
                  {entry.icon}
                </button>
              )
            })}
          </div>

          {/* Content sheet */}
          <div className="relative" style={{ paddingTop: '16%', paddingBottom: '15%' }}>
            <div className="mx-[12%]">
              <div
                className="rounded-lg border-2 border-[#3e2723] p-5 shadow-[4px_4px_0_#3e2723] transition-colors"
                style={{ backgroundColor: active.noteColor }}
              >
                <div className="flex items-center gap-2 mb-3 border-b-2 border-[#3e2723]/30 pb-2">
                  <span className="text-2xl">{active.icon}</span>
                  <h2 className="font-bytebounce text-[clamp(18px,5.5vw,23px)] leading-tight text-[#3e2723]">
                    {active.title}
                  </h2>
                </div>

                <div className="space-y-3 min-h-[130px]">
                  {pageContent.map((para, i) => (
                    <p
                      key={i}
                      className="font-bytebounce text-[15px] leading-snug text-[#2a170e]"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 pt-2 border-t border-[#3e2723]/20">
                  <button
                    onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                    disabled={pageIdx === 0}
                    aria-label="Previous page"
                    className="w-[8%] min-w-[28px] transition-transform active:translate-y-0.5 disabled:opacity-30"
                  >
                    <img src="/images/committee/page-prev.png" alt="" className="w-full" />
                  </button>
                  <span className="font-bytebounce text-[18px] leading-none text-[#3e2723]">
                    {pageIdx + 1}/{totalPages}
                  </span>
                  <button
                    onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={pageIdx >= totalPages - 1}
                    aria-label="Next page"
                    className="w-[8%] min-w-[28px] transition-transform active:translate-y-0.5 disabled:opacity-30"
                  >
                    <img src="/images/committee/page-next.png" alt="" className="w-full" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
