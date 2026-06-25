// app/(game)/map/guidebook/page.tsx
'use client'
import { useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────────────────
 * EDIT GUIDE BOOK CONTENT HERE
 * Each entry: { icon, title, body[] } — body is a list of paragraphs.
 * ──────────────────────────────────────────────────────────────────────── */
type GuideEntry = {
  icon: string
  title: string
  color: string
  body: string[]
}

const guide: GuideEntry[] = [
  {
    icon: '💬',
    title: 'How to Talk to People in SU',
    color: '#4CAF50',
    body: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Start with a smile and a simple greeting — most seniors are happy to help newcomers.',
      'Ask open questions about their course, clubs, and favourite spots on campus. Listen more than you speak.',
      'Donec euismod, nisi vel consectetur euismod, nunc nisi aliquam nunc, vitae aliquam nisi nunc vitae nisi.',
    ],
  },
  {
    icon: '✅',
    title: "Do's and Don'ts as an SU Student",
    color: '#FFD700',
    body: [
      "DO: Attend your orientation sessions, keep your student ID with you, and respect campus facilities.",
      "DON'T: Skip safety briefings, share your login with others, or litter around campus zones.",
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    ],
  },
  {
    icon: '📄',
    title: 'CV and Interview',
    color: '#2196F3',
    body: [
      'Keep your CV to one page during your first year. Highlight activities, volunteering, and any club leadership.',
      'For interviews: research the role, prepare two or three questions, and practise a 30-second self-introduction.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
    ],
  },
]
/* ──────────────────────────────────────────────────────────────────────── */

export default function GuideBookPage() {
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/map"
            className="font-pixel text-xs text-green-400 hover:text-green-300">
            ‹ BACK
          </Link>
          <h1 className="font-pixel text-lg text-yellow-400 text-center flex-1"
            style={{ textShadow: '3px 3px 0 #000' }}>
            📔 GUIDE BOOK
          </h1>
          <span className="w-12" />
        </div>

        {/* Collapsible topics */}
        <div className="space-y-3">
          {guide.map((entry, index) => {
            const isOpen = open.has(index)
            return (
              <PixelCard key={index} className="bg-gray-800" glowColor={isOpen ? entry.color : undefined}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span className="w-10 h-10 border-2 border-black flex items-center
                    justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${entry.color}33`, boxShadow: '3px 3px 0 #000' }}>
                    {entry.icon}
                  </span>
                  <span className="font-pixel text-xs flex-1" style={{ color: entry.color }}>
                    {entry.title}
                  </span>
                  <span className={`font-pixel text-lg text-yellow-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t-2 border-gray-700 pt-4">
                    {entry.body.map((para, pIndex) => (
                      <p key={pIndex} className="font-pixel text-xs text-gray-300 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </PixelCard>
            )
          })}
        </div>

      </div>
    </PageWrapper>
  )
}
