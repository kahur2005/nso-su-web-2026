# Secret page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/secret-between-me-and-you` with per-student claim, YouTube redirect on first claim, and quest QR from DB thereafter.

**Architecture:** `PageWrapper` student page + `/api/secret` + `/api/secret/claim` + `SecretClaim` migration + seed script for `Quest.qrCode`.

**Tech Stack:** Next.js App Router, next-auth, Supabase service-role client, existing `Quest.qrCode` data-URL pattern.

---

### Task 1: Migration `SecretClaim`

**Files:**
- Create: `supabase/migrations/20260818_secret_claim.sql`

**Step 1:** Add idempotent `CREATE TABLE IF NOT EXISTS "SecretClaim"` with unique `studentId`, RLS enabled, no policies.

**Step 2:** Apply in Supabase SQL Editor (or note for the team) — same workflow as other hand-applied migrations.

---

### Task 2: Constants + APIs

**Files:**
- Create: `lib/secret.ts` (title + YouTube URL constants; pure)
- Create: `app/api/secret/route.ts` (GET)
- Create: `app/api/secret/claim/route.ts` (POST)

**Step 1:** GET resolves session → student UUID → whether `SecretClaim` exists; if claimed, load quest by title and return `qrCode`.

**Step 2:** POST inserts claim (ignore unique conflict) → return YouTube URL.

---

### Task 3: Page UI

**Files:**
- Create: `app/(game)/secret-between-me-and-you/page.tsx`

**Step 1:** Server redirect to `/login` if no session.

**Step 2:** Client fetch GET; render warning + claim button or QR.

**Step 3:** Claim button POST then `window.location.href = youtubeUrl`.

---

### Task 4: Seed QR into Quest + drop public file

**Files:**
- Create: `scripts/seed-easter-egg-qr.mjs`
- Delete (after seed succeeds locally if desired): `public/images/qr-find-an-easter-egg-in-the-website!.png` — keep until seed has been run against the live DB; script reads from that path.

**Step 1:** Script loads env, finds quest by title, updates `qrCode` data-URL.

**Step 2:** Run script against the project DB when env is available.

---

### Task 5: Smoke check

- Unauthenticated → `/login`
- First claim → YouTube
- Reload → QR visible
- Second student can still claim independently
