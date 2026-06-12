// components/ui/PixelCard.tsx
interface PixelCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export default function PixelCard({ 
  children, 
  className = '',
  glowColor
}: PixelCardProps) {
  return (
    <div
      className={`
        pixel-card
        border-4
        border-black
        p-4
        rounded-none
        ${className}
      `}
      style={{
        boxShadow: glowColor 
          ? `6px 6px 0px #000, 0 0 20px ${glowColor}40`
          : '6px 6px 0px #000'
      }}
    >
      {children}
    </div>
  )
}