// app/(game)/codex/page.tsx
'use client'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const ACCENT = '#9C27B0'

interface CodexEntry {
  id: string
  npcId: string
  committeeName: string
  role: string
  funFact: string
  points: number
  avatarUrl?: string
  collected: boolean
  collectedAt?: string
  index: number
}

export default function CodexPage() {
  const [entries, setEntries] = useState<CodexEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCodex()
  }, [])

  async function fetchCodex() {
    try {
      const res = await fetch('/api/codex')
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = entries

  const collected = entries.filter(e => e.collected).length
  const total = entries.length

  if (loading) return <PageWrapper><LoadingSpinner text="LOADING CODEX..." /></PageWrapper>

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-yellow-400 mb-4"
            style={{ textShadow: '3px 3px 0 #000' }}>
            📖 FUN FACT CODEX
          </h1>
          <ProgressBar
            value={collected}
            max={total}
            color="#9C27B0"
            label="COLLECTED"
          />
        </div>

        {/* Milestone rewards */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { at: 5, icon: '🥉', label: '5 FACTS' },
            { at: 10, icon: '🥈', label: '10 FACTS' },
            { at: 15, icon: '🥇', label: '15 FACTS' },
            { at: total, icon: '💎', label: 'ALL!' },
          ].map((milestone) => (
            <PixelCard
              key={milestone.at}
              className={`flex-shrink-0 text-center py-2 px-3 ${
                collected >= milestone.at
                  ? 'bg-yellow-900/50 border-yellow-600'
                  : 'bg-gray-800 opacity-50'
              }`}
            >
              <div className="text-2xl">{collected >= milestone.at ? milestone.icon : '🔒'}</div>
              <p className="font-pixel text-xs mt-1"
                style={{ color: collected >= milestone.at ? '#FFD700' : '#666' }}>
                {milestone.label}
              </p>
            </PixelCard>
          ))}
        </div>

        {/* Entry Detail View */}
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <PixelCard
              className="w-full max-w-md"
              glowColor={ACCENT}
            >
              <div className="p-4">
                {/* NPC Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-700 border-4 border-black
                    flex items-center justify-center text-2xl flex-shrink-0">
                    {selectedEntry.avatarUrl || '👤'}
                  </div>
                  <div>
                    <p className="font-pixel text-xs text-gray-400">
                      #{String(selectedEntry.index).padStart(3, '0')}
                    </p>
                    <h3 className="font-pixel text-sm text-white mt-1">
                      {selectedEntry.committeeName}
                    </h3>
                    <p className="font-pixel text-xs text-gray-400 mt-1">
                      {selectedEntry.role}
                    </p>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-pixel text-xs text-yellow-400">
                    +{selectedEntry.points} PTS
                  </span>
                </div>

                {/* Fun Fact */}
                <div className="p-4 bg-gray-900 border-2 border-gray-700 mb-4"
                  style={{ borderColor: ACCENT }}>
                  <p className="font-pixel text-xs text-white leading-relaxed">
                    💬 "{selectedEntry.funFact}"
                  </p>
                </div>

                {/* Collection Info */}
                {selectedEntry.collectedAt && (
                  <p className="font-pixel text-xs text-gray-500 mb-4">
                    📅 COLLECTED:{' '}
                    {new Date(selectedEntry.collectedAt).toLocaleString()}
                  </p>
                )}

                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-full font-pixel text-xs text-white bg-gray-700
                    border-2 border-black py-3 hover:bg-gray-600 transition-colors"
                  style={{ boxShadow: '3px 3px 0 #000' }}
                >
                  ← BACK TO CODEX
                </button>
              </div>
            </PixelCard>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((entry) => {
            return (
              <button
                key={entry.id}
                onClick={() => entry.collected && setSelectedEntry(entry)}
                className={`
                  aspect-square border-4 border-black
                  flex flex-col items-center justify-center gap-1 p-2
                  transition-all
                  ${entry.collected
                    ? 'bg-purple-900 hover:opacity-90 cursor-pointer'
                    : 'bg-gray-900 cursor-not-allowed'
                  }
                `}
                style={{
                  boxShadow: entry.collected
                    ? `4px 4px 0 #000, 0 0 10px ${ACCENT}40`
                    : '4px 4px 0 #000',
                  borderColor: entry.collected ? ACCENT : '#333',
                }}
              >
                {entry.collected ? (
                  <>
                    <div className="text-2xl">
                      {entry.avatarUrl || '👤'}
                    </div>
                    <p className="font-pixel text-[8px] text-center leading-tight"
                      style={{ color: ACCENT }}>
                      {entry.committeeName.split(' ')[0]}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🔒</span>
                    <p className="font-pixel text-[8px] text-gray-600">
                      #{String(entry.index).padStart(3, '0')}
                    </p>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <PixelCard className="bg-gray-800 text-center py-8 mt-4">
            <span className="text-4xl">📖</span>
            <p className="font-pixel text-xs text-gray-400 mt-4">
              NO ENTRIES FOUND
            </p>
          </PixelCard>
        )}

      </div>
    </PageWrapper>
  )
}