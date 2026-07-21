# Group Logos & Canonical Group Seeding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the 15 group logos embedded in `public/images/group/group-logo.svg` into individual PNGs, and replace the 3 ad-hoc `Group` rows with the 15 canonical NSO 2026 groups wired to those logos.

**Architecture:** `group-logo.svg` is not vector art — it is a 84×1427 strip of 15 `<rect>`s filled with `<pattern>`s, each `<use>`-ing an `<image>` that holds a base64 PNG (1600×1600). A Node script parses the SVG, sorts rects by effective Y, maps them to the supplied name order, and writes `public/images/group/<slug>.png`. A SQL migration then wipes `Group` and reseeds 15 rows whose `emblemUrl` is the static path `/images/group/<slug>.png`, which `GroupEmblem.tsx` already renders without modification.

**Tech Stack:** Node 20 (built-in `fs`/`Buffer`, no new dependencies), Supabase Postgres 17, Next.js 16.2.9 App Router.

## Global Constraints

- **No test framework is configured in this repo.** There is no `npm test`. Verification in every task is by: running the script and asserting its output, `npm run build`, and SQL `select` assertions. Do **not** add Jest/Vitest as part of this plan.
- `npm run lint` **already fails** on a clean checkout (~44 errors / 17 warnings). A non-zero exit is not a regression signal. Compare counts before/after; do not fix unrelated lint errors.
- Supabase table and column names are **quoted PascalCase/camelCase**. Always quote them in raw SQL: `"Group"`, `"emblemUrl"`, `"totalPoints"`.
- There is **one** Supabase project (`ndezlikvpsjmbvuptlfc`) and **no staging environment**. Every SQL statement in this plan hits production data.
- The canonical group order, top-to-bottom in the strip, is exactly:
  `Siren, Unicorn, Griffin, Sphinx, Wyvern, Faerie, Nymph, Minotaur, Pegasus, Kraken, Kitsune, Phoenix, Harpy, Chimera, Fenrir`
- Slugs are the lowercase name (`Siren` → `siren`). No spaces or special characters occur in any of the 15 names.

## ⚠️ Destructive-operation notice

Task 2 **deletes every row in `Group`**. Confirmed consequences, verified against the live DB on 2026-07-20:

- 3 existing rows are destroyed: `minotaur`, `Pegasus` (10 points), `Wyvern`.
- `Student.groupId` is `on delete set null`, so **all 10 students become ungrouped**. No students are deleted.
- `Pegasus`'s `totalPoints = 10` is lost. Individual `Student.points`/`xp` are **not** touched, so no student loses progress.
- The 3 previously uploaded emblems remain orphaned in the `group-emblems` Storage bucket. They are not deleted by this plan.

This was explicitly chosen over preserving the rows. Task 2 Step 1 takes a recoverable dump first.

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/extract-group-logos.mjs` (create) | One-shot, re-runnable extractor: SVG → 15 PNGs + printed manifest |
| `public/images/group/<slug>.png` (create ×15) | The extracted logos, served statically by Next |
| `public/images/group/group-logo.svg` (keep) | Source of truth, retained so extraction can be re-run |
| `supabase/schema.sql` (modify) | Add the canonical 15-group seed so a rebuilt DB matches production |
| `app/admin/actions.ts` (modify) | Delete `createGroup` + `uploadEmblem` |
| `app/admin/groups/page.tsx` (modify) | Delete the create-group form |

`scripts/` does not exist yet; Task 1 creates it. It is for one-shot maintenance scripts, not application code — nothing in `app/` may import from it.

---

### Task 1: Extract the 15 logos from the SVG

**Files:**
- Create: `scripts/extract-group-logos.mjs`
- Create: `public/images/group/{siren,unicorn,griffin,sphinx,wyvern,faerie,nymph,minotaur,pegasus,kraken,kitsune,phoenix,harpy,chimera,fenrir}.png`

**Interfaces:**
- Consumes: nothing.
- Produces: 15 files at `public/images/group/<slug>.png`. Task 2 hardcodes these paths into `Group.emblemUrl`.

**Why this is not a trivial loop:** the `<rect>`s are **not** in visual order. Sorted by Y, the pattern indices run `0,1,2,11,3,4,5,6,7,8,9,10,12,13,14` — the 12th rect in the file sits 4th from the top (y=292). Reading the file in document order mislabels 12 of the 15 logos. The script must sort by Y.

Six rects also carry `transform="matrix(-1 0 0 1 e f)"`, a horizontal flip, and for those the Y value is the **6th** matrix component, not a `y=` attribute. The flip is a display transform in the strip; the script extracts the unmirrored source PNG. That is a deliberate, cosmetic-only deviation — see "Known deviation" at the end of this task.

- [ ] **Step 1: Write the extraction script**

Create `scripts/extract-group-logos.mjs`:

```js
// Extracts the 15 group logos embedded in public/images/group/group-logo.svg.
//
// The file is not vector art: it is 15 <rect>s filled with <pattern>s, each of
// which <use>s an <image> holding a base64 PNG. Critically the <rect>s are NOT
// in visual order -- the 12th rect in the file sits 4th from the top. We sort by
// effective Y so the strip reads top-to-bottom, which is the order the names
// were supplied in.
//
// Usage: node scripts/extract-group-logos.mjs
// Safe to re-run; overwrites its own output.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SVG = 'public/images/group/group-logo.svg'
const OUT = 'public/images/group'

// Top-to-bottom order of the strip, as supplied by the design owner.
const NAMES = [
  'Siren', 'Unicorn', 'Griffin', 'Sphinx', 'Wyvern',
  'Faerie', 'Nymph', 'Minotaur', 'Pegasus', 'Kraken',
  'Kitsune', 'Phoenix', 'Harpy', 'Chimera', 'Fenrir',
]

const svg = readFileSync(SVG, 'utf8')

// 1. Collect rects with their effective Y. Two forms appear:
//    y="390", and transform="matrix(-1 0 0 1 57 781)" where Y is component 6.
const rects = []
for (const m of svg.matchAll(/<rect\b([^>]*)\/>/g)) {
  const attrs = m[1]
  const fill = /fill="url\(#(pattern\d+_[\d_]+)\)"/.exec(attrs)
  if (!fill) continue

  const yAttr = /\by="([\d.]+)"/.exec(attrs)
  const matrix = /transform="matrix\(([^)]+)\)"/.exec(attrs)
  let y = yAttr ? parseFloat(yAttr[1]) : 0
  if (matrix) {
    const parts = matrix[1].trim().split(/[\s,]+/).map(Number)
    y = parts[5] // f component of matrix(a b c d e f)
  }
  rects.push({ patternId: fill[1], y })
}

if (rects.length !== NAMES.length) {
  throw new Error(`Expected ${NAMES.length} rects, found ${rects.length}`)
}

rects.sort((a, b) => a.y - b.y)

// 2. pattern id -> image id
const patternToImage = new Map()
for (const m of svg.matchAll(
  /<pattern id="(pattern\d+_[\d_]+)"[^>]*>\s*<use xlink:href="#(image\d+_[\d_]+)"/g
)) {
  patternToImage.set(m[1], m[2])
}

// 3. image id -> base64 payload
const imageToData = new Map()
for (const m of svg.matchAll(
  /<image id="(image\d+_[\d_]+)"[^>]*xlink:href="data:image\/png;base64,([^"]+)"/g
)) {
  imageToData.set(m[1], m[2])
}

mkdirSync(OUT, { recursive: true })

const manifest = []
rects.forEach((rect, i) => {
  const name = NAMES[i]
  const imageId = patternToImage.get(rect.patternId)
  if (!imageId) throw new Error(`No image for ${rect.patternId}`)
  const b64 = imageToData.get(imageId)
  if (!b64) throw new Error(`No data for ${imageId}`)

  const slug = name.toLowerCase()
  const buf = Buffer.from(b64, 'base64')
  writeFileSync(join(OUT, `${slug}.png`), buf)
  manifest.push({ name, slug, y: rect.y, pattern: rect.patternId, bytes: buf.length })
})

console.table(manifest)
console.log(`Wrote ${manifest.length} logos to ${OUT}/`)
```

- [ ] **Step 2: Run the extractor**

Run from the repo root:

```bash
node scripts/extract-group-logos.mjs
```

Expected: a 15-row table, then `Wrote 15 logos to public/images/group/`. The `y` column must ascend `0, 97, 194, 292, 390, 489, 584, 682, 781, 880, 979, 1074, 1173, 1271, 1370`, and the `pattern` column must read `pattern0, pattern1, pattern2, pattern11, pattern3, …` — `pattern11` in **4th** position is the signal that the Y-sort worked. If `pattern11` is last, the sort silently failed; stop and fix before continuing.

- [ ] **Step 3: Assert the files exist and are valid PNGs**

```bash
ls public/images/group/*.png | wc -l
node -e "
const {readFileSync}=require('fs');
const names=['siren','unicorn','griffin','sphinx','wyvern','faerie','nymph','minotaur','pegasus','kraken','kitsune','phoenix','harpy','chimera','fenrir'];
const sig=Buffer.from([0x89,0x50,0x4e,0x47]);
for(const n of names){
  const b=readFileSync('public/images/group/'+n+'.png');
  if(!b.subarray(0,4).equals(sig)) throw new Error(n+' is not a PNG');
  if(b.length<10000) throw new Error(n+' is suspiciously small: '+b.length);
}
console.log('all 15 PNGs valid');
"
```

Expected: `15`, then `all 15 PNGs valid`.

- [ ] **Step 4: Spot-check that the art matches the labels**

Open `public/images/group/sphinx.png` and `public/images/group/siren.png` in an image viewer.

Expected: `sphinx.png` is a gold-and-blue pharaoh figure in a nemes headdress. `siren.png` is a blue mermaid. `sphinx` is the rect that was out of document order, so if it renders as a pharaoh the Y-sort is confirmed correct end-to-end. If `sphinx.png` shows anything else, the name↔position mapping is wrong — stop and re-derive it before Task 2.

Also open `chimera.png`: it is the only non-square source (2400×1600), so it will be wider than the rest. That is expected, not a bug.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-group-logos.mjs public/images/group/*.png
git commit -m "feat(groups): extract 15 group logos from combined SVG strip

The SVG is 15 base64 PNGs behind pattern fills, not vector art. Rects are
not in document order -- sort by Y so names map to the right art."
```

**Known deviation (do not fix unless asked):** six logos (`unicorn`, `griffin`, `pegasus`, `kraken`, `kitsune`, `chimera`) are drawn horizontally mirrored in the source strip via `matrix(-1 0 0 1 …)`. The extracted PNGs are unmirrored. These are symmetrical-enough creature badges and read correctly either way. Mirroring them would require an image library (`sharp`), which this plan deliberately avoids.

---

### Task 2: Reseed `Group` with the 15 canonical groups

**Files:**
- Modify: `supabase/schema.sql` (append a seed block)
- No application code changes in this task.

**Interfaces:**
- Consumes: the 15 files from Task 1, referenced as `/images/group/<slug>.png`.
- Produces: exactly 15 `Group` rows, names in canonical Capitalized form, `emblemUrl` set to a static path. Task 3 and Plan 3 read these.

- [ ] **Step 1: Dump the current rows so the delete is recoverable**

Run in the Supabase **SQL Editor** and save the output into the PR description or a scratch file:

```sql
select json_agg(g) from "Group" g;
select "studentId", "name", "groupId" from "Student" where "groupId" is not null;
```

Expected: 3 group rows (`minotaur`, `Pegasus`, `Wyvern`) and the list of students currently assigned. Keep this output — it is the only record of the assignments after Step 2.

- [ ] **Step 2: Wipe and reseed in one transaction**

Run in the Supabase SQL Editor:

```sql
begin;

delete from "Group";

insert into "Group" ("name", "emblem", "color", "emblemUrl") values
  ('Siren',    '🧜', '#1e63d0', '/images/group/siren.png'),
  ('Unicorn',  '🦄', '#b06fd6', '/images/group/unicorn.png'),
  ('Griffin',  '🦅', '#c9922b', '/images/group/griffin.png'),
  ('Sphinx',   '🏺', '#d4a017', '/images/group/sphinx.png'),
  ('Wyvern',   '🐉', '#2f8f4e', '/images/group/wyvern.png'),
  ('Faerie',   '🧚', '#e86bb0', '/images/group/faerie.png'),
  ('Nymph',    '🌿', '#4fae8b', '/images/group/nymph.png'),
  ('Minotaur', '🐂', '#a3402a', '/images/group/minotaur.png'),
  ('Pegasus',  '🐴', '#5b9bd5', '/images/group/pegasus.png'),
  ('Kraken',   '🦑', '#2b5f7a', '/images/group/kraken.png'),
  ('Kitsune',  '🦊', '#e87d2b', '/images/group/kitsune.png'),
  ('Phoenix',  '🔥', '#d63a1e', '/images/group/phoenix.png'),
  ('Harpy',    '🪶', '#8a7fbf', '/images/group/harpy.png'),
  ('Chimera',  '🦁', '#9b3b6e', '/images/group/chimera.png'),
  ('Fenrir',   '🐺', '#5a6b7d', '/images/group/fenrir.png');

commit;
```

`emblem` stays populated as the emoji fallback `GroupEmblem.tsx` uses when `emblemUrl` is absent. `totalPoints` defaults to 0.

- [ ] **Step 3: Assert the seed landed correctly**

```sql
select count(*) as n,
       count(*) filter (where "emblemUrl" like '/images/group/%') as with_logo
from "Group";

select "name", "emblemUrl" from "Group" order by "name";

select count(*) as ungrouped from "Student" where "groupId" is null;
```

Expected: `n = 15`, `with_logo = 15`; 15 alphabetically ordered rows each pointing at a distinct `/images/group/*.png`; `ungrouped = 10` (every student, as the destructive notice predicted).

- [ ] **Step 4: Mirror the seed into `supabase/schema.sql`**

Append the **exact same `insert` statement** from Step 2 (without `begin`/`commit`/`delete`) to the end of `supabase/schema.sql`, under a new heading:

```sql
-- ---------------------------------------------------------------------------
-- Seed: the 15 canonical NSO 2026 groups.
-- Logos are extracted from public/images/group/group-logo.svg by
-- scripts/extract-group-logos.mjs and served as static files.
-- ---------------------------------------------------------------------------
```

This keeps `schema.sql` a faithful rebuild of production, which it currently is not.

- [ ] **Step 5: Verify the logos render**

```bash
npm run dev
```

Visit <http://localhost:3000/leaderboard>. Expected: group entries render the new pixel logos via `GroupEmblem` rather than the 🛡️ emoji. All groups sit at 0 points, so ordering is arbitrary — that is correct post-wipe.

- [ ] **Step 6: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(groups): reseed the 15 canonical groups with extracted logos

Replaces 3 ad-hoc rows. Group.emblemUrl now holds a static /images path.
All students are unassigned by this change (Student.groupId on delete set null)."
```

---

### Task 3: Remove the create-group flow

Groups are now a fixed set of 15 seeded rows, so creating them from the admin UI is no longer meaningful and would let an operator add a 16th group with no logo.

**Files:**
- Modify: `app/admin/actions.ts` — delete `createGroup` and `uploadEmblem`
- Modify: `app/admin/groups/page.tsx` — delete the create-group form

**Interfaces:**
- Consumes: nothing.
- Produces: `assignStudentToGroup` and `unassignStudent` remain exported and unchanged. Plan 3 reuses both verbatim.

- [ ] **Step 1: Confirm nothing else imports the symbols being deleted**

```bash
grep -rn "createGroup\|uploadEmblem" app/ components/ lib/
```

Expected: hits only in `app/admin/actions.ts` (definitions) and `app/admin/groups/page.tsx` (the form's `action={createGroup}`). If any other file appears, stop and reassess — this task assumes those two call sites only.

- [ ] **Step 2: Delete `createGroup` and `uploadEmblem` from `app/admin/actions.ts`**

Remove the `EMBLEM_BUCKET` constant, the whole `uploadEmblem` function, and the whole `createGroup` function. Leave `assignStudentToGroup` and `unassignStudent` untouched. The `// --- Groups ---` section header stays, now directly above `assignStudentToGroup`.

- [ ] **Step 3: Delete the create-group form from `app/admin/groups/page.tsx`**

Remove the `<form action={createGroup}>` block and its surrounding card/heading, and drop `createGroup` from the import at the top of the file. Keep the assign-student form, the ranking table, and the member listing exactly as they are.

- [ ] **Step 4: Verify the build compiles**

```bash
npm run build
```

Expected: build succeeds. An unused-import or undefined-reference error here means Step 3 missed a reference to `createGroup`.

- [ ] **Step 5: Verify the page still works**

```bash
npm run dev
```

Visit <http://localhost:3000/admin/groups> as an admin. Expected: no "create group" form; all 15 groups listed with logos; the assign-student form still assigns a student and the row moves into that group's member list.

- [ ] **Step 6: Commit**

```bash
git add app/admin/actions.ts app/admin/groups/page.tsx
git commit -m "refactor(admin): drop create-group flow

Groups are a fixed seeded set of 15; creating ad-hoc groups would produce
logo-less entries."
```

---

## Done when

- `public/images/group/` holds 15 PNGs plus the original SVG, all committed.
- `select count(*) from "Group"` returns 15, every row with an `/images/group/*.png` `emblemUrl`.
- `supabase/schema.sql` reproduces those 15 rows on a clean rebuild.
- `/leaderboard` renders logos instead of emoji.
- `npm run build` succeeds; `npm run lint` error count is unchanged from before this plan.

## Follow-on

Students are all unassigned after Task 2. Reassigning them is an operator task via `/admin/groups`, not part of this plan. Plan 3 rebuilds that screen into the ERP panel.
