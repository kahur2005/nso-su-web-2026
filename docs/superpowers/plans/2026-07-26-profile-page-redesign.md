# /profile Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/profile` to Figma node `8:2` — a wood-sign player banner, three stacked parchment stat cards beside a house pennant, a horizontal achievement badge strip, and an expandable activity log.

**Architecture:** `app/(game)/profile/page.tsx` stays a server component owning session checks, Supabase queries and derived values. Five presentational components move to `components/profile/`. Only `ActivityLog` is a client component, because it owns the See All expand state. Navbar/BottomNav/`PageWrapper` are untouched.

**Tech Stack:** Next.js 16.2.11 App Router (React 19.2.4), Tailwind CSS 4 (no config file — tokens live in `app/globals.css`), Supabase via `@supabase/supabase-js`, next-auth v4.

**Spec:** `docs/superpowers/specs/2026-07-26-profile-page-redesign-design.md`

## Global Constraints

- **There is no test framework in this repo.** The verification step for every task is `npm run build` (the de-facto type check) plus a browser check at mobile width. Do not add a test runner.
- **`npm run lint` is broken** (ESLint 10.8.0 vs the `eslint-plugin-react` inside `eslint-config-next`). It crashes on the first file and lints nothing. Never use it to judge a change.
- **Next.js 16.2.11 post-dates training data.** Consult `node_modules/next/dist/docs/01-app/` before using any Next.js API.
- All game type is `font-bytebounce`. Never introduce another font family.
- Raw `<img>` tags need `{/* eslint-disable-next-line @next/next/no-img-element */}` above them, matching every other file in `app/(game)/`.
- Keep these four `data-tour` attributes alive on their sections, or the `PageIntro` tour silently degrades: `profile-header`, `profile-stats`, `profile-achievements`, `profile-activity`. Do not edit `lib/tours.ts`.
- Never import `@/lib/supabase` from a client component — it holds the service-role key.

### Palette, sampled pixel-by-pixel from the frame

| Token | Value | Use |
|---|---|---|
| Parchment | `#ffecb3` | Stat card and activity row fill — this is exactly `paper.png`'s fill, so the sprite matches with no tinting |
| Dark brown | `#3e2723` | Card labels, big numbers, row titles, borders, text shadows |
| Muted brown | `#6d4c41` | Activity row sub-lines |
| Cream | `#ffecb3` | `Achievements` / `Activity Log` headings, `HOUSE OF`, level line |
| Tan | `#e0b391` | `WELCOME BACK, PLAYER`, the `n/m xp` counter |
| Name yellow | `#fcf940` | The player's first name, XP bar fill |
| Grey-tan | `#a1887f` | `See All`, XP bar border |
| Pennant red | `#bf360c` | Pennant fill fallback |
| Pennant crossbar | `#a62700` | The darker bar across the pennant's top |
| Positive | `#328b36` | `+ N Points` |
| Negative | `#d6101d` | `− N Points`, and a negative total-points figure |

### Geometry measured off the frame (386px wide = 1× for this pixel art)

- Wood sign: x 14–371, y 54–195 (358 × 142). Border `#3e2723` 4px, highlight `#ba8f6e`, bands `#88684e` → `#6d4c41` → `#4e342e`. **This is the existing `.wood-plank` palette**, which is why no sprite is cropped for it (see the deviation note below).
- Avatar frame: 90 × 89, 3px `#fcf940` border, red backing that runs `#761915` at the top to `#d6101d` at the bottom.
- Stat cards: x 15–197 (182 wide), each ~81 tall, 8px gap.
- Pennant: x 226–345 (120 wide), top y 215, sides end y ≈ 455, centre tip y ≈ 499 — a downward point ~44px deep.

### Two deviations from the spec, and why

1. **No board sprite, no `SliceBg` extraction.** The spec proposed cropping the wood sign into three slices. Measuring it showed the sign is the `.wood-plank` gradient already in `globals.css` — same border, same highlight, same three bands. Using the class avoids a sprite crop, avoids knocking transparency into its rounded corners, avoids a new shared component, and follows the documented project convention that wood is CSS and not a Figma export. `components/ui/SliceBg.tsx` is **not** created and `app/(game)/quests/page.tsx` is **not** touched.
2. **The pennant's group name is cream `#ffecb3`, not the frame's `#d37a38`.** The pennant is tinted from `Group.color` as the spec requires, so the name sits on an arbitrary hue; a warm tan disappears against a yellow or orange group colour. Cream with a dark shadow reads on every hue.

---

### Task 1: Extract the medal icon

The `Achievements` heading has a pixel medal to its left. Nothing in `public/images/` has one. The `Activity Log` heading's clipboard is close enough to the existing scroll icon that it needs no new asset.

**Files:**
- Create: `public/images/profile/medal.png`
- Scratch (not committed): a PowerShell crop script

**Interfaces:**
- Consumes: nothing.
- Produces: `/images/profile/medal.png` — a transparent-background PNG, roughly 43 × 58, used by Task 4.

- [ ] **Step 1: Re-download the frame render**

The screenshot URL from the design session is short-lived. Call `mcp__figma__get_screenshot` with `fileKey: "VCnH1k8cwo2dWaLjL7YRVS"`, `nodeId: "8:2"`, `maxDimension: 1400`, then `curl -L -o` the returned URL into the session scratchpad directory as `profile-figma.png`. It must come back 386 × 1203; that is 1× for this pixel art, so crops are lossless.

Note the absolute path you saved it to — Step 2's script needs it.

> The Figma MCP is on the Starter plan with a hard call quota. This is the only Figma call in the whole plan — do not add `get_metadata` or `get_design_context` calls.

- [ ] **Step 2: Crop the medal and knock out its background**

The medal occupies x 16–58, y 480–537. Its pixels are bright orange/gold/red (`#ff8e24`, `#d88722`, `#e0d239`, `#bf360c`); the background behind it is dark forest (`#111111`, `#41260d`, `#032626`). Keep only pixels that are bright and not green-dominant.

```powershell
Add-Type -AssemblyName System.Drawing
$src = New-Object System.Drawing.Bitmap("<the profile-figma.png path from Step 1>")
$w = 43; $h = 58; $x0 = 16; $y0 = 480
$out = New-Object System.Drawing.Bitmap($w, $h)
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $c = $src.GetPixel($x0 + $x, $y0 + $y)
    $max = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
    # Background is dark; the medal's darkest kept pixel is well above 110.
    # Green-dominant pixels are foliage, never medal.
    $keep = ($max -ge 110) -and ($c.G -lt ($c.R + 20))
    if ($keep) { $out.SetPixel($x, $y, $c) }
    else { $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0,0,0,0)) }
  }
}
$out.Save("D:\!!! GITHUB\nso-su-web-2026\public\images\profile\medal.png",
          [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose(); $src.Dispose()
```

Create `public/images/profile/` first if it does not exist.

- [ ] **Step 3: Look at the result**

Read `public/images/profile/medal.png` with the Read tool.
Expected: a ribbon-and-disc medal, orange ribbon, gold disc, no dark forest speckle around it and no chunks bitten out of the ribbon.

If it is ragged, delete the file and record in the task notes that Task 4 must use the 🏅 emoji fallback instead. Do not spend more than one retry adjusting the threshold.

- [ ] **Step 4: Commit**

```bash
git add public/images/profile/medal.png
git commit -m "feat(profile): add the medal icon cropped from the Figma frame"
```

(If the knockout failed and no file was produced, skip this commit entirely.)

---

### Task 2: PlayerBanner

**Files:**
- Create: `components/profile/PlayerBanner.tsx`
- Modify: `app/(game)/profile/page.tsx` — replace the existing header block (currently the `wood-plank` div carrying `data-tour="profile-header"`, roughly lines 140–188) and delete the now-unused `OUTLINE_GOLD` constant.

**Interfaces:**
- Consumes: `ParsedAvatar` and `hairKey` from `@/lib/avatar`; `PixelAvatar` from `@/components/ui/PixelAvatar` (props: `skin`, `clothes`, `hair`, `hijab`, `eyes`, `brow`, `mouth`, `size` — note the prop is `brow`, singular, while `ParsedAvatar`'s field is `brows`).
- Produces: `<PlayerBanner name level title into span avatar />`, where `name` is the student's full name (the component takes the first word itself), `title` is the level's display name, and `into`/`span` come from `levelProgress(xp)`.

- [ ] **Step 1: Write the component**

Create `components/profile/PlayerBanner.tsx`:

```tsx
// components/profile/PlayerBanner.tsx
// The wood sign at the top of /profile (Figma VCnH1k8cwo2dWaLjL7YRVS node 8:2).
// The sign itself is `.wood-plank` rather than a sprite: the frame's board is
// that class's exact palette — #3e2723 border, #ba8f6e highlight, then the
// #88684e / #6d4c41 / #4e342e bands — so a crop would add an asset and a
// corner-transparency problem for no visual gain.
import PixelAvatar from '@/components/ui/PixelAvatar'
import { hairKey, type ParsedAvatar } from '@/lib/avatar'

const TAN = { color: '#e0b391', textShadow: '1.5px 1.5px 0 #3e2723' }
const CREAM = { color: '#ffecb3', textShadow: '1.5px 1.5px 0 #3e2723' }
const NAME_YELLOW = { color: '#fcf940', textShadow: '3px 3px 0 #3e2723' }

interface PlayerBannerProps {
  name: string
  level: number
  title: string
  into: number
  span: number
  avatar: ParsedAvatar
}

export default function PlayerBanner({
  name,
  level,
  title,
  into,
  span,
  avatar,
}: PlayerBannerProps) {
  const firstName = (name.split(' ')[0] || name).toUpperCase()
  const pct = span > 0 ? Math.max(0, Math.min(100, (into / span) * 100)) : 0

  return (
    <div
      className="wood-plank flex items-center gap-4 px-4 py-4 sm:px-5"
      data-tour="profile-header"
    >
      {/* Gold-framed avatar on the frame's red backing */}
      <div
        className="shrink-0 border-[3px] border-[#fcf940]"
        style={{ background: 'linear-gradient(180deg, #761915 0%, #d6101d 100%)' }}
      >
        <PixelAvatar
          skin={avatar.skin}
          clothes={avatar.clothes ?? undefined}
          hair={hairKey(avatar) ?? undefined}
          hijab={avatar.hijab ?? undefined}
          eyes={avatar.eyes ?? undefined}
          brow={avatar.brows ?? undefined}
          mouth={avatar.mouth ?? undefined}
          size={80}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bytebounce text-[16px] leading-none sm:text-[17px]" style={TAN}>
          WELCOME BACK, PLAYER
        </p>

        <h1
          className="my-1 truncate font-bytebounce text-[clamp(2.2rem,10.5vw,3.2rem)] leading-none"
          style={NAME_YELLOW}
        >
          {firstName} !
        </h1>

        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate font-bytebounce text-[17px] leading-none sm:text-[18px]" style={CREAM}>
            LEVEL {level} – {title}
          </p>
          <p className="shrink-0 font-bytebounce text-[14px] leading-none sm:text-[15px]" style={TAN}>
            {into}/{span} xp
          </p>
        </div>

        {/* XP bar: dark track, gold fill, as on the sign in the frame */}
        <div className="mt-1.5 h-[11px] w-full overflow-hidden rounded-full border border-[#a1887f] bg-[#3e2723]">
          <div className="h-full rounded-full bg-[#fcf940]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into the page**

In `app/(game)/profile/page.tsx`, add the import:

```tsx
import PlayerBanner from '@/components/profile/PlayerBanner'
```

Delete the whole `{/* ── Player header banner (wood plank) ── */}` block and put this in its place:

```tsx
<PlayerBanner
  name={student.name}
  level={level}
  title={levelTitle(level)}
  into={into}
  span={span}
  avatar={av}
/>
```

Then delete the `OUTLINE_GOLD` constant — nothing references it any more.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: PASS. A failure naming `OUTLINE_GOLD` means it is still referenced somewhere; a failure naming `brow` means the `brows`/`brow` prop mismatch was not handled.

- [ ] **Step 4: Verify in the browser**

Run `npm run dev`, log in, open `/profile` at 390px viewport width.
Expected: a wood sign with a gold-framed avatar on red, `WELCOME BACK, PLAYER` in tan, the first name large in yellow with a brown drop shadow, the level line with `n/m xp` pushed hard right, and a thin dark XP bar with a gold fill under it. Nothing below the sign has changed yet.

- [ ] **Step 5: Commit**

```bash
git add components/profile/PlayerBanner.tsx "app/(game)/profile/page.tsx"
git commit -m "feat(profile): wood-sign player banner from the Figma frame"
```

---

### Task 3: Stat cards and the house pennant

**Files:**
- Create: `components/profile/StatCard.tsx`
- Create: `components/profile/HouseBanner.tsx`
- Modify: `app/(game)/profile/page.tsx` — replace the whole `{/* ── 2×2 stat cards (parchment) ── */}` grid (roughly lines 190–269) and delete the now-unused `getPointsColor` helper.

**Interfaces:**
- Consumes: `/images/quests/paper.png` (365 × 72, fill `#ffecb3`, transparent torn corners) and `/images/group/<mascot>.png`.
- Produces:
  - `<StatCard label={string} value={string} sub={string | undefined} valueClassName={string | undefined} />`
  - `<HouseBanner groupName={string | null} groupColor={string | null} mascotSrc={string | null} />`

- [ ] **Step 1: Write StatCard**

Create `components/profile/StatCard.tsx`:

```tsx
// components/profile/StatCard.tsx
// One parchment stat card: label on the left over two lines, a big figure on
// the right, and an optional "/total" tucked under it — the frame's
// FUNFACTS COLLECTED 59/59 card. The slab is the same paper.png the quest
// cards use, stretched in both directions so its torn edges scale with the
// card instead of tiling.
interface StatCardProps {
  label: string
  value: string
  /** Renders as "/sub" beneath the value, e.g. the fun-fact denominator. */
  sub?: string
  /** Extra classes on the value, used to colour a negative point total. */
  valueClassName?: string
}

export default function StatCard({ label, value, sub, valueClassName = '' }: StatCardProps) {
  return (
    <div
      className="flex min-h-[74px] items-center gap-2 px-5 py-3"
      style={{
        backgroundImage: 'url(/images/quests/paper.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    >
      <p className="min-w-0 flex-1 font-bytebounce text-[18px] uppercase leading-[1.05] text-[#3e2723] sm:text-[19px]">
        {label}
      </p>
      <div className="shrink-0 text-right">
        <p className={`font-bytebounce text-[38px] leading-none text-[#3e2723] sm:text-[42px] ${valueClassName}`}>
          {value}
        </p>
        {sub && (
          <p className="font-bytebounce text-[20px] leading-none text-[#3e2723] sm:text-[22px]">
            /{sub}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write HouseBanner**

Create `components/profile/HouseBanner.tsx`:

```tsx
// components/profile/HouseBanner.tsx
// The "HOUSE OF" pennant beside the stat cards. Drawn in CSS rather than
// exported: sprite exports out of this Figma file carry stray near-white edge
// pixels, and the shape is a flat fill, a crossbar and a notch.
//
// clip-path removes any real border, so the #3e2723 outline is four 2px
// drop-shadows, which trace the clipped silhouette including the bottom point.
// The shape is its own absolutely-positioned layer with the content sitting
// above it: `filter` applies to an element's whole subtree, so painting the
// pennant and its text together would outline every glyph and the mascot too.
//
// The fill is the group's own colour, so the name is cream rather than the
// frame's tan #d37a38 — tan vanishes against a yellow or orange house.
const PENNANT_FALLBACK = '#bf360c'
const TIP_DEPTH = 44 // px, measured off the frame

interface HouseBannerProps {
  groupName: string | null
  groupColor: string | null
  mascotSrc: string | null
}

export default function HouseBanner({ groupName, groupColor, mascotSrc }: HouseBannerProps) {
  const fill = groupColor || PENNANT_FALLBACK

  return (
    <div className="relative w-[118px] shrink-0 sm:w-[132px]">
      {/* Shape layer: fill, notch and outline only — never text. */}
      <div
        className="absolute inset-0"
        style={{
          // Vertical cloth streaks over the house colour.
          background: `repeating-linear-gradient(90deg, ${fill} 0 3px, rgba(0,0,0,0.10) 3px 4px)`,
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${TIP_DEPTH}px), 50% 100%, 0 calc(100% - ${TIP_DEPTH}px))`,
          filter:
            'drop-shadow(2px 0 0 #3e2723) drop-shadow(-2px 0 0 #3e2723) drop-shadow(0 2px 0 #3e2723) drop-shadow(0 -2px 0 #3e2723)',
        }}
      >
        {/* Darker crossbar across the top of the pennant */}
        <div className="absolute inset-x-0 top-0 h-[5px] bg-[#a62700]" />
      </div>

      {/* Content layer: sits above the shape and drives the wrapper's height. */}
      <div
        className="relative flex flex-col items-center gap-2 px-2 pt-3"
        style={{ paddingBottom: TIP_DEPTH + 8 }}
      >
      <p
        className="font-bytebounce text-[15px] leading-none text-[#ffecb3] sm:text-[16px]"
        style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.4)' }}
      >
        HOUSE OF
      </p>

      {mascotSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={mascotSrc}
          alt=""
          aria-hidden
          className="h-[76px] w-[76px] object-contain sm:h-[88px] sm:w-[88px]"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <span className="text-4xl" aria-hidden>🛡️</span>
      )}

      <p
        className="w-full break-words text-center font-bytebounce text-[20px] leading-none text-[#ffecb3] sm:text-[22px]"
        style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.45)' }}
      >
        {groupName ?? 'Unassigned'}
      </p>
      </div>
    </div>
  )
}
```

> Re-indent the content layer's four children (`HOUSE OF`, the mascot branch, the name) one level in when you paste this — they now sit inside the content `<div>`, not the wrapper.

- [ ] **Step 3: Wire both into the page**

Add the imports:

```tsx
import StatCard from '@/components/profile/StatCard'
import HouseBanner from '@/components/profile/HouseBanner'
```

Replace the entire 2×2 grid block with:

```tsx
{/* ── Stats: three stacked cards beside the house pennant ── */}
<div className="flex items-start gap-2.5" data-tour="profile-stats">
  <div className="flex min-w-0 flex-1 flex-col gap-2">
    <StatCard
      label="Total Points"
      value={String(student.points)}
      valueClassName={student.points < 0 ? 'text-[#d6101d]' : ''}
    />
    <StatCard label="Quests Completed" value={String(completedQuests)} />
    <StatCard
      label="Funfacts Collected"
      value={String(student.funFactsCollected)}
      sub={String(totalNPCs)}
    />
  </div>

  <HouseBanner
    groupName={groupName}
    groupColor={student.group?.color ?? null}
    mascotSrc={mascotImg}
  />
</div>
```

Then delete the `getPointsColor` function at the top of the file and the now-unused `groupColor` local (`HouseBanner` reads `student.group?.color` directly and applies its own fallback).

> The frame prints the total in plain dark brown. `valueClassName` only overrides that when the total is actually negative, so a deducted score still reads as a loss.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: PASS. A failure naming `groupColor` or `getPointsColor` means a stale reference survived the deletion.

- [ ] **Step 5: Verify in the browser**

Reload `/profile` at 390px width.
Expected: three cream parchment cards stacked down the left with torn edges, each showing its label on two lines and a large brown figure on the right; the fun-facts card shows `/total` under its figure. To their right a pennant in the group's colour with a dark crossbar on top, `HOUSE OF`, the mascot, the group name, and a bottom that comes to a point. A dark brown outline traces the whole pennant including the point.

If the group is unassigned, expect a red pennant with a shield emoji and `Unassigned`.

- [ ] **Step 6: Commit**

```bash
git add components/profile/StatCard.tsx components/profile/HouseBanner.tsx "app/(game)/profile/page.tsx"
git commit -m "feat(profile): parchment stat cards and the house pennant"
```

---

### Task 4: Section heading and the achievement strip

**Files:**
- Create: `components/profile/SectionHeading.tsx`
- Create: `components/profile/AchievementStrip.tsx`
- Modify: `app/(game)/profile/page.tsx` — replace the whole `{/* ── Achievements section ── */}` block (roughly lines 295–368), and delete the `{/* ── Instagram link (if set) ── */}` block plus the `instagramHref` helper.

**Interfaces:**
- Consumes: `/images/profile/medal.png` from Task 1 (or 🏅 if that knockout failed).
- Produces:
  - `<SectionHeading icon={string} title={string} right={React.ReactNode | undefined} />` — `icon` is an image path. Task 5 imports this too.
  - `<AchievementStrip achievements={{ id: string; name: string; imageUrl: string | null; unlocked: boolean }[]} />`

`SectionHeading` carries no `'use client'` directive and no server-only imports, so Task 5's client component can import it.

- [ ] **Step 1: Write SectionHeading**

Create `components/profile/SectionHeading.tsx`:

```tsx
// components/profile/SectionHeading.tsx
// Icon + cream display title, with an optional right-hand slot (a count, or
// the activity log's See All button). The cream/brown treatment is the same
// one the /quests header uses, so the two pages read as one design.
import type { ReactNode } from 'react'

const CREAM_HEADING = {
  color: '#ffecb3',
  textShadow: '3px 3px 0 #3e2723',
}

interface SectionHeadingProps {
  icon: string
  title: string
  right?: ReactNode
}

export default function SectionHeading({ icon, title, right }: SectionHeadingProps) {
  return (
    <div className="mb-2 flex items-center gap-2.5 px-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        className="h-9 w-8 shrink-0 object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      <h2 className="font-bytebounce text-[28px] leading-none sm:text-[32px]" style={CREAM_HEADING}>
        {title}
      </h2>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </div>
  )
}
```

> If Task 1's knockout failed and `medal.png` was never committed, change the `<img>` to `<span className="shrink-0 text-[26px]" aria-hidden>{icon}</span>` and pass the emoji through `icon` instead. Make that change once, here, and pass `'🏅'` / `'📋'` at the call sites.

- [ ] **Step 2: Write AchievementStrip**

Create `components/profile/AchievementStrip.tsx`:

```tsx
// components/profile/AchievementStrip.tsx
// The frame leaves the Achievements area empty, so this is a horizontal shelf
// of badge medallions: unlocked in full colour, locked dimmed behind a
// padlock. Horizontal keeps the section as short as the frame implies.
export interface AchievementBadge {
  id: string
  name: string
  imageUrl: string | null
  unlocked: boolean
}

export default function AchievementStrip({
  achievements,
}: {
  achievements: AchievementBadge[]
}) {
  if (achievements.length === 0) {
    return (
      <p
        className="px-1 font-bytebounce text-[17px] leading-none text-[#e0b391]"
        style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
      >
        No achievements yet — complete a quest to earn your first badge.
      </p>
    )
  }

  return (
    <ul className="-mx-1 flex list-none gap-2.5 overflow-x-auto px-1 pb-1">
      {achievements.map((a) => (
        <li key={a.id} className="w-[82px] shrink-0">
          <div
            className={`flex h-[68px] w-[68px] items-center justify-center border-2 border-[#3e2723] ${
              a.unlocked ? '' : 'opacity-60'
            }`}
            style={{ background: 'linear-gradient(180deg, #8a5a37 0%, #5d3a1a 100%)' }}
            aria-label={a.unlocked ? a.name : `${a.name} (locked)`}
            title={a.unlocked ? a.name : `${a.name} (locked)`}
          >
            {a.unlocked ? (
              a.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={a.imageUrl}
                  alt=""
                  aria-hidden
                  className="h-14 w-14 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="text-3xl" aria-hidden>🏅</span>
              )
            ) : (
              <span className="text-2xl" aria-hidden>🔒</span>
            )}
          </div>
          <p
            className={`mt-1 w-[68px] truncate font-bytebounce text-[13px] leading-none ${
              a.unlocked ? 'text-[#ffecb3]' : 'text-[#a1887f]'
            }`}
            style={{ textShadow: '1px 1px 0 #3e2723' }}
          >
            {a.name}
          </p>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Wire it into the page and drop Instagram**

Add the imports:

```tsx
import SectionHeading from '@/components/profile/SectionHeading'
import AchievementStrip from '@/components/profile/AchievementStrip'
```

Delete the entire `{student.instagram && ( … )}` block and the `instagramHref` helper above it. (`Student.instagram` stays in the database and in the profile edit action — only this page's display of it goes.)

Replace the achievements block with:

```tsx
{/* ── Achievements ── */}
<section data-tour="profile-achievements">
  <SectionHeading
    icon="/images/profile/medal.png"
    title="Achievements"
    right={
      <span
        className="font-bytebounce text-[17px] leading-none text-[#e0b391]"
        style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
      >
        {unlockedCount}/{achievements.length}
      </span>
    }
  />
  <AchievementStrip achievements={achievements} />
</section>
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: PASS. A failure naming `instagramHref` means the helper was deleted but a call site survived, or vice versa.

- [ ] **Step 5: Verify in the browser**

Reload `/profile` at 390px width.
Expected: a medal icon beside a cream `Achievements` heading with `unlocked/total` on the right, then a row of badge tiles that scrolls sideways when there are more than four. Locked tiles are dimmed with a padlock and a grey name. The Instagram row is gone.

With no achievements in the database, expect the single-line empty message instead of the strip.

- [ ] **Step 6: Commit**

```bash
git add components/profile/SectionHeading.tsx components/profile/AchievementStrip.tsx "app/(game)/profile/page.tsx"
git commit -m "feat(profile): achievement badge strip, drop the Instagram row"
```

---

### Task 5: The expandable activity log

**Files:**
- Create: `components/profile/ActivityLog.tsx`
- Modify: `app/(game)/profile/page.tsx` — raise the `ScanLog` query's `.limit(8)` to `.limit(30)` inside `getProfileData`, and replace the whole `{/* ── Activity log ── */}` block (roughly lines 370–410).

**Interfaces:**
- Consumes: `SectionHeading` from Task 4; `/images/dashboard/quest.svg`, the existing scroll icon the quests page already uses.
- Produces: `<ActivityLog rows={ActivityRow[]} />` where `ActivityRow` is `{ id: string; title: string; points: number; scannedAt: string }`. The page shapes raw `ScanLog` records into this before passing them, so no Supabase row shape crosses into the client bundle.

- [ ] **Step 1: Write the client component**

Create `components/profile/ActivityLog.tsx`:

```tsx
// components/profile/ActivityLog.tsx
// The frame's activity feed: parchment rows with the scanned committee member,
// a fun-fact sub-line, and the point delta on the right — green when positive,
// red when negative. "See All" expands the list in place, so no extra route is
// needed. This is the page's only client component; it exists for that state.
'use client'
import { useState } from 'react'
import SectionHeading from './SectionHeading'

export interface ActivityRow {
  id: string
  title: string
  points: number
  scannedAt: string
}

/** Rows shown before "See All" is pressed — the frame shows a short feed. */
const COLLAPSED_ROWS = 3

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const PAPER = {
  backgroundImage: 'url(/images/quests/paper.png)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  imageRendering: 'pixelated' as const,
}

export default function ActivityLog({ rows }: { rows: ActivityRow[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)
  const canExpand = rows.length > COLLAPSED_ROWS

  return (
    <section data-tour="profile-activity">
      <SectionHeading
        icon="/images/dashboard/quest.svg"
        title="Activity Log"
        right={
          canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="font-bytebounce text-[17px] leading-none text-[#a1887f] transition-colors hover:text-[#ffecb3]"
              style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
            >
              {expanded ? 'Show Less ◀' : 'See All ▶'}
            </button>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-4" style={PAPER}>
          <p className="font-bytebounce text-[17px] leading-none text-[#6d4c41]">
            No scans yet — go scan a committee member!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((row) => (
            <div key={row.id} className="flex items-center gap-3 px-5 py-3.5" style={PAPER}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bytebounce text-[21px] leading-none text-[#3e2723]">
                  Scanned {row.title}
                </p>
                <p className="mt-1.5 font-bytebounce text-[17px] leading-none text-[#6d4c41]">
                  <span aria-hidden>💡</span> FunFact collected · {formatDate(row.scannedAt)}
                </p>
              </div>
              <p
                className={`shrink-0 font-bytebounce text-[18px] leading-none ${
                  row.points < 0 ? 'text-[#d6101d]' : 'text-[#328b36]'
                }`}
              >
                {row.points < 0 ? '−' : '+'} {Math.abs(row.points)} Points
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Raise the query limit**

In `app/(game)/profile/page.tsx`, inside `getProfileData`, the `ScanLog` query currently ends `.limit(8)`. Change it to:

```tsx
        .limit(30),
```

Leave the `.order('scannedAt', { ascending: false })` above it alone — newest first is what the feed wants.

- [ ] **Step 3: Wire it into the page**

Add the import:

```tsx
import ActivityLog, { type ActivityRow } from '@/components/profile/ActivityLog'
```

Inside the component body, after `const av = parseAvatarConfig(student.avatarConfig)`, shape the rows:

```tsx
  const activityRows: ActivityRow[] = (student.scanLogs ?? []).map((log: any) => ({
    id: log.id,
    title: log.npc?.committeeName ?? 'Committee',
    points: log.pointsAwarded ?? 0,
    scannedAt: log.scannedAt,
  }))
```

Replace the whole activity-log block with:

```tsx
<ActivityLog rows={activityRows} />
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: PASS. If it complains that `ActivityRow` is not exported as a type, check that the import uses `{ type ActivityRow }`.

- [ ] **Step 5: Verify in the browser**

Reload `/profile` at 390px width, on an account with more than three scans.
Expected: a scroll icon beside a cream `Activity Log` heading with `See All ▶` on the right; three parchment rows below it, each `Scanned <name>` in dark brown over `💡 FunFact collected · <date>`, with `+ N Points` in green on the right. Pressing `See All ▶` reveals the rest and the label becomes `Show Less ◀`; pressing it again collapses.

With three or fewer scans, the See All button should not render at all.

- [ ] **Step 6: Commit**

```bash
git add components/profile/ActivityLog.tsx "app/(game)/profile/page.tsx"
git commit -m "feat(profile): expandable activity log with signed point deltas"
```

---

### Task 6: Whole-page pass

**Files:**
- Modify: `app/(game)/profile/page.tsx` — the outer layout wrapper and the file's header comment.

**Interfaces:**
- Consumes: everything from Tasks 2–5.
- Produces: the finished page.

- [ ] **Step 1: Tighten the page layout and refresh the header comment**

The outer wrapper currently reads:

```tsx
<div className="game-column pt-3 sm:pt-5 pb-28 sm:pb-32 md:pb-12 flex flex-col gap-3.5 sm:gap-4 md:gap-5">
```

Change it to:

```tsx
<div className="game-column flex flex-col gap-4 pt-3 pb-28 sm:pt-5 sm:pb-32 md:pb-12">
```

Replace the file's four-line header comment with:

```tsx
// app/(game)/profile/page.tsx
// The "Me" page, built to Figma VCnH1k8cwo2dWaLjL7YRVS node 8:2: the jungle
// backdrop /scan and /quests share, a wood-sign player banner, three parchment
// stat cards beside the house pennant, a badge strip, and an activity feed.
// This file owns the session check, the queries and the derived values; every
// visual block lives in components/profile/.
```

- [ ] **Step 2: Check the tour anchors survived**

Run: `grep -n 'data-tour' "app/(game)/profile/page.tsx" components/profile/*.tsx`
Expected: exactly four matches — `profile-header` (in `PlayerBanner.tsx`), `profile-stats` (in `page.tsx`), `profile-achievements` (in `page.tsx`), `profile-activity` (in `ActivityLog.tsx`). Any missing anchor silently breaks that step of the `PageIntro` tour.

- [ ] **Step 3: Check nothing dead was left behind**

Run: `grep -n 'instagramHref\|getPointsColor\|OUTLINE_GOLD\|LEVEL_TITLES' "app/(game)/profile/page.tsx"`
Expected: only `LEVEL_TITLES` and its `levelTitle` helper remain. The other three were deleted in Tasks 2–4; a hit on any of them means a leftover.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Compare against the frame**

Open `/profile` at 390px width and compare top to bottom with the Figma frame:

1. Wood sign, gold-framed avatar, tan welcome line, yellow name, level line with right-aligned xp, XP bar.
2. Three parchment cards left, pennant right, pennant coming to a point.
3. Medal + `Achievements` + count, badge strip.
4. Scroll icon + `Activity Log` + `See All ▶`, parchment rows with green/red deltas.
5. Navbar and BottomNav unchanged.

Then widen to 1280px. The `.game-column` caps at 800px, so everything should stay centred with no horizontal scrollbar and no stretched pennant.

Finally, clear `localStorage` key `nso-intro-seen:profile` and reload: all four tour steps should spotlight a real element rather than falling back to a full-screen tooltip.

- [ ] **Step 6: Commit**

```bash
git add "app/(game)/profile/page.tsx"
git commit -m "feat(profile): finish the Figma redesign pass"
```

---

## Notes for the reviewer

- `student.level` (the denormalised column) is still never read — `levelProgress(student.xp)` remains the source of truth. Nothing in this plan writes XP or points, so the RPC invariant is untouched.
- No schema, auth, or API change. The single data change is `.limit(8)` → `.limit(30)` on the profile's own `ScanLog` read.
- `app/(game)/quests/page.tsx` has uncommitted work in the tree and is deliberately not touched. Its private `SliceBg` helper stays where it is.
