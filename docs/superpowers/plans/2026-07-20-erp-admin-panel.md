# ERP Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six standalone pixel-themed admin pages with one light-themed ERP panel: a collapsible left sidebar, Poppins, and six sections — QR/fun-facts, Groups, Points, Announcements, Clubs, Committee.

**Architecture:** A new `app/admin/layout.tsx` (the repo's first nested layout) scopes a light design system to `/admin/*` and renders `<AdminShell>`, a client component holding the collapsible sidebar with its state in `localStorage`. Each section stays its own route under `/admin/*`, so sidebar navigation is real routing and every page keeps the existing `getServerSession` + `redirect` guard. All writes go through server actions in `app/admin/actions.ts`, per the established convention.

**Tech Stack:** Next.js 16.2.9 App Router (nested layout + server actions), Tailwind CSS 4, `next/font/google` Poppins, `lucide-react`, Supabase.

## Global Constraints

- **No test framework.** Verification is `npm run build`, SQL assertions, and manual browser checks. Do not add a test runner.
- `npm run lint` already fails with ~44 errors on a clean checkout. Compare counts before/after; do not fix unrelated errors.
- **Depends on Plan 1 and Plan 2 being complete.** This plan assumes 15 seeded `Group` rows with `/images/group/*.png` logos, `NPC.division`/`NPC.instagram`, and `Club.images`/`instagram`/`registrationUrl` all exist.
- All admin writes are **server actions in `app/admin/actions.ts`**, each starting with `requireAdmin()` and ending with `revalidatePath(...)`. Do not add admin API routes.
- `lib/supabase.ts` is **server-only**. Sidebar/search/modal components are `'use client'` and must receive data as props from server components — never import `supabase` directly.
- The admin panel shares **no** visual language with the student app: no `scanlines`, `pixel-card`, `wood-plank`, `rpg-dialog`, `font-pixel`, or `font-bytebounce`. Light backgrounds, Poppins, plain borders.
- Every `/admin/*` page keeps its own auth guard. There is no middleware and a layout does **not** protect its children.

## File Structure

| File | Responsibility |
| --- | --- |
| `app/admin/layout.tsx` (create) | Poppins + light theme scope; renders `<AdminShell>` |
| `components/admin/AdminShell.tsx` (create) | Collapsible sidebar + content frame (client) |
| `components/admin/ADMIN_NAV.ts` (create) | The six nav entries; single source of truth |
| `components/admin/SearchableList.tsx` (create) | Reusable client-side filter box + list; used by QR, Points, Committee |
| `components/admin/DataTable.tsx` (create) | Plain light table shell used by every section |
| `app/admin/qr/page.tsx` (create) | Section (a) — replaces `app/admin/npc/` |
| `app/admin/groups/page.tsx` (modify) | Section (b) |
| `app/admin/points/page.tsx` (modify) | Section (c) |
| `app/admin/announcements/page.tsx` (modify) | Section (d) — restyle only |
| `app/admin/clubs/page.tsx` (create) | Section (e) |
| `app/admin/committee/page.tsx` (create) | Section (f) |
| `app/admin/actions.ts` (modify) | New club/committee/NPC actions |
| `components/layout/AdminHeader.tsx` (delete) | Superseded by the shell |

---

### Task 1: Build the admin shell

**Files:**
- Create: `app/admin/layout.tsx`, `components/admin/ADMIN_NAV.ts`, `components/admin/AdminShell.tsx`
- Modify: `app/layout.tsx` (suppress the pixel intro on admin routes)

**Interfaces:**
- Produces: `ADMIN_NAV: Array<{ href: string; label: string; icon: LucideIcon }>` and a default-exported `AdminShell` taking `{ children }`. Every later task renders inside it and adds nothing to it.

- [ ] **Step 1: Write the nav manifest**

`components/admin/ADMIN_NAV.ts`:

```ts
import {
  QrCode, Users, Star, Megaphone, Building2, IdCard,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/qr', label: 'QR & Fun Facts', icon: QrCode },
  { href: '/admin/groups', label: 'Groups', icon: Users },
  { href: '/admin/points', label: 'Points', icon: Star },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/admin/committee', label: 'Committee', icon: IdCard },
]
```

- [ ] **Step 2: Write `components/admin/AdminShell.tsx`**

```tsx
'use client'
// ERP-style admin frame: a collapsible left rail plus the content column.
// Collapsed state persists in localStorage so it survives navigation.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { ADMIN_NAV } from './ADMIN_NAV'

const STORAGE_KEY = 'admin-sidebar-collapsed'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady] = useState(false)

  // Read persisted state after mount so server and client markup agree.
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
    setReady(true)
  }, [])

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem(STORAGE_KEY, c ? '0' : '1')
      return !c
    })
  }

  const current = ADMIN_NAV.find((i) => pathname.startsWith(i.href))

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 border-r border-slate-200
          bg-white transition-[width] duration-200 flex flex-col`}
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-200">
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">NSO 2026</span>
          )}
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto p-1.5 rounded hover:bg-slate-100 text-slate-500"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-2">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm
                  ${active
                    ? 'bg-slate-100 text-slate-900 font-medium border-r-2 border-slate-900'
                    : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/dashboard"
          title={collapsed ? 'Back to app' : undefined}
          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500
            border-t border-slate-200 hover:bg-slate-50"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Back to app</span>}
        </Link>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 flex items-center px-6 border-b border-slate-200 bg-white">
          <h1 className="text-base font-semibold">{current?.label ?? 'Admin'}</h1>
        </header>
        <main className="flex-1 p-6" suppressHydrationWarning={!ready}>
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `app/admin/layout.tsx`**

```tsx
// Scopes the light ERP design system to /admin/*. This is the repo's first
// nested layout -- the student app deliberately has none, but the admin panel
// swaps the entire design system, so a layout is the right tool here.
import { Poppins } from 'next/font/google'
import AdminShell from '@/components/admin/AdminShell'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${poppins.variable} font-[var(--font-poppins)] antialiased`}>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
```

- [ ] **Step 4: Suppress the pixel intro splash on admin routes**

`components/IntroSequence.tsx` is mounted globally in `app/layout.tsx` and would flash a pixel splash over the ERP panel. Add an early return inside it:

```tsx
'use client'
import { usePathname } from 'next/navigation'
// …inside the component, before any other logic:
const pathname = usePathname()
if (pathname.startsWith('/admin')) return null
```

- [ ] **Step 5: Verify the shell**

```bash
npm run build && npm run dev
```

Visit <http://localhost:3000/admin/groups> as an admin. Expected: white sidebar with six items, Groups highlighted, Poppins throughout, no scanlines and no pixel splash. Collapsing hides the labels and leaves icons; reload keeps it collapsed. The old page body still renders with its dark pixel styling inside the light frame — that is expected until Tasks 2–7 restyle each one.

- [ ] **Step 6: Commit**

```bash
git add app/admin/layout.tsx components/admin/ADMIN_NAV.ts components/admin/AdminShell.tsx components/IntroSequence.tsx
git commit -m "feat(admin): add light ERP shell with collapsible sidebar"
```

---

### Task 2: Shared list primitives

**Files:**
- Create: `components/admin/DataTable.tsx`, `components/admin/SearchableList.tsx`

**Interfaces:**
- Produces:
  - `DataTable({ headers, children }: { headers: string[]; children: React.ReactNode })` — renders `<table>` with a styled `<thead>`; caller supplies `<tr>` rows.
  - `SearchableList<T>({ items, filter, placeholder, render }: { items: T[]; filter: (item: T, q: string) => boolean; placeholder: string; render: (items: T[]) => React.ReactNode })` — client component owning the query state.
- Consumed by Tasks 3, 5, and 7. Building these once is why those tasks are short.

- [ ] **Step 1: Write `components/admin/DataTable.tsx`**

```tsx
export default function DataTable({
  headers,
  children,
}: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left font-medium text-slate-500 px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/admin/SearchableList.tsx`**

```tsx
'use client'
// Client-side filter box. Datasets here are small (hundreds of rows at most),
// so filtering in memory avoids a round trip per keystroke.
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchableList<T>({
  items,
  filter,
  placeholder,
  render,
}: {
  items: T[]
  filter: (item: T, query: string) => boolean
  placeholder: string
  render: (filtered: T[]) => React.ReactNode
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => filter(item, q))
  }, [items, query, filter])

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md
            bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10
            focus:border-slate-400"
        />
      </div>
      <p className="text-xs text-slate-500">
        {filtered.length} of {items.length}
      </p>
      {render(filtered)}
    </div>
  )
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run build
```

Expected: success. Nothing renders these yet.

- [ ] **Step 4: Commit**

```bash
git add components/admin/DataTable.tsx components/admin/SearchableList.tsx
git commit -m "feat(admin): add DataTable and SearchableList primitives"
```

---

### Task 3: Section (a) — QR & fun facts, with search

Replaces `app/admin/npc/`. Creating an NPC and generating its QR already works via `POST /api/qr/generate` and `components/admin/NpcForm.tsx`; this task keeps that flow and adds the searchable list beneath it.

**Files:**
- Create: `app/admin/qr/page.tsx`
- Modify: `app/admin/npc/NpcForm.tsx` → move to `components/admin/NpcForm.tsx`, restyle light
- Delete: `app/admin/npc/page.tsx`

**Interfaces:**
- Consumes: `DataTable`, `SearchableList`, `DIVISIONS` (Plan 2), `toggleNpcActive` (existing action).
- Produces: nothing new exported.

- [ ] **Step 1: Move and restyle the NPC form**

`git mv app/admin/npc/NpcForm.tsx components/admin/NpcForm.tsx`. Replace pixel classes (`font-pixel`, `bg-gray-900`, `border-2 border-black`) with the light equivalents used in `SearchableList` (`border border-slate-300 rounded-md`, `text-sm`). Add a **Division** `<select>` populated from `DIVISIONS` and an **Instagram** text input, both posted to `/api/qr/generate`.

- [ ] **Step 2: Accept the two new fields in the QR generate route**

In `app/api/qr/generate/route.ts`, read `division` and `instagram` from the request body, validate `division` with `isDivisionId` from `@/lib/divisions` (reject with 400 when present and invalid), and include both in the `NPC` insert.

- [ ] **Step 3: Write `app/admin/qr/page.tsx`**

Server component. Keep the standard guard:

```tsx
const session = await getServerSession(authOptions)
if (!session || !session.user?.isAdmin) redirect('/dashboard')
```

Fetch `id, committeeName, role, division, funFact, points, qrCode, isActive, scanCount` from `NPC` ordered by `committeeName`. Render `<NpcForm />`, then a `<SearchableList>` over the NPCs whose `filter` matches `committeeName`, `role`, `funFact`, and `divisionName(division)` — fun-fact text must be searchable, since that is the stated reason for the search box. Render results in a `<DataTable>` with headers `Name, Division, Role, Fun fact, Points, Scans, QR, Status`, a thumbnail `<img src={qrCode}>` per row linking to the full data-URL, and a toggle button bound to `toggleNpcActive`.

- [ ] **Step 4: Delete the old page and fix references**

```bash
git rm app/admin/npc/page.tsx
grep -rn "admin/npc" app/ components/
```

Expected after the grep: no results. Update any hit (notably `app/admin/dashboard/page.tsx`) to point at `/admin/qr`.

- [ ] **Step 5: Verify**

```bash
npm run build && npm run dev
```

At <http://localhost:3000/admin/qr>: create an NPC with a division and fun fact; the QR renders and the row appears in the table. Type a word from one fun fact into the search box — only that row remains and the counter reads `1 of N`. Toggle a row inactive and confirm it disappears from `/map/committee`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin): QR & fun-facts section with search"
```

---

### Task 4: Section (b) — Groups

**Files:**
- Modify: `app/admin/groups/page.tsx`

**Interfaces:**
- Consumes: `assignStudentToGroup`, `unassignStudent` (unchanged from Plan 1 Task 3), `GroupEmblem`, `DataTable`.

- [ ] **Step 1: Restyle to the light theme and add the logo grid**

Keep the existing data fetching and both server actions. Replace `AdminHeader` and all pixel classes. Above the ranking, add a responsive grid of the 15 groups — each cell a `<GroupEmblem emblemUrl={g.emblemUrl} emblem={g.emblem} size={56} />` with the group name and `totalPoints` beneath it, on a white card with a `border-l-4` in the group's `color`.

There is no create-group form — Plan 1 Task 3 removed it, and it must not come back.

- [ ] **Step 2: Restyle the ranking and member list**

Ranking becomes a `<DataTable>` with headers `#, Group, Points, Members`. Member listing keeps its current grouping; restyle only.

- [ ] **Step 3: Verify**

```bash
npm run build && npm run dev
```

At `/admin/groups`: 15 logo cards render (Plan 1's static PNGs), no create form, assigning a student moves them into that group's member list and the ranking count increments.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/groups/page.tsx"
git commit -m "feat(admin): groups section with logo grid, no create flow"
```

---

### Task 5: Section (c) — Points, with search and an adjust modal

**Files:**
- Modify: `app/admin/points/page.tsx`
- Create: `components/admin/PointsAdjustModal.tsx`

**Interfaces:**
- Consumes: `adjustPoints` (existing action, takes `studentId` + signed `amount`), `SearchableList`, `DataTable`.
- Produces: `PointsAdjustModal({ student, onClose })` where `student` is `{ studentId, name, points }`.

`adjustPoints` already handles negatives and calls the atomic `adjust_points` RPC, which keeps `xp`, `level`, and the group total in sync. Do not write a second points path.

- [ ] **Step 1: Write `components/admin/PointsAdjustModal.tsx`**

Client component. Shows the student's name and current points, an **Add** / **Reduce** toggle, a numeric `<input min="1">`, and a submit button. On submit, build a `FormData` with `studentId` and `amount` — negated when Reduce is selected — and call the `adjustPoints` server action, then `onClose()`.

Guard the input: reject empty, zero, non-numeric, and negative typed values (the sign comes from the toggle, not the field), and disable the submit button while pending via `useTransition`.

- [ ] **Step 2: Rebuild the points page around search + modal**

Fetch **all** students (`studentId, name, email, points, group:Group(name, emblem, emblemUrl, color)`) ordered by `name` — not the current `limit(15)`, since the section must list every logged player. Wrap in `<SearchableList>` filtering on `name`, `email`, `studentId`, and group name. Render a `<DataTable>` (`Player, Student ID, Group, Points`); clicking a row opens `PointsAdjustModal` for that student.

Row click requires client state, so extract the table into a small `'use client'` child that receives the student array as a prop. Do not import `supabase` there.

- [ ] **Step 3: Verify**

```bash
npm run build && npm run dev
```

At `/admin/points`: all students listed; searching by partial name filters; clicking a row opens the modal; Add 25 raises their points by 25 and the page reflects it after revalidation; Reduce 10 lowers it by 10. Confirm in SQL that `xp` and the group total moved too:

```sql
select "name","points","xp","level" from "Student" where "studentId" = '<the id>';
select "name","totalPoints" from "Group" where "id" = '<their group id>';
```

- [ ] **Step 4: Commit**

```bash
git add "app/admin/points/page.tsx" components/admin/PointsAdjustModal.tsx
git commit -m "feat(admin): points section with player search and adjust modal"
```

---

### Task 6: Section (d) — Announcements

**Files:**
- Modify: `app/admin/announcements/page.tsx`

Behaviour is unchanged; this is a restyle only.

- [ ] **Step 1: Restyle**

Drop `AdminHeader` and pixel classes. Create form becomes a light card with title/content inputs; the list becomes a `<DataTable>` with headers `Title, Content, Status, Created` and the existing `toggleAnnouncement` action bound to a status button. Keep `createAnnouncement` and `toggleAnnouncement` exactly as they are.

- [ ] **Step 2: Verify**

```bash
npm run build && npm run dev
```

At `/admin/announcements`: create one, confirm it appears, toggle it inactive, and confirm the student dashboard stops showing it.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/announcements/page.tsx"
git commit -m "feat(admin): restyle announcements to ERP theme"
```

---

### Task 7: Section (e) — Clubs

**Files:**
- Create: `app/admin/clubs/page.tsx`, `components/admin/ClubForm.tsx`
- Modify: `app/admin/actions.ts`

**Interfaces:**
- Produces server actions `createClub(formData: FormData)` and `deleteClub(formData: FormData)`.
- Consumes: `uploadImage(bucket, file)` from `lib/storage.ts`.

- [ ] **Step 1: Add the club actions**

In `app/admin/actions.ts`:

```ts
// --- Clubs ---

export async function createClub(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const instagram = String(formData.get('instagram') || '').trim() || null
  const registrationUrl = String(formData.get('registrationUrl') || '').trim() || null

  if (!name || !category || !description) return

  // Unlimited carousel images; upload in parallel and drop any that fail.
  const files = formData.getAll('images').filter(
    (f): f is File => f instanceof File && f.size > 0
  )
  const uploaded = await Promise.all(files.map((f) => uploadImage('club-images', f)))
  const images = uploaded.filter((url): url is string => Boolean(url))

  await supabase.from('Club').insert({
    name, category, description, instagram, registrationUrl, images,
  })

  revalidatePath('/admin/clubs')
  revalidatePath('/map/clubs')
}

export async function deleteClub(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Club').delete().eq('id', id)

  revalidatePath('/admin/clubs')
  revalidatePath('/map/clubs')
}
```

Add `import { uploadImage } from '@/lib/storage'` at the top. Both actions revalidate `/map/clubs` so the public page updates immediately — that is the "automatically displayed" requirement.

- [ ] **Step 2: Write `components/admin/ClubForm.tsx`**

Client component posting to `createClub`. Fields: name, category, description (`<textarea>`), Instagram URL, registration URL, and `<input type="file" name="images" multiple accept="image/*">`. Show the selected filenames and a count before submit so the operator can confirm the carousel contents. Disable submit while pending with `useTransition`.

- [ ] **Step 3: Write `app/admin/clubs/page.tsx`**

Server component with the standard admin guard. Fetch all clubs ordered by `name`. Render `<ClubForm />` then a `<DataTable>` with headers `Club, Category, Images, Instagram, Registration, ''`, showing the image count, links rendered as anchors, and a delete button bound to `deleteClub`.

- [ ] **Step 4: Verify the full round trip**

```bash
npm run build && npm run dev
```

At `/admin/clubs`: create a club with 3 images. Expected: the row shows `3` images. Then open <http://localhost:3000/map/clubs> **without restarting the dev server** — the new club appears (proving `revalidatePath`), and its detail carousel cycles all 3 images. Create a club with **zero** images and confirm `/map/clubs` renders it without crashing (the Plan 2 Task 4 Step 3 guard).

- [ ] **Step 5: Commit**

```bash
git add app/admin/clubs/page.tsx components/admin/ClubForm.tsx app/admin/actions.ts
git commit -m "feat(admin): clubs section with multi-image carousel upload"
```

---

### Task 8: Section (f) — Committee

**Files:**
- Create: `app/admin/committee/page.tsx`, `components/admin/CommitteeForm.tsx`
- Modify: `app/admin/actions.ts`

**Interfaces:**
- Produces server actions `createCommitteeMember(formData)` and `deleteCommitteeMember(formData)`.

These write to `NPC` — the same table as Section (a). Section (a) is QR-centric (generate and print codes); this section is roster-centric (who is in which division). A member added here has **no QR** until one is generated in Section (a).

- [ ] **Step 1: Add the committee actions**

```ts
// --- Committee (stored as NPC rows; see docs plan 2) ---

export async function createCommitteeMember(formData: FormData) {
  await requireAdmin()

  const committeeName = String(formData.get('name') || '').trim()
  const role = String(formData.get('role') || '').trim()
  const division = String(formData.get('division') || '')
  const funFact = String(formData.get('funFact') || '').trim()
  const instagram = String(formData.get('instagram') || '').trim() || null

  if (!committeeName || !role || !funFact || !isDivisionId(division)) return

  const image = formData.get('image')
  const avatarUrl =
    image instanceof File && image.size > 0
      ? await uploadImage('committee-photos', image)
      : null

  await supabase.from('NPC').insert({
    committeeName, role, division, funFact, instagram, avatarUrl,
  })

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/map/committee')
}

export async function deleteCommitteeMember(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  // ScanLog references NPC; delete the logs first or the FK blocks this.
  await supabase.from('ScanLog').delete().eq('npcId', id)
  await supabase.from('NPC').delete().eq('id', id)

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/map/committee')
}
```

Add `import { isDivisionId } from '@/lib/divisions'`.

**Deleting a member destroys every scan of them**, which reduces the fun-fact counts of students who had collected them. Their `points`/`xp` are not recalculated, so totals stay intact. Put that warning in the delete button's `confirm()` text.

- [ ] **Step 2: Write `components/admin/CommitteeForm.tsx`**

Client component posting to `createCommitteeMember`. Fields: name, role, a division `<select>` built from `DIVISIONS`, fun fact (`<textarea>`), Instagram URL, and a single `<input type="file" name="image" accept="image/*">`. Same `useTransition` pending pattern as `ClubForm`.

- [ ] **Step 3: Write `app/admin/committee/page.tsx`**

Server component with the admin guard. Fetch all `NPC` rows. Render `<CommitteeForm />`, then a `<SearchableList>` (filter on name, role, division name) rendering members **grouped by division** in `DIVISIONS` order, each group under a heading with a swatch of that division's `color`. Each row shows the photo or a placeholder, name, role, fun fact, whether a QR exists (`qrCode` non-null), and a delete button.

- [ ] **Step 4: Verify**

```bash
npm run build && npm run dev
```

At `/admin/committee`: add a member to **Creative** with a photo and fun fact. Expected: they appear under the Creative heading with "no QR". Open `/map/committee` — they appear under the Creative bookmark with the fun fact **locked**. Generate their QR in `/admin/qr`, scan it as a student, reload `/map/committee` — the real fun fact is revealed. Then delete them and confirm they vanish from both pages.

- [ ] **Step 5: Delete the dead AdminHeader**

```bash
grep -rn "AdminHeader" app/ components/
```

Expected: no results once all sections are restyled. Then:

```bash
git rm components/layout/AdminHeader.tsx
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin): committee roster section grouped by division"
```

---

## Done when

- `/admin/*` renders the light Poppins ERP shell with a persistent collapsible sidebar and six working sections.
- No `/admin` page imports `AdminHeader`, `PixelCard`, `font-pixel`, or `scanlines`.
- Search filters live on QR/fun-facts, Points, and Committee.
- Creating a club or committee member appears on `/map/clubs` / `/map/committee` without a restart.
- Points adjustments move `points`, `xp`, `level`, and the group total together.
- `npm run build` succeeds; lint error count unchanged.

## Deliberately out of scope

- Editing existing clubs and committee members (create + delete only). Add it once the roster is stable.
- Deleting or reordering carousel images on an existing club.
- Quests (`/admin/quests`) — untouched by this plan and not in the six sections. It keeps its pixel styling inside the light shell, which will look inconsistent. Either add it to `ADMIN_NAV` and restyle it, or drop the route; decide before shipping.
