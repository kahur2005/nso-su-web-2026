# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The warning above is real: this repo uses Next.js 16.2.9, which post-dates training data. Before using any Next.js API (caching, navigation, route handlers, etc.), consult the bundled docs at `node_modules/next/dist/docs/` (`01-app/` for App Router guides and API reference).

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build (also the de-facto type check; no separate `tsc` script)
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

`npm run lint` is **already failing on a clean checkout** (~44 errors / 17 warnings as of 2026-07-20 — mostly `@typescript-eslint/no-explicit-any` and `react-hooks/static-components`). A non-zero exit does not mean you broke something; diff the output against a pre-change run before assuming your edit is at fault, and don't take on a repo-wide lint cleanup unless asked.

No test framework is configured.

`README.md` has a "Key Files to Change" table, the design-system CSS class/color reference, and the team's branch workflow: branch from `main` as `dev/<yourname>`, push, and open a PR with base `main`.

Database is **Supabase** (hosted PostgreSQL, project ref `ndezlikvpsjmbvuptlfc`, Postgres 17), accessed via `@supabase/supabase-js`. There is no ORM and no migration workflow in use — the schema is a plain SQL file (`supabase/schema.sql`) you run in the Supabase dashboard. You browse/edit data in the Supabase **Table Editor**, not a local studio. See **"Supabase setup (step by step)"** below — written for a first-time Supabase user.

> The `supabase` CLI is a devDependency and `supabase/migrations/` exists, but the directory is **empty** and no migration has ever been generated. Don't assume `supabase db push`/`db diff` reflects reality; the SQL file plus manual `alter table` in the dashboard is the actual process.

## What this app is

A gamified New Student Orientation (NSO 2026) web app. Students scan QR codes carried by committee members ("NPCs") to collect fun facts and earn points/XP, compete in groups, complete quests, and unlock achievements.

## Architecture

**Route areas** (App Router). `app/(game)/*` and `app/(auth)/*` are route groups — the parenthesized segment does NOT appear in the URL (so pages live at `/dashboard`, `/scan`, `/login`, etc.). `app/admin/*` is a literal path segment.
- `app/(game)/*` — student-facing pages (dashboard, scan, quests, leaderboard, codex, profile, clubs, rulebook, and `map`). `map` is itself a hub: `app/(game)/map/page.tsx` renders tiles linking to its sub-pages `map/zones`, `map/timeline`, `map/guidebook`, `map/clubs`, `map/committee`.
- `app/(auth)/login`, `app/(auth)/register` — login and registration pages
- `app/admin/*` — admin pages (dashboard, qr, committee, quests, groups, points, announcements, clubs, plus `quests/onboarding`, a static how-to guide for committee members uploading quests). `/admin/npc` was removed and replaced by `/admin/qr`.
- `app/api/*` — route handlers (leaderboard, leaderboard/feed, quests, codex, committee, clubs, qr/scan, qr/generate, qr/recent, onboarding/complete, me/avatar, auth/register, auth/[...nextauth])
- `app/font-test` — dev-only font preview page, not linked from the app

**Data layer**: Supabase client singleton in `lib/supabase.ts` (import `supabase` from `@/lib/supabase`). It is created with `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` — the **service-role** key, which bypasses Row Level Security. This client is **server-only**; never import it from a client component or expose the key. The schema lives in `supabase/schema.sql` (run once in the dashboard). Tables: `Student` ↔ `Group`, `NPC`, `ScanLog` (unique on `(studentId, npcId)` — this constraint is the duplicate-scan guard), `Quest`/`QuestProgress`, `Achievement`/`StudentAchievement`, `Announcement`, `Club`. Table and column names are **quoted PascalCase/camelCase** (e.g. `"Student"`, `"funFactsCollected"`) — so always quote them in raw SQL and match the casing exactly in `.from('Student')` / `.select('funFactsCollected')`. `Student` carries a hashed `password`, the registration-questionnaire fields (`medicalNote`, `pastAchievements`, `instagram`, `major`, `hobby`), the pixel-avatar part keys (`avatarSkin`, `avatarHair`, `avatarEyes`, `avatarBrows`), and `hasSeenIntro` (dashboard onboarding flag). ⚠️ Known drift (verified against the live DB on 2026-07-20): the live `Student` table has `avatarSkin` and `avatarHair` columns — registration inserts them and several pages select them — but `supabase/schema.sql` does **not** define them. If you rebuild a database from `schema.sql`, registration will fail until you run:
```sql
alter table "Student" add column "avatarSkin" text, add column "avatarHair" text;
```
Everything else in `schema.sql` matches the live database. Server components and API routes query Supabase directly; API routes exist for client-side fetches. Two atomic multi-row operations are **Postgres functions** called via `supabase.rpc(...)`: `scan_npc` and `adjust_points` (defined in `supabase/schema.sql`).

**Leveling / XP**: `lib/leveling.ts` derives a student's level from their stored `xp` with a doubling curve (step cost `10·2^(L-1)`, so total XP to reach level L is `10·(2^(L-1)−1)`). The same curve is duplicated as the `level_from_xp` Postgres function in `supabase/schema.sql` — if you change the curve, change **both**.

`Student` has *both* an `xp` and a denormalized `level` column, but they are not used the same way. `xp` is the source of truth: `dashboard` and `profile` call `levelProgress(xp)` and compute level + in-level progress on read — call that helper rather than recomputing. The stored `level` column is written by the `scan_npc` and `adjust_points` RPCs (`"level" = level_from_xp(...)`) and, as of this writing, **read by nothing in the app**. Treat it as a convenience for SQL-side queries, not as a value to display; never update `xp` with a bare `.update()` that skips the RPCs, or the two will silently diverge.

**Image uploads**: `lib/storage.ts` `uploadImage(bucket, file)` lazily creates a **public** Supabase Storage bucket on first use and returns the public URL (or `null`). Used for student avatars (`avatars` bucket) and admin-supplied art.

**Auth**: next-auth v4 with a single email/password `credentials` provider (`lib/auth.ts`, JWT sessions). The `[...nextauth]` handler is at `app/api/auth/[...nextauth]/route.ts`; all consumers call `getServerSession(authOptions)`. `authorize()` looks the student up by email and checks the password via `verifyPassword` (`lib/password.ts`, Node `scrypt`, no native dep). The `jwt` callback caches `studentId`/`isAdmin`/`points` at sign-in; the `session` callback copies them onto `session.user` (`types/next-auth.d.ts` augments the Session/JWT types, though existing call sites still read them via `(session.user as any).studentId`). `components/providers/AuthProvider.tsx` wraps the app in `SessionProvider` from the root `app/layout.tsx`. There is no SSO/OAuth — registration is self-serve.

There is no `middleware.ts` and no shared protected layout — auth is enforced **inline, per file**, and inconsistently: most `app/admin/*` and some `app/(game)/*` server components open with `getServerSession` + `redirect(...)` on failure; most route handlers (e.g. `/api/quests`, `/api/codex`, `/api/qr/*`) check `getServerSession` and return 401; a few (`/api/leaderboard`, `/api/leaderboard/feed`) are intentionally public; and `'use client'` pages (e.g. `(game)/scan`, `(game)/quests`) have no server-side check of their own and rely entirely on the API route they call. When adding a new protected page or route, copy the pattern from a sibling file in the same directory — don't assume protection is inherited from a layout.

**Login & registration**:
- `app/(auth)/login` — email/password form; calls `signIn('credentials', { redirect: false })` then routes to `/dashboard`.
- `app/(auth)/register` — multi-step form: name/email/password, a questionnaire (major, hobby, medical note, past achievements all **required**; Instagram optional), and a pixel-avatar builder (skin, hair style+color, eyes, brows — previewed live with `<PixelAvatar>`). POSTs to `app/api/auth/register/route.ts` (hashes the password, generates a `NSO-XXXXXXXX` `studentId`, creates the `Student`), then auto signs in. Hair style and color combine into one stored key (e.g. `hairb1` + `.2` → `avatarHair: "hairb1.2"`).

New students default to `isAdmin: false`. To grant admin, flip `isAdmin` on the `Student` row (in the Supabase **Table Editor**, or run `update "Student" set "isAdmin" = true where email = '…';` in the **SQL Editor**) and have them log in again (the flag is read into the JWT at sign-in).

**Admin mutations**: server actions in `app/admin/actions.ts` (`'use server'`) handle quest/group/points/announcement/NPC writes. Each starts with `requireAdmin()` (throws on a non-admin session) and ends with `revalidatePath(...)`. Prefer adding admin writes here over new API routes.

**Student self-service mutations**: server actions in `app/(game)/profile/actions.ts` (`'use server'`) let a logged-in student edit only their own row (name, Instagram, avatar via `uploadImage`), keyed off the session's `studentId` — the student-side counterpart to admin `actions.ts`.

**QR flow** (core mechanic):
1. Admin POSTs to `/api/qr/generate` (admin-session-gated): creates an NPC, signs a JWT `{ npcId, points }` with `QR_SECRET_KEY` (7-day expiry), renders it as a QR data-URL pointing to `${NEXT_PUBLIC_BASE_URL}/scan?token=...`, and stores both on the NPC.
2. Student POSTs the token to `/api/qr/scan` (session-gated): verifies the JWT, then calls the `scan_npc` Postgres function (`supabase.rpc`). That function atomically rejects duplicates via `ScanLog`, creates the `ScanLog`, and increments student `points`/`xp`/`funFactsCollected`, group `totalPoints`, and NPC `scanCount` — returning the response payload as JSON.

**Pixel avatars**: `components/ui/PixelAvatar.tsx` composites transparent PNG layers from `public/images/avatar/` — skin base, then optional eyes, brows, and hair overlays, each identified by a filename key (`skin3`, `eyes1`, `brow2`, `hairb1.2`). Students pick their parts once at registration; the keys are stored on the `Student` row and rendered by dashboard, leaderboard, and profile. The separate `Avatar.tsx` + `avatarUrl` (uploaded image) path predates this and still exists. Source art for new parts lives in the untracked-style `REFERENCE/` folder (design references only — nothing in it is imported by code; usable assets go in `public/images/`).

**Intro/onboarding flows** (two distinct ones):
- `components/IntroSequence.tsx` — a ~3 s pixel splash on first page load per browser session (`sessionStorage`), mounted globally in `app/layout.tsx`. Replay via `sessionStorage.clear()`.
- `components/dashboard/DashboardIntro.tsx` — a one-time-per-account walkthrough shown on the dashboard while `Student.hasSeenIntro` is false; it POSTs to `/api/onboarding/complete` to set the flag.

**UI**: Tailwind CSS 4 (via `@tailwindcss/postcss`, no tailwind.config; theme tokens and pixel/RPG utility classes like `scanlines`, `pixel-card`, `wood-plank`, `rpg-dialog` live in `app/globals.css`). Custom fonts in `public/fonts/` (ByteBounce — main pixel display font, `font-bytebounce`; Campton; VCR). Shared components in `components/ui/` (PixelButton, WoodButton, PixelCard, ProgressBar, CountdownTimer, LoadingSpinner, Avatar, PixelAvatar, GroupEmblem) and `components/layout/`. The student app has **no route-group `layout.tsx` files** — each student page wraps its own content in `<PageWrapper>` (renders Navbar + BottomNav). `app/admin/*` is the exception: `app/admin/layout.tsx` wraps every admin page in `<AdminShell>` (`components/admin/AdminShell.tsx`), a light ERP-style shell with a collapsible left rail driven by `components/admin/ADMIN_NAV.ts` — admin pages do **not** render their own header. (`components/layout/AdminHeader.tsx` is an older, unrelated header still used only by `app/admin/quests/*`.) The admin panel deliberately uses none of the student app's pixel/RPG classes (`scanlines`, `pixel-card`, `wood-plank`, `rpg-dialog`, `font-bytebounce`) — white cards, slate text, `border-slate-200`. Also available: framer-motion, zustand, recharts, lucide-react, html5-qrcode (client-side QR scanning).

**Committee vs. QR & Fun Facts**: committee members are stored as `NPC` rows — there is one table, two admin views. `/admin/qr` is QR-centric (create an NPC, generate/print its QR); `/admin/committee` is roster-centric (roster grouped by division, matching `/map/committee`). `/api/qr/generate` accepts an optional `npcId` to generate/regenerate a QR for an *existing* NPC (used by the "Generate QR" action on the committee roster) instead of always inserting a new row. `lib/divisions.ts` is the single source of truth for the six divisions (`isDivisionId`, `divisionName`, `DIVISIONS`). Removing a committee member from `/admin/committee` is a **soft delete** (`isActive = false`, via `deactivateCommitteeMember` in `app/admin/actions.ts`) — it keeps their `ScanLog`/points history and only hides them from `/map/committee`; `/api/qr/scan` separately rejects scans against an inactive NPC (the `scan_npc` RPC does not check `isActive` itself). `next.config.ts` raises the server-action body size limit to accommodate committee/club photo and image uploads.

**Env vars** (in `.env`, not committed): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `QR_SECRET_KEY`, `NEXT_PUBLIC_BASE_URL`. The `SUPABASE_SERVICE_ROLE_KEY` is a secret admin key — keep it server-side, never prefix it with `NEXT_PUBLIC_`, never commit it.

## Supabase setup (step by step)

> First time using Supabase? Supabase is just a hosted PostgreSQL database with a
> web dashboard. You don't install a database — you create a project on their
> website, run one SQL file, copy two keys into `.env`, and you're done. The full
> companion walkthrough with screenshots-worth of detail is in
> `docs/SUPABASE_MIGRATION.md`; this is the condensed checklist.

1. **Create a project.** Go to <https://supabase.com> → sign in (GitHub works) →
   **New project**. Choose a name, set a **database password** (save it — you
   rarely need it again, but don't lose it), pick the region closest to your
   users, and click **Create**. Wait ~2 minutes while it provisions.

2. **Create the tables + functions.** In the project, open **SQL Editor** (left
   sidebar) → **New query**. Open `supabase/schema.sql` from this repo, copy the
   **entire** file, paste it into the editor, and click **Run** (or Ctrl+Enter).
   A green "Success. No rows returned" means it worked. You can now see all the
   tables under **Table Editor**.
   - ⚠️ Re-running `schema.sql` **drops and recreates everything — it wipes all
     data.** Only do that when you intentionally want a clean slate.

3. **Copy your two keys** (left sidebar → **Settings**):
   - **Project URL**: Settings → **Data API** → `Project URL`
     (looks like `https://abcdefgh.supabase.co`).
   - **service_role key**: Settings → **API Keys** → reveal the `service_role`
     secret (a long `eyJ…` string). This is the admin key the app uses.

4. **Fill in `.env`** (already scaffolded with placeholders):
   ```dotenv
   SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJ…the service_role key…"
   ```
   Then restart `npm run dev` (env changes aren't hot-reloaded).

5. **Create your first admin.** Register a normal account at `/register`, then
   in **Table Editor → `Student`** flip your row's `isAdmin` to `true` (or run
   `update "Student" set "isAdmin" = true where email = 'you@example.com';` in the
   **SQL Editor**). Log out and back in so the JWT picks up the flag.

**Day-to-day Supabase tasks** (mental model for "where do I click?"):
- **See / edit rows** → Table Editor (this replaces what `prisma studio` did).
- **Run a query or one-off fix** → SQL Editor.
- **Change the schema** → edit `supabase/schema.sql` to keep it the source of
  truth, **and** apply the change live in the SQL Editor (e.g.
  `alter table "Student" add column "nickname" text;`). There is no auto-migrate.
- **Inspect the schema without leaving the editor** → if the Supabase MCP server
  is connected, `list_tables` / `execute_sql` / `get_advisors` hit this project
  directly, which is the fastest way to confirm the live shape of a table before
  trusting `schema.sql`. Reads are safe; anything that writes (`apply_migration`,
  DDL via `execute_sql`) touches **production data** — there is no staging
  project, so confirm with the team first.
- **Security model**: every table has RLS enabled with **no policies**, so the
  public `anon` key can access nothing. The app only ever connects with the
  `service_role` key (server-side), which bypasses RLS. Don't add client-side
  Supabase calls unless you also write RLS policies.
