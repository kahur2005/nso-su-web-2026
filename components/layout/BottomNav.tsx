// components/layout/BottomNav.tsx
// Wooden-plank bottom nav (Figma node 258:678): pixel icons + ByteBounce labels.
// The "Me" tab renders the student's own pixel avatar, fetched once per tab
// session from /api/me/avatar and cached in sessionStorage.
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PixelAvatar from '@/components/ui/PixelAvatar'
import { parseAvatarConfig, hairKey } from '@/lib/avatar'
import { useStudentAvatar } from '@/lib/hooks/useStudentAvatar'

const LABEL_SHADOW = '2.4px 2.5px 0 #4e342e'

const items = [
  { href: '/dashboard', label: 'Home',    icon: '/images/nav/house.png',  iconWidth: 40 },
  { href: '/info',      label: 'Info',    icon: '/images/nav/info.png',   iconWidth: 28 },
  { href: '/scan',      label: 'QR Scan', icon: 'qr'     as const,        iconWidth: 0  },
  { href: '/leaderboard', label: 'Rankings', icon: '/images/nav/trophy.png', iconWidth: 43 },
  { href: '/profile',   label: 'Me',      icon: 'avatar' as const,        iconWidth: 0  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const avatarConfig = useStudentAvatar()
  const av = parseAvatarConfig(avatarConfig)

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
                    skin={av.skin}
                    clothes={av.clothes ?? undefined}
                    hair={hairKey(av)}
                    hijab={av.hijab ?? undefined}
                    eyes={av.eyes ?? undefined}
                    brow={av.brows ?? undefined}
                    mouth={av.mouth ?? undefined}
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
                className={`absolute left-1/2 -translate-x-1/2 font-bytebounce text-fluid-base leading-none whitespace-nowrap ${item.label === 'QR Scan' ? 'top-[44px]' : 'top-[52px]'} ${isActive ? 'text-[#fff3d9]' : 'text-[#e0b391]'}`}
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
