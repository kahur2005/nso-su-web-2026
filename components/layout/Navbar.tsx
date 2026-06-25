// components/layout/Navbar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

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

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-black"
      style={{ backgroundColor: '#fde6c4', boxShadow: '0 4px 0 #000' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="font-pixel text-sm transition-colors hover:brightness-110"
          style={{ color: '#c2410c', textShadow: '2px 2px 0 #fff' }}>
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
                    : 'border-transparent text-[#6b4f2a] hover:text-black hover:border-black/20'
                  }
                `}
              >
                {item.icon} {item.label}
              </Link>
            )
          })}
        </div>

        {/* User info */}
        {session && (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="font-pixel text-xs text-[#5b4636]">
                {session.user?.name?.split(' ')[0]}
              </p>
              <p className="font-pixel text-xs text-amber-600">
                ⭐ {(session.user as any)?.points || 0} PTS
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="font-pixel text-xs text-red-600 hover:text-red-500
                px-2 py-1 border-2 border-black/20 hover:border-red-500
                transition-all"
            >
              EXIT
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
