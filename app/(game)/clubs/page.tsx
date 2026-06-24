// app/(game)/clubs/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'

const categoryConfig: Record<string, { icon: string; color: string; bg: string }> = {
  sports: { icon: '⚽', color: '#4CAF50', bg: 'bg-green-900/30' },
  arts: { icon: '🎨', color: '#E91E63', bg: 'bg-pink-900/30' },
  academic: { icon: '📚', color: '#2196F3', bg: 'bg-blue-900/30' },
  technology: { icon: '💻', color: '#9C27B0', bg: 'bg-purple-900/30' },
  music: { icon: '🎵', color: '#FF9800', bg: 'bg-orange-900/30' },
  social: { icon: '🤝', color: '#FFD700', bg: 'bg-yellow-900/30' },
}

const defaultCategory = { icon: '🏷️', color: '#9E9E9E', bg: 'bg-gray-800' }

export default async function ClubsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { data: clubsData } = await supabase
    .from('Club')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const clubs = clubsData ?? []
  const categories = [...new Set(clubs.map((c: any) => c.category))]

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-white"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🏰 CLUB GUILD HALL
          </h1>
          <p className="font-pixel text-xs text-gray-400 mt-2">
            JOIN A GUILD. FIND YOUR PARTY.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <PixelCard className="bg-gray-800 text-center">
            <p className="font-pixel text-xs text-gray-400">GUILDS</p>
            <p className="font-pixel text-2xl text-yellow-400 mt-1">{clubs.length}</p>
          </PixelCard>
          <PixelCard className="bg-gray-800 text-center">
            <p className="font-pixel text-xs text-gray-400">CATEGORIES</p>
            <p className="font-pixel text-2xl text-purple-400 mt-1">{categories.length}</p>
          </PixelCard>
        </div>

        {/* Clubs grouped by category */}
        {categories.map((category) => {
          const cfg = categoryConfig[category.toLowerCase()] || defaultCategory
          const categoryClubs = clubs.filter(c => c.category === category)

          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cfg.icon}</span>
                <h2 className="font-pixel text-sm uppercase" style={{ color: cfg.color }}>
                  {category}
                </h2>
                <div className="flex-1 h-px bg-gray-700" />
                <span className="font-pixel text-xs text-gray-500">
                  {categoryClubs.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryClubs.map((club) => (
                  <PixelCard key={club.id} className={cfg.bg} glowColor={cfg.color}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-900 border-2 border-black
                        flex items-center justify-center text-xl flex-shrink-0"
                        style={{ boxShadow: '3px 3px 0 #000' }}>
                        {club.iconUrl || cfg.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-pixel text-xs text-white">{club.name}</h3>
                        <p className="font-pixel text-xs text-gray-400 mt-2 leading-relaxed">
                          {club.description}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <span className="font-pixel text-[8px] text-green-400">
                            👥 {club.memberCount} MEMBERS
                          </span>
                          {club.established && (
                            <span className="font-pixel text-[8px] text-gray-500">
                              🏳️ EST. {club.established}
                            </span>
                          )}
                        </div>
                        {club.contactInfo && (
                          <p className="font-pixel text-[8px] text-blue-400 mt-2">
                            📮 {club.contactInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  </PixelCard>
                ))}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {clubs.length === 0 && (
          <PixelCard className="bg-gray-800 text-center py-10">
            <span className="text-5xl float inline-block">🏰</span>
            <p className="font-pixel text-sm text-white mt-4">
              GUILD HALL IS EMPTY
            </p>
            <p className="font-pixel text-xs text-gray-400 mt-2">
              CLUBS WILL APPEAR HERE SOON. CHECK BACK LATER!
            </p>
          </PixelCard>
        )}

      </div>
    </PageWrapper>
  )
}
