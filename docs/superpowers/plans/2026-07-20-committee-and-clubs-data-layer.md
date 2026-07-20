# Committee & Clubs Data Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/map/committee` and `/map/clubs` off hardcoded mock data onto real Supabase tables, so the admin panel built in Plan 3 has something to write to.

**Architecture:** `NPC` is extended with `division` and `instagram` rather than introducing a parallel `Committee` table — see the decision note below. `Club` gains `images text[]`, `instagram`, and `registrationUrl`. Two new public GET route handlers (`/api/committee`, `/api/clubs`) serve the data; the two existing `'use client'` pages fetch from them and drop their mock arrays, keeping all current layout and interaction.

**Tech Stack:** Supabase Postgres 17, Next.js 16.2.9 App Router route handlers, `@supabase/supabase-js`.

## Global Constraints

- **No test framework.** Verification is `npm run build`, SQL `select` assertions, and manual checks against `npm run dev`. Do not add a test runner.
- `npm run lint` already fails with ~44 errors on a clean checkout. Compare counts; do not fix unrelated errors.
- All Supabase identifiers are **quoted PascalCase/camelCase** in SQL and case-exact in `.from()`/`.select()`.
- One Supabase project, **no staging**. All DDL hits production.
- `lib/supabase.ts` uses the **service-role** key and is **server-only**. Never import it into a `'use client'` file. Client pages must go through a route handler.
- Division ids and colors are fixed and must match `app/(game)/map/committee/page.tsx` exactly:
  `mainboard` `#a83fbf` · `itlog` `#331f8f` · `pubdoc` `#22998f` · `event` `#cc0505` · `creative` `#f5187a` · `groupleader` `#7fa510`
- Depends on: **Plan 1 complete** (not strictly required by the code here, but Plan 3 needs both).

## Decision: extend `NPC`, do not create a `Committee` table

`NPC` already stores `committeeName`, `role`, `funFact`, `avatarUrl`, `points`, `qrToken`, `qrCode`, `isActive`, `scanCount`. That is a committee member with a QR code attached. The `/map/committee` mock even names its own future source as "the NPC/committee tables", and its `isScanned` gate is exactly a `ScanLog` lookup.

A separate `Committee` table would duplicate every field and force a join-or-sync between "the person" and "the person's QR". Extending `NPC` with two columns keeps one row per committee member and makes the QR-generation admin tab and the committee-roster admin tab two views of the same table.

**Consequence for Plan 3:** admin tabs (a) "QR" and (f) "Committee" operate on `NPC`. They stay separate tabs — (a) is QR-code-centric, (f) is roster-centric — but they must not be allowed to create duplicate rows for one person.

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/schema.sql` (modify) | Add new columns to `NPC` and `Club` so rebuilds match production |
| `lib/divisions.ts` (create) | Single source of truth for the 6 divisions; imported by public page, API, and Plan 3's admin |
| `app/api/committee/route.ts` (create) | Public GET: members grouped by division + the caller's scanned set |
| `app/api/clubs/route.ts` (create) | Public GET: all clubs with images/links |
| `app/(game)/map/committee/page.tsx` (modify) | Drop `MEMBERS`/`ROLES` mocks; fetch `/api/committee` |
| `app/(game)/map/clubs/page.tsx` (modify) | Drop the `clubs` array; fetch `/api/clubs` |

---

### Task 1: Add the schema columns

**Files:**
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: `NPC.division text`, `NPC.instagram text`, `Club.images text[]`, `Club.instagram text`, `Club.registrationUrl text`. Every later task and all of Plan 3 depend on these exact names.

- [ ] **Step 1: Apply the DDL**

Run in the Supabase SQL Editor:

```sql
begin;

alter table "NPC"
  add column if not exists "division"  text,
  add column if not exists "instagram" text;

alter table "Club"
  add column if not exists "images"          text[] not null default '{}',
  add column if not exists "instagram"       text,
  add column if not exists "registrationUrl" text;

create index if not exists "NPC_division_idx" on "NPC" ("division");

commit;
```

`division` is nullable so the 3 existing NPC rows survive; the API treats `null` as unassigned. `images` defaults to an empty array so the carousel never receives `null`.

- [ ] **Step 2: Assert the columns exist**

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_name in ('NPC','Club')
  and column_name in ('division','instagram','images','registrationUrl')
order by table_name, column_name;
```

Expected 5 rows: `Club.images` = `ARRAY`, `Club.instagram` = `text`, `Club.registrationUrl` = `text`, `NPC.division` = `text`, `NPC.instagram` = `text`.

- [ ] **Step 3: Backfill the 3 existing NPCs to a division**

```sql
update "NPC" set "division" = 'mainboard' where "division" is null;
select "committeeName", "division" from "NPC";
```

Expected: 3 rows, all `mainboard`. They can be re-assigned from the admin panel later.

- [ ] **Step 4: Mirror into `supabase/schema.sql`**

Add the new columns inline to the `create table "NPC"` and `create table "Club"` statements (not as trailing `alter`s), so a clean rebuild produces the same shape:

```sql
-- inside create table "NPC", after "role":
  "division"        text,
  "instagram"       text,
-- inside create table "Club", after "description":
  "images"          text[] not null default '{}',
  "instagram"       text,
  "registrationUrl" text,
```

Also add `create index "NPC_division_idx" on "NPC" ("division");` next to the other index declarations.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): add division/instagram to NPC and carousel+link fields to Club"
```

---

### Task 2: Extract the division constants

**Files:**
- Create: `lib/divisions.ts`
- Modify: `app/(game)/map/committee/page.tsx` (import instead of redeclare)

**Interfaces:**
- Produces:
  - `type DivisionId = 'mainboard' | 'itlog' | 'pubdoc' | 'event' | 'creative' | 'groupleader'`
  - `interface Division { id: DivisionId; name: string; color: string }`
  - `const DIVISIONS: Division[]` — ordered, Mainboards first
  - `function divisionName(id: string | null): string`
  - Consumed by Task 3, Task 4, and every committee screen in Plan 3.

- [ ] **Step 1: Write `lib/divisions.ts`**

```ts
// The six NSO 2026 committee divisions. Order and colours follow the Figma
// bookmark ribbon (top to bottom); Mainboards is always first. This is the
// single source of truth -- the public committee page, the committee API, and
// the admin panel all import from here.

export type DivisionId =
  | 'mainboard'
  | 'itlog'
  | 'pubdoc'
  | 'event'
  | 'creative'
  | 'groupleader'

export interface Division {
  id: DivisionId
  name: string
  /** bookmark + banner colour */
  color: string
}

export const DIVISIONS: Division[] = [
  { id: 'mainboard', name: 'Mainboards', color: '#a83fbf' },
  { id: 'itlog', name: 'IT & Logistics', color: '#331f8f' },
  { id: 'pubdoc', name: 'PubDoc', color: '#22998f' },
  { id: 'event', name: 'Event', color: '#cc0505' },
  { id: 'creative', name: 'Creative', color: '#f5187a' },
  { id: 'groupleader', name: 'Group Leader', color: '#7fa510' },
]

export const DIVISION_IDS = DIVISIONS.map((d) => d.id)

/** True when `id` is one of the six known divisions. */
export function isDivisionId(id: unknown): id is DivisionId {
  return typeof id === 'string' && (DIVISION_IDS as string[]).includes(id)
}

/** Display name for a stored division id; falls back for null/unknown values. */
export function divisionName(id: string | null): string {
  return DIVISIONS.find((d) => d.id === id)?.name ?? 'Unassigned'
}
```

- [ ] **Step 2: Import it in the committee page**

In `app/(game)/map/committee/page.tsx`, delete the local `interface Division` and `const DIVISIONS` declarations and replace with:

```ts
import { DIVISIONS } from '@/lib/divisions'
```

Leave `ROLES`, `MEMBERS`, and the rest of the mock data alone for now — Task 4 removes them.

- [ ] **Step 3: Verify the build compiles**

```bash
npm run build
```

Expected: success. The page renders identically because the constants are byte-identical to what was inlined.

- [ ] **Step 4: Commit**

```bash
git add lib/divisions.ts "app/(game)/map/committee/page.tsx"
git commit -m "refactor: extract committee divisions into lib/divisions.ts"
```

---

### Task 3: Add the `/api/committee` and `/api/clubs` route handlers

**Files:**
- Create: `app/api/committee/route.ts`
- Create: `app/api/clubs/route.ts`

**Interfaces:**
- Consumes: `DIVISIONS`, `isDivisionId` from `lib/divisions.ts`.
- Produces two JSON contracts, consumed by Task 4:

```ts
// GET /api/committee
{ members: Array<{
    id: string; name: string; role: string; division: string;
    imageUrl: string | null; instagram: string | null;
    funFact: string; isScanned: boolean
  }> }

// GET /api/clubs
{ clubs: Array<{
    id: string; name: string; category: string; description: string;
    images: string[]; instagram: string | null; registrationUrl: string | null;
    iconUrl: string | null
  }> }
```

Both are **public reads** — no 401 — matching `/api/leaderboard`. `/api/committee` still calls `getServerSession` because `isScanned` is per-student; with no session every member returns `isScanned: false`, which is the correct locked state for a logged-out viewer.

- [ ] **Step 1: Write `app/api/committee/route.ts`**

```ts
// Public read of the committee roster. Fun facts are gated: `isScanned` tells
// the client whether this student has scanned that member's QR, and the real
// funFact is only included when they have.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const LOCKED_FACT = 'Scan this member’s QR to unlock their fun fact!'

export async function GET() {
  const session = await getServerSession(authOptions)
  const studentId = (session?.user as { studentId?: string } | undefined)?.studentId

  const { data: npcs, error } = await supabase
    .from('NPC')
    .select('id, committeeName, role, division, funFact, avatarUrl, instagram')
    .eq('isActive', true)
    .order('committeeName')

  if (error) {
    console.error('committee fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load committee' }, { status: 500 })
  }

  // Which of these members has the current student already scanned?
  const scanned = new Set<string>()
  if (studentId) {
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', studentId)
      .maybeSingle()

    if (student) {
      const { data: logs } = await supabase
        .from('ScanLog')
        .select('npcId')
        .eq('studentId', student.id)
      for (const log of logs ?? []) scanned.add(log.npcId)
    }
  }

  const members = (npcs ?? []).map((n) => {
    const isScanned = scanned.has(n.id)
    return {
      id: n.id,
      name: n.committeeName,
      role: n.role,
      division: n.division,
      imageUrl: n.avatarUrl,
      instagram: n.instagram,
      funFact: isScanned ? n.funFact : LOCKED_FACT,
      isScanned,
    }
  })

  return NextResponse.json({ members })
}
```

- [ ] **Step 2: Write `app/api/clubs/route.ts`**

```ts
// Public read of the club directory shown at /map/clubs.
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('Club')
    .select('id, name, category, description, images, instagram, registrationUrl, iconUrl')
    .order('name')

  if (error) {
    console.error('clubs fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load clubs' }, { status: 500 })
  }

  const clubs = (data ?? []).map((c) => ({
    ...c,
    images: c.images ?? [],
  }))

  return NextResponse.json({ clubs })
}
```

- [ ] **Step 3: Seed one club and one committee member so the endpoints return data**

```sql
insert into "Club" ("name","category","description","images","instagram","registrationUrl")
values ('Robotics Club','Technology',
        'Build, code, and battle robots.',
        array['/images/map.jpg','/images/map.jpg'],
        'https://instagram.com/example','https://forms.gle/example');

update "NPC" set "instagram" = 'https://instagram.com/example'
where "division" = 'mainboard';
```

- [ ] **Step 4: Verify both endpoints**

```bash
npm run dev
curl -s http://localhost:3000/api/clubs
curl -s http://localhost:3000/api/committee
```

Expected: `/api/clubs` returns `{"clubs":[{…"name":"Robotics Club"…,"images":["/images/map.jpg","/images/map.jpg"]…}]}`. `/api/committee` returns `{"members":[…]}` with 3 entries, each `"isScanned":false` and `funFact` equal to the locked string (curl sends no session cookie — that is the correct logged-out response, not a bug).

- [ ] **Step 5: Commit**

```bash
git add app/api/committee/route.ts app/api/clubs/route.ts
git commit -m "feat(api): add public committee and clubs read endpoints"
```

---

### Task 4: Wire the two public pages to the endpoints

**Files:**
- Modify: `app/(game)/map/committee/page.tsx`
- Modify: `app/(game)/map/clubs/page.tsx`

**Interfaces:**
- Consumes: the two JSON contracts from Task 3.
- Produces: no exports. Both pages keep their current visual design and interactions; only the data source changes.

- [ ] **Step 1: Replace the committee mock with a fetch**

In `app/(game)/map/committee/page.tsx`, delete `ROLES`, `SKINS`, `EYES`, `BROWS`, `HAIRS`, and the `MEMBERS` array. Replace the `CommitteeMember` interface and add loading state:

```ts
interface CommitteeMember {
  id: string
  name: string
  role: string
  division: string | null
  imageUrl: string | null
  instagram: string | null
  funFact: string
  isScanned: boolean
}

const [members, setMembers] = useState<CommitteeMember[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/committee')
    .then((r) => r.json())
    .then((d) => setMembers(d.members ?? []))
    .catch(() => setMembers([]))
    .finally(() => setLoading(false))
}, [])
```

Add `useEffect` to the `react` import. Everywhere the file previously read `MEMBERS`, read `members`. Where it filtered by `divisionId`, filter by `division`.

The mock carried an `avatar` object driving `<PixelAvatar>`; real rows have no avatar parts. Render `imageUrl` when present, and fall back to a neutral `<PixelAvatar skin="skin1" eyes="eyes1" brow="brow1" />` when it is null, so the card layout never collapses.

- [ ] **Step 2: Add a loading state to the committee page**

While `loading` is true, render the existing scroll frame with `<LoadingSpinner />` in the member area rather than an empty parchment:

```tsx
import LoadingSpinner from '@/components/ui/LoadingSpinner'
// …
{loading ? <LoadingSpinner /> : /* existing member grid */}
```

- [ ] **Step 3: Replace the clubs mock with a fetch**

In `app/(game)/map/clubs/page.tsx`, delete the `clubs` array and `PLACEHOLDER_IMAGES`. Change the `Club` type to match the API contract (`images: string[]`, `instagram: string | null`, `register` renamed to `registrationUrl`, `icon` replaced by `iconUrl: string | null`), then:

```ts
const [clubs, setClubs] = useState<Club[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/clubs')
    .then((r) => r.json())
    .then((d) => setClubs(d.clubs ?? []))
    .catch(() => setClubs([]))
    .finally(() => setLoading(false))
}, [])
```

`ClubDetail`'s carousel does `(s - 1 + count) % count`, which is `NaN` when `count === 0`. Guard it — a club with no images must render the card with the carousel area hidden, not crash:

```tsx
const count = club.images.length
const prev = () => count && setSlide((s) => (s - 1 + count) % count)
const next = () => count && setSlide((s) => (s + 1) % count)
```

Keep `categoryColor` and its `'#9E9E9E'` fallback — admin-entered categories will not always be one of the six known keys.

- [ ] **Step 4: Verify the build**

```bash
npm run build
```

Expected: success. A "cannot find name `MEMBERS`" or "`register` does not exist" error means a reference was missed in Steps 1 or 3.

- [ ] **Step 5: Verify both pages in the browser**

```bash
npm run dev
```

- <http://localhost:3000/map/clubs> — shows exactly the one seeded "Robotics Club" (not 15 placeholders). Opening it shows a 2-image carousel; both arrows work and wrap.
- <http://localhost:3000/map/committee> logged in — shows 3 real members under Mainboards; the other 5 division bookmarks render but are empty. Fun facts show the locked message.
- Scan a committee member's QR at `/scan`, then reload `/map/committee`. Expected: that member now shows `isScanned` styling and their real fun fact. **This is the key end-to-end check** — it proves the `ScanLog` gate works against real rows.

- [ ] **Step 6: Commit**

```bash
git add "app/(game)/map/committee/page.tsx" "app/(game)/map/clubs/page.tsx"
git commit -m "feat: wire committee and clubs pages to Supabase

Both pages were fully mocked. Fun facts are now gated on real ScanLog rows."
```

---

## Done when

- `/map/clubs` and `/map/committee` contain no hardcoded content arrays.
- `/api/clubs` and `/api/committee` return seeded rows.
- Scanning a committee QR flips that member's fun fact from locked to real.
- `npm run build` succeeds; lint error count unchanged.
- `supabase/schema.sql` reproduces the new columns.

## Follow-on

Both pages are now read-only against near-empty tables. Plan 3 builds the admin panel that fills them.
