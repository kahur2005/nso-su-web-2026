import PageWrapper from '@/components/layout/PageWrapper'
import PageIntro from '@/components/onboarding/PageIntro'
import Link from 'next/link'

interface InfoTile {
  href: string
  img: string
  label: string
  tour: string
}

const tiles: InfoTile[] = [
  {
    href: '/info/guidebook',
    img: '/images/map/tile-guidebook.png',
    label: 'Guide Book — survival tips for SU life',
    tour: 'info-guidebook',
  },
  {
    href: '/info/committee',
    img: '/images/map/tile-committee.png',
    label: "NSO'26 Committee — the team behind NSO26",
    tour: 'info-committee',
  },
  {
    href: '/info/timeline',
    img: '/images/map/tile-timeline.png',
    label: 'Timeline — day-by-day event agenda',
    tour: 'info-timeline',
  },
  {
    href: '/info/clubs',
    img: '/images/map/tile-clubs.png',
    label: 'UKM Clubs — explore student clubs',
    tour: 'info-clubs',
  },
  {
    href: '/info/maps',
    img: '/images/map/tile-map.png',
    label: 'Map — campus zones & scan spots',
    tour: 'info-maps',
  },
]

export default function InfoHubPage() {
  return (
    <PageWrapper>
      <PageIntro page="info" />
      <div className="mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-md flex-col justify-center px-3 py-2 lg:max-w-lg">
        {/* Header */}
        <h1 className="title-gold text-center font-bytebounce text-[clamp(2.75rem,15vw,4rem)] leading-none">
          INFO STATION
        </h1>
        <p className="mx-auto mt-1 max-w-[280px] text-center font-bytebounce text-fluid-base leading-tight text-[#7d5a3d]">
          Everything you need to know to survive NSO 2026
        </p>

        {/* Parchment scroll with tile banners */}
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
                data-tour={tile.tour}
                className="block transition-transform duration-100 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]"
              >
                <img src={tile.img} alt="" className="w-full h-auto object-contain block" style={{ imageRendering: 'pixelated' }} />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </PageWrapper>
  )
}
