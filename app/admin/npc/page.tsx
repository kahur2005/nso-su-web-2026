// app/admin/npc/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/layout/AdminHeader'
import PixelCard from '@/components/ui/PixelCard'
import NpcForm from './NpcForm'
import { toggleNpcActive } from '../actions'

const rarityConfig: Record<string, { color: string; stars: string }> = {
  common: { color: '#9E9E9E', stars: '★' },
  rare: { color: '#2196F3', stars: '★★' },
  epic: { color: '#9C27B0', stars: '★★★' },
  legendary: { color: '#FFD700', stars: '★★★★' },
}

export default async function AdminNpcPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: npcsData } = await supabase
    .from('NPC')
    .select('*')
    .order('createdAt', { ascending: false })

  const npcs = npcsData ?? []

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      <AdminHeader title="👤 MANAGE NPCs" subtitle="ADD MEMBERS & GENERATE QR CODES" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Create form */}
          <div>
            <NpcForm />
          </div>

          {/* NPC list */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-pixel text-sm text-white">
                📋 NPC ROSTER
              </h2>
              <span className="font-pixel text-xs text-gray-400">
                {npcs.length} TOTAL
              </span>
            </div>

            <div className="space-y-3">
              {npcs.map((npc) => {
                const rarity = rarityConfig[npc.rarity] || rarityConfig.common
                return (
                  <PixelCard
                    key={npc.id}
                    className={`bg-gray-800 ${!npc.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* QR thumbnail */}
                      {npc.qrCode ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={npc.qrCode}
                          alt={`QR for ${npc.committeeName}`}
                          className="w-20 h-20 border-2 border-black bg-white flex-shrink-0"
                          width={80}
                          height={80}
                        />
                      ) : (
                        <div className="w-20 h-20 border-2 border-black bg-gray-900
                          flex items-center justify-center text-2xl flex-shrink-0">
                          👤
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-xs text-white truncate">
                          {npc.committeeName}
                        </p>
                        <p className="font-pixel text-[8px] text-gray-400 mt-1">
                          {npc.role}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="font-pixel text-[8px]"
                            style={{ color: rarity.color }}>
                            {rarity.stars} {npc.rarity.toUpperCase()}
                          </span>
                          <span className="font-pixel text-[8px] text-yellow-400">
                            +{npc.points} PTS
                          </span>
                          <span className="font-pixel text-[8px] text-blue-400">
                            📊 {npc.scanCount} SCANS
                          </span>
                        </div>
                      </div>

                      {/* Toggle active */}
                      <form action={toggleNpcActive.bind(null, npc.id)}>
                        <button
                          type="submit"
                          className={`font-pixel text-[8px] px-2 py-1 border-2 border-black
                            transition-colors ${npc.isActive
                              ? 'bg-green-700 text-white hover:bg-green-600'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                          style={{ boxShadow: '2px 2px 0 #000' }}
                        >
                          {npc.isActive ? '✅ ACTIVE' : '⛔ INACTIVE'}
                        </button>
                      </form>
                    </div>
                  </PixelCard>
                )
              })}

              {npcs.length === 0 && (
                <PixelCard className="bg-gray-800 text-center py-8">
                  <span className="text-4xl">👤</span>
                  <p className="font-pixel text-xs text-gray-400 mt-4">
                    NO NPCs YET — CREATE THE FIRST ONE!
                  </p>
                </PixelCard>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
