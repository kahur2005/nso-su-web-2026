// components/layout/Navbar.tsx
// Top bar that exactly mirrors the Figma/mobile design on desktop:
//   – "NSO 2026" gold pixel logo on the left
//   – wood-plank navigation rail with icon + label items (hidden on mobile, where BottomNav takes over)
//   – "EXIT" red logout button on the right
// On scroll the bar picks up a darkened wood background so content below it
// doesn't bleed through.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import PixelAvatar from '@/components/ui/PixelAvatar'

interface AvatarParts {
  avatarSkin: string | null
  avatarHair: string | null
  avatarEyes: string | null
  avatarBrows: string | null
}

const LOGO_SHADOW = '2px 2px 0 #3e2723'
const EXIT_SHADOW  = '2px 2px 0 #3e2723'

const navItems = [
  { href: '/dashboard',   label: 'Home',     icon: '/images/nav/house.png',  iconW: 28 },
  { href: '/map',         label: 'Info',     icon: '/images/nav/info.png',   iconW: 22 },
  { href: '/scan',        label: 'QR Scan',  icon: 'qr'     as const,        iconW: 0  },
  { href: '/leaderboard', label: 'Rankings', icon: '/images/nav/trophy.png', iconW: 30 },
  { href: '/profile',     label: 'Me',       icon: 'avatar' as const,        iconW: 0  },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [avatar, setAvatar] = useState<AvatarParts | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    const studentId = (session?.user as { studentId?: string } | undefined)?.studentId
    const cacheKey = `nav-avatar:${studentId ?? 'anon'}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try { setAvatar(JSON.parse(cached)); return } catch { sessionStorage.removeItem(cacheKey) }
    }
    fetch('/api/me/avatar')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.avatar) {
          setAvatar(data.avatar)
          sessionStorage.setItem(cacheKey, JSON.stringify(data.avatar))
        }
      })
      .catch(() => {})
  }, [status, session])

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-[#4e342e]/80 backdrop-blur-sm shadow-[0_2px_0_#3e2723]'
          : 'bg-transparent'
      }`}
    >
      {/* ── 3-slice wood plank background (desktop only) ───────────────── */}
      {/* Shown as a separate layer so the mobile top area stays transparent */}
      <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-y-0 left-[40px] right-[40px]"
          style={{
            backgroundImage: 'url(/images/nav/plank-mid.png)',
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/nav/plank-left.png" alt="" aria-hidden
          className="absolute left-0 inset-y-0 h-full w-[41px]"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/nav/plank-right.png" alt="" aria-hidden
          className="absolute right-0 inset-y-0 h-full w-[41px]"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-2 md:py-3 flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="font-bytebounce text-[28px] md:text-[30px] leading-none text-[#fbc94c] transition-all hover:brightness-110"
          style={{ textShadow: LOGO_SHADOW }}
        >
          NSO 2026
        </Link>

        {/* ── Desktop nav items (hidden on mobile — BottomNav handles it) ── */}
        <nav className="hidden md:flex items-center gap-0" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                  active ? 'brightness-110' : 'opacity-75 hover:opacity-100'
                }`}
              >
                {/* Active underline dot */}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ffd23f] shadow-[0_0_4px_#ffd23f]" />
                )}

                {/* Icon */}
                <span className={`flex items-center justify-center h-7 transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.icon === 'qr' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/images/nav/qr-scan.png"
                      alt="" aria-hidden
                      className="h-7 w-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : item.icon === 'avatar' ? (
                    <PixelAvatar
                      skin={avatar?.avatarSkin}
                      hair={avatar?.avatarHair}
                      eyes={avatar?.avatarEyes}
                      brow={avatar?.avatarBrows}
                      size={28}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.icon}
                      alt="" aria-hidden
                      className="h-7 object-contain"
                      style={{ width: item.iconW, imageRendering: 'pixelated' }}
                    />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`font-bytebounce text-[14px] leading-none whitespace-nowrap ${
                    active ? 'text-[#fff3d9]' : 'text-[#e0b391]'
                  }`}
                  style={{ textShadow: '1.75px 1.3px 0 #4e342e' }}
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
