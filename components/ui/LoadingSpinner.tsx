// components/ui/LoadingSpinner.tsx
export default function LoadingSpinner({ text = "LOADING..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-16 h-16">
        {/* Pixel spinner made of divs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-yellow-400 border border-black"
            style={{
              top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8) - 6}%`,
              left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8) - 6}%`,
              opacity: (i + 1) / 8,
              animation: `blink ${0.8 + i * 0.1}s infinite`
            }}
          />
        ))}
      </div>
      <p className="text-yellow-400 text-xs font-pixel blink">{text}</p>
    </div>
  )
}