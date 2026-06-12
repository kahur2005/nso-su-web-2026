// components/layout/BottomNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/dashboard', icon: '🏠', label: 'HOME' },
  { href: '/map', icon: '🗺️', label: 'MAP' },
  { href: '/scan', icon: '📱', label: 'SCAN' },
  { href: '/leaderboard', icon: '🏆', label: 'BOARD' },
  { href: '/profile', icon: '👤', label: 'ME' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900
      border-t-4 border-black md:hidden"
      style={{ boxShadow: '0 -4px 0 #000' }}>
      <div className="flex">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex-1 flex flex-col items-center py-3 gap-1
                font-pixel text-xs transition-all
                ${isActive
                  ? 'bg-green-700 text-white border-t-2 border-green-400'
                  : 'text-gray-500 hover:text-white'
                }
                ${item.label === 'SCAN' ? 'relative' : ''}
              `}
            >
              <span className={`text-xl ${item.label === 'SCAN' ? 'text-2xl' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[8px]">{item.label}</span>
              {item.label === 'SCAN' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2
                  w-12 h-12 bg-green-500 border-4 border-black rounded-none
                  flex items-center justify-center text-xl"
                  style={{ boxShadow: '3px 3px 0 #000' }}>
                  📱
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}