# NSO 2026 — Production Environment Setup, Vercel Testing & Data Input Guide

This guide provides step-by-step instructions for setting up environment variables, deploying to Vercel, inputting Committee NPC data (fun facts, links, photos) and Quest specifications (from `.docx` documents), and executing a full production testing pass.

---

## Step 1: Environment Setup & Variables

### Required Environment Variables

| Variable | Description | Example (Local) | Example (Vercel Prod) |
|---|---|---|---|
| `SUPABASE_URL` | Your Supabase Project REST API URL | `https://xyz.supabase.co` | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Secret Key (bypasses RLS) | `eyJhbG...` | `eyJhbG...` |
| `NEXTAUTH_SECRET` | Secret key for JWT session encryption | `your-random-32-char-secret` | `your-random-32-char-secret` |
| `NEXTAUTH_URL` | Base URL for auth callbacks | `http://localhost:3000` | `https://nso-su-web-2026.vercel.app` |
| `QR_SECRET_KEY` | Secret key for QR code JWT generation | `your-qr-jwt-secret` | `your-qr-jwt-secret` |
| `NEXT_PUBLIC_BASE_URL` | Base URL embedded into printed QR codes | `http://localhost:3000` | `https://nso-su-web-2026.vercel.app` |

> [!CAUTION]
> Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components or prefix it with `NEXT_PUBLIC_`. Keep it strictly on the server.

### Local Setup
1. Copy `.env` or create `.env` in the root directory.
2. Fill in all 6 environment variables listed above.
3. Restart dev server (`npm run dev`) whenever `.env` changes.

### Vercel Production Setup
1. Go to your **Vercel Dashboard** → Select `nso-su-web-2026` project.
2. Navigate to **Settings** → **Environment Variables**.
3. Add each variable for the **Production**, **Preview**, and **Development** environments.
4. Redeploy the project so new environment variables take effect.

---

## Step 2: Supabase Database Setup

1. Log into [Supabase Dashboard](https://supabase.com).
2. Open **SQL Editor** → **New Query**.
3. Open `supabase/schema.sql` from this repository.
4. Copy the entire file, paste into SQL Editor, and click **Run**.
5. Verify under **Table Editor** that all 10 tables are present:
   - `Group`, `Student`, `NPC`, `ScanLog`, `PointAdjustment`, `Quest`, `QuestProgress`, `Achievement`, `StudentAchievement`, `Announcement`, `Club`.

### Granting Admin Privileges
To make a registered user an Admin:
```sql
UPDATE "Student"
SET "isAdmin" = true
WHERE email = 'your-admin-email@example.com';
```
*(User must log out and log back in for JWT session to refresh).*

---

## Step 3: Inputting Committee NPC Data (Fun Facts & Links)

Committee NPCs appear under `/map/committee` (grouped by Division) and are scanned via QR code for fun facts and points.

### Division Categories (`lib/divisions.ts`)
- `SC` (Steering Committee)
- `BPH` (Badan Pengurus Harian)
- `ACAD` (Academics & Events)
- `SPONSOR` (Sponsorship & Partnership)
- `DOCS` (Documentation & Design)
- `LOG` (Logistics & Operations)

### Methods to Input Data

#### Method A: Using SQL Seed Script (`supabase/seed_committee_and_quests.sql`)
Run queries in Supabase SQL Editor to insert or update committee members:
```sql
INSERT INTO "NPC" (
  "id", "committeeName", "role", "division", "instagram", "funFact", "points", "avatarUrl", "isActive"
) VALUES (
  gen_random_uuid()::text,
  'Alex Chen',
  'Head of Logistics',
  'LOG',
  'alexchen_su',
  'Has drunk 5 cups of matcha every single day of orientation planning!',
  10,
  'https://xyz.supabase.co/storage/v1/object/public/avatars/alex.png',
  true
);
```

#### Method B: Admin Dashboard (`/admin/committee`)
1. Log in as an Admin and navigate to `/admin/committee`.
2. Click **Add Committee Member**.
3. Fill in **Name**, **Role**, **Division**, **Instagram Handle**, **Fun Fact**, and upload a photo.
4. Click **Generate QR** to generate an active QR token for student scanning.

---

## Step 4: Applying `.docx` Quest Guidelines to Quests

Quests are printed missions shared by all students. When scanned, they award points and unlock badge achievements.

### Structuring Quest Data from `.docx` Specifications

Each quest from the `.docx` guideline should map to the following fields:

1. **Title**: Short, memorable quest title (e.g. `Orientation Hero`).
2. **Description**: Clear instructions for the student (e.g. `Find the campus library and scan the secret emblem on row 4`).
3. **Points**: XP/Points awarded upon scanning (e.g. `25`).
4. **Achievement (Badge)**: Linked badge unlocked in `/profile`.

### SQL Seed Example for Quests & Achievements
```sql
-- 1. Create Achievement Badge
INSERT INTO "Achievement" ("id", "name", "description", "imageUrl")
VALUES (
  'achv-library-explorer',
  'Master Scholar',
  'Unlocked by completing the Library Secret quest during NSO 2026',
  'https://xyz.supabase.co/storage/v1/object/public/avatars/badge-scholar.png'
);

-- 2. Create Linked Quest
INSERT INTO "Quest" ("id", "title", "description", "points", "isActive", "achievementId")
VALUES (
  'quest-library-01',
  'Library Secret',
  'Locate the hidden emblem inside the campus main library and scan it.',
  25,
  true,
  'achv-library-explorer'
);
```

---

## Step 5: Vercel & Production Testing Checklist

Run through this checklist on your Vercel deployment URL (`https://<app-name>.vercel.app`):

### 1. Auth & Registration
- [ ] Register a new student at `/register` with full questionnaire & custom avatar.
- [ ] Confirm auto-login routes to `/dashboard`.
- [ ] Log out and log back in at `/login`.

### 2. Dashboard & Navigation
- [ ] Verify profile banner shows correct name, level, and group.
- [ ] Click the **MAP** tile on the dashboard — confirm it opens `/map/zones` (the campus map/zones), NOT the info station.
- [ ] Verify announcement banner displays recent broadcast messages.

### 3. Committee Scroll (`/map/committee`)
- [ ] Switch between all 6 division tabs (`SC`, `BPH`, `ACAD`, `SPONSOR`, `DOCS`, `LOG`).
- [ ] Verify committee photos, name plaques, and roles render cleanly.
- [ ] Click Instagram link icons — verify they open the Instagram handle in a new browser tab.
- [ ] Verify locked fun facts display placeholder text before scanning.

### 4. Quests Board (`/quests`)
- [ ] Open `/quests` and check that active quests are listed.
- [ ] Verify point rewards (`+25 XP`) and achievement badges render properly.

### 5. QR Code Scanning Flow (`/scan`)
- [ ] As an admin, generate a test QR code for an NPC or Quest at `/admin/qr` or `/admin/quests`.
- [ ] As a student, navigate to `/scan` and scan the QR code.
- [ ] Confirm scan success screen displays fun fact / quest completion message.
- [ ] Verify student points, XP, and level update in real-time on `/dashboard` and `/profile`.
- [ ] Try scanning the same QR code again — confirm duplicate guard blocks second scan.

### 6. Leaderboard (`/leaderboard`)
- [ ] Confirm student rankings and group total points calculate correctly.
