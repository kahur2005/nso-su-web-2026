// app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CountdownTimer from '@/components/ui/CountdownTimer'
import PixelButton from '@/components/ui/PixelButton'

// Pixel art cloud component
function Cloud({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute" style={style}>
      <div className="flex">
        <div className="w-8 h-4 bg-white border-2 border-black" />
        <div className="w-12 h-8 bg-white border-2 border-black -ml-1 -mt-4" />
        <div className="w-8 h-4 bg-white border-2 border-black -ml-1" />
      </div>
    </div>
  )
}

// Floating platform
function Platform({ 
  style, 
  hasItem 
}: { 
  style: React.CSSProperties
  hasItem?: boolean 
}) {
  return (
    <div className="absolute" style={style}>
      {hasItem && (
        <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center 
          justify-center -mt-10 mx-auto text-black text-xs font-pixel">
          ?
        </div>
      )}
      <div className="flex">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 border-2 border-black"
            style={{
              background: i % 2 === 0 ? '#4CAF50' : '#388E3C'
            }}
          />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="w-8 h-4 border-2 border-black inline-block"
          style={{ background: '#795548' }}
        />
      ))}
    </div>
  )
}

// Star component
function Star({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute text-yellow-400 text-2xl float"
      style={style}
    >
      ★
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [showStart, setShowStart] = useState(true)
  const orientationDate = new Date('2026-06-08T08:00:00')

  useEffect(() => {
    const interval = setInterval(() => {
      setShowStart(prev => !prev)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden scanlines"
      style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E8 60%, #4CAF50 60%, #4CAF50 75%, #795548 75%)' }}
    >
      {/* Clouds */}
      <Cloud style={{ top: '5%', left: '5%' }} />
      <Cloud style={{ top: '8%', left: '30%' }} />
      <Cloud style={{ top: '12%', left: '55%' }} />
      <Cloud style={{ top: '6%', left: '75%' }} />

      {/* Stars */}
      <Star style={{ top: '15%', left: '8%', animationDelay: '0s' }} />
      <Star style={{ top: '10%', right: '10%', animationDelay: '0.5s' }} />
      <Star style={{ top: '20%', left: '45%', animationDelay: '1s' }} />

      {/* Platforms */}
      <Platform style={{ top: '15%', left: '2%' }} hasItem />
      <Platform style={{ top: '25%', right: '5%' }} hasItem />
      <Platform style={{ top: '35%', left: '20%' }} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-block bg-black/30 backdrop-blur-sm p-6 border-4 border-black"
            style={{ boxShadow: '8px 8px 0px #000' }}>
            <h1 className="font-pixel text-3xl md:text-5xl text-yellow-400 pixel-text-shadow mb-2"
              style={{ textShadow: '4px 4px 0 #b45309, 8px 8px 0 #000' }}>
              NSO 2026
            </h1>
            <h2 className="font-pixel text-lg md:text-2xl text-white pixel-text-shadow mt-2">
              NEW STUDENT
            </h2>
            <h2 className="font-pixel text-lg md:text-2xl text-white pixel-text-shadow">
              ORIENTATION
            </h2>
          </div>
        </div>

        {/* Subtitle */}
        <div className="pixel-card bg-black/50 px-6 py-3 mb-6 border-2 border-white/30">
          <p className="font-pixel text-xs text-gray-300 text-center">
            SU NEW STUDENT ORIENTATION 2026
          </p>
          <p className="font-pixel text-xs text-yellow-400 text-center mt-1">
            08.06.26 — 12.06.26
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-8">
          <CountdownTimer targetDate={orientationDate} />
        </div>

        {/* Press Start */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/login')}
            className={`
              font-pixel text-lg text-white
              bg-green-600 border-4 border-black
              px-10 py-4
              transition-all duration-75
              hover:bg-green-500
              active:translate-x-1 active:translate-y-1
              ${showStart ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ boxShadow: '6px 6px 0px #000' }}
          >
            ▶ PRESS START
          </button>
        </div>

        {/* Category Badges */}
        <div className="flex flex-wrap gap-3 justify-center max-w-lg">
          {[
            { label: 'Creative & Media', color: '#E91E63' },
            { label: 'Group Leaders', color: '#2196F3' },
            { label: 'Event', color: '#4CAF50' },
            { label: 'Publication', color: '#FF9800' },
            { label: 'Logi & IT', color: '#9C27B0' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="font-pixel text-xs text-white px-3 py-2 border-2 border-black"
              style={{
                backgroundColor: badge.color,
                boxShadow: '3px 3px 0px #000'
              }}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      {/* Ground decorations */}
      <div className="absolute bottom-0 w-full h-16 flex">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col">
            <div className="h-8 bg-green-500 border-t-2 border-black" />
            <div className="h-8 bg-amber-800 border-t-2 border-black" />
          </div>
        ))}
      </div>

      {/* Version text */}
      <div className="absolute bottom-4 right-4 z-10">
        <p className="font-pixel text-xs text-black/50">v1.0.0</p>
      </div>
    </div>
  )
}