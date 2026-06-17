// app/(game)/map/clubs/page.tsx
'use client'
import { useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────────────────
 * EDIT CLUBS HERE
 *   - images:    carousel images (placeholder map.jpg for now)
 *   - instagram: full IG profile URL (placeholder '#' for now)
 *   - register:  Google Form URL the club provides (placeholder '#' for now)
 * ──────────────────────────────────────────────────────────────────────── */
type Club = {
  id: string
  name: string
  icon: string
  category: string
  description: string
  images: string[]
  instagram: string
  register: string
}

const PLACEHOLDER_IMAGES = ['/images/map.jpg', '/images/map.jpg', '/images/map.jpg']

const clubs: Club[] = [
  { id: 'photography', name: 'Photography Society', icon: '📷', category: 'Arts', description: 'Capture campus life one frame at a time. Weekly photowalks, editing workshops, and an annual exhibition.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'robotics', name: 'Robotics Club', icon: '🤖', category: 'Technology', description: 'Build, code, and battle robots. Compete in national competitions and learn hands-on engineering.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'debate', name: 'Debate Union', icon: '🎙️', category: 'Academic', description: 'Sharpen your arguments and public speaking. Regular friendly debates and inter-varsity tournaments.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'football', name: 'Football Club', icon: '⚽', category: 'Sports', description: 'Train, play, and represent SU on the pitch. Open to all skill levels with weekly practice sessions.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'music', name: 'Music & Band Society', icon: '🎸', category: 'Music', description: 'Jam sessions, open mics, and live gigs. Whether you sing or shred, there is a stage for you.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'coding', name: 'Coding & Dev Club', icon: '💻', category: 'Technology', description: 'Hackathons, study jams, and side-project nights. From web to AI, build cool stuff with friends.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'art', name: 'Fine Arts Circle', icon: '🎨', category: 'Arts', description: 'Painting, sketching, and digital art meetups. Express yourself and showcase work in our gallery.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'volunteer', name: 'Volunteer Corps', icon: '🤝', category: 'Social', description: 'Give back through community drives, charity events, and campus sustainability projects.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'basketball', name: 'Basketball Club', icon: '🏀', category: 'Sports', description: 'Fast breaks and friendly rivalries. Casual pickup games and a competitive varsity squad.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'film', name: 'Film & Media Club', icon: '🎬', category: 'Arts', description: 'Write, shoot, and edit short films. Learn the craft and screen your work at our film night.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'entrepreneur', name: 'Entrepreneurship Hub', icon: '🚀', category: 'Academic', description: 'Turn ideas into startups. Pitch nights, mentorship, and networking with industry founders.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'gaming', name: 'E-Sports & Gaming', icon: '🎮', category: 'Technology', description: 'Compete in tournaments across popular titles. LAN parties, ranked nights, and a strong community.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'dance', name: 'Dance Crew', icon: '💃', category: 'Arts', description: 'From hip-hop to traditional, learn choreography and perform at campus events.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'nature', name: 'Nature & Hiking Club', icon: '🥾', category: 'Social', description: 'Explore trails, camp under the stars, and connect with the outdoors every weekend.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
  { id: 'language', name: 'Language Exchange', icon: '🗣️', category: 'Academic', description: 'Practise new languages with native speakers. Casual cafe meetups and culture nights.', images: PLACEHOLDER_IMAGES, instagram: '#', register: '#' },
]
/* ──────────────────────────────────────────────────────────────────────── */

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

  const prev = () => setSlide((s) => (s - 1 + count) % count)
  const next = () => setSlide((s) => (s + 1) % count)

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
              {club.icon}
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

          {/* Image carousel */}
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

          {/* Description */}
          <p className="font-pixel text-xs text-gray-300 leading-relaxed mb-5">
            {club.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <a
              href={club.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center font-pixel text-xs text-white py-2
                border-2 border-black hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', boxShadow: '3px 3px 0 #000' }}
            >
              📸 INSTAGRAM
            </a>
            <a
              href={club.register}
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

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/map"
            className="font-pixel text-xs text-green-400 hover:text-green-300">
            ‹ BACK
          </Link>
          <h1 className="font-pixel text-lg text-white text-center flex-1"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🏰 UKM CLUBS
          </h1>
          <span className="w-12" />
        </div>

        <p className="font-pixel text-xs text-gray-400 text-center mb-6">
          TAP A CLUB TO LEARN MORE & JOIN
        </p>

        {/* Glossary grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {clubs.map((club) => {
            const color = categoryColor[club.category] || '#9E9E9E'
            return (
              <button key={club.id} onClick={() => setSelected(club)} className="text-left">
                <PixelCard className="bg-gray-800 h-full cursor-pointer
                  transition-transform hover:scale-105">
                  <div className="flex flex-col items-center text-center py-2">
                    <span className="text-3xl mb-2">{club.icon}</span>
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

      </div>

      {selected && <ClubDetail club={selected} onClose={() => setSelected(null)} />}
    </PageWrapper>
  )
}
