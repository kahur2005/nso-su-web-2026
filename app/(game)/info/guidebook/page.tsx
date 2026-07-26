// app/(game)/info/guidebook/page.tsx
// Figma guidebook: a full-bleed spiral-bound open book rendered as a vertical
// 3-slice (top cap / repeating ringed page / bottom cap) so it grows with the
// content, with eight colour-coded bookmark ribbons down the right gutter.
// The two controls are independent: a bookmark opens a chapter, and the pager
// under the page walks that chapter's own pages (so "1/7" means page 1 of 7
// inside the open bookmark, not bookmark 1 of 7).
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'

/* ── Design tokens lifted from the Figma frame ───────────────────────────── */

// Translucent panel tints (rgba straight from the design).
const TINT = {
  green: 'rgba(101,198,54,0.41)',
  red: 'rgba(242,93,93,0.36)',
  yellow: 'rgba(252,249,64,0.46)',
  blue: 'rgba(64,196,255,0.36)',
  purple: 'rgba(171,71,188,0.33)',
} as const

const INK_TITLE = '#543631' // section headings on the cream page
const INK_BODY = '#7d5a3d'  // list + notes copy
const INK_PAGER = '#88684e' // "1/7"

// The book art is 387px wide in Figma. Everything below is that px value as a
// percentage of the frame so the whole book scales with `.game-column`.
const PAGE = {
  contentLeft: '7.2%',   // x=28  — left edge of the content panels
  contentRight: '24.3%', // x=293 — panels stop before the tan gutter (x=304)
  bookmarkRight: '0.8%', // x=384 — ribbons run to the book's outer border
}

/* ── Content ─────────────────────────────────────────────────────────────── */

type Section = { title: string; tint: string; items: string[] }
/** One spread of the open book — what the pager steps through. */
type Page = { sections: Section[]; notes?: string[] }
type Chapter = {
  title: string
  /** Two-tone bookmark ribbon: dark stub tucked under the page, lighter tail. */
  bookmark: { dark: string; light: string }
  pages: Page[]
}

// Eight bookmarks, in the ribbon colours the Figma frame draws top-to-bottom.
// A bookmark selects a chapter; the pager under the page then walks that
// chapter's own pages, so the two controls are independent — a chapter can hold
// as many pages as its copy needs.
const chapters: Chapter[] = [
  {
    title: 'How To Talk To People in SU',
    bookmark: { dark: '#311b92', light: '#0d47a1' },
    pages: [
      {
        sections: [
          {
            title: 'How To Talk To\nPeople in SU',
            tint: TINT.green,
            items: [
              "Maintain positive body language and don't forget to smile!",
              'Introduce yourself with confidence.',
              'Be open-minded when meeting new people.',
              'Listen actively in conversations and show genuine interest.',
              'Show gratitude by saying "please" and "thank you".',
              'Treat everyone equally, regardless of their background, age, or achievements.',
            ],
          },
          {
            title: 'How NOT To Talk To\nPeople in SU',
            tint: TINT.red,
            items: [
              'Avoid making offensive jokes about race, religion, gender, or culture',
              "Respect people's privacy instead of pressuring them to share personal information",
              'Stay away from gossiping or spreading rumors.',
              'Refrain from interrupting people if not necessary',
              'Never act superior or compare yourself to others',
              'Avoid excluding others from conversations or group activities',
              'Own up to your own mistakes and apologize when necessary',
            ],
          },
        ],
        notes: [
          "Remember that everyone is new at some point, so don't be afraid to start conversations",
          'Building friendships takes time, small and consistent interactions matter the most.',
        ],
      },
    ],
  },
  {
    title: "Do's and Don'ts as an SU Student",
    bookmark: { dark: '#4caf50', light: '#65c636' },
    pages: [
      {
        sections: [
          {
            title: "Do's as an\nSU Student",
            tint: TINT.green,
            items: [
              'Attend every orientation session and arrive on time.',
              'Keep your student ID on you — you will need it all week.',
              'Respect campus facilities and clean up after yourself.',
              'Ask questions when you are lost; committee members are there to guide you.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Don'ts as an\nSU Student",
            tint: TINT.red,
            items: [
              "Don't skip the safety briefings.",
              "Don't share your login with anyone — your points travel with your account.",
              "Don't litter around the campus zones.",
              "Don't panic! Orientation is built to help you settle in.",
            ],
          },
        ],
        notes: ['Log in daily so you never miss a quest before its deadline.'],
      },
    ],
  },
  {
    title: 'CV and Interview Tips',
    bookmark: { dark: '#fbc94c', light: '#fcf940' },
    pages: [
      {
        sections: [
          {
            title: 'Writing\nYour CV',
            tint: TINT.yellow,
            items: [
              'Keep it to one page during your first year.',
              'Highlight activities, volunteering, and any club leadership.',
              'Tailor your experience to the position or club you are applying for.',
              'Focus on specific outcomes rather than a list of responsibilities.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Interview Day',
            tint: TINT.blue,
            items: [
              'Research the role and prepare two or three questions of your own.',
              'Practise a 30-second self-introduction until it feels natural.',
              'Dress appropriately and arrive 10 minutes early.',
              'Send a short thank-you message afterwards.',
            ],
          },
        ],
        notes: ['A clear, honest CV beats a padded one every time.'],
      },
    ],
  },
  {
    title: 'Campus Life at SU',
    bookmark: { dark: '#40c4ff', light: '#71dbfe' },
    pages: [
      {
        sections: [
          {
            title: 'Know Your\nCampus',
            tint: TINT.blue,
            items: [
              'Sampoerna University sits in South Jakarta, with a library, cafeteria, labs, and a main auditorium.',
              'The Cafeteria is the prime spot for socialising and meeting committee members at lunch.',
              'The Library has quiet study areas and research materials.',
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Where To\nSpend Time',
            tint: TINT.green,
            items: [
              'The Student Center is where UKM clubs, sports teams, and creative organisations gather.',
              'The Auditorium hosts ceremonies, guest lectures, and student performances.',
              'Every zone has its own atmosphere — find the one that suits how you study.',
            ],
          },
        ],
        notes: ['Explore every zone during NSO 2026 — some scan spots are tucked away on purpose.'],
      },
    ],
  },
  {
    title: 'Staying Safe & Getting Help',
    bookmark: { dark: '#311b92', light: '#0d47a1' },
    pages: [
      {
        sections: [
          {
            title: 'If Something\nGoes Wrong',
            tint: TINT.red,
            items: [
              'Tell your group leader first — they can reach the committee fastest.',
              'Note any medical condition on your profile so the team knows in advance.',
              'Stay with your group when moving between zones.',
              'Report lost items to the nearest committee member straight away.',
            ],
          },
        ],
        notes: ['Asking for help early is never a bother — it is what the committee is there for.'],
      },
    ],
  },
  {
    title: 'Scanning & Fun Facts',
    bookmark: { dark: '#8e24aa', light: '#ab47bc' },
    pages: [
      {
        sections: [
          {
            title: 'Collecting\nFun Facts',
            tint: TINT.purple,
            items: [
              'Committee members carry a QR code — scan it from the Scan tab to unlock their fun fact.',
              'Every fun fact you collect adds points and XP to your account.',
              'Each committee member can only be scanned once, so hunt for new faces.',
              'Everything you collect is stored in your Codex.',
            ],
          },
        ],
        notes: ['Some codes are shown live on a screen and refresh every minute — scan them while you are there.'],
      },
    ],
  },
  {
    title: 'Quests & Achievements',
    bookmark: { dark: '#558b2f', light: '#689f38' },
    pages: [
      {
        sections: [
          {
            title: 'Running\nQuests',
            tint: TINT.green,
            items: [
              'Quests are missions posted around campus, not tied to a single person.',
              'The whole quest board is visible from the start — plan your route.',
              'Some quests only open inside a time window; locked ones show when they unlock.',
              'Finishing a quest can award a badge on top of its points.',
            ],
          },
        ],
        notes: ['Badges live on your profile. Quests are the only way to earn them.'],
      },
    ],
  },
  {
    title: 'Your Guild & The Leaderboard',
    bookmark: { dark: '#26a695', light: '#4db6ac' },
    pages: [
      {
        sections: [
          {
            title: 'Climbing The\nLeaderboard',
            tint: TINT.yellow,
            items: [
              'Every point you earn also counts towards your group total.',
              'Group leaders can award points for challenges won during the day.',
              'Your XP raises your level — the curve doubles at every step, so keep scanning.',
              'Check the leaderboard often to see where your guild stands.',
            ],
          },
        ],
        notes: ['Bonus points earned as a team beat anything you can grind alone.'],
      },
    ],
  },
]

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function GuideBookPage() {
  const router = useRouter()
  // Two independent cursors: which bookmark is open, and where inside it.
  const [chapterIdx, setChapterIdx] = useState(0)
  const [pageIdx, setPageIdx] = useState(0)

  const chapter = chapters[chapterIdx]
  const totalPages = chapter.pages.length
  const page = chapter.pages[pageIdx]

  // Opening a bookmark always lands on that chapter's first page.
  const openChapter = (idx: number) => {
    setChapterIdx(idx)
    setPageIdx(0)
  }

  return (
    <PageWrapper>
      <div className="relative game-column pb-4 pt-8">
        {/* Back to the info hub — not in the Figma frame, kept so the /info
            hierarchy stays reachable on mobile where the navbar is collapsed. */}
        <button
          type="button"
          onClick={() => router.push('/info')}
          aria-label="Back to info station"
          className="absolute left-2 top-6 z-30 w-[52px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        {/* Title */}
        <h1
          className="text-center font-bytebounce text-[clamp(2.6rem,16vw,4rem)] leading-[0.9] text-[#ff7670]"
          style={{ textShadow: '2px 2px 0 #3e2723' }}
        >
          GUIDEBOOK
        </h1>

        {/* ── The book ─────────────────────────────────────────────────────
            Vertical 3-slice: a fixed top cap, a page tile that repeats (one
            spiral-ring period per tile, so the rings run the full height), and
            a fixed bottom cap. */}
        <div className="relative mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/guidebook/book-top.png" alt="" aria-hidden className="block w-full" />

          <div
            className="relative -my-px"
            style={{
              backgroundImage: 'url(/images/guidebook/book-page.png)',
              backgroundRepeat: 'repeat-y',
              backgroundSize: '100% auto',
            }}
          >
            {/* Bookmark ribbons — pinned to the right gutter, over the page. */}
            <div
              className="absolute top-8 z-20 flex flex-col gap-[14px]"
              style={{ right: PAGE.bookmarkRight }}
              role="tablist"
              aria-label="Guide book chapters"
            >
              {chapters.map((entry, idx) => {
                const isActive = idx === chapterIdx
                return (
                  <button
                    key={entry.title}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={entry.title}
                    title={entry.title}
                    onClick={() => openChapter(idx)}
                    className={`h-[32px] transition-all duration-150 ${
                      isActive
                        ? 'w-[82px] brightness-110'
                        : 'w-[70px] brightness-90 hover:w-[78px] hover:brightness-105'
                    }`}
                    style={{
                      // Dark stub where the ribbon disappears under the page,
                      // then the lighter tail — exactly the two overlapping
                      // rectangles from the design.
                      backgroundImage: `linear-gradient(90deg, ${entry.bookmark.dark} 0 28%, ${entry.bookmark.light} 28% 100%)`,
                    }}
                  />
                )
              })}
            </div>

            {/* Page content */}
            <div
              className="relative z-10 flex min-h-[420px] flex-col gap-3 py-4"
              style={{ paddingLeft: PAGE.contentLeft, paddingRight: PAGE.contentRight }}
            >
              {page.sections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-[11px] px-2 py-2.5"
                  style={{ backgroundColor: section.tint }}
                >
                  <h2
                    className="whitespace-pre-line text-center font-bytebounce text-[clamp(22px,7.6vw,30px)] leading-[0.78]"
                    style={{ color: INK_TITLE }}
                  >
                    {section.title}
                  </h2>
                  <ol
                    className="mt-1.5 list-decimal ps-6 font-bytebounce text-[16px] leading-[0.92]"
                    style={{ color: INK_BODY }}
                  >
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>
              ))}

              {page.notes && (
                <section
                  className="rounded-[11px] px-2 py-2"
                  style={{ backgroundColor: TINT.yellow }}
                >
                  <h3
                    className="font-bytebounce text-[20px] leading-none"
                    style={{ color: INK_BODY }}
                  >
                    📌 Notes
                  </h3>
                  <ul
                    className="mt-1 list-disc ps-5 font-bytebounce text-[15px] leading-[0.92]"
                    style={{ color: INK_BODY }}
                  >
                    {page.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pager — bottom-right of the page, as in the design. It walks
                  the open chapter's pages only; changing chapter is the
                  bookmarks' job. The frame only draws a forward arrow; a back
                  arrow is added so a chapter reads in both directions. */}
              <div className="mt-auto flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                  disabled={pageIdx === 0}
                  aria-label="Previous page"
                  className="w-[22px] shrink-0 transition-transform active:translate-y-0.5 disabled:opacity-25"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/committee/page-prev.png" alt="" className="w-full" />
                </button>
                <span
                  className="font-bytebounce text-[22px] leading-none"
                  style={{ color: INK_PAGER }}
                >
                  {pageIdx + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIdx((i) => Math.min(totalPages - 1, i + 1))}
                  disabled={pageIdx >= totalPages - 1}
                  aria-label="Next page"
                  className="w-[22px] shrink-0 transition-transform active:translate-y-0.5 disabled:opacity-25"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/committee/page-next.png" alt="" className="w-full" />
                </button>
              </div>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/guidebook/book-bottom.png" alt="" aria-hidden className="block w-full" />
        </div>
      </div>
    </PageWrapper>
  )
}
