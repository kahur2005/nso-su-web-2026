# Leaderboard Suspense Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins veil the public Rankings page (names/points/logos → `?`, hide bars/LV/RECORD) while keeping admin rankings real, and pause `/gl` point awards until reveal.

**Architecture:** Store `leaderboardSuspense` on a single-row `AppSetting` table. Public `/api/leaderboard` (+ feed) redact identity/score fields for non-admins when the flag is on and return `suspense: boolean`. Student UI branches on that flag. Admin Dashboard toggles the flag via server action and keeps reading Supabase directly. `/gl` + `POST /api/gl/points` refuse work while suspense is on.

**Tech Stack:** Next.js 16 App Router, next-auth v4, Supabase JS client, existing admin server-action patterns, Framer Motion leaderboard page.

**Spec:** `docs/superpowers/specs/2026-08-22-leaderboard-suspense-design.md`

## Global Constraints

- **No test framework.** Verify with `npm run build` redirected to a log; confirm `✓ Compiled successfully` and `Finished TypeScript`. Do not use `npm run lint` (broken).
- **Never run `npm run build` while `npm run dev` is running** — they share `.next`. Ask before killing the user's dev process.
- **Never import `@/lib/supabase` from a client component.**
- Admin rankings (Dashboard / Groups) **must stay real** — do not route them through the redacted public API.
- Missing `AppSetting` row → treat suspense as **`false`**.
- Seeded default: `leaderboardSuspense = false`.
- No teaser banner copy on Rankings.
- Consult `node_modules/next/dist/docs/01-app/` before new Next.js APIs.
- Commit only when the user asks (or at task end if they already approved commits for this workstream).

## File map

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20260822_app_setting_leaderboard_suspense.sql` | Create `AppSetting` + seed row |
| `lib/app-settings.ts` | Read/write `leaderboardSuspense` |
| `lib/leaderboard-redact.ts` | Pure redaction helpers for API payloads |
| `app/api/app-settings/route.ts` | Public `GET { leaderboardSuspense }` |
| `app/api/leaderboard/route.ts` | Session + flag; redact for non-admins; add `suspense` |
| `app/api/leaderboard/feed/route.ts` | Same; empty feed when veiled |
| `app/api/gl/points/route.ts` | Reject awards while suspense ON |
| `app/admin/actions.ts` | `setLeaderboardSuspense` server action |
| `app/admin/dashboard/SuspenseToggle.tsx` | Client/form UI for the toggle |
| `app/admin/dashboard/page.tsx` | Mount toggle next to Current rankings |
| `app/(game)/leaderboard/page.tsx` | `?` UI, hide bars/LV/RECORD when `suspense` |
| `app/(game)/gl/page.tsx` | Blocked state when suspense ON |

---

### Task 1: `AppSetting` migration + settings helpers

**Files:**
- Create: `supabase/migrations/20260822_app_setting_leaderboard_suspense.sql`
- Create: `lib/app-settings.ts`

**Interfaces:**
- Produces:
  - `getLeaderboardSuspense(): Promise<boolean>` — missing/error → `false`
  - `setLeaderboardSuspense(value: boolean): Promise<void>` — upserts `id = 'default'`

- [ ] **Step 1: Add the migration**

```sql
-- AppSetting: single-row app flags (leaderboard suspense / final-day reveal)
CREATE TABLE IF NOT EXISTS "AppSetting" (
  "id" text PRIMARY KEY,
  "leaderboardSuspense" boolean NOT NULL DEFAULT false
);

INSERT INTO "AppSetting" ("id", "leaderboardSuspense")
VALUES ('default', false)
ON CONFLICT ("id") DO NOTHING;
```

- [ ] **Step 2: Add `lib/app-settings.ts`**

```ts
import { supabase } from '@/lib/supabase'

const SETTING_ID = 'default'

export async function getLeaderboardSuspense(): Promise<boolean> {
  const { data, error } = await supabase
    .from('AppSetting')
    .select('leaderboardSuspense')
    .eq('id', SETTING_ID)
    .maybeSingle()

  if (error) {
    console.error('getLeaderboardSuspense:', error)
    return false
  }
  return data?.leaderboardSuspense === true
}

export async function setLeaderboardSuspense(value: boolean): Promise<void> {
  const { error } = await supabase.from('AppSetting').upsert({
    id: SETTING_ID,
    leaderboardSuspense: value,
  })
  if (error) {
    console.error('setLeaderboardSuspense:', error)
    throw new Error('Failed to update leaderboard suspense')
  }
}
```

- [ ] **Step 3: Apply migration to the linked Supabase project**

Use the project’s normal migration path (Supabase CLI / dashboard SQL). Confirm one row exists:

```sql
SELECT * FROM "AppSetting" WHERE id = 'default';
```

Expected: `leaderboardSuspense = false`.

- [ ] **Step 4: Commit** (only if user asked for commits)

```bash
git add supabase/migrations/20260822_app_setting_leaderboard_suspense.sql lib/app-settings.ts
git commit -m "feat: add AppSetting flag for leaderboard suspense"
```

---

### Task 2: Pure redaction helpers

**Files:**
- Create: `lib/leaderboard-redact.ts`

**Interfaces:**
- Consumes: shapes returned by today’s leaderboard/feed builders (groups with members, topStudents, feed items).
- Produces:
  - `redactLeaderboardPayload(payload: { groups: any[]; topStudents: any[] }): { groups: any[]; topStudents: any[] }`
  - `redactFeedPayload(): { feed: [] }` (always empty when called under veil)

Redaction rules (keep `id` and array order; strip identity/scores/display):

- Group: keep `id`; set `name` to `'?'`; `totalPoints` to `0`; `emblem` to `''`; `emblemUrl` to `null`; `color` to `'#888888'`; keep `_count.members`; map `members` with member redaction.
- Member: keep `id`; `name` `'?'`; `points` `0`; `funFactsCollected` `0`; `instagram` `null`; `avatarConfig` `null`.
- Student: keep `id`; `name` `'?'`; `studentId` to `'?'`; `points` `0`; `funFactsCollected` `0`; `avatarConfig` `null`; `group` → `{ name: '?', emblem: '', emblemUrl: null, color: '#888888' }` or `null` if already null.

- [ ] **Step 1: Implement `lib/leaderboard-redact.ts`**

```ts
function redactMember(m: any) {
  return {
    id: m.id,
    name: '?',
    points: 0,
    funFactsCollected: 0,
    instagram: null,
    avatarConfig: null,
    isAdmin: false,
  }
}

function redactGroup(g: any) {
  return {
    id: g.id,
    name: '?',
    emblem: '',
    emblemUrl: null,
    color: '#888888',
    totalPoints: 0,
    members: (g.members ?? []).map(redactMember),
    _count: g._count ?? { members: (g.members ?? []).length },
  }
}

function redactStudent(s: any) {
  return {
    id: s.id,
    name: '?',
    studentId: '?',
    points: 0,
    funFactsCollected: 0,
    avatarConfig: null,
    isAdmin: false,
    group: s.group
      ? { name: '?', emblem: '', emblemUrl: null, color: '#888888' }
      : null,
  }
}

export function redactLeaderboardPayload(payload: {
  groups: any[]
  topStudents: any[]
}) {
  return {
    groups: (payload.groups ?? []).map(redactGroup),
    topStudents: (payload.topStudents ?? []).map(redactStudent),
  }
}

export function redactFeedPayload() {
  return { feed: [] as const }
}
```

- [ ] **Step 2: Commit** (only if user asked)

```bash
git add lib/leaderboard-redact.ts
git commit -m "feat: add leaderboard payload redaction helpers"
```

---

### Task 3: Wire public APIs (`app-settings`, leaderboard, feed, gl/points)

**Files:**
- Create: `app/api/app-settings/route.ts`
- Modify: `app/api/leaderboard/route.ts`
- Modify: `app/api/leaderboard/feed/route.ts`
- Modify: `app/api/gl/points/route.ts`

**Interfaces:**
- Consumes: `getLeaderboardSuspense`, `redactLeaderboardPayload`, `redactFeedPayload`, `getServerSession(authOptions)`
- Produces:
  - `GET /api/app-settings` → `{ leaderboardSuspense: boolean }`
  - `GET /api/leaderboard` → `{ groups, topStudents, suspense }`
  - `GET /api/leaderboard/feed` → `{ feed, suspense }`
  - `POST /api/gl/points` → `403` with message when suspense ON (before awarding)

- [ ] **Step 1: Create `app/api/app-settings/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getLeaderboardSuspense } from '@/lib/app-settings'

export async function GET() {
  const leaderboardSuspense = await getLeaderboardSuspense()
  return NextResponse.json({ leaderboardSuspense })
}
```

- [ ] **Step 2: Update `app/api/leaderboard/route.ts`**

At the top of `GET`, after building the real `groups` / `topStudents` (keep existing query + sort logic unchanged):

```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLeaderboardSuspense } from '@/lib/app-settings'
import { redactLeaderboardPayload } from '@/lib/leaderboard-redact'

// ... existing build of groups, topStudents ...

const suspense = await getLeaderboardSuspense()
const session = await getServerSession(authOptions)
const isAdmin = Boolean(session?.user?.isAdmin)

if (suspense && !isAdmin) {
  const redacted = redactLeaderboardPayload({ groups, topStudents })
  return NextResponse.json({ ...redacted, suspense: true })
}

return NextResponse.json({ groups, topStudents, suspense })
```

- [ ] **Step 3: Update `app/api/leaderboard/feed/route.ts`**

Same pattern: compute existing `feed`, then:

```ts
const suspense = await getLeaderboardSuspense()
const session = await getServerSession(authOptions)
const isAdmin = Boolean(session?.user?.isAdmin)

if (suspense && !isAdmin) {
  return NextResponse.json({ feed: [], suspense: true })
}

return NextResponse.json({ feed, suspense })
```

(Optional optimization: skip the heavy feed queries when `suspense && !isAdmin` — preferred.)

- [ ] **Step 4: Gate `app/api/gl/points/route.ts`**

Immediately after the existing GL/committee/admin authorization check:

```ts
import { getLeaderboardSuspense } from '@/lib/app-settings'

if (await getLeaderboardSuspense()) {
  return NextResponse.json(
    { error: 'Point assignment is paused until leaderboard reveal.' },
    { status: 403 }
  )
}
```

- [ ] **Step 5: Typecheck via production build**

Ask before stopping `npm run dev` if running. Then:

```powershell
npm run build 2>&1 | Tee-Object -FilePath build-leaderboard-suspense.log
```

Expected: `✓ Compiled successfully` and TypeScript finished with no errors related to these files.

- [ ] **Step 6: Commit** (only if user asked)

```bash
git add app/api/app-settings/route.ts app/api/leaderboard/route.ts app/api/leaderboard/feed/route.ts app/api/gl/points/route.ts
git commit -m "feat: redact public leaderboard APIs when suspense is on"
```

---

### Task 4: Admin Dashboard toggle

**Files:**
- Modify: `app/admin/actions.ts` — add `setLeaderboardSuspenseAction`
- Create: `app/admin/dashboard/SuspenseToggle.tsx`
- Modify: `app/admin/dashboard/page.tsx` — load flag + render toggle beside Current rankings

**Interfaces:**
- Consumes: `requireAdmin` pattern, `setLeaderboardSuspense`, `getLeaderboardSuspense`, `revalidatePath`
- Produces: form action toggling boolean; UI shows ON/OFF clearly

- [ ] **Step 1: Add server action in `app/admin/actions.ts`**

```ts
import { setLeaderboardSuspense } from '@/lib/app-settings'

export async function setLeaderboardSuspenseAction(formData: FormData) {
  await requireAdmin()
  const next = String(formData.get('value') || '') === 'true'
  await setLeaderboardSuspense(next)
  revalidatePath('/admin/dashboard')
  revalidatePath('/leaderboard')
  revalidatePath('/gl')
}
```

- [ ] **Step 2: Create `SuspenseToggle.tsx`**

Server-friendly form (no client JS required):

```tsx
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
```

- [ ] **Step 3: Mount on Dashboard**

In `app/admin/dashboard/page.tsx`:

- Import `getLeaderboardSuspense` and `SuspenseToggle`.
- `const leaderboardSuspense = await getLeaderboardSuspense()` next to `getAdminStats()`.
- Above the “Current rankings” `<h2>`, render `<SuspenseToggle enabled={leaderboardSuspense} />`.
- Leave the rankings list data path unchanged (still from `stats.groups`).

- [ ] **Step 4: Manual check**

As admin: open `/admin/dashboard`, click Hide → refresh `/leaderboard` as a student session (or logged-out if API allows) and confirm veil. Click Reveal → real board returns. Admin Current rankings must stay real while hidden.

- [ ] **Step 5: Commit** (only if user asked)

```bash
git add app/admin/actions.ts app/admin/dashboard/SuspenseToggle.tsx app/admin/dashboard/page.tsx
git commit -m "feat: add admin dashboard toggle for leaderboard suspense"
```

---

### Task 5: Student Rankings UI veil

**Files:**
- Modify: `app/(game)/leaderboard/page.tsx`

**Interfaces:**
- Consumes: `suspense` boolean from `/api/leaderboard` (+ feed)
- Produces: when `suspense === true` — `?` for name/points/logo, no bars, no LV, no RECORD tab, no Instagram; ranks/trophies unchanged

- [ ] **Step 1: Track suspense state**

```ts
const [suspense, setSuspense] = useState(false)
```

In `fetchData`, after parsing JSON:

```ts
setSuspense(Boolean(lb.suspense))
```

If `activeTab === 'record'` and the new suspense value is true, reset tab to `'groups'`:

```ts
if (lb.suspense) {
  setActiveTab((t) => (t === 'record' ? 'groups' : t))
}
```

(Use a functional update or set after reading — avoid stale closure bugs.)

- [ ] **Step 2: Filter tabs**

```ts
const tabs: { key: Tab; label: string }[] = suspense
  ? [
      { key: 'groups', label: 'GUILDS' },
      { key: 'individual', label: 'PLAYERS' },
    ]
  : [
      { key: 'groups', label: 'GUILDS' },
      { key: 'individual', label: 'PLAYERS' },
      { key: 'record', label: 'RECORD' },
    ]
```

- [ ] **Step 3: Current Leader plaque**

When `suspense`, replace points text with `? Points`, name banner with `?`, and center art with a large `?` (`font-bytebounce`) instead of `GroupIcon` / `PixelAvatar`. Keep board/stars/banner chrome.

- [ ] **Step 4: Guild rows**

When `suspense`:

- Replace `GroupIcon` with a `?` block of similar size.
- Show name as `?` (API already sends `?`, but render explicitly).
- Hide the `LV …` line.
- Hide `<PixelBar … />`.
- Show points as `?` (not `0`).
- Keep expand behavior; in roster: no Instagram `<a>` (always plain span); avatar → `?` or blank pixel placeholder; name/points display `?`.

When `!suspense`: keep current markup.

- [ ] **Step 5: Player rows**

Same pattern: mask avatar/name/points; hide `PixelBar`; keep trophies/ranks.

- [ ] **Step 6: Manual check**

With suspense ON: GUILDS/PLAYERS only; Current Leader and rows show `?`; expand shows veiled members; DevTools Network on `/api/leaderboard` shows redacted fields (no real names). With OFF: identical to today’s UI.

- [ ] **Step 7: Commit** (only if user asked)

```bash
git add "app/(game)/leaderboard/page.tsx"
git commit -m "feat: veil public leaderboard UI during suspense"
```

---

### Task 6: Pause `/gl` UI

**Files:**
- Modify: `app/(game)/gl/page.tsx`

**Interfaces:**
- Consumes: `GET /api/app-settings` → `{ leaderboardSuspense }`
- Produces: blocked panel when true; full panel when false

- [ ] **Step 1: Load suspense on mount**

After auth is ready and `isAuthorized`, fetch settings:

```ts
const [suspense, setSuspense] = useState<boolean | null>(null)

useEffect(() => {
  if (!isAuthorized) return
  fetch('/api/app-settings')
    .then((r) => r.json())
    .then((d) => setSuspense(Boolean(d.leaderboardSuspense)))
    .catch(() => setSuspense(false))
}, [isAuthorized])
```

While `suspense === null`, show `LoadingSpinner`.

- [ ] **Step 2: Blocked UI**

If `suspense === true`, render inside `PageWrapper` / `game-column`:

- Title: `GL POINT PANEL`
- Message: `Point assignment is paused until the leaderboard is revealed.`
- Do not render search or award forms.

- [ ] **Step 3: Manual check**

Suspense ON → `/gl` blocked; POST `/api/gl/points` returns 403. Suspense OFF → panel works.

- [ ] **Step 4: Final build**

```powershell
npm run build 2>&1 | Tee-Object -FilePath build-leaderboard-suspense.log
```

Expected: clean compile + TypeScript.

- [ ] **Step 5: Commit** (only if user asked)

```bash
git add "app/(game)/gl/page.tsx"
git commit -m "feat: pause GL point panel while leaderboard suspense is on"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Admin toggle on Dashboard | Task 4 |
| Keep ranks; mask name/points/logo | Tasks 2, 3, 5 |
| Hide bars + LV + RECORD | Task 5 |
| Guild expand with masked roster | Task 5 |
| Admins-only real data | Tasks 3, 4 |
| `/gl` disabled + API reject | Tasks 3, 6 |
| No teaser banner | Task 5 (do not add) |
| Missing row → OFF | Task 1 |
| Default false | Task 1 |
| Redact APIs (not UI-only) | Tasks 2–3 |

## Self-review notes

- No scheduled auto-reveal (out of scope).
- Admin path never uses redacted API.
- `suspense` in JSON is always the DB flag; redaction only when `suspense && !isAdmin`.
- Points display uses `?` in UI even though API sends `0` after redaction (avoid showing literal zeros).
