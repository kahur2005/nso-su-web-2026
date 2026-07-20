// app/(game)/map/clubs/page.tsx
'use client'
import { useEffect, useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────────────────
 * Shape returned by GET /api/clubs. Clubs are admin-managed rows in the
 * `Club` table — `images` may be empty and every link field may be null.
 * ──────────────────────────────────────────────────────────────────────── */
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

const categoryColor: Record<string, string> = {
  Arts: '#E91E63',
  Technology: '#9C27B0',
  Academic: '#2196F3',
  Sports: '#4CAF50',
  Music: '#FF9800',
  Social: '#FFD700',
}

function ClubDetail({ club, onClose }: { club: Club; onClose: () => void }) {
  const [slide, setSlide] = useState(0)
  const color = categoryColor[club.category] || '#9E9E9E'
  const count = club.images.length

  // `count` is 0 for a club with no uploaded images; the modulo below would be
  // NaN, so bail out and let the carousel block render nothing instead.
  const prev = () => count && setSlide((s) => (s - 1 + count) % count)
  const next = () => count && setSlide((s) => (s + 1) % count)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <PixelCard className="bg-gray-900" glowColor={color}>
          {/* Title row */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-12 border-2 border-black flex items-center
              justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${color}33`, boxShadow: '3px 3px 0 #000' }}>
              {club.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={club.iconUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                '🏛️'
              )}
            </span>
            <div className="flex-1">
              <h2 className="font-pixel text-sm text-white">{club.name}</h2>
              <p className="font-pixel text-[8px] mt-1" style={{ color }}>
                {club.category.toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="font-pixel text-xs text-gray-400 hover:text-red-400
                border-2 border-black bg-gray-700 px-2 py-1"
              style={{ boxShadow: '2px 2px 0 #000' }}
            >
              ✖
            </button>
          </div>

          {/* Image carousel — hidden entirely when the club has no images */}
          {count > 0 && (
          <div className="relative mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={club.images[slide]}
              alt={`${club.name} ${slide + 1}`}
              className="w-full h-48 object-cover border-2 border-black"
            />
            {count > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 font-pixel
                    text-sm text-white bg-black/70 border-2 border-black w-8 h-8"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-pixel
                    text-sm text-white bg-black/70 border-2 border-black w-8 h-8"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {club.images.map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 border border-black"
                      style={{ backgroundColor: i === slide ? color : '#555' }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          )}

          {/* Description */}
          <p className="font-pixel text-xs text-gray-300 leading-relaxed mb-5">
            {club.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <a
              href={club.instagram ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center font-pixel text-xs text-white py-2
                border-2 border-black hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', boxShadow: '3px 3px 0 #000' }}
            >
              📸 INSTAGRAM
            </a>
            <a
              href={club.registrationUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center font-pixel text-xs text-white bg-green-600
                py-2 border-2 border-black hover:bg-green-500 transition-colors"
              style={{ boxShadow: '3px 3px 0 #000' }}
            >
              📝 REGISTER
            </a>
          </div>
        </PixelCard>
      </div>
    </div>
  )
}

export default function UkmClubsPage() {
  const [selected, setSelected] = useState<Club | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clubs')
      .then((r) => r.json())
      .then((d) => setClubs(d.clubs ?? []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/map"
            className="font-pixel text-xs text-green-400 hover:text-green-300">
            ‹ BACK
          </Link>
          <h1 className="font-pixel text-lg text-yellow-400 text-center flex-1"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🏰 UKM CLUBS
          </h1>
          <span className="w-12" />
        </div>

        <p className="font-pixel text-xs text-gray-400 text-center mb-6">
          TAP A CLUB TO LEARN MORE & JOIN
        </p>

        {/* Glossary grid */}
        {loading ? (
          <LoadingSpinner />
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {clubs.map((club) => {
            const color = categoryColor[club.category] || '#9E9E9E'
            return (
              <button key={club.id} onClick={() => setSelected(club)} className="text-left">
                <PixelCard className="bg-gray-800 h-full cursor-pointer
                  transition-transform hover:scale-105">
                  <div className="flex flex-col items-center text-center py-2">
                    <span className="text-3xl mb-2">
                      {club.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={club.iconUrl} alt="" className="w-8 h-8 object-cover" />
                      ) : (
                        '🏛️'
                      )}
                    </span>
                    <p className="font-pixel text-[10px] text-white leading-tight">
                      {club.name}
                    </p>
                    <p className="font-pixel text-[8px] mt-2" style={{ color }}>
                      {club.category.toUpperCase()}
                    </p>
                  </div>
                </PixelCard>
              </button>
            )
          })}
        </div>
        )}

      </div>

      {selected && <ClubDetail club={selected} onClose={() => setSelected(null)} />}
    </PageWrapper>
  )
}
