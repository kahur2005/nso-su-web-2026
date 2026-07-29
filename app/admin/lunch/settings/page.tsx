// app/admin/lunch/settings/page.tsx
// Two things committee has to set before students can order:
//
//   1. the static QRIS payload for the merchant account collecting the money
//   2. which days are open, and each day's cutoff
//
// Both are enforced server-side in POST /api/lunch/orders — a closed day or a
// missing QRIS payload rejects the request there, not just in the UI.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLunchDays, getQrisStatic } from '@/lib/lunch-data'
import { LUNCH_DAYS } from '@/lib/lunch'
import { isValidQrisPayload } from '@/lib/qris'
import LunchTabs from '../LunchTabs'
import { updateLunchSettings, updateLunchDay } from '../actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const saveButton =
  'rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700'

/**
 * <input type="datetime-local"> wants 'YYYY-MM-DDTHH:mm' in LOCAL time, while
 * the column is timestamptz. Building the string from the local getters is the
 * conversion; toISOString() would silently shift the displayed time by the
 * server's UTC offset.
 */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export default async function AdminLunchSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ qris?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const [{ qris }, qrisStatic, days] = await Promise.all([
    searchParams,
    getQrisStatic(),
    getLunchDays(),
  ])
  const byKey = new Map(days.map((d) => [d.dayKey, d]))

  // Validated on every read, not just on save: this catches a payload edited
  // directly in the Supabase table editor as well as one pasted here.
  const storedIsValid = qrisStatic ? isValidQrisPayload(qrisStatic) : true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Lunch</h1>
        <p className="mt-1 text-sm text-slate-500">
          Payment details and the ordering window for each day.
        </p>
      </div>

      <LunchTabs />

      {!qrisStatic && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No QRIS payload set.</strong> Students can browse the menu but
          every attempt to pay will fail until you paste one below.
        </div>
      )}

      {qris === 'invalid' && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <strong>Not saved — that payload failed its own checksum.</strong> It
          was altered somewhere between your bank and this form. Paste it again
          exactly as issued, including any spaces in the merchant name.
        </div>
      )}

      {qris === 'saved' && storedIsValid && qrisStatic && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          Payload saved and checksum verified.
        </div>
      )}

      {qrisStatic && !storedIsValid && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <strong>The stored QRIS payload is corrupt.</strong> It does not match
          its own checksum, so every payment code generated from it will fail in
          the student&apos;s banking app. Re-paste it below, exactly as your bank
          issued it.
        </div>
      )}

      {/* QRIS */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-900">QRIS merchant payload</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          The <em>static</em> QRIS string for the account collecting lunch money
          — the long code starting <span className="font-mono">00020101...</span>{' '}
          that you get by decoding your printed QRIS image. The app inserts each
          order&apos;s exact amount into it and recomputes the checksum, so
          students scan a code for the precise total. It is never shown to
          students as-is. Paste it exactly as issued — spaces inside the
          merchant name are part of the code. The checksum is verified on save,
          and a payload that fails it is rejected rather than stored.
        </p>
        <form action={updateLunchSettings} className="space-y-3">
          <textarea
            name="qrisStatic"
            rows={4}
            defaultValue={qrisStatic}
            placeholder="00020101021126670016COM.EXAMPLE.WWW..."
            className={`${inputClass} font-mono text-xs`}
          />
          <button type="submit" className={saveButton}>
            Save payload
          </button>
        </form>
      </section>

      {/* Days */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-900">Ordering days</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          A day has to be open <em>and</em> before its deadline for students to
          order. Leave the deadline blank to keep a day open indefinitely.
        </p>

        <div className="space-y-2">
          {LUNCH_DAYS.map((meta) => {
            const day = byKey.get(meta.key)
            return (
              <form
                key={meta.key}
                action={updateLunchDay}
                className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 p-3"
              >
                <input type="hidden" name="dayKey" value={meta.key} />
                <div className="min-w-[140px]">
                  <div className="text-sm font-medium text-slate-900">
                    {meta.headerTitle}
                  </div>
                  <div className="text-xs text-slate-500">{meta.date}</div>
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                  <input
                    name="isOpen"
                    type="checkbox"
                    defaultChecked={day?.isOpen ?? false}
                    className="h-4 w-4"
                  />
                  Open for orders
                </label>
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Order deadline
                  </label>
                  <input
                    name="orderDeadline"
                    type="datetime-local"
                    defaultValue={toLocalInputValue(day?.orderDeadline ?? null)}
                    className={inputClass}
                  />
                </div>
                <button type="submit" className={saveButton}>
                  Save
                </button>
              </form>
            )
          })}
        </div>
      </section>
    </div>
  )
}
