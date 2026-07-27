# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The warning above is real: this repo uses **Next.js 16.2.11** (React 19.2.4), which post-dates training data. Before using any Next.js API (caching, navigation, route handlers, etc.), consult the bundled docs at `node_modules/next/dist/docs/` (`01-app/` for App Router guides and API reference).

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build; **this is the only working check in the repo** (no separate `tsc` script — the build is the de-facto type check). It passes on a clean checkout as of 2026-07-25.
- `npm run lint` — **currently broken; do not use it to judge your changes.** ESLint 10.8.0 is incompatible with the `eslint-plugin-react` bundled inside `eslint-config-next`, so it crashes on the first file and lints *nothing*:
  ```
  TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function
  ```
  Exit code 2, zero files checked. This is a pre-existing dependency problem, not something you broke. Don't take on fixing it (or a repo-wide lint cleanup) unless asked.

No test framework is configured. No Prettier config exists either, despite branch names suggesting otherwise.

`README.md` has a "Key Files to Change" table, the design-system CSS class/color reference, and the team's branch workflow (branch from `main` as `dev/<yourname>`, push, PR with base `main`). **The README is stale** — it still documents `components/IntroSequence.tsx`, `/admin/quests/onboarding`, `/admin/qr`, and `createQuest()` in `app/admin/actions.ts`, none of which exist anymore. Trust this file over the README on architecture; the branch workflow and design-system tables are still accurate.

`docs/PROD_TESTING_AND_DATA_GUIDE.md` covers Vercel env setup, seeding committee/quest data from the `.docx` specs, and a production test checklist (its route references are partly stale — it says `/map/committee` where the app now uses `/info/committee`). `docs/SUPABASE_MIGRATION.md` is the long-form Supabase walkthrough.

## What this app is

A gamified New Student Orientation (NSO 2026) web app. Students scan QR codes carried by committee members ("NPCs") to collect fun facts and earn points/XP, compete in groups, complete quests, and unlock achievements.

## Database: Supabase, and the drift you must check first

Database is **Supabase** (hosted PostgreSQL, project ref `ndezlikvpsjmbvuptlfc`, Postgres 17), accessed via `@supabase/supabase-js`. There is no ORM. The schema lives in `supabase/schema.sql`, which you run by hand in the Supabase dashboard; you browse/edit data in the **Table Editor**, not a local studio. See **"Supabase setup (step by step)"** below.

`supabase/migrations/` is **no longer empty** — it holds two hand-written, hand-applied SQL files (they are not `supabase db push` artifacts; the CLI migration workflow is still unused):

| File | Status in the live DB (verified 2026-07-25) |
|---|---|
| `20260725_blockers_and_gaps.sql` | **Applied.** `Student.role`, `Student.gender`, `NPC.maxScans`, `Quest.availableFrom`/`availableUntil` all exist; `complete_quest` was redefined to also bump `Group.totalPoints`. |
| `20260725_single_use_tokens.sql` | **NOT applied.** The `SingleUseToken` table does not exist. |
| `20260727_guidebook_quiz.sql` | **Applied** (verified 2026-07-27). `GuidebookQuizAttempt` exists with its `unique ("studentId", "chapterId")` — that constraint *is* the one-try rule for the `/info/guidebook` end-of-chapter quizzes, so never drop it. RLS on, no policies, like every other table. |

**Live-vs-file drift, verified against the live DB on 2026-07-25** — check this before trusting either file:

- **`SingleUseToken` is missing from the live DB.** `/api/qr/scan` wraps its nonce lookup and its "mark consumed" insert in `try {} catch {}`, and supabase-js *returns* errors rather than throwing — so both silently no-op. **Single-use QR codes are therefore currently re-scannable by different students.** Applying `20260725_single_use_tokens.sql` in the SQL Editor is what fixes it.
- **`PointAdjustment` is missing from the live DB** even though `schema.sql` creates it. `/api/gl/points` inserts an audit row into it without checking the error, so GL point awards succeed but leave no audit trail.
- **`schema.sql` declares `Student.avatarSkin` and `avatarHair`, which do not exist live** — the reverse of the drift older notes described. Avatars moved to a single `avatarConfig` jsonb column (see below); the flat columns were dropped.
- **`schema.sql` does not define** `Student.role`, `NPC.maxScans`, `Quest.availableFrom`/`availableUntil`, or `SingleUseToken`. Rebuilding from `schema.sql` alone gives you a database the app partly fails against — run both migration files after it.
- `Student.hasSeenIntro` is **gone** (column, and the `/api/onboarding/complete` route that set it). Onboarding is localStorage-only now.

Tables: `Student` ↔ `Group`, `NPC`, `ScanLog` (unique on `(studentId, npcId)` — this constraint is the duplicate-scan guard), `Quest`/`QuestProgress` (unique on `(studentId, questId)`), `Achievement`/`StudentAchievement`, `Announcement`, `Club`. Table and column names are **quoted PascalCase/camelCase** (e.g. `"Student"`, `"funFactsCollected"`) — always quote them in raw SQL and match the casing exactly in `.from('Student')` / `.select('funFactsCollected')`.

Three atomic multi-row operations are **Postgres functions** called via `supabase.rpc(...)`: `scan_npc`, `complete_quest`, and `adjust_points`. `complete_quest`'s current definition lives in the migration file, **not** in `schema.sql` (which still has the older version missing the `Group.totalPoints` update).

**Data layer**: Supabase client singleton in `lib/supabase.ts` (import `supabase` from `@/lib/supabase`). It is created with the **service-role** key, which bypasses Row Level Security. This client is **server-only**; never import it from a client component or expose the key. Every table has RLS enabled with **no policies**, so the public `anon` key can reach nothing — don't add client-side Supabase calls unless you also write policies.

## Architecture

**Route areas** (App Router). `app/(game)/*` and `app/(auth)/*` are route groups — the parenthesized segment does NOT appear in the URL (pages live at `/dashboard`, `/scan`, `/login`). `app/admin/*` is a literal path segment.

- `app/(game)/*` — student-facing: `dashboard`, `scan`, `quests`, `leaderboard`, `codex`, `profile`, `rulebook`, plus two hubs and one unlinked tool:
  - **`info/`** is the canonical content hub (Navbar/BottomNav point at `/info`): `info/guidebook`, `info/committee`, `info/timeline`, `info/clubs`, `info/maps`.
  - **`map/`** is the older duplicate of that hub and **still routes** (`/map`, `/map/guidebook`, `/map/committee`, `/map/timeline`, `/map/clubs`, `/map/zones`). Nothing in the nav links to it, but `app/admin/actions.ts` still calls `revalidatePath('/map/committee')` / `('/map/clubs')` and **not** the `/info/*` equivalents — so admin committee/club writes leave the pages students actually visit stale. Fix the revalidate targets (or delete `map/`) if you touch this area. `/info/maps` also links to `/map/campus`, which does not exist.
  - **`gl/`** — Group Leader / IT-Logi point panel (search a student, award or deduct points). Gated on `session.user.role` being `gl`/`committee` or `isAdmin`. **Not linked from any nav** — you reach it by typing `/gl`.
  - `clubs/` is a redirect to `/info/clubs`.
- `app/(auth)/login`, `app/(auth)/register`
- `app/admin/*` — `dashboard`, `committee`, `present`, `quests`, `achievements`, `groups`, `points`, `announcements`, `clubs`, `guide` (a static page describing every admin tab). The left rail is driven by `components/admin/ADMIN_NAV.ts`; `AdminShell` highlights via `pathname.startsWith(href)`, so entry order matters. Legacy paths kept as redirects: `/admin/qr` → `/admin/committee`, `/admin/daily-qr` → `/admin/quests`, and top-level `/present` → `/admin/present`.
- `app/api/*` — route handlers: `leaderboard`, `leaderboard/feed`, `quests`, `quests/qr`, `codex`, `committee`, `clubs`, `qr/scan`, `qr/generate`, `qr/live`, `qr/single-use`, `qr/recent`, `gl/points`, `me/avatar`, `auth/register`, `auth/[...nextauth]`. (`app/api/admin/` and `app/api/profile/` are empty leftover directories.)
- `app/font-test` — dev-only font preview, not linked.

**Leveling / XP**: `lib/leveling.ts` derives level from stored `xp` with a doubling curve (step cost `10·2^(L-1)`; total XP to reach level L is `10·(2^(L-1)−1)`). The same curve is duplicated as the `level_from_xp` Postgres function — change **both**.

`Student` has *both* `xp` and a denormalized `level`. `xp` is the source of truth: `dashboard` and `profile` call `levelProgress(xp)` and compute level + in-level progress on read. The stored `level` column is written by the `scan_npc`/`adjust_points` RPCs and **read by nothing in the app** — treat it as a SQL-side convenience, not a display value. Never update `xp` with a bare `.update()` that skips the RPCs, or the two silently diverge.

**Auth & roles**: next-auth v4, one email/password `credentials` provider (`lib/auth.ts`, JWT sessions). `authorize()` looks the student up by email and verifies via `verifyPassword` (`lib/password.ts`, Node `scrypt`, no native dep). The `jwt` callback caches `id`, `studentId`, `isAdmin`, `points`, `role`, `groupId` at sign-in; the `session` callback copies them onto `session.user` (typed in `types/next-auth.d.ts`, though many call sites still read them via `(session.user as any)`).

There are now **two overlapping authorization concepts**:
- `Student.isAdmin` (boolean) — gates every `app/admin/*` page and `requireAdmin()` in the server actions.
- `Student.role` — `'student' | 'gl' | 'committee' | 'admin'`, added by the blockers migration. Gates `/gl`, `/admin/present`, `/api/gl/points`, and `/api/qr/single-use`, always as `role === 'gl' || role === 'committee' || isAdmin`.

`authorize()` derives `role` as `student.isAdmin ? 'admin' : 'student'` — it **ignores the stored `role` column**. So promoting someone to `gl` or `committee` in the database has no effect on their session; today only admins can actually reach the GL/committee-gated surfaces. Fix `authorize()` to read `student.role` if you need real GL accounts.

To grant admin: flip `isAdmin` on the `Student` row (Table Editor, or `update "Student" set "isAdmin" = true where email = '…';`) and have them log in again — the flag is read into the JWT at sign-in.

There is no `middleware.ts` and no shared protected layout — auth is enforced **inline, per file**, and inconsistently: most `app/admin/*` server components open with `getServerSession` + `redirect(...)`; most route handlers check `getServerSession` and return 401; a few (`/api/leaderboard`, `/api/leaderboard/feed`) are intentionally public; `'use client'` pages (`scan`, `quests`, `gl`, `admin/present`) do their check client-side against `useSession` and rely on the API route behind them. When adding a protected page or route, copy the pattern from a sibling file in the same directory — protection is never inherited from a layout.

**Login & registration**:
- `app/(auth)/login` — calls `signIn('credentials', { redirect: false })` then routes to `/dashboard`.
- `app/(auth)/register` — multi-step: name/email/password → questionnaire (major, hobby, medical note, past achievements **required**; Instagram optional; gender optional) → pixel-avatar builder, previewed live with `<PixelAvatar>`. POSTs to `app/api/auth/register/route.ts`, which hashes the password, generates a `NSO-XXXXXXXX` `studentId`, builds the `avatarConfig` object, and inserts the `Student`, then auto signs in. The route has an explicit retry that strips `gender` and re-inserts if that column is missing, for partially-migrated databases. New students default to `isAdmin: false`, `role: 'student'`.

**Pixel avatars**: `components/ui/PixelAvatar.tsx` composites transparent PNG layers from `public/images/avatar/` (skin base, then clothes/hijab/eyes/brows/mouth/hair overlays, each a filename key like `skin3`, `eyes1`, `brow2`, `hairb1.2`). Parts are stored in the **`Student.avatarConfig` jsonb column**, and every consumer must go through `lib/avatar.ts`:
- `parseAvatarConfig(raw)` → fully-defaulted `ParsedAvatar`
- `hairKey({ hair, hairColor })` → the combined key (`'hairb1'` + `'.2'` → `'hairb1.2'`)

Never flatten `avatarConfig` by hand. `lib/hooks/useStudentAvatar.ts` is the client-side fetch hook (used by Navbar/BottomNav). The older `Avatar.tsx` + uploaded-image `avatarUrl` path predates this and still exists. Source art for new parts lives in `REFERENCE/` (design references only — nothing there is imported; usable assets go in `public/images/`).

**Image uploads**: `lib/storage.ts` `uploadImage(bucket, file)` lazily creates a **public** Supabase Storage bucket on first use and returns the public URL (or `null`). Used for student avatars (`avatars` bucket) and admin-supplied art. `next.config.ts` raises the server-action body size limit for committee/club photo uploads.

**Admin mutations**: server actions, each starting with a `requireAdmin()`-style session check and ending with `revalidatePath(...)`. They are split across three files — `app/admin/actions.ts` (groups, points, announcements, NPC/committee, clubs), `app/admin/quests/actions.ts` (quest CRUD, including the `availableFrom`/`availableUntil` window and a fallback that retries the write without those fields on an unmigrated DB), and `app/admin/achievements/actions.ts`. Prefer adding admin writes here over new API routes.

**Student self-service mutations**: `app/(game)/profile/actions.ts` lets a logged-in student edit only their own row, keyed off the session's `studentId`.

## The QR system

`/api/qr/scan` is the **single entry point for every scannable code**. It verifies the JWT once, checks optional `validFrom`/`validUntil` window claims, checks the `jti` single-use nonce, resolves the student, then dispatches on the presence of `questId` → `lib/scan/quest.ts`, else → `lib/scan/npc.ts`. (Dispatching on `questId` rather than a `kind` claim is deliberate: it keeps fun-fact QRs printed before quests existed working.)

There are **four token shapes**, all signed with `QR_SECRET_KEY` and all pointing at `${NEXT_PUBLIC_BASE_URL}/scan?token=…`:

| Kind | Minted by | TTL | Stored on the row? | Extra claims |
|---|---|---|---|---|
| Printed fun-fact QR | `/api/qr/generate` (admin) | 7d | yes — `NPC.qrToken` | optional `validFrom`/`validUntil` for a daily window |
| Quest poster QR | `/api/quests/qr` (admin) | 120d | yes — `Quest.qrToken` | `kind: 'quest'`, `questId` |
| Live rolling QR | `/api/qr/live` (any session) | 60s | **no — stateless** | `live: true`, `ts` |
| Single-use link QR | `/api/qr/single-use` (gl/committee/admin) | 24h | no; nonce recorded in `SingleUseToken` | `jti`, `singleUse: true` |

Posters are printed weeks ahead, which is why quest tokens get 120 days. Expiry is not the revocation mechanism anyway: **both scan handlers re-check `isActive` and `qrToken === token`**, because neither RPC does — regenerating a QR only overwrites the stored token, leaving the old JWT signed and unexpired, and soft-deleting a committee member doesn't invalidate anything either. Any future caller of `scan_npc`/`complete_quest` must repeat those guards.

The one exception: a live rolling token has no stored counterpart, so `completeNpcScan` skips the `qrToken` match when `isDynamicToken` is set (`live` or `jti` present) and leans entirely on the JWT signature plus the short TTL. `ScanLog`'s `(studentId, npcId)` uniqueness still stops the same student double-claiming.

**Fun-fact flow**: `/api/qr/generate` creates (or, with an `npcId`, regenerates for) an NPC and stores token + QR image on the row → student POSTs the token to `/api/qr/scan` → `lib/scan/npc.ts` guards, then `scan_npc` atomically rejects duplicates via `ScanLog`, creates the log row, and increments student `points`/`xp`/`funFactsCollected`, group `totalPoints`, and NPC `scanCount`. `NPC.maxScans` (NULL = unlimited) is enforced **in `lib/scan/npc.ts`, not in the RPC**: it rejects at the cap and flips `isActive = false` once the cap is reached.

**Live presenter**: `/admin/present` is the committee-facing screen — pick a member, and it polls `/api/qr/live` on a 30-second rotation to display a fresh 60-second code to a queue of students. Nothing is written to the DB, which is the point (no bloat, and a screenshot is worthless within a minute).

**Quest flow**: a `Quest` is a mission not tied to a person — one printed code scanned by every student, with `QuestProgress`'s unique `(studentId, questId)` as the duplicate guard. Admin creates the quest at `/admin/quests`, generates its QR, prints it, then activates it. `complete_quest` inserts the progress row, adds points/xp, bumps `Group.totalPoints`, and inserts a `StudentAchievement` when `Quest.achievementId` is set. Points come from the `Quest` row at scan time, not from the token, so editing a quest's points doesn't strand printed codes.

**Quest time-gating is display-only.** `/api/quests` computes `isLocked` (window not yet open — shown with an "opens at" label) and `isExpired` (window closed — filtered out of the response), and `app/(game)/quests/page.tsx` renders the locked state. But `lib/scan/quest.ts` never looks at `availableFrom`/`availableUntil`, so **scanning a not-yet-open quest poster still succeeds**. The `validFrom`/`validUntil` check in `/api/qr/scan` is a separate mechanism that only applies to NPC QRs minted with those claims — it does not read the `Quest` columns. If a quest window must be enforced, add the check in `lib/scan/quest.ts`.

`Achievement`s are created at `/admin/achievements` with uploaded badge art and are **only** obtainable by completing a linked quest, so one with no quest pointing at it is unearnable (the admin table flags this). Students see quests at `/quests` (fully visible before completion — it's a mission board) and badges at `/profile`.

**Committee vs. QR**: committee members are `NPC` rows — one table, and since the consolidation, one admin view. `/admin/committee` is the roster (grouped by division, matching `/info/committee`) *and* where you generate/regenerate/print QRs. `lib/divisions.ts` is the single source of truth for the six divisions (`isDivisionId`, `divisionName`, `DIVISIONS`). Removing a member is a **soft delete** (`isActive = false`, via `deactivateCommitteeMember`) — it keeps their `ScanLog`/points history and hides them from the roster; `lib/scan/npc.ts` separately rejects scans against an inactive NPC.

## Onboarding

There is **one** onboarding system now. The old `components/IntroSequence.tsx` splash, `components/dashboard/DashboardIntro.tsx`, the `hasSeenIntro` column, and `/api/onboarding/complete` have all been removed — `app/layout.tsx` mounts nothing but `AuthProvider`.

Current flow: `components/onboarding/PageIntro.tsx` renders a one-time guided tour per page, tracked in `localStorage` under `nso-intro-seen:<page>`, driven by `components/onboarding/IntroOverlay.tsx`. Tour copy lives in `lib/tours.ts` as `TOURS[page]`, and each step's `target` must match a `data-tour="<target>"` attribute that actually exists on that page — otherwise the step silently degrades to a spotlight-less full-screen tooltip. Tours exist for `dashboard`, `info`, `scan`, `leaderboard`, and `profile`. Replay by clearing those localStorage keys.

## UI

Tailwind CSS 4 (via `@tailwindcss/postcss`, no `tailwind.config`; theme tokens and pixel/RPG utility classes like `scanlines`, `pixel-card`, `wood-plank`, `rpg-dialog` live in `app/globals.css`). Custom fonts in `public/fonts/` (ByteBounce — main pixel display font, `font-bytebounce`; Campton; VCR); the root layout also loads Geist from `next/font/google`.

`app/globals.css` defines **`--game-font-family`** as the single knob for the whole game UI's typeface (`--font-bytebounce` and `.font-bytebounce` both resolve to it) — change that one variable to re-test typography app-wide. Alongside it are the `--pixel-*` colour tokens and the standardized retro type/icon-size tokens.

Shared components in `components/ui/` (PixelButton, WoodButton, PixelCard, ProgressBar, CountdownTimer, LoadingSpinner, Avatar, PixelAvatar, GroupEmblem) and `components/layout/`. The student app has **no route-group `layout.tsx`** — each student page wraps its own content in `<PageWrapper>` (Navbar + BottomNav). `app/admin/*` is the exception: `app/admin/layout.tsx` wraps every admin page in `<AdminShell>`, an ERP-style shell with a collapsible left rail, so admin pages do **not** render their own header. (`components/layout/AdminHeader.tsx` is an older, unrelated header.) The admin panel deliberately uses none of the student app's pixel/RPG classes — white cards, slate text, `border-slate-200`. Also available: framer-motion, zustand, recharts, lucide-react, html5-qrcode (client-side QR scanning).

**Env vars** (in `.env`, not committed): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `QR_SECRET_KEY`, `NEXT_PUBLIC_BASE_URL`. The `SUPABASE_SERVICE_ROLE_KEY` is a secret admin key — keep it server-side, never prefix it with `NEXT_PUBLIC_`, never commit it.

## Supabase setup (step by step)

> First time using Supabase? It's just a hosted PostgreSQL database with a web
> dashboard. You don't install a database — you create a project on their
> website, run some SQL, copy two keys into `.env`, and you're done. The
> long-form companion walkthrough is in `docs/SUPABASE_MIGRATION.md`.

1. **Create a project.** <https://supabase.com> → sign in (GitHub works) → **New
   project**. Set a **database password** (save it), pick the nearest region,
   click **Create**, wait ~2 minutes.

2. **Create the tables + functions.** Open **SQL Editor** → **New query**, paste
   the **entire** `supabase/schema.sql`, and **Run**. "Success. No rows returned"
   means it worked. Then run **both files in `supabase/migrations/`**, in
   filename order — `schema.sql` alone is not a complete schema (see the drift
   table above), and the app will fail on registration, GL points, quest windows,
   and single-use QRs without them.
   - ⚠️ Re-running `schema.sql` **drops and recreates everything — it wipes all
     data.** Only do that for an intentional clean slate.

3. **Copy your two keys** (left sidebar → **Settings**):
   - **Project URL**: Settings → **Data API** → `Project URL`
   - **service_role key**: Settings → **API Keys** → reveal the `service_role`
     secret (a long `eyJ…` string). This is the admin key the app uses.

4. **Fill in `.env`** (already scaffolded with placeholders), then restart
   `npm run dev` — env changes aren't hot-reloaded.
   ```dotenv
   SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJ…the service_role key…"
   ```

5. **Create your first admin.** Register at `/register`, then flip your row's
   `isAdmin` to `true` in **Table Editor → `Student`** (or via the SQL Editor).
   Log out and back in so the JWT picks up the flag.

**Day-to-day Supabase tasks** (where do I click?):
- **See / edit rows** → Table Editor.
- **Run a query or one-off fix** → SQL Editor.
- **Change the schema** → edit `supabase/schema.sql` to keep it the intended
  source of truth, **and** apply the change live in the SQL Editor. There is no
  auto-migrate. If the change is more than a column, add a dated file to
  `supabase/migrations/` following the two existing ones (idempotent
  `add column if not exists` / `create or replace function`) so the next person
  can replay it.
- **Confirm the live shape before trusting `schema.sql`** → if the Supabase MCP
  server is connected, `list_tables` / `execute_sql` / `get_advisors` hit this
  project directly. Given the drift documented above, **do this rather than
  reading `schema.sql`** whenever the answer matters. Reads are safe; anything
  that writes (`apply_migration`, DDL via `execute_sql`) touches **production
  data** — there is no staging project, so confirm with the team first.
