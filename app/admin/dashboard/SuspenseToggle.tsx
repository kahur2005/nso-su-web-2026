import { setLeaderboardSuspenseAction } from '@/app/admin/actions'

export default function SuspenseToggle({ enabled }: { enabled: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">Leaderboard suspense</p>
        <p className="text-xs text-slate-500">
          {enabled
            ? 'ON — public Rankings are veiled; /gl awards paused'
            : 'OFF — public Rankings show real names and points'}
        </p>
      </div>
      <form action={setLeaderboardSuspenseAction}>
        <input type="hidden" name="value" value={enabled ? 'false' : 'true'} />
        <button
          type="submit"
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          {enabled ? 'Reveal rankings' : 'Hide rankings'}
        </button>
      </form>
    </div>
  )
}
