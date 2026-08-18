interface GroupEmblemProps {
  emblem?: string | null
  emblemUrl?: string | null
  size?: number
  className?: string
}

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
      className={`inline-block align-middle leading-none border-2 border-black ${className}`}
      style={{ fontSize: size }}
    >
      {emblem || '🛡️'}
    </span>
  )
}
