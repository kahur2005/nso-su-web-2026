// app/(game)/map/zones/page.tsx
'use client'
import { useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import Link from 'next/link'

interface MapZone {
  id: string
  name: string
  icon: string
  color: string
  bg: string
  description: string
  tip: string
  span?: string
}

const zones: MapZone[] = [
  {
    id: 'main-hall',
    name: 'MAIN HALL',
    icon: '🏛️',
    color: '#FFD700',
    bg: 'bg-yellow-900/40',
    description: 'The heart of campus. Opening ceremony, big announcements and main stage events happen here.',
    tip: 'Committee NPCs gather here during ceremonies — easy scans!',
    span: 'md:col-span-2'
  },
  {
    id: 'library',
    name: 'LIBRARY',
    icon: '📚',
    color: '#9C27B0',
    bg: 'bg-purple-900/40',
    description: 'Quiet zone full of knowledge. Rumor says rare fun facts hide between the shelves.',
    tip: 'Look for EPIC rarity NPCs studying here.'
  },
  {
    id: 'cafeteria',
    name: 'CAFETERIA',
    icon: '🍜',
    color: '#FF9800',
    bg: 'bg-orange-900/40',
    description: 'Refill your HP! Food stalls, drinks and the best place to meet other players.',
    tip: 'Lunch hour = maximum NPC density.'
  },
  {
    id: 'sports-field',
    name: 'SPORTS FIELD',
    icon: '⚽',
    color: '#4CAF50',
    bg: 'bg-green-900/40',
    description: 'Open arena for games, group challenges and team battles during orientation week.',
    tip: 'Group quests are often held here. Bring your guild!'
  },
  {
    id: 'lab-building',
    name: 'LAB BUILDING',
    icon: '🧪',
    color: '#2196F3',
    bg: 'bg-blue-900/40',
    description: 'Science labs and computer rooms. Tech committee NPCs patrol these halls.',
    tip: 'Logi & IT crew spotted on floors 2-3.'
  },
  {
    id: 'student-center',
    name: 'STUDENT CENTER',
    icon: '🎮',
    color: '#E91E63',
    bg: 'bg-pink-900/40',
    description: 'Club booths, music and chaos. Discover every club on campus in one place.',
    tip: 'Visit the UKM CLUBS page after exploring here.',
    span: 'md:col-span-2'
  },
  {
    id: 'garden',
    name: 'CAMPUS GARDEN',
    icon: '🌳',
    color: '#8BC34A',
    bg: 'bg-lime-900/40',
    description: 'A peaceful grove between buildings. Perfect spot to rest between quests.',
    tip: 'LEGENDARY NPCs have been sighted here at dawn...'
  },
  {
    id: 'auditorium',
    name: 'AUDITORIUM',
    icon: '🎭',
    color: '#F44336',
    bg: 'bg-red-900/40',
    description: 'Seminars, talent shows and the closing ceremony stage.',
    tip: 'Hidden quests unlock during evening events.'
  },
]

// EDIT MAP IMAGES HERE — currently all point to the same placeholder.
const mapImages = [
  { src: '/images/map.jpg', label: 'GROUND FLOOR' },
  { src: '/images/map.jpg', label: 'LEVEL 1' },
  { src: '/images/map.jpg', label: 'LEVEL 2' },
]

export default function MapZonesPage() {
  const [selected, setSelected] = useState<MapZone | null>(null)

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
            🗺️ WORLD MAP
          </h1>
          <span className="w-12" />
        </div>

        {/* Stacked Map Images */}
        <div className="space-y-4 mb-8">
          {mapImages.map((img, index) => (
            <PixelCard key={index} className="bg-gray-800 p-2">
              <p className="font-pixel text-xs text-gray-400 mb-2 px-1">
                {img.label}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-auto border-2 border-black"
                style={{ imageRendering: 'pixelated' }}
              />
            </PixelCard>
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="font-pixel text-xs text-gray-400">
            SELECT A ZONE TO SCOUT IT
          </p>
        </div>

        {/* Selected Zone - RPG Dialog */}
        {selected && (
          <div className="rpg-dialog p-5 mb-6"
            style={{ borderColor: selected.color }}>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 border-4 border-black flex items-center
                justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: `${selected.color}33`, boxShadow: '4px 4px 0 #000' }}>
                {selected.icon}
              </div>
              <div className="flex-1">
                <h2 className="font-pixel text-sm" style={{ color: selected.color }}>
                  {selected.name}
                </h2>
                <p className="font-pixel text-xs text-gray-300 mt-2 leading-relaxed">
                  {selected.description}
                </p>
                <p className="font-pixel text-xs text-yellow-400 mt-3">
                  💡 {selected.tip}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Link href="/scan" className="flex-1">
                <span className="block text-center font-pixel text-xs text-white
                  bg-green-600 border-2 border-black py-2 hover:bg-green-500
                  transition-colors" style={{ boxShadow: '3px 3px 0 #000' }}>
                  📱 SCAN HERE
                </span>
              </Link>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 font-pixel text-xs text-gray-300 bg-gray-700
                  border-2 border-black py-2 hover:bg-gray-600 transition-colors"
                style={{ boxShadow: '3px 3px 0 #000' }}
              >
                ✖ CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Map Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelected(zone)}
              className={`${zone.span || ''} text-left`}
            >
              <PixelCard
                className={`${zone.bg} h-full cursor-pointer transition-transform
                  hover:scale-105`}
                glowColor={selected?.id === zone.id ? zone.color : undefined}
              >
                <div className="text-center py-3">
                  <div className="text-3xl mb-2 float inline-block">{zone.icon}</div>
                  <p className="font-pixel text-xs" style={{ color: zone.color }}>
                    {zone.name}
                  </p>
                </div>
              </PixelCard>
            </button>
          ))}
        </div>

        {/* Legend */}
        <PixelCard className="bg-gray-800">
          <h3 className="font-pixel text-xs text-white mb-3">📋 LEGEND</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { icon: '👤', label: 'NPC ZONE', color: '#4CAF50' },
              { icon: '⚔️', label: 'QUEST AREA', color: '#FFD700' },
              { icon: '🔮', label: 'HIDDEN SECRETS', color: '#9C27B0' },
              { icon: '🍜', label: 'REST STOP', color: '#FF9800' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="font-pixel text-[8px]" style={{ color: item.color }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </PixelCard>

      </div>
    </PageWrapper>
  )
}
