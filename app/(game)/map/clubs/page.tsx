// app/(game)/map/clubs/page.tsx
// UKM CLUBS page — parchment tiles grid matching Figma pixel art reference.
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Club = {
  id: string
  name: string
  iconUrl: string | null
  category: string
  description: string
  images: string[]
  instagram: string | null
  registrationUrl: string | null
}

/* Local fallback icon mapping based on club name */
const CLUB_ICONS: Record<string, string> = {
  'archery': '/images/clubs/archery 2.png',
  'badminton': '/images/clubs/raket 2.png',
  'basketball': '/images/clubs/basketball 1.png',
  'futsal': '/images/clubs/soccer 1.png',
  'e-sports': '/images/clubs/game 1.png',
  'serafvoce': '/images/clubs/notes 1.png',
  'stadium': '/images/clubs/cactus 2.png',
  'summer': '/images/clubs/gitar 1.png',
  'cactus': '/images/clubs/cactus 2.png',
  'ldk syamil': '/images/clubs/raket 2.png',
  'creative house': '/images/clubs/cactus 2.png',
  'japanese': '/images/clubs/nihon 1.png',
  'imeche': '/images/clubs/cactus 2.png',
  'devstub': '/images/clubs/devstub 1.png',
  'apssu': '/images/clubs/appsu 1.png',
  'sounds': '/images/clubs/sounds 2.png',
  'business': '/images/clubs/cactus 2.png',
  'young investor': '/images/clubs/stock 1.png',
  'ieom': '/images/clubs/cactus 2.png',
}

function getClubIcon(club: Club): string {
  if (club.iconUrl) return club.iconUrl
  const key = club.name.toLowerCase().trim()
  return CLUB_ICONS[key] ?? '/images/clubs/cactus 2.png'
}

/* Default mock data matching the Figma list if DB has no records */
const DEFAULT_CLUBS: Club[] = [
  { id: '1', name: 'Archery', iconUrl: null, category: 'Sports', description: 'Master precision and focus with the SU Archery Club.', images: [], instagram: null, registrationUrl: null },
  { id: '2', name: 'Badminton', iconUrl: null, category: 'Sports', description: 'High energy smash & rally on the courts.', images: [], instagram: null, registrationUrl: null },
  { id: '3', name: 'Basketball', iconUrl: null, category: 'Sports', description: 'Hoop, dribble, and dominate the court.', images: [], instagram: null, registrationUrl: null },
  { id: '4', name: 'Futsal', iconUrl: null, category: 'Sports', description: 'Fast-paced indoor soccer team.', images: [], instagram: null, registrationUrl: null },
  { id: '5', name: 'E-Sports', iconUrl: null, category: 'Gaming', description: 'Competitive gaming, tournaments, and streaming.', images: [], instagram: null, registrationUrl: null },
  { id: '6', name: 'SerafVoce', iconUrl: null, category: 'Music', description: 'Sampoerna University choir and vocal ensemble.', images: [], instagram: null, registrationUrl: null },
  { id: '7', name: 'STADIUM', iconUrl: null, category: 'Social', description: 'Student fellowship and community service.', images: [], instagram: null, registrationUrl: null },
  { id: '8', name: 'SUMMER', iconUrl: null, category: 'Music', description: 'SU Music Movement & live band performances.', images: [], instagram: null, registrationUrl: null },
  { id: '9', name: 'Cactus', iconUrl: null, category: 'Arts', description: 'Creative design, visual arts & photography.', images: [], instagram: null, registrationUrl: null },
  { id: '10', name: 'LDK Syamil', iconUrl: null, category: 'Social', description: 'Islamic student association & community.', images: [], instagram: null, registrationUrl: null },
  { id: '11', name: 'Creative House', iconUrl: null, category: 'Arts', description: 'Digital media creation, branding & video.', images: [], instagram: null, registrationUrl: null },
  { id: '12', name: 'Japanese', iconUrl: null, category: 'Culture', description: 'Anime, language, cosplay, and Japanese culture.', images: [], instagram: null, registrationUrl: null },
  { id: '13', name: 'IMechE', iconUrl: null, category: 'Academic', description: 'Institution of Mechanical Engineers student chapter.', images: [], instagram: null, registrationUrl: null },
  { id: '14', name: 'DevStuB', iconUrl: null, category: 'Technology', description: 'Developer Student Club & software engineering.', images: [], instagram: null, registrationUrl: null },
  { id: '15', name: 'APSSU', iconUrl: null, category: 'Academic', description: 'Association of Psychology Students SU.', images: [], instagram: null, registrationUrl: null },
  { id: '16', name: 'SOUNDS', iconUrl: null, category: 'Music', description: 'Sound engineering, DJing, and audio production.', images: [], instagram: null, registrationUrl: null },
  { id: '17', name: 'Business', iconUrl: null, category: 'Academic', description: 'Entrepreneurship, case competitions & startups.', images: [], instagram: null, registrationUrl: null },
  { id: '18', name: 'Young Investor', iconUrl: null, category: 'Academic', description: 'Capital market investment & stock trading club.', images: [], instagram: null, registrationUrl: null },
  { id: '19', name: 'IEOM', iconUrl: null, category: 'Academic', description: 'Industrial Engineering and Operations Management.', images: [], instagram: null, registrationUrl: null },
]

function ClubDetailModal({ club, onClose }: { club: Club; onClose: () => void }) {
  const icon = getClubIcon(club)
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded border-2 border-[#b08a5e] bg-[#f5e7c6] p-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 font-bytebounce text-lg text-[#5d4330] hover:text-[#a04040]"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt={club.name}
            className="w-20 h-20 object-contain mb-3"
            style={{ imageRendering: 'pixelated' }}
          />
          <h2 className="font-bytebounce text-[26px] text-[#3e2723] leading-tight">
            {club.name}
          </h2>
          <span className="font-bytebounce text-[14px] text-[#8a5c2e] uppercase mt-0.5">
            {club.category}
          </span>
          <p className="font-bytebounce text-[15px] text-[#5d4330] leading-snug mt-3">
            {club.description || 'Join UKM clubs to connect with fellow students and develop your skills.'}
          </p>

          <div className="flex gap-2 w-full mt-5">
            {club.instagram && (
              <a
                href={club.instagram.startsWith('http') ? club.instagram : `https://instagram.com/${club.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 wood-plank py-2.5 font-bytebounce text-[16px] text-[#fff3d9] text-center"
              >
                📸 Instagram
              </a>
            )}
            {club.registrationUrl && (
              <a
                href={club.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 wood-plank py-2.5 font-bytebounce text-[16px] text-[#ffd23f] text-center"
              >
                📝 Register
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UkmClubsPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Club | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clubs')
      .then((r) => r.json())
      .then((d) => {
        const fetched = d.clubs ?? []
        setClubs(fetched.length > 0 ? fetched : DEFAULT_CLUBS)
      })
      .catch(() => setClubs(DEFAULT_CLUBS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      {/* ── Forest background ── */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative mx-auto w-full max-w-md px-3 pb-28 pt-12 lg:max-w-lg">

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

        {/* Cyan title matching Figma */}
        <h1
          className="text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85] text-[#43F6FF]"
          style={{
            textShadow:
              '3px 3px 0 #3e2723, -3px 3px 0 #3e2723, 3px -3px 0 #3e2723, -3px -3px 0 #3e2723, 0 5px 0 #3e2723',
          }}
        >
          UKM CLUBS
        </h1>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="LOADING CLUBS..." />
          </div>
        ) : (
          /* 2-column parchment grid matching Figma screenshot */
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {clubs.map((club) => {
              const icon = getClubIcon(club)
              return (
                <button
                  key={club.id}
                  onClick={() => setSelected(club)}
                  className="rounded border-2 border-[#b08a5e] bg-[#fdf3e3] p-4 flex flex-col items-center justify-center transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.97]"
                  style={{ boxShadow: '2px 2px 0 #3e2723' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon}
                    alt={club.name}
                    className="w-16 h-16 object-contain mb-2"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <p className="font-bytebounce text-[20px] text-[#3e2723] leading-tight text-center">
                    {club.name}
                  </p>
                </button>
              )
            })}
          </div>
        )}

      </div>

      {selected && <ClubDetailModal club={selected} onClose={() => setSelected(null)} />}
    </PageWrapper>
  )
}
