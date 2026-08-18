interface PixelAvatarProps {
  /** e.g. "skin3" */
  skin?: string | null
  /** e.g. "roundshirt1", "shirt2", "turtleneck3" */
  clothes?: string | null
  /** e.g. "hairb2" or "hairg1.2" */
  hair?: string | null
  /** e.g. "hijab1" */
  hijab?: string | null
  /** e.g. "eyes1" */
  eyes?: string | null
  /** e.g. "brow1" */
  brow?: string | null
  /** e.g. "mouth1" */
  mouth?: string | null
  size?: number
  className?: string
}

export default function PixelAvatar({
  skin = 'skin1',
  clothes,
  hair,
  hijab,
  eyes,
  brow,
  mouth,
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

      {/* Clothes layer (over skin, under face details) */}
      {clothes && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/avatar/${clothes}.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Eyes layer */}
      {eyes && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/avatar/${eyes}.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Brows layer */}
      {brow && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/avatar/${brow}.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Mouth layer */}
      {mouth && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/avatar/${mouth}.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Hair overlay */}
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

      {/* Hijab overlay (top layer) */}
      {hijab && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/avatar/${hijab}.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
    </div>
  )
}
