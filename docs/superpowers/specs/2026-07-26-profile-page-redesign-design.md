# /profile page redesign — design

**Date:** 2026-07-26
**Figma:** file `VCnH1k8cwo2dWaLjL7YRVS`, node `8:2` — the same file the `/quests`
page was built from (node `1:2`), so its conventions carry over directly.

## Goal

Restyle `app/(game)/profile/page.tsx` to the Figma "Me" frame. The Navbar and
BottomNav are already styled and are out of scope — `PageWrapper` keeps
supplying both, untouched.

No data-layer, auth, or schema changes. This is a presentation pass plus one
query-limit bump.

## What the frame specifies

Top to bottom, on the `/images/scan/bg.png` jungle backdrop:

1. **Wood sign banner** — pixel avatar in a bright yellow frame on a dark red
   backing; to its right `WELCOME BACK, PLAYER` in tan, the player's first name
   in large gold, then `LEVEL 1 – Freshman` on the left with `1/10 xp` pushed to
   the right edge, and a thin XP bar spanning the text column beneath.
2. **Stats row** — a two-column band. Left column is three stacked parchment
   cards, each with its label on the left in two lines and a large number on the
   right: `TOTAL POINTS 333`, `QUESTS COMPLETED 33`, `FUNFACTS COLLECTED 59/59`
   (the `/59` sits below and right of the `59`). Right column is a red pennant
   banner: `HOUSE OF` at the top, mascot art in the middle, group name at the
   bottom, notched V bottom edge.
3. **Achievements** — medal icon plus a cream `Achievements` heading. The frame
   shows nothing beneath it.
4. **Activity Log** — clipboard icon, cream `Activity Log` heading, `See All ▶`
   right-aligned. Beneath it, parchment rows: bold dark-brown title
   (`Scanned Dafi`), a `💡 FunFact collected` sub-line, and the point delta on
   the right — green for `+ 10 Points`, red for `− 5 Points`.

## Resolved gaps

The frame leaves two things undefined. Both were decided with the user:

- **Achievements content** → a horizontally scrolling strip of badge
  medallions. Unlocked badges show their art in full colour; locked ones are
  dimmed with a padlock. A `unlocked/total` count sits at the right of the
  heading. Chosen over a stacked list because the frame's short gap implies a
  compact shelf, not a tall section.
- **`See All ▶`** → expands the list inline. Three rows are shown by default;
  the link reveals the rest. No new route.

## Decisions

- **The Instagram link is removed.** It is not in the frame and the user
  confirmed dropping it. `student.instagram` stays in the database and in the
  profile edit action; only the profile page's display of it goes away.
- **The 2×2 stat grid becomes three stacked cards.** The old fourth card
  ("HOUSE") is replaced by the pennant, so the house is no longer a card.
- **The pennant is tinted from `group.color`,** not hardcoded red, so each house
  reads as its own. The frame's `#bf360c` is the fallback when a group has no
  colour or the student is unassigned.

## Component breakdown

`app/(game)/profile/page.tsx` stays a server component and keeps sole
responsibility for session checks, Supabase queries, and derived values
(`levelProgress`, completed-quest count, unlocked count). The visual blocks move
to `components/profile/` so the page file stays readable and each block can be
understood on its own.

| Component | Type | Props in | Responsibility |
|---|---|---|---|
| `PlayerBanner.tsx` | server | `name`, `level`, `levelTitle`, `into`, `span`, `avatar` (ParsedAvatar) | The wood sign: avatar frame, welcome line, gold name, level line, xp counter, xp bar |
| `HouseBanner.tsx` | server | `groupName`, `groupColor`, `mascotSrc` | The pennant, including the unassigned fallback |
| `AchievementStrip.tsx` | server | `achievements` (`{id,name,imageUrl,unlocked}[]`) | The scrolling badge shelf and its empty state |
| `ActivityLog.tsx` | **client** | `logs` (plain serialisable rows) | Parchment rows, the 3-row collapse, and the `See All ▶` toggle |

`ActivityLog` is the only client component — it owns the expand/collapse state.
It receives already-shaped rows (`id`, `title`, `points`, `scannedAt`) rather
than raw Supabase records, so the client bundle carries no database shape.

Two small helpers stay in the page file because nothing else uses them:
`mascotSrc()` and `levelTitle()`.

## Assets and styling

- **Backdrop** — `/images/scan/bg.png`, already in the repo and already what the
  page uses. Unchanged.
- **Parchment** — `/images/quests/paper.png`, the torn-edge slab added during
  the quests pass, stretched with `background-size: 100% 100%` exactly as
  `QuestCard` does. Used for both the three stat cards and the activity rows.
- **Wood sign** — cropped from the Figma frame at native pixel resolution (the
  frame renders at 386px wide, which is 1× for this pixel art, so a crop is
  lossless) into `public/images/profile/board-left.png`, `board-mid.png`,
  `board-right.png`. Rendered as a 3-slice so the rounded corners and corner
  studs never stretch.
- **`SliceBg`** — the 3-slice helper currently lives as a private function
  inside `app/(game)/quests/page.tsx`, whose own comment asks that it be kept in
  step with `BottomNav`. It moves to `components/ui/SliceBg.tsx` and is imported
  by the profile components. **The quests page is not edited** — it has
  uncommitted work in the tree — so it keeps its local copy for now; the new
  shared component is documented as the one to converge on.
- **Pennant** — built in CSS, not exported: a vertical-streak
  `repeating-linear-gradient` over the group colour, a darker crossbar at the
  top, and a `clip-path` for the notched bottom. This follows the established
  convention that simple gradient shapes are rebuilt in CSS rather than
  exported, because the sprite exports from this file carry stray near-white
  edge pixels.
- **Mascot** — the existing `/images/group/<mascot>.png` art, matched by the
  current `MASCOTS` set and its `nympth` → `nymph` correction.
- **Icons** — the medal and clipboard are pixel art sitting on the forest
  background in the frame. First choice is a clean crop with the background
  knocked out into `public/images/profile/`; if the knockout is ragged, fall
  back to sized emoji, which is what the page renders today.

### Palette (sampled from the frame)

| Token | Value | Use |
|---|---|---|
| Cream heading | `#ffecb3` + `3px 3px 0 #3e2723` | `Achievements`, `Activity Log` — same as the quests page's `CREAM_HEADING` |
| Gold name | `#ffe94a` | The player's first name on the sign |
| Tan label | `#c9a882` | `WELCOME BACK, PLAYER`, `See All` |
| Cream body | `#fff3d9` | Level line on the sign |
| Parchment | `#f7edc4` | Card fill (supplied by `paper.png`) |
| Dark brown | `#3e2723` | Card labels, numbers, row titles |
| Muted brown | `#6d4c41` | Row sub-lines |
| Pennant red | `#bf360c` | Pennant fallback fill |
| Positive | `#1b8a34` | `+ N Points` |
| Negative | `#d6101d` | `− N Points` |

Type is `font-bytebounce` throughout, matching the rest of the game UI.

## Data changes

One change only: the activity query in `getProfileData` raises its `.limit(8)`
to `.limit(30)`, so `See All` has something to reveal. Everything else — the
student row, NPC count, quest progress, achievements — is already fetched.

Point deltas keep their sign logic: a row renders green with a `+` when
`pointsAwarded > 0` and red with a `−` when negative, so the design's two states
are both reachable.

## Accessibility and behaviour

- `See All` / `Show Less` is a real `<button>` with `aria-expanded`.
- The badge strip scrolls horizontally with `overflow-x-auto`; locked badges get
  a `title`/`aria-label` naming the achievement so the padlock isn't the only
  information.
- Decorative sprites (board slices, icons) are `alt=""` and `aria-hidden`.
- `data-tour` attributes are preserved on their sections
  (`profile-header`, `profile-stats`, `profile-achievements`, `profile-activity`)
  so the existing `PageIntro` tour keeps its anchors. The tour steps in
  `lib/tours.ts` are not changed.

## Out of scope

Navbar, BottomNav, `PageWrapper`, the quests page, `lib/tours.ts`, and anything
touching the database schema or auth.

## Verification

`npm run build` is the only working check in this repo (`npm run lint` is
broken for pre-existing dependency reasons). The build must pass, and the page
is then checked in the browser at mobile width against the frame.
