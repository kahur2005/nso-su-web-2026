// app/(game)/info/clubs/page.tsx
// UKM CLUBS page — parchment tiles grid matching Figma pixel art reference.
'use client'
import { useEffect, useMemo, useState } from 'react'
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
  const [slide, setSlide] = useState(0)
  // A club row written before the images column existed can come back null.
  const images = club.images ?? []
  const count = images.length

  // `count` is 0 for a club with no uploaded images; the modulo would be NaN,
  // so bail out and let the carousel block render nothing instead.
  const prev = () => count && setSlide((s) => (s - 1 + count) % count)
  const next = () => count && setSlide((s) => (s + 1) % count)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[85vh] origin-center scale-[1.12] overflow-y-auto rounded border-2 border-[#b08a5e] bg-[#f5e7c6] p-5 shadow-2xl sm:max-h-[90vh] sm:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 font-bytebounce text-lg text-[#5d4330] hover:text-[#a04040]"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={icon}
            alt={club.name}
            className="w-20 h-20 object-contain mb-3"
            style={{ imageRendering: 'pixelated' }}
          />
          <h2 className="font-bytebounce text-fluid-2xl text-[#3e2723] leading-tight">
            {club.name}
          </h2>
          <span className="font-bytebounce text-fluid-xs text-[#8a5c2e] uppercase mt-0.5">
            {club.category}
          </span>
          {/* Photo carousel — hidden entirely when the club has no images */}
          {count > 0 && (
            <div className="relative mt-4 w-full">
              <img
                src={images[slide]}
                alt={`${club.name} photo ${slide + 1} of ${count}`}
                className="w-full h-44 object-cover rounded-sm border-2 border-[#3a2418]"
              />
              {count > 1 && (
                <>
                  {/* Same pixel arrows the committee/guidebook pagers use.
                      They sit on a parchment chip so the dark pixel art stays
                      readable over an arbitrary photo. */}
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous photo"
                    className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm border-2 border-[#3a2418] bg-[#f5e7c6]/90 transition-transform hover:bg-[#fdf6e3] active:translate-y-[calc(-50%+2px)]"
                  >
                    <img
                      src="/images/committee/page-prev.png"
                      alt=""
                      className="h-4 w-4 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next photo"
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm border-2 border-[#3a2418] bg-[#f5e7c6]/90 transition-transform hover:bg-[#fdf6e3] active:translate-y-[calc(-50%+2px)]"
                  >
                    <img
                      src="/images/committee/page-next.png"
                      alt=""
                      className="h-4 w-4 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </button>
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setSlide(i)}
                        aria-label={`Go to photo ${i + 1}`}
                        aria-current={i === slide}
                        className="h-2.5 w-2.5 border border-[#3a2418]"
                        style={{ backgroundColor: i === slide ? '#ffd23f' : '#5d4330' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <p className="font-bytebounce text-fluid-sm text-[#5d4330] leading-snug mt-3">
            {club.description || 'Join UKM clubs to connect with fellow students and develop your skills.'}
          </p>

          <div className="flex gap-2 w-full mt-5">
            {club.instagram && (
              <a
                href={club.instagram.startsWith('http') ? club.instagram : `https://instagram.com/${club.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 wood-plank py-2.5 font-bytebounce text-fluid-sm text-[#fff3d9] text-center"
              >
                📸 Instagram
              </a>
            )}
            {club.registrationUrl && (
              <a
                href={club.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 wood-plank py-2.5 font-bytebounce text-fluid-sm text-[#ffd23f] text-center"
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
  const [selected, setSelected] = useState<Club | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

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

  const visibleClubs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clubs
    return clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(q) ||
        club.category.toLowerCase().includes(q) ||
        club.description.toLowerCase().includes(q),
    )
  }, [clubs, query])

  return (
    <PageWrapper>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative game-column pb-28 pt-12">
        {/* Title */}
        <h1 className="title-gold text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85]">
          UKM CLUBS
        </h1>

        {/* Search */}
        <div className="relative mt-4">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bytebounce text-fluid-base text-[#8a5c2e]"
          >
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs..."
            aria-label="Search clubs"
            className="w-full rounded-md border-2 border-[#3a2418] bg-[#fdf6e3] py-2 pl-10 pr-10 font-bytebounce text-fluid-base text-[#3e2723] placeholder:text-[#a08a6e] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 font-bytebounce text-fluid-base text-[#5d4330] hover:text-[#a04040]"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="LOADING CLUBS..." />
          </div>
        ) : visibleClubs.length === 0 ? (
          <p className="mt-10 text-center font-bytebounce text-fluid-md text-[#fff3d9]">
            NO CLUBS MATCH &quot;{query.trim()}&quot;
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {visibleClubs.map((club) => {
              const icon = getClubIcon(club)
              return (
                <button
                  key={club.id}
                  onClick={() => setSelected(club)}
                  className="px-6 py-5 flex flex-col items-center justify-center transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.97]"
                  style={{
                    // The parchment frame is baked into the art (border + fill),
                    // so it is stretched to the tile rather than tiled or
                    // cropped — the pixel border must reach every edge.
                    backgroundImage: 'url(/images/clubs/background-clubs.png)',
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                  }}
                >
                  <img
                    src={icon}
                    alt={club.name}
                    className="w-14 h-14 object-contain mb-2"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <p className="font-bytebounce text-fluid-base text-[#3e2723] leading-tight text-center px-2.5 w-full break-words">
                    {club.name}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        // Keyed on the club so the carousel's slide index resets when a
        // different club is opened rather than carrying over.
        <ClubDetailModal key={selected.id} club={selected} onClose={() => setSelected(null)} />
      )}
    </PageWrapper>
  )
}
