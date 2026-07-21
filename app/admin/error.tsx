'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

// Catches runtime errors anywhere under /admin, including requireAdmin()'s
// `throw new Error('Unauthorized')` in app/admin/actions.ts, which previously
// had nothing to catch it. Styled in the admin light theme, not the student
// pixel/RPG theme.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-lg p-6 text-center">
        <h2 className="text-sm font-semibold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500 mt-2">
          {error.message === 'Unauthorized'
            ? 'You do not have permission to view this page.'
            : 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium
            rounded-md px-4 py-2 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
