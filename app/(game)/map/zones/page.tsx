// app/(game)/map/zones/page.tsx
// Campus zones — parchment/wood design system matching committee & leaderboard.
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

/** Gold outline shared across all Figma-style pages */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

export default function MapZonesPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<MapZone | null>(null)

  return (
    <PageWrapper>
      <div className="relative mx-auto w-full max-w-md px-3 pb-4 pt-12 lg:max-w-lg">

        {/* Back button — same sprite as committee */}
        <button
          type="button"
          onClick={() => router.push('/map')}
          aria-label="Back to info station"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        {/* Title */}
        <h1
          className="text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85]"
          style={OUTLINE_GOLD}
        >
          WORLD MAP
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[18px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          Explore campus zones &amp; find NPCs
        </p>

        {/* ── Selected zone detail (parchment panel) ── */}
        {selected && (
          <div className="mt-4 rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-4 py-4">
            <div className="flex items-start gap-3">
              <div
                className="w-14 h-14 shrink-0 flex items-center justify-center text-3xl rounded border-2 border-[#b08a5e] bg-[#e9d3ab]"
              >
                {selected.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="font-bytebounce text-[22px] leading-tight text-[#3e2723]"
                >
                  {selected.name}
                </h2>
                <p
                  className="font-bytebounce text-[14px] leading-snug text-[#5d4330] mt-1"
                >
                  {selected.description}
                </p>
                <p
                  className="font-bytebounce text-[13px] leading-snug text-[#8a5c2e] mt-2"
                >
                  💡 {selected.tip}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href="/scan"
                className="flex-1 text-center wood-plank py-2.5 font-bytebounce text-[18px] leading-none text-[#ffd23f] hover:brightness-110 transition-all"
                style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
              >
                📱 Scan Here
              </a>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 rounded border-2 border-[#b08a5e] bg-[#e9d3ab] py-2.5 font-bytebounce text-[18px] leading-none text-[#5d4330] hover:bg-[#dfc898] transition-colors"
              >
                ✖ Close
              </button>
            </div>
          </div>
        )}

        {/* ── Zone grid ── */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {zones.map((zone) => {
            const isActive = selected?.id === zone.id
            return (
              <button
                key={zone.id}
                onClick={() => setSelected(zone)}
                className={`${zone.span ?? ''} text-left transition-all duration-100 active:scale-[0.97] ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.02] hover:brightness-105'}`}
              >
                <div
                  className="rounded border-2 bg-[#f5e7c6] px-3 py-3 flex flex-col items-center gap-1 h-full"
                  style={{
                    borderColor: isActive ? zone.color : '#b08a5e',
                    boxShadow: isActive ? `0 0 0 2px ${zone.color}55` : undefined,
                  }}
                >
                  <span className="text-3xl">{zone.icon}</span>
                  <p
                    className="font-bytebounce text-[15px] leading-tight text-center text-[#3e2723]"
                  >
                    {zone.name}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Legend (parchment strip) ── */}
        <div className="mt-4 rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-4 py-3">
          <p
            className="font-bytebounce text-[16px] text-[#5d4330] mb-2"
          >
            📋 LEGEND
          </p>
          <div className="grid grid-cols-2 gap-y-1.5">
            {[
              { icon: '👤', label: 'NPC Zone' },
              { icon: '⚔️', label: 'Quest Area' },
              { icon: '🔮', label: 'Hidden Secrets' },
              { icon: '🍜', label: 'Rest Stop' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="font-bytebounce text-[14px] text-[#7d5a3d]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
