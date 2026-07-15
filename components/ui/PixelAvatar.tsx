// components/ui/PixelAvatar.tsx
// Composite pixel avatar: skin base + hair overlay layered with absolute positioning.
// Pass size in px (square). Both props are optional — falls back to a plain placeholder.

interface PixelAvatarProps {
  /** e.g. "skin3" */
  skin?: string | null
  /** e.g. "hairb2" or "hairg1.2" */
  hair?: string | null
  size?: number
  className?: string
}

export default function PixelAvatar({
  skin = 'skin1',
  hair,
  size = 48,
  className = '',
}: PixelAvatarProps) {
  const activeSkin = skin || 'skin1'

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Base skin layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/avatar/${activeSkin}.png`}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Hair overlay (transparent PNG on top) */}
      {hair && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/avatar/${hair}.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
    </div>
  )
}
