// app/(game)/map/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import Link from 'next/link'

interface InfoTile {
  href: string
  icon: string
  title: string
  subtitle: string
  color: string
  bg: string
}

const tiles: InfoTile[] = [
  {
    href: '/map/zones',
    icon: '🗺️',
    title: 'MAP',
    subtitle: 'Campus zones & scan spots',
    color: '#4CAF50',
    bg: 'bg-green-900/40',
  },
  {
    href: '/map/timeline',
    icon: '🗓️',
    title: 'TIMELINE',
    subtitle: 'Day-by-day event agenda',
    color: '#FFD700',
    bg: 'bg-yellow-900/40',
  },
  {
    href: '/codex',
    icon: '📖',
    title: 'CODEX',
    subtitle: 'Fun facts you collected',
    color: '#9C27B0',
    bg: 'bg-purple-900/40',
  },
  {
    href: '/map/guidebook',
    icon: '📔',
    title: 'GUIDE BOOK',
    subtitle: 'Survival tips for SU life',
    color: '#2196F3',
    bg: 'bg-blue-900/40',
  },
  {
    href: '/map/clubs',
    icon: '🏰',
    title: 'UKM CLUBS',
    subtitle: 'Explore student clubs',
    color: '#E91E63',
    bg: 'bg-pink-900/40',
  },
  {
    href: '/map/committee',
    icon: '🎖️',
    title: 'COMMITTEE',
    subtitle: 'Meet the NSO 2026 team',
    color: '#FF5722',
    bg: 'bg-red-900/40',
  },
]

export default function InfoHubPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-white"
            style={{ textShadow: '3px 3px 0 #000' }}>
            📖 INFO STATION
          </h1>
          <p className="font-pixel text-xs text-gray-400 mt-2">
            EVERYTHING YOU NEED TO SURVIVE NSO 2026
          </p>
        </div>

        {/* Info Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href}>
              <PixelCard
                className={`${tile.bg} cursor-pointer transition-transform hover:scale-[1.03]`}
                glowColor={tile.color}
              >
                <div className="flex items-center gap-4 py-2">
                  <div className="w-14 h-14 border-4 border-black flex items-center
                    justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: `${tile.color}33`, boxShadow: '4px 4px 0 #000' }}>
                    {tile.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-pixel text-sm" style={{ color: tile.color }}>
                      {tile.title}
                    </p>
                    <p className="font-pixel text-xs text-gray-300 mt-1 leading-relaxed">
                      {tile.subtitle}
                    </p>
                  </div>
                  <span className="font-pixel text-lg text-gray-500">›</span>
                </div>
              </PixelCard>
            </Link>
          ))}
        </div>

      </div>
    </PageWrapper>
  )
}
