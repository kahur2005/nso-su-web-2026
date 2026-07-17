// components/layout/Navbar.tsx
// Transparent in-game header (Figma node 267:81): gold "NSO 2026" logo on
// the left, red "EXIT" (logout) on the right, page background shows through.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'HOME', icon: '🏠' },
  { href: '/map', label: 'INFO', icon: 'ℹ️' },
  { href: '/quests', label: 'QUESTS', icon: '⚔️' },
  { href: '/scan', label: 'SCAN', icon: '📱' },
  { href: '/leaderboard', label: 'BOARD', icon: '🏆' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)

  // Fully transparent at the top of the page (per design); once content
  // starts scrolling underneath, fade in a blurred scrim for readability.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-black/35 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="font-bytebounce text-[30px] leading-none text-[#fbc94c] transition-all hover:brightness-110"
          style={{ textShadow: '1.75px 1.3px 0 #4e342e' }}
        >
          NSO 2026
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden md:flex gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  font-pixel text-xs px-3 py-2 border-2 transition-all
                  ${active
                    ? 'bg-green-500 border-green-800 text-white'
                    : 'border-transparent text-[#5b4636] hover:text-black hover:border-black/20'
                  }
                `}
                style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}
              >
                {item.icon} {item.label}
              </Link>
            )
          })}
        </div>

        {/* User info + EXIT (logout) */}
        {session && (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="font-pixel text-xs text-[#5b4636]">
                {session.user?.name?.split(' ')[0]}
              </p>
              <p className="font-pixel text-xs text-amber-600">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                ⭐ {(session.user as any)?.points || 0} PTS
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="font-bytebounce text-[30px] leading-none text-[#ff180e]
                transition-all hover:brightness-110 active:translate-y-[1px]"
              style={{ textShadow: '1.75px 1.3px 0 #3e2723' }}
            >
              EXIT
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
