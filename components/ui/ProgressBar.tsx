// components/ui/ProgressBar.tsx
interface ProgressBarProps {
  value: number
  max: number
  color?: string
  showText?: boolean
  label?: string
}

export default function ProgressBar({
  value,
  max,
  color = '#4CAF50',
  showText = true,
  label
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-pixel text-white">{label}</span>
          {showText && (
            <span className="text-xs font-pixel text-yellow-400">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="pixel-progress w-full">
        <div
          className="pixel-progress-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}