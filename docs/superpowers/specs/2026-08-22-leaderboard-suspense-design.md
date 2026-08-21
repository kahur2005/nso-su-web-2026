# Leaderboard suspense (final-day reveal) — design

**Date:** 2026-08-22  
**Status:** approved  
**Approach:** Server-side redaction + DB admin toggle (Approach 2)

## Problem

On the last stretch of NSO, the public Rankings page should build hype by hiding **who** is winning while still showing that a competition is underway. Admins must keep a live, accurate leaderboard. Students (and non-admin staff tools that would leak identity) must not see real names, points, or logos until an admin reveals them.

## Decisions

| Question | Decision |
| --- | --- |
| Reveal control | Admin toggle (manual), not a scheduled datetime |
| Rank order | Keep `#1…n`, trophies, medal trim |
| Masked fields | Name, points, logo/mascot/avatar → rendered as `?` |
| Progress bars | Hidden while suspense is ON |
| Guild level (`LV`) | Hidden while suspense is ON (leaks strength) |
| RECORD tab | Hidden while suspense is ON |
| Guild expand | Allowed; roster members also masked (name/points/avatar); Instagram disabled |
| Hype copy / banner | None — `?` alone |
| Who sees real identity | **Admins only** |
| Admin dashboard / groups rankings | Always real (unchanged data path) |
| `/gl` during suspense | Disabled (point award paused) with a clear blocked state |
| Spoiler resistance | Redact in `/api/leaderboard` (+ feed); do not rely on UI-only masking |
| Missing settings row | Treat as suspense **OFF** (safe default = today’s behavior) |
| Initial `leaderboardSuspense` value | **`false`** until an admin turns it on |

## Student UX (`/leaderboard`)

### Suspense ON

- **Current Leader:** board chrome stays; name, points, and mascot/avatar show `?`.
- **Tabs:** `GUILDS` \| `PLAYERS` only (no `RECORD`).
- **Rows:** rank + trophy/medal stay; name / points / emblem-avatar → `?`; no `PixelBar`; no guild `LV`.
- **Expand:** one open guild; members show `?` for name/points/avatar; no Instagram links.
- **LIVE 30s + refresh:** keep polling; order may change under the veil.
- **No** extra teaser banner.

### Suspense OFF

- Exact current behavior (including RECORD, bars, LV, real identities).

## Admin & staff surfaces

### Admin Dashboard (`/admin/dashboard`)

- Control next to **Current rankings**: e.g. “Leaderboard suspense” with ON (hidden) / OFF (revealed).
- Toggle is a server action (admin session required); flips live without deploy.
- **Current rankings** preview stays fully real at all times.

### Other admin pages

- Unchanged; they keep reading Supabase directly (e.g. Groups rankings).

### `/gl`

- If suspense ON: no search/award UI — blocked message that point assignment is paused until rankings are revealed.
- If suspense OFF: current behavior.
- Safety: `POST /api/gl/points` rejects while suspense is ON.

## Architecture

### Storage

New Supabase table modeled after `LunchSetting`:

- Table: `AppSetting`
- Single row: `id = 'default'`
- Column: `leaderboardSuspense boolean not null default false`

Migration seeds the default row.

### Flag helpers

Shared lib (e.g. `lib/app-settings.ts`):

- `getLeaderboardSuspense(): Promise<boolean>` — missing row → `false`
- Admin-only writer used by the dashboard server action

### Public API redaction

`GET /api/leaderboard` and `GET /api/leaderboard/feed`:

1. Read suspense flag.
2. Read session; **unredacted** only if `isAdmin === true`.
3. Always include `suspense: boolean` = the DB flag (same value for everyone). Redaction is separate: apply only when `suspense && !isAdmin`.
4. When suspense ON and caller is not admin:
   - **Leaderboard:** preserve sort order and stable entity `id`s (for expand keys). Redact identity/score/display fields (`name`, `points`, `totalPoints`, emblem fields, `avatarConfig`, `instagram`, nested group display names/emblems, etc.) so the client cannot recover them.
   - **Feed:** return empty `feed: []` (tab is hidden; avoid leaking activity).
5. When suspense OFF, or when caller is admin: full unredacted payload as today, still with `suspense` set to the DB flag.

Admin dashboard **must not** switch its rankings preview to the redacted public API.

### Client

`app/(game)/leaderboard/page.tsx`:

- Read `suspense` from API responses.
- When true: apply `?` rendering, hide bars/LV/RECORD, disable Instagram; still use ids for accordion state.
- When false: current UI.

`GET /api/app-settings`:

- Public read of `{ leaderboardSuspense: boolean }` (not sensitive — the Rankings UI already reveals the mode).
- Used by `/gl` (and optionally others) without going through leaderboard search.

`app/(game)/gl/page.tsx`:

- On load, `GET /api/app-settings`; if `leaderboardSuspense`, show blocked UI and do not call leaderboard/award endpoints.
- Block UI when ON.

### Data flow

```text
Admin toggles Dashboard
  → server action updates AppSetting.leaderboardSuspense
  → revalidate /admin/dashboard, /leaderboard, /gl

Student opens /leaderboard
  → GET /api/leaderboard (+ feed)
  → if suspense && !isAdmin → redacted JSON + suspense: true
  → UI renders ? / hides RECORD & bars

Admin opens /admin/dashboard
  → direct Supabase Group/Student aggregates (real)
  → toggle reflects AppSetting
```

## Non-goals

- Scheduled auto-reveal by datetime
- Scrambling or hiding rank order
- Teaser marketing copy on Rankings
- Masking a student’s own profile/dashboard points elsewhere in the app
- Changing admin Groups / Points / Presenter UIs beyond the Dashboard toggle
- Keeping `/gl` usable for awards during suspense

## Success criteria

- With suspense ON, a non-admin session’s Rankings UI shows ranks with `?` for name/points/logo, no bars/LV/RECORD, and network responses do not include recoverable identity/score fields.
- With suspense ON, admin Dashboard (and other admin ranking views) still show real names, emblems, and points.
- With suspense ON, `/gl` cannot search or award; award API returns an error if called anyway.
- Flipping the Dashboard toggle immediately switches public Rankings between veiled and full (within the existing poll/refresh window).
- With no `AppSetting` row (or suspense OFF), public Rankings matches today’s behavior.
