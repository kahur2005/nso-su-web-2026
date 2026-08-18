import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTimelineDays } from '@/lib/timeline-data'
import {
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from './actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

export default async function AdminTimelinePage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const days = await getTimelineDays()
  const totalRows = days.reduce((n, d) => n + d.agenda.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Timeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          The agenda students see at <span className="font-mono">/info/timeline</span>.
          Edit a row and press Save, or add one at the bottom of a day. Order
          controls the position within that day — lower numbers sit higher up.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          The six days and their dates are fixed for NSO 2026 and cannot be
          edited here.
        </p>
      </div>

      {totalRows === 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No agenda rows found. If you have not run{' '}
          <span className="font-mono">
            supabase/migrations/20260727_timeline_events.sql
          </span>{' '}
          yet, run it in the Supabase SQL Editor — it creates the table and
          seeds the original schedule.
        </div>
      )}

      {days.map((day) => (
        <section
          key={day.key}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-900">
              {day.headerTitle}
            </h2>
            <span className="text-xs text-slate-500">
              {day.date} · {day.agenda.length}{' '}
              {day.agenda.length === 1 ? 'row' : 'rows'}
            </span>
          </div>

          {day.agenda.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400">No rows for this day yet.</p>
          ) : (
            <div className="mb-4 space-y-2">
              {day.agenda.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 p-3"
                >
                  {/* Edit form. Separate from the delete form below because a
                      form cannot nest, and delete must not carry these fields. */}
                  <form
                    action={updateTimelineEvent}
                    className="flex flex-1 flex-wrap items-end gap-2"
                    id={`edit-${row.id}`}
                  >
                    <input type="hidden" name="id" value={row.id} />
                    <div className="w-[64px]">
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Order
                      </label>
                      <input
                        name="sortOrder"
                        type="number"
                        defaultValue={row.sortOrder}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-[150px]">
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Time
                      </label>
                      <input
                        name="time"
                        defaultValue={row.time}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="min-w-[200px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Activity
                      </label>
                      <input
                        name="activity"
                        defaultValue={row.activity}
                        required
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Save
                    </button>
                  </form>

                  <form action={deleteTimelineEvent}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Add a row to this day */}
          <form
            action={createTimelineEvent}
            className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4"
          >
            <input type="hidden" name="dayKey" value={day.key} />
            <div className="w-[150px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Time
              </label>
              <input
                name="time"
                placeholder="09:00 - 09:30"
                required
                className={inputClass}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Activity
              </label>
              <input
                name="activity"
                placeholder="Opening Greetings"
                required
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add row
            </button>
          </form>
        </section>
      ))}
    </div>
  )
}
