// components/profile/PlayerBanner.tsx
// The wood sign at the top of /profile (Figma VCnH1k8cwo2dWaLjL7YRVS node 8:2).
// The sign itself is `.wood-plank` rather than a sprite: the frame's board is
// that class's exact palette — #3e2723 border, #ba8f6e highlight, then the
// #88684e / #6d4c41 / #4e342e bands — so a crop would add an asset and a
// corner-transparency problem for no visual gain.
import PixelAvatar from '@/components/ui/PixelAvatar'
import { hairKey, type ParsedAvatar } from '@/lib/avatar'

const TAN = { color: '#e0b391', textShadow: '1.5px 1.5px 0 #3e2723' }
const CREAM = { color: '#ffecb3', textShadow: '1.5px 1.5px 0 #3e2723' }
const NAME_YELLOW = { color: '#fcf940', textShadow: '3px 3px 0 #3e2723' }

interface PlayerBannerProps {
  name: string
  level: number
  title: string
  into: number
  span: number
  avatar: ParsedAvatar
}

export default function PlayerBanner({
  name,
  level,
  title,
  into,
  span,
  avatar,
}: PlayerBannerProps) {
  const firstName = (name.split(' ')[0] || name).toUpperCase()
  const pct = span > 0 ? Math.max(0, Math.min(100, (into / span) * 100)) : 0

  return (
    <div
      className="wood-plank flex items-center gap-4 px-4 py-4 sm:px-5"
      data-tour="profile-header"
    >
      {/* Gold-framed avatar on the frame's red backing */}
      <div
        className="shrink-0 border-[3px] border-[#fcf940]"
        style={{ background: 'linear-gradient(180deg, #761915 0%, #d6101d 100%)' }}
      >
        <PixelAvatar
          skin={avatar.skin}
          clothes={avatar.clothes ?? undefined}
          hair={hairKey(avatar) ?? undefined}
          hijab={avatar.hijab ?? undefined}
          eyes={avatar.eyes ?? undefined}
          brow={avatar.brows ?? undefined}
          mouth={avatar.mouth ?? undefined}
          size={80}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bytebounce text-[16px] leading-none sm:text-[17px]" style={TAN}>
          WELCOME BACK, PLAYER
        </p>

        <h1
          className="my-1 truncate font-bytebounce text-[clamp(2.2rem,10.5vw,3.2rem)] leading-none"
          style={NAME_YELLOW}
        >
          {firstName} !
        </h1>

        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate font-bytebounce text-[17px] leading-none sm:text-[18px]" style={CREAM}>
            LEVEL {level} – {title}
          </p>
          <p className="shrink-0 font-bytebounce text-[14px] leading-none sm:text-[15px]" style={TAN}>
            {into}/{span} xp
          </p>
        </div>

        {/* XP bar: dark track, gold fill, as on the sign in the frame */}
        <div className="mt-1.5 h-[11px] w-full overflow-hidden rounded-full border border-[#a1887f] bg-[#3e2723]">
          <div className="h-full rounded-full bg-[#fcf940]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
