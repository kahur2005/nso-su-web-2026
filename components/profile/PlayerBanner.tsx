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
  avatarBg: string
}

export default function PlayerBanner({
  name,
  level,
  title,
  into,
  span,
  avatar,
  avatarBg,
}: PlayerBannerProps) {
  const firstName = (name.split(' ')[0] || name).toUpperCase()
  const pct = span > 0 ? Math.max(0, Math.min(100, (into / span) * 100)) : 0

  return (
    <div
      className="flex items-center gap-4 px-4 py-4 sm:px-5"
      style={{
        backgroundImage: 'url(/images/profile/wooden-background.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
      data-tour="profile-header"
    >
      {/* Gold-framed avatar on its house backdrop */}
      <div
        className="shrink-0 border-[3px] border-[#fcf940]"
        style={{
          backgroundImage: `url(${avatarBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated'
        }}
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
        <p className="font-bytebounce text-fluid-sm leading-none" style={TAN}>
          WELCOME BACK, PLAYER
        </p>

        <h1
          className="my-1 truncate font-bytebounce text-[clamp(2.2rem,10.5vw,3.2rem)] leading-none"
          style={NAME_YELLOW}
        >
          {firstName} !
        </h1>

        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate font-bytebounce text-fluid-base leading-none" style={CREAM}>
            LEVEL {level} ✤ {title}
          </p>
          <p className="shrink-0 font-bytebounce text-fluid-xs leading-none" style={TAN}>
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
