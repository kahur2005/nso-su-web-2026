// app/(game)/info/maps/page.tsx
// Primary Campus Map & Zones view — parchment/wood design system matching committee & leaderboard.
'use client'
import { useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'

interface MapZone {
  id: string
  name: string
  icon: string
  color: string
  description: string
  tip: string
  span?: string
}

const zones: MapZone[] = [
  {
    id: 'main-hall',
    name: 'MAIN HALL',
    icon: '🏛️',
    color: '#b8860b',
    description: 'The heart of campus. Opening ceremony, big announcements and main stage events happen here.',
    tip: 'Committee NPCs gather here during ceremonies — easy scans!',
    span: 'col-span-2',
  },
  {
    id: 'library',
    name: 'LIBRARY',
    icon: '📚',
    color: '#7d5a3d',
    description: 'Quiet zone full of knowledge. Rumor says fun facts hide between the shelves.',
    tip: 'Look for committee NPCs studying here.',
  },
  {
    id: 'cafeteria',
    name: 'CAFETERIA',
    icon: '🍜',
    color: '#8a5c2e',
    description: 'Refill your HP! Food stalls, drinks and the best place to meet other players.',
    tip: 'Lunch hour = maximum NPC density.',
  },
  {
    id: 'sports-field',
    name: 'SPORTS FIELD',
    icon: '⚽',
    color: '#3d6b35',
    description: 'Open arena for games, group challenges and team battles during orientation week.',
    tip: 'Group quests are often held here. Bring your guild!',
  },
  {
    id: 'lab-building',
    name: 'LAB BUILDING',
    icon: '🧪',
    color: '#2a5f8a',
    description: 'Science labs and computer rooms. Tech committee NPCs patrol these halls.',
    tip: 'Logi & IT crew spotted on floors 2–3.',
  },
  {
    id: 'student-center',
    name: 'STUDENT CENTER',
    icon: '🎮',
    color: '#7d3546',
    description: 'Club booths, music and chaos. Discover every club on campus in one place.',
    tip: 'Visit the UKM CLUBS page after exploring here.',
    span: 'col-span-2',
  },
  {
    id: 'garden',
    name: 'CAMPUS GARDEN',
    icon: '🌳',
    color: '#4a6741',
    description: 'A peaceful grove between buildings. Perfect spot to rest between quests.',
    tip: 'LEGENDARY NPCs have been sighted here at dawn...',
  },
  {
    id: 'auditorium',
    name: 'AUDITORIUM',
    icon: '🎭',
    color: '#7d3a2e',
    description: 'Seminars, talent shows and the closing ceremony stage.',
    tip: 'Hidden quests unlock during evening events.',
  },
]

export default function CampusMapPage() {
  const [selected, setSelected] = useState<MapZone | null>(null)

  return (
    <PageWrapper>
      <div className="relative game-column pb-4 pt-12">
        {/* Title */}
        <h1 className="title-gold text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85]">
          WORLD MAP
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[18px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          Explore campus zones &amp; find NPCs
        </p>

        {/* Selected zone detail (parchment panel) */}
        {selected && (
          <div className="mt-4 rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-4 py-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-2xl"
                style={{ backgroundColor: selected.color }}
              >
                {selected.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bytebounce text-[22px] leading-none text-[#3e2723]">
                    {selected.name}
                  </h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="font-bytebounce text-[16px] text-[#8a5a37] hover:underline"
                  >
                    ✕ Close
                  </button>
                </div>
                <p className="mt-2 font-bytebounce text-[16px] leading-snug text-[#5d4330]">
                  {selected.description}
                </p>
                <div className="mt-3 rounded border border-[#d2b48c] bg-[#fff8dc] p-2">
                  <p className="font-bytebounce text-[14px] text-[#8b4513]">
                    💡 <span className="font-bold">PRO TIP:</span> {selected.tip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid of zone cards */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelected(zone)}
              className={`wood-plank flex flex-col items-center p-3 text-center transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                zone.span ?? ''
              }`}
            >
              <span className="text-3xl mb-1">{zone.icon}</span>
              <h2
                className="font-bytebounce text-[18px] leading-tight text-[#fff3d9] truncate w-full"
                style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
              >
                {zone.name}
              </h2>
              <span className="mt-1 font-bytebounce text-[12px] text-[#ffd23f]">
                Tap for intel →
              </span>
            </button>
          ))}
        </div>

      </div>
    </PageWrapper>
  )
}
