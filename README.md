# NSO SU Web 2026

Gamified campus orientation platform for Sampoerna University's New Student Orientation 2026. Students earn XP, complete quests, meet NPCs, and compete on a leaderboard.

**Stack:** Next.js (App Router) · Supabase (Postgres + Storage) · NextAuth · Tailwind CSS v4

---

## Quick Start

```bash
npm install
cp .env.example .env     # fill in Supabase + NextAuth keys
npm run dev              # http://localhost:3000
```

### Required `.env` keys
| Key | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (service_role key) |
| `NEXTAUTH_SECRET` | Any random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local |

---

## Project Map

```
app/
├── (auth)/
│   ├── login/page.tsx          ← Login page (forest background, ByteBounce font)
│   └── register/page.tsx       ← Student registration
├── (game)/
│   ├── dashboard/              ← Main home screen for students
│   ├── map/                    ← Interactive campus map
│   ├── quests/                 ← Quest log for students
│   ├── leaderboard/            ← Group & individual rankings
│   ├── profile/                ← Student profile + avatar customization
│   ├── clubs/                  ← Club info pages
│   ├── codex/                  ← Campus knowledge base
│   ├── rulebook/               ← NSO rulebook
│   └── scan/                   ← QR code scanner (check-in)
├── admin/
│   ├── dashboard/              ← Admin home
│   ├── quests/page.tsx         ← Create & toggle quests  ← edit quests here
│   ├── quests/onboarding/      ← Guide for uploading quests
│   ├── groups/                 ← Manage groups + assign students
│   ├── points/                 ← Manually adjust student points
│   ├── announcements/          ← Push announcements to students
│   ├── npc/                    ← Toggle NPC availability
│   └── actions.ts              ← All admin server actions  ← add new admin logic here
├── layout.tsx                  ← Root layout (fonts, auth provider, intro sequence)
└── globals.css                 ← Design tokens, animations, pixel utilities
```

---

## Key Files to Change

| What you want to change | File |
|---|---|
| Login page look/text | `app/(auth)/login/page.tsx` |
| Student home screen | `app/(game)/dashboard/page.tsx` |
| Create/edit quests | `app/admin/quests/page.tsx` |
| Quest DB logic | `app/admin/actions.ts` → `createQuest()` |
| Global styles / fonts | `app/globals.css` |
| Fonts available | `public/fonts/` (ByteBounce, Campton, VCR) |
| Background images | `public/images/` |
| Intro splash animation | `components/IntroSequence.tsx` |
| Auth config / roles | `lib/auth.ts` |
| Supabase client | `lib/supabase.ts` (service-role, server-only) |

---

## Design System

All pixel-art / retro game aesthetic. Key CSS classes in `globals.css`:

| Class | Use |
|---|---|
| `font-bytebounce` | Main pixel display font (titles, buttons) |
| `font-pixel` | "Press Start 2P" — smaller labels |
| `wood-plank` | Wooden plank button/banner style |
| `pixel-btn` | Generic raised pixel button |
| `pixel-card` | Dark card with pixel border + shadow |
| `rpg-dialog` | RPG dialogue box |
| `blink` | Blinking text animation |
| `scanlines` | CRT scanline overlay (admin pages) |

**Color palette:**

| Var | Hex | Use |
|---|---|---|
| `--pixel-yellow` | `#FFD700` | Gold / XP |
| `--pixel-green` | `#4CAF50` | Active / positive |
| `--pixel-blue` | `#2196F3` | Info / daily |
| `--pixel-red` | `#F44336` | Danger / deadline |
| `--pixel-purple` | `#9C27B0` | Hidden / mystery |
| `--pixel-brown` | `#795548` | Wooden UI elements |

---

## Admin Routes

All require `session.user.isAdmin === true`. Unauthorized users are redirected to `/dashboard`.

| URL | Purpose |
|---|---|
| `/admin/dashboard` | Admin overview |
| `/admin/quests` | Create & manage quests |
| `/admin/quests/onboarding` | Step-by-step quest upload guide |
| `/admin/groups` | Create groups, assign students |
| `/admin/points` | Manually add/subtract student points |
| `/admin/announcements` | Broadcast announcements |
| `/admin/npc` | Toggle NPC active state |

---

## Database (Supabase)

Main tables: `Student`, `Quest`, `QuestProgress`, `Group`, `NPC`, `Announcement`

All DB access is **server-side only** via `lib/supabase.ts` (service role key — never import in client components).

---

## Intro Sequence

`components/IntroSequence.tsx` — plays a ~2.8 s pixel splash on **first page load per session** (uses `sessionStorage`). Mounted globally in `app/layout.tsx`. To replay it, run `sessionStorage.clear()` in the browser console.

---

## Branch Workflow

```bash
git checkout main && git pull
git checkout -b dev/yourname
# work...
git add . && git commit -m "feat: description"
git push -u origin dev/yourname
# open a PR on GitHub → base: main
```
