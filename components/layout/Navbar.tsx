// components/layout/Navbar.tsx
// Top bar that exactly mirrors the Figma/mobile design on desktop:
//   – "NSO 2026" gold pixel logo on the left
//   – wood-plank navigation rail with icon + label items (hidden on mobile, where BottomNav takes over)
//   – "EXIT" red logout button on the right
// Pinned with position:fixed and a height of --nav-h; PageWrapper reserves the
// same amount of top padding on <main> so nothing renders underneath it.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import PixelAvatar from '@/components/ui/PixelAvatar'
import { parseAvatarConfig, hairKey } from '@/lib/avatar'
import { useStudentAvatar } from '@/lib/hooks/useStudentAvatar'

const LOGO_SHADOW = '2px 2px 0 #3e2723'
const EXIT_SHADOW  = '2px 2px 0 #3e2723'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '/images/nav/house.png' },
  { href: '/info', label: 'Info', icon: '/images/nav/info.png' },
  { href: '/scan', label: 'QR Scan', icon: 'qr' as const },
  { href: '/leaderboard', label: 'Rankings', icon: '/images/nav/trophy.png' },
  { href: '/profile', label: 'Me', icon: 'avatar' as const },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const avatarConfig = useStudentAvatar()
  const av = parseAvatarConfig(avatarConfig)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[var(--nav-h)] wood-plank rounded-none border-x-0 border-t-0 border-b-2 border-[#3e2723] shadow-md">
      <div className="game-column h-full flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="font-bytebounce text-[28px] md:text-[30px] leading-none text-[#fbc94c] transition-all hover:brightness-110"
          style={{ textShadow: LOGO_SHADOW }}
        >
          NSO 2026
        </Link>

        {/* ── Desktop nav items (hidden on mobile — BottomNav handles it) ── */}
        <nav className="hidden md:flex items-center gap-1 md:gap-2" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-1 px-2.5 py-1 transition-all ${
                  active ? 'brightness-110' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {/* Active underline dot */}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ffd23f] shadow-[0_0_4px_#ffd23f]" />
                )}

                {/* Standardized Icon Box (32px x 32px) */}
                <span className={`flex items-center justify-center h-8 w-8 transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.icon === 'qr' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/images/nav/qr-scan.png"
                      alt="" aria-hidden
                      className="h-8 w-auto object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : item.icon === 'avatar' ? (
                    <PixelAvatar
                      skin={av.skin}
                      clothes={av.clothes ?? undefined}
                      hair={hairKey(av)}
                      hijab={av.hijab ?? undefined}
                      eyes={av.eyes ?? undefined}
                      brow={av.brows ?? undefined}
                      mouth={av.mouth ?? undefined}
                      size={32}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.icon}
                      alt="" aria-hidden
                      className="h-8 w-auto object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                </span>

                {/* Standardized Label */}
                <span
                  className={`font-bytebounce text-[16px] md:text-[17px] leading-none whitespace-nowrap ${
                    active ? 'text-[#fff3d9] font-bold' : 'text-[#e0b391]'
                  }`}
                  style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* ── EXIT button ───────────────────────────────────────────────── */}
        {session && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="font-bytebounce text-[26px] md:text-[30px] leading-none text-[#ff180e]
              transition-all hover:brightness-125 active:translate-y-[1px]"
            style={{ textShadow: EXIT_SHADOW }}
          >
            EXIT
          </button>
        )}
      </div>
    </header>
  )
}
