// app/(game)/scan/RecentScansPopup.tsx
// Receipt-scroll popup (Figma node 269:99): last 10 scans as a
// Time / Name / Points table plus the all-time scan total.
'use client'

interface RecentScan {
  scannedAt: string
  pointsAwarded: number
  npc?: { committeeName?: string }
}

interface RecentScansPopupProps {
  scans: RecentScan[]
  total: number
  onClose: () => void
}

const BROWN = '#6d4c41'

export default function RecentScansPopup({ scans, total, onClose }: RecentScansPopupProps) {
  const rows = scans.slice(0, 10)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Recent scans"
    >
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Receipt scroll */}
      <div
        className="relative w-[320px] max-w-[88vw] h-[520px] max-h-[85vh]"
        style={{
          backgroundImage: 'url(/images/scan/receipt.png)',
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated',
        }}
      >
        {/* Content sits on the paper area of the scroll (rolled corner is top-left) */}
        <div
          className="absolute flex flex-col overflow-hidden"
          style={{ left: '27%', right: '16%', top: '12.5%', bottom: '7.5%' }}
        >
          <h2
            className="font-bytebounce text-[30px] leading-none text-center mb-3"
            style={{ color: BROWN }}
          >
            Recent Scans
          </h2>

          {/* Table header */}
          <div
            className="flex font-bytebounce text-[16px] leading-none gap-2"
            style={{ color: BROWN }}
          >
            <span className="w-11 shrink-0">Time</span>
            <span className="flex-1">Name</span>
            <span className="shrink-0">Points</span>
          </div>
          <div className="border-t-2 border-dashed my-1.5" style={{ borderColor: BROWN }} />

          {/* Rows */}
          <div className="flex flex-col gap-0.5">
            {rows.map((scan, i) => (
              <div
                key={i}
                className="flex font-bytebounce text-[16px] leading-[1.15] gap-2"
                style={{ color: BROWN }}
              >
                <span className="w-11 shrink-0">
                  {new Date(scan.scannedAt).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="flex-1 truncate">{scan.npc?.committeeName ?? '???'}</span>
                <span className="shrink-0">+{scan.pointsAwarded} pts</span>
              </div>
            ))}
            {rows.length === 0 && (
              <p
                className="font-bytebounce text-[16px] text-center py-3"
                style={{ color: BROWN }}
              >
                No scans yet - go find an NPC!
              </p>
            )}
          </div>

          <div className="border-t-2 border-dashed my-1.5" style={{ borderColor: BROWN }} />

          {/* Total */}
          <div
            className="flex justify-between font-bytebounce text-[18px] leading-none"
            style={{ color: BROWN }}
          >
            <span>Total Scanned:</span>
            <span>{total}</span>
          </div>

          {/* Close (X) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mt-auto mx-auto transition-transform active:scale-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/scan/close.png"
              alt=""
              aria-hidden
              className="w-9 h-9"
              style={{ imageRendering: 'pixelated' }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
