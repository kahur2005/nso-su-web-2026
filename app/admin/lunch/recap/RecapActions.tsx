// app/admin/lunch/recap/RecapActions.tsx
// Copy-to-clipboard and download-as-.xlsx for the recap.
//
// The copy button builds its text from the same recapToRows() the server used
// to render the table and the spreadsheet, so all three agree. The download is
// a plain link to /api/lunch/recap, which re-queries server-side — that keeps
// the numbers authoritative and means the browser handles the file save.
'use client'
import { useEffect, useState } from 'react'
import { buildRecapText, type RecapTextOrder } from '@/lib/lunch'

export default function RecapActions({
  orders,
  dayKey,
  downloadHref,
}: {
  orders: RecapTextOrder[]
  dayKey?: string
  downloadHref: string
}) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'error'>('idle')
  const [preview, setPreview] = useState(false)

  const text = buildRecapText(orders, { dayKey })

  useEffect(() => {
    if (copied === 'idle') return
    const t = setTimeout(() => setCopied('idle'), 2500)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    const tsv = text
    try {
      await navigator.clipboard.writeText(tsv)
      setCopied('ok')
    } catch {
      // navigator.clipboard needs a secure context and permission, neither of
      // which is guaranteed. Fall back to a hidden textarea + execCommand,
      // which still works when it is blocked.
      try {
        const area = document.createElement('textarea')
        area.value = tsv
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        setCopied(ok ? 'ok' : 'error')
      } catch {
        setCopied('error')
      }
    }
  }

  const disabled = orders.length === 0

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied === 'ok'
            ? 'Copied'
            : copied === 'error'
              ? 'Copy failed'
              : 'Copy for WhatsApp'}
        </button>

        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          disabled={disabled}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {preview ? 'Hide preview' : 'Preview message'}
        </button>

        {disabled ? (
          <span className="cursor-not-allowed rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400">
            Download .xlsx
          </span>
        ) : (
          <a
            href={downloadHref}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download .xlsx
          </a>
        )}

        <span className="text-xs text-slate-500" role="status">
          {copied === 'ok'
            ? 'Paste it straight into the vendor’s chat.'
            : copied === 'error'
              ? 'Your browser blocked clipboard access — copy it from the preview instead.'
              : 'Copies the order list for the vendor. The .xlsx is the priced spreadsheet.'}
        </span>
      </div>

      {preview && (
        <pre className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
          {text}
        </pre>
      )}
    </div>
  )
}
