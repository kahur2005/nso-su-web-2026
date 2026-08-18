'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import PixelAvatar from '@/components/ui/PixelAvatar'
import { parseAvatarConfig, hairKey } from '@/lib/avatar'
import { useStudentAvatar } from '@/lib/hooks/useStudentAvatar'

const LOGO_SHADOW = '2px 2px 0 #3e2723'
const EXIT_SHADOW  = '2px 2px 0 #3e2723'

const BACK_TARGETS: Array<[prefix: string, href: string]> = [
  ['/info/clubs', '/info'],
  ['/info/committee', '/info'],
  ['/info/guidebook', '/info'],
  ['/info/maps', '/info'],
  ['/info/timeline', '/info'],
  ['/quests', '/dashboard'],
]

function lunchBackHref(pathname: string): string | null {
  if (pathname !== '/lunch' && !pathname.startsWith('/lunch/')) return null
  if (pathname === '/lunch' || pathname === '/lunch/') return '/dashboard'
  if (pathname.startsWith('/lunch/order')) return '/lunch'
  const parts = pathname.replace(/\/$/, '').split('/')
  parts.pop()
  const parent = parts.join('/')
  return parent || '/dashboard'
}

function backHrefFor(pathname: string): string | null {
  const lunch = lunchBackHref(pathname)
  if (lunch) return lunch
  const hit = BACK_TARGETS.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'),
  )
  return hit ? hit[1] : null
}

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
  const backHref = backHrefFor(pathname)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[var(--nav-h)] wood-plank rounded-none border-x-0 border-t-0 border-b-2 border-[#3e2723] shadow-md">
      {/* `relative` is the anchor the mobile-centred logo positions against. */}
      <div className="game-column relative h-full flex items-center justify-between gap-2">
        {/* ── Left slot: back arrow, then the logo once it rejoins the flow ── */}
        <div className="flex items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Go back"
              className="block shrink-0 transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/login/back-button.png"
                alt=""
                aria-hidden
                className="h-[26px] md:h-[34px] w-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            </Link>
          )}

          {/* ── Logo ───────────────────────────────────────────────────────
              Absolutely centred on mobile so the back arrow and EXIT can be
              different widths without pushing it off-centre; `md:static`
              drops it back into the flex row beside the back arrow. */}
          <Link
            href="/dashboard"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              md:static md:translate-x-0 md:translate-y-0
              font-bytebounce text-[28px] md:text-[30px] leading-none text-[#fbc94c] transition-all hover:brightness-110"
            style={{ textShadow: LOGO_SHADOW }}
          >
            NSO 2026
          </Link>
        </div>

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
