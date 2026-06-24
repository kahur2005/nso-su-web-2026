interface GroupEmblemProps {
  emblem?: string | null
  emblemUrl?: string | null
  /** Rendered width/height in px (square). */
  size?: number
  className?: string
}

// Renders a group's emblem: the uploaded logo image when present, otherwise the
// emoji emblem as a fallback. Inline + square so it drops into existing layouts.
export default function GroupEmblem({
  emblem,
  emblemUrl,
  size = 20,
  className = '',
}: GroupEmblemProps) {
  if (emblemUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={emblemUrl}
        alt={emblem || 'group emblem'}
        className={`inline-block object-cover align-middle border-2 border-black bg-white ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className={`inline-block align-middle leading-none ${className}`}
      style={{ fontSize: size }}
    >
      {emblem || '🛡️'}
    </span>
  )
}
