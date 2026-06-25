// app/(game)/map/committee/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────────────────
 * EDIT COMMITTEE HERE
 *   - image:     member photo (placeholder mb_dini.webp for now)
 *   - instagram: full IG profile URL (placeholder '#' for now)
 *   - ngl:       NGL link (placeholder '#' for now)
 * Add / remove members inside each division's `members` array.
 * ──────────────────────────────────────────────────────────────────────── */
type Member = {
  name: string
  position: string
  image: string
  instagram: string
  ngl: string
}

type Division = {
  name: string
  icon: string
  color: string
  members: Member[]
}

const PHOTO = '/images/mb_dini.webp'

const mk = (name: string, position: string): Member => ({
  name,
  position,
  image: PHOTO,
  instagram: '#',
  ngl: '#',
})

const divisions: Division[] = [
  {
    name: 'MAINBOARD',
    icon: '👑',
    color: '#FFD700',
    members: [
      mk('Dini', 'Project Director'),
      mk('Dini', 'Vice Director'),
      mk('Dini', 'Secretary'),
      mk('Dini', 'Treasurer'),
    ],
  },
  {
    name: 'EVENT DIVISION',
    icon: '🎪',
    color: '#4CAF50',
    members: [
      mk('Dini', 'Event Head'),
      mk('Dini', 'Event Vice Head'),
      mk('Dini', 'Event Member'),
      mk('Dini', 'Event Member'),
    ],
  },
  {
    name: 'CREATIVE DIVISION',
    icon: '🎨',
    color: '#E91E63',
    members: [
      mk('Dini', 'Creative Head'),
      mk('Dini', 'Creative Vice Head'),
      mk('Dini', 'Designer'),
      mk('Dini', 'Designer'),
    ],
  },
  {
    name: 'IT & LOGI DIVISION',
    icon: '💻',
    color: '#2196F3',
    members: [
      mk('Dini', 'IT & Logi Head'),
      mk('Dini', 'IT & Logi Vice Head'),
      mk('Dini', 'Developer'),
      mk('Dini', 'Logistics'),
    ],
  },
  {
    name: 'PUBDOC DIVISION',
    icon: '📸',
    color: '#9C27B0',
    members: [
      mk('Dini', 'PubDoc Head'),
      mk('Dini', 'PubDoc Vice Head'),
      mk('Dini', 'Photographer'),
      mk('Dini', 'Content Writer'),
    ],
  },
  {
    name: 'GROUP LEADERS',
    icon: '🚩',
    color: '#FF9800',
    members: [
      mk('Dini', 'Group Leader'),
      mk('Dini', 'Group Leader'),
      mk('Dini', 'Group Leader'),
      mk('Dini', 'Group Leader'),
    ],
  },
]
/* ──────────────────────────────────────────────────────────────────────── */

export default function CommitteePage() {
  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/map"
            className="font-pixel text-xs text-green-400 hover:text-green-300">
            ‹ BACK
          </Link>
          <h1 className="font-pixel text-lg text-yellow-400 text-center flex-1"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🎖️ COMMITTEE
          </h1>
          <span className="w-12" />
        </div>

        <p className="font-pixel text-xs text-gray-400 text-center mb-8">
          THE TEAM BEHIND NSO 2026
        </p>

        {divisions.map((division) => (
          <div key={division.name} className="mb-10">
            {/* Division divider + name */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">{division.icon}</span>
              <h2 className="font-pixel text-sm uppercase whitespace-nowrap"
                style={{ color: division.color }}>
                {division.name}
              </h2>
              <div className="flex-1 h-1 border-b-2 border-black"
                style={{ backgroundColor: `${division.color}55` }} />
            </div>

            {/* Member cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {division.members.map((member, index) => (
                <PixelCard key={index} className="bg-gray-800" glowColor={division.color}>
                  <div className="flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full aspect-square object-cover border-2 border-black mb-3"
                    />
                    <p className="font-pixel text-xs text-white leading-tight">
                      {member.name}
                    </p>
                    <p className="font-pixel text-[8px] mt-1" style={{ color: division.color }}>
                      {member.position.toUpperCase()}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-3 w-full">
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center font-pixel text-[8px] text-white py-2
                          border-2 border-black hover:opacity-90 transition-opacity"
                        style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', boxShadow: '2px 2px 0 #000' }}
                      >
                        📸 IG
                      </a>
                      <a
                        href={member.ngl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center font-pixel text-[8px] text-white bg-purple-600
                          py-2 border-2 border-black hover:bg-purple-500 transition-colors"
                        style={{ boxShadow: '2px 2px 0 #000' }}
                      >
                        💬 NGL
                      </a>
                    </div>
                  </div>
                </PixelCard>
              ))}
            </div>
          </div>
        ))}

      </div>
    </PageWrapper>
  )
}
