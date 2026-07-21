'use client'
// Preview for a stored QR code.
//
// The QR is stored as a `data:image/png;base64,...` string. Browsers block
// top-level navigation to data: URLs, so `<a href={dataUrl} target="_blank">`
// silently opens a blank tab -- which is what this modal replaces. Downloading
// a data: URL via an anchor's `download` attribute is still allowed, so the
// download button below works (same trick NpcForm/GenerateQrButton already use).
import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function QrPreviewModal({
  name,
  qrCode,
  onClose,
}: {
  name: string
  qrCode: string
  onClose: () => void
}) {
  // Escape closes, matching the backdrop click.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function download() {
    const a = document.createElement('a')
    a.href = qrCode
    a.download = `qr-${name.trim().replace(/\s+/g, '-').toLowerCase() || 'npc'}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`QR code for ${name}`}
    >
      {/* Stop clicks inside the card from reaching the backdrop handler. */}
      <div
        className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 truncate">{name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Scan or download to print</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCode}
          alt={`QR code for ${name}`}
          className="w-full h-auto border border-slate-200 rounded bg-white"
        />

        <button
          onClick={download}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-slate-900
            hover:bg-slate-800 text-white text-sm font-medium rounded-md px-4 py-2"
        >
          <Download size={16} />
          Download PNG
        </button>
      </div>
    </div>
  )
}
