// components/layout/BottomNav.tsx
// Wooden-plank bottom nav (Figma node 258:678): pixel icons + ByteBounce labels.
// The "Me" tab renders the student's own pixel avatar, fetched once per tab
// session from /api/me/avatar and cached in sessionStorage.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import PixelAvatar from '@/components/ui/PixelAvatar'

interface AvatarParts {
  avatarSkin: string | null
  avatarHair: string | null
  avatarEyes: string | null
  avatarBrows: string | null
}

const LABEL_SHADOW = '2.4px 2.5px 0 #4e342e'

const items = [
  { href: '/dashboard', label: 'Home', icon: '/images/nav/house.png', iconWidth: 40 },
  { href: '/map', label: 'Info', icon: '/images/nav/info.png', iconWidth: 28 },
  { href: '/scan', label: 'QR Scan', icon: 'qr' as const, iconWidth: 0 },
  { href: '/leaderboard', label: 'Rankings', icon: '/images/nav/trophy.png', iconWidth: 43 },
  { href: '/profile', label: 'Me', icon: 'avatar' as const, iconWidth: 0 },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [avatar, setAvatar] = useState<AvatarParts | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    const studentId = (session?.user as { studentId?: string } | undefined)?.studentId
    const cacheKey = `nav-avatar:${studentId ?? 'anon'}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        setAvatar(JSON.parse(cached))
        return
      } catch {
        sessionStorage.removeItem(cacheKey)
      }
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 md:hidden">
      {/* 3-slice wooden plank background: fixed caps + stretched middle */}
      <div
        className="absolute inset-y-0 left-[36px] right-[36px]"
        style={{
          backgroundImage: 'url(/images/nav/plank-mid.png)',
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/nav/plank-left.png"
        alt=""
        aria-hidden
        className="absolute left-0 inset-y-0 h-full w-[37px]"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/nav/plank-right.png"
        alt=""
        aria-hidden
        className="absolute right-0 inset-y-0 h-full w-[37px]"
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="relative flex h-full">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1"
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon === 'qr' ? (
                // Parchment QR panel pokes above the plank
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/nav/qr-scan.png"
                  alt=""
                  aria-hidden
                  className={`absolute left-1/2 -translate-x-1/2 -top-[26px] w-[78px] h-[71px] transition-transform ${isActive ? 'scale-110' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : item.icon === 'avatar' ? (
                <span
                  className={`absolute left-1/2 -translate-x-1/2 top-[9px] transition-transform ${isActive ? 'scale-110' : ''}`}
                >
                  <PixelAvatar
                    skin={avatar?.avatarSkin}
                    hair={avatar?.avatarHair}
                    eyes={avatar?.avatarEyes}
                    brow={avatar?.avatarBrows}
                    size={43}
                  />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden
                  className={`absolute left-1/2 -translate-x-1/2 top-[9px] h-[43px] object-contain transition-transform ${isActive ? 'scale-110' : ''}`}
                  style={{ width: item.iconWidth, imageRendering: 'pixelated' }}
                />
              )}
              <span
                className={`absolute left-1/2 -translate-x-1/2 font-bytebounce text-[18px] leading-none whitespace-nowrap ${item.label === 'QR Scan' ? 'top-[44px]' : 'top-[52px]'} ${isActive ? 'text-[#fff3d9]' : 'text-[#e0b391]'}`}
                style={{ textShadow: LABEL_SHADOW }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
