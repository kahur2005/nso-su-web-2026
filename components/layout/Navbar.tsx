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
    <nav className="sticky top-0 z-50 bg-gray-900 border-b-4 border-black"
      style={{ boxShadow: '0 4px 0 #000' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="font-pixel text-yellow-400 text-sm
          hover:text-yellow-300 transition-colors"
          style={{ textShadow: '2px 2px 0 #000' }}>
          NSO 2026
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden md:flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                font-pixel text-xs px-3 py-2
                border-2 border-transparent
                transition-all hover:border-white/30
                ${pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-green-600 border-green-800 text-white'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>

        {/* User info */}
        {session && (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="font-pixel text-xs text-white">
                {session.user?.name?.split(' ')[0]}
              </p>
              <p className="font-pixel text-xs text-yellow-400">
                ⭐ {(session.user as any)?.points || 0} PTS
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="font-pixel text-xs text-gray-400 hover:text-red-400
                px-2 py-1 border border-gray-700 hover:border-red-700
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