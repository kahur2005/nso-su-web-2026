'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nso-intro-done'
const TOTAL_MS = 2800

export default function IntroSequence() {
  const [phase, setPhase] = useState<'idle' | 'logo' | 'text' | 'blink' | 'fadeout' | 'done'>('idle')

  useEffect(() => {
    // Skip if already seen this session
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setPhase('done')
      return
    }

    // Sequence timeline
    const t1 = setTimeout(() => setPhase('logo'),    300)
    const t2 = setTimeout(() => setPhase('text'),   1200)
    const t3 = setTimeout(() => setPhase('blink'),  1900)
    const t4 = setTimeout(() => setPhase('fadeout'), 2300)
    const t5 = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setPhase('done')
    }, TOTAL_MS)

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        animation: phase === 'fadeout'
          ? 'introOut 0.5s ease-in forwards'
          : 'introIn 0.3s ease-out forwards',
        imageRendering: 'pixelated',
      }}
    >
      <style>{`
        @keyframes introIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes introOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes logoPop  {
          0%   { transform: scale(0.2); opacity: 0 }
          60%  { transform: scale(1.08); opacity: 1 }
          100% { transform: scale(1); opacity: 1 }
        }
        @keyframes textIn   {
          from { opacity: 0; letter-spacing: 0.5em }
          to   { opacity: 1; letter-spacing: 0.12em }
        }
        @keyframes blinkKf  {
          0%, 100% { opacity: 1 } 50% { opacity: 0 }
        }
      `}</style>

      {/* Logo */}
      {(phase === 'logo' || phase === 'text' || phase === 'blink' || phase === 'fadeout') && (
        <img
          src="/images/login/logo-512.png"
          alt="NSO 2026"
          style={{
            width: 130,
            height: 'auto',
            imageRendering: 'pixelated',
            animation: 'logoPop 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        />
      )}

      {/* Title text */}
      {(phase === 'text' || phase === 'blink' || phase === 'fadeout') && (
        <p
          style={{
            fontFamily: "'ByteBounce', 'Press Start 2P', monospace",
            fontSize: 28,
            color: '#fbc94c',
            textShadow: '4px 4px 0 #4e342e',
            animation: 'textIn 0.5s ease-out forwards',
            letterSpacing: '0.12em',
          }}
        >
          NSO 2026
        </p>
      )}

      {/* Press start blink */}
      {(phase === 'blink' || phase === 'fadeout') && (
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            color: '#24e9d5',
            animation: 'blinkKf 0.6s step-start infinite',
            marginTop: 8,
          }}
        >
          LOADING...
        </p>
      )}
    </div>
  )
}
