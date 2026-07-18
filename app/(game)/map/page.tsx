// app/(game)/map/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import Link from 'next/link'

interface InfoTile {
  href: string
  img: string
  label: string
}

// Tile art (banner + icon + text) is exported straight from the Figma frame.
const tiles: InfoTile[] = [
  {
    href: '/map/guidebook',
    img: '/images/map/tile-guidebook.png',
    label: 'Guide Book — survival tips for SU life',
  },
  {
    href: '/map/committee',
    img: '/images/map/tile-committee.png',
    label: "NSO'26 Committee — the team behind NSO26",
  },
  {
    href: '/map/timeline',
    img: '/images/map/tile-timeline.png',
    label: 'Timeline — day-by-day event agenda',
  },
  {
    href: '/map/clubs',
    img: '/images/map/tile-clubs.png',
    label: 'UKM Clubs — explore student clubs',
  },
  {
    href: '/map/zones',
    img: '/images/map/tile-map.png',
    label: 'Map — campus zones & scan spots',
  },
]

export default function InfoHubPage() {
  return (
    <PageWrapper>
      {/* min-h = viewport minus navbar (~60px) + bottom-nav clearance (7rem),
          so the info station centers vertically in the visible area */}
      <div className="mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-md flex-col justify-center px-3 py-2 lg:max-w-lg">
        {/* Header */}
        <h1 className="text-center font-bytebounce text-[clamp(2.75rem,15vw,4rem)] leading-none text-[#d7a717]">
          INFO STATION
        </h1>
        <p className="mx-auto mt-1 max-w-[280px] text-center font-bytebounce text-[17px] leading-tight text-[#7d5a3d]">
          Everything you need to know to survive NSO 2026
        </p>

        {/* Parchment scroll with tile banners — translated up so the title
            and subtitle keep their position (transform doesn't affect flow) */}
        <div className="relative mt-2 -translate-y-8">
          <img src="/images/map/scroll.png" alt="" aria-hidden className="w-full" />
          <nav
            aria-label="Info station"
            className="absolute bottom-[14.1%] left-[15%] right-[15%] top-[13.8%] flex flex-col justify-between"
          >
            {tiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                aria-label={tile.label}
                className="block transition-transform duration-100 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]"
              >
                <img src={tile.img} alt="" className="w-full" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </PageWrapper>
  )
}
