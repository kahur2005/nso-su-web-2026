interface AvatarProps {
  avatarUrl?: string | null
  /** Shown when there's no uploaded image (emoji). */
  fallback?: string
  className?: string
}

// Renders a student's profile picture: the uploaded image when `avatarUrl` is a
// URL, otherwise the emoji fallback. Fills its parent box, so wrap it in a sized,
// `overflow-hidden` container.
export default function Avatar({ avatarUrl, fallback = '👤', className = '' }: AvatarProps) {
  if (avatarUrl && /^(https?:|data:|\/)/.test(avatarUrl)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="Profile picture"
        className={`w-full h-full object-cover ${className}`}
      />
    )
  }
  return <>{avatarUrl || fallback}</>
}
