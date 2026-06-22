# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The warning above is real: this repo uses Next.js 16.2.9, which post-dates training data. Before using any Next.js API (caching, navigation, route handlers, etc.), consult the bundled docs at `node_modules/next/dist/docs/` (`01-app/` for App Router guides and API reference).

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build (also the de-facto type check; no separate `tsc` script)
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npx prisma migrate dev` — create/apply migrations (none exist yet — the first run creates the initial migration)
- `npx prisma generate` — regenerate client after schema changes
- `npx prisma studio` — browse the database
- `npx prisma dev` — start the local Prisma Postgres server that `DATABASE_URL` points at

No test framework is configured.

Prisma 7: CLI configuration lives in `prisma.config.ts` (loads `.env` via `import "dotenv/config"`), not in `package.json`. It also wires `SHADOW_DATABASE_URL` for migrations. Database is PostgreSQL.

## What this app is

A gamified New Student Orientation (NSO 2026) web app. Students scan QR codes carried by committee members ("NPCs") to collect fun facts and earn points/XP, compete in groups, complete quests, and unlock achievements.

## Architecture

**Route areas** (App Router). `app/(game)/*` and `app/(auth)/*` are route groups — the parenthesized segment does NOT appear in the URL (so pages live at `/dashboard`, `/scan`, `/login`, etc.). `app/admin/*` is a literal path segment.
- `app/(game)/*` — student-facing pages (dashboard, scan, quests, leaderboard, codex, profile, map, clubs, rulebook)
- `app/(auth)/login` — login page
- `app/admin/*` — admin pages (dashboard, npc, quests, groups, points, announcements)
- `app/api/*` — route handlers (leaderboard, quests, codex, qr/scan, qr/generate, qr/recent, auth/[...nextauth])

**Data layer**: Prisma singleton in `lib/prisma.ts` (import `prisma` from `@/lib/prisma`). It uses the `@prisma/adapter-pg` driver adapter, with the connection string passed to the `PrismaClient` constructor (Prisma 7 — not in the schema). The `prisma/schema.prisma` `datasource` block intentionally has no `url`. Models: `Student` ↔ `Group`, `NPC`, `ScanLog` (unique per `[studentId, npcId]` — this constraint is the duplicate-scan guard), `Quest`/`QuestProgress`, `Achievement`/`StudentAchievement`, `Announcement`, `Club`. `Student` carries a hashed `password` plus the registration-questionnaire fields `medicalNote`, `pastAchievements`, `instagram`. Server components query Prisma directly; API routes exist for client-side fetches.

**Auth**: next-auth v4 with a single email/password `credentials` provider (`lib/auth.ts`, JWT sessions). The `[...nextauth]` handler is at `app/api/auth/[...nextauth]/route.ts`; all consumers call `getServerSession(authOptions)`. `authorize()` looks the student up by email and checks the password via `verifyPassword` (`lib/password.ts`, Node `scrypt`, no native dep). The `jwt` callback caches `studentId`/`isAdmin`/`points` at sign-in; the `session` callback exposes them via `(session.user as any).studentId`. `components/providers/AuthProvider.tsx` wraps the app in `SessionProvider` from the root `app/layout.tsx`. There is no SSO/OAuth — registration is self-serve.

**Login & registration**:
- `app/(auth)/login` — email/password form; calls `signIn('credentials', { redirect: false })` then routes to `/dashboard`.
- `app/(auth)/register` — collects name/email/password plus a questionnaire (medical note, past achievements, optional Instagram), POSTs to `app/api/auth/register/route.ts` (hashes the password, generates a `NSO-XXXXXXXX` `studentId`, creates the `Student`), then auto signs in.

New students default to `isAdmin: false`. To grant admin, flip `isAdmin` on the `Student` row (e.g. via `npx prisma studio`) and have them log in again (the flag is read into the JWT at sign-in).

**Admin mutations**: server actions in `app/admin/actions.ts` (`'use server'`) handle quest/group/points/announcement/NPC writes. Each starts with `requireAdmin()` (throws on a non-admin session) and ends with `revalidatePath(...)`. Prefer adding admin writes here over new API routes.

**QR flow** (core mechanic):
1. Admin POSTs to `/api/qr/generate` (admin-session-gated): creates an NPC, signs a JWT `{ npcId, points }` with `QR_SECRET_KEY` (7-day expiry), renders it as a QR data-URL pointing to `${NEXT_PUBLIC_BASE_URL}/scan?token=...`, and stores both on the NPC.
2. Student POSTs the token to `/api/qr/scan` (session-gated): verifies the JWT, rejects duplicates via `ScanLog`, then in one transaction creates the `ScanLog` and increments student `points`/`xp`/`funFactsCollected`, group `totalPoints`, and NPC `scanCount`.

**UI**: Tailwind CSS 4 (via `@tailwindcss/postcss`, no tailwind.config). Pixel/RPG-themed shared components in `components/ui/` (PixelButton, PixelCard, ProgressBar, CountdownTimer, LoadingSpinner) and `components/layout/` (Navbar, BottomNav, PageWrapper, AdminHeader). Also available: framer-motion, zustand, recharts, lucide-react, html5-qrcode (client-side QR scanning).

**Env vars** (in `.env`, not committed): `DATABASE_URL`, `SHADOW_DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `QR_SECRET_KEY`, `NEXT_PUBLIC_BASE_URL`. (The `CAMPUS_*` SSO vars are no longer used — auth is email/password.)
