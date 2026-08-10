# Quest Types (Submission + Quiz) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new quest types — multi-file **submission** (admin-approved) and **multiple-choice quiz** (per-question points, retries) — while keeping existing QR quests as type `qr`.

**Architecture:** Revive `Quest.type` (`qr` | `submission` | `quiz`) with child tables for questions/options, submissions/files, and answers. Students start submission/quiz from `/quests` only (no QR). Points go through `adjust_points`; QR path stays `complete_quest` but rejects non-`qr` types. Admin quests gain a Lunch-style tab strip plus `/admin/quests/submissions`.

**Tech Stack:** Next.js 16.2.11 App Router (React 19.2.4), Tailwind CSS 4, Supabase (`@supabase/supabase-js` service role), next-auth v4, existing `lib/storage.ts` + `adjust_points` RPC.

**Spec:** `docs/superpowers/specs/2026-08-10-quest-types-submission-quiz-design.md`

## Global Constraints

- **No test framework.** Every task verifies with `npm run build` (redirect to a log; confirm `✓ Compiled successfully` and `Finished TypeScript`). Do not add a test runner. Do not use `npm run lint` (broken).
- **Never run `npm run build` while `npm run dev` is running** — they share `.next` and corrupt the cache. Stop dev first if needed; ask before killing the user's process.
- **Never import `@/lib/supabase` from a client component** — service-role key.
- **Never bare-`.update()` student `xp`/`points`** — use `adjust_points` (or `complete_quest` for QR only).
- **Quiz `isCorrect` never leaves the server** on GET; grading trusts option ids only.
- **Admin UI** = slate/ERP (`AdminShell`). **Student UI** = pixel/`font-bytebounce`/`game-column`.
- **Migrations are hand-applied** in the Supabase SQL Editor. Do not run DDL against production from the agent unless the human explicitly asks.
- Consult `node_modules/next/dist/docs/01-app/` before new Next.js APIs.

## File map

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20260810_quest_types_submission_quiz.sql` | Tables, indexes, backfill `Quest.type` |
| `lib/quests.ts` | Pure types, labels, window helpers (client-safe) |
| `lib/quests-data.ts` | Server-only helpers: load quest for student, assert active+window |
| `lib/storage.ts` | `quest-submissions` policy + `uploadQuestFile` (image resize / PDF passthrough) |
| `app/admin/quests/actions.ts` | Extend create/update; question CRUD; approve/reject |
| `components/admin/QuestForm.tsx` | Type picker + type-specific fields |
| `components/admin/QuestQuestionEditor.tsx` | Quiz question builder (client) |
| `app/admin/quests/QuestTabs.tsx` | Quests \| Submissions tabs |
| `app/admin/quests/page.tsx` | Wire tabs + type column; pass type into form |
| `app/admin/quests/submissions/page.tsx` | Approval queue |
| `app/api/quests/route.ts` | Include `type`, richer status for board |
| `app/api/quests/[id]/submit/route.ts` | Multi-file submission upload |
| `app/api/quests/[id]/quiz/route.ts` | GET questions (no keys) + POST answers |
| `app/(game)/quests/page.tsx` | Type badges, status, open detail |
| `components/quests/SubmissionPanel.tsx` | Student multi-file upload UI |
| `components/quests/QuizPanel.tsx` | Student quiz + retry UI |
| `lib/scan/quest.ts` | Reject scans when `type !== 'qr'` |

---

### Task 1: Migration — schema for typed quests

**Files:**
- Create: `supabase/migrations/20260810_quest_types_submission_quiz.sql`
- Modify (optional intent sync): `supabase/schema.sql` — only if you are already editing it; live path is the migration file.

**Interfaces:**
- Consumes: existing `"Quest"`, `"QuestProgress"`, `"Student"`.
- Produces: tables `"QuestQuestion"`, `"QuestQuestionOption"`, `"QuestSubmission"`, `"QuestSubmissionFile"`, `"QuestAnswer"`; `Quest.type` backfilled to `'qr'`.

- [ ] **Step 1: Write the migration file**

```sql
-- 20260810_quest_types_submission_quiz.sql
-- Typed quests: qr (existing), submission (multi-file + admin approve), quiz (MCQ).
-- Hand-apply in Supabase SQL Editor. Idempotent where practical.

-- Discriminator. Retired nullable "type" is revived with a closed set of values.
update "Quest" set "type" = 'qr' where "type" is null or "type" = '';
alter table "Quest" alter column "type" set default 'qr';
-- App always sends type on insert; default covers legacy insert paths.

create table if not exists "QuestQuestion" (
  "id"        text primary key default gen_random_uuid()::text,
  "questId"   text not null references "Quest"("id") on delete cascade,
  "prompt"    text not null,
  "points"    integer not null check ("points" > 0),
  "sortOrder" integer not null default 0
);
create index if not exists "QuestQuestion_questId_idx" on "QuestQuestion" ("questId");

create table if not exists "QuestQuestionOption" (
  "id"         text primary key default gen_random_uuid()::text,
  "questionId" text not null references "QuestQuestion"("id") on delete cascade,
  "label"      text not null,
  "isCorrect"  boolean not null default false,
  "sortOrder"  integer not null default 0
);
create index if not exists "QuestQuestionOption_questionId_idx"
  on "QuestQuestionOption" ("questionId");
-- At most one correct option per question (partial unique).
create unique index if not exists "QuestQuestionOption_one_correct"
  on "QuestQuestionOption" ("questionId") where "isCorrect" = true;

create table if not exists "QuestSubmission" (
  "id"         text primary key default gen_random_uuid()::text,
  "studentId"  text not null references "Student"("id") on delete cascade,
  "questId"    text not null references "Quest"("id") on delete cascade,
  "status"     text not null check ("status" in ('awaiting_approval', 'approved', 'rejected')),
  "createdAt"  timestamptz not null default now(),
  "reviewedAt" timestamptz,
  "reviewedBy" text
);
create index if not exists "QuestSubmission_questId_idx" on "QuestSubmission" ("questId");
create index if not exists "QuestSubmission_status_idx" on "QuestSubmission" ("status");
-- One in-flight submission per student+quest.
create unique index if not exists "QuestSubmission_one_pending"
  on "QuestSubmission" ("studentId", "questId")
  where "status" = 'awaiting_approval';

create table if not exists "QuestSubmissionFile" (
  "id"           text primary key default gen_random_uuid()::text,
  "submissionId" text not null references "QuestSubmission"("id") on delete cascade,
  "fileUrl"      text not null,
  "fileName"     text not null,
  "mimeType"     text not null,
  "sortOrder"    integer not null default 0
);
create index if not exists "QuestSubmissionFile_submissionId_idx"
  on "QuestSubmissionFile" ("submissionId");

create table if not exists "QuestAnswer" (
  "id"            text primary key default gen_random_uuid()::text,
  "studentId"     text not null references "Student"("id") on delete cascade,
  "questionId"    text not null references "QuestQuestion"("id") on delete cascade,
  "optionId"      text not null references "QuestQuestionOption"("id"),
  "isCorrect"     boolean not null,
  "awardedPoints" integer not null default 0,
  "answeredAt"    timestamptz not null default now(),
  unique ("studentId", "questionId")
);
create index if not exists "QuestAnswer_questionId_idx" on "QuestAnswer" ("questionId");

alter table "QuestQuestion"          enable row level security;
alter table "QuestQuestionOption"    enable row level security;
alter table "QuestSubmission"        enable row level security;
alter table "QuestSubmissionFile"    enable row level security;
alter table "QuestAnswer"            enable row level security;
```

- [ ] **Step 2: Tell the human to apply it**

Do **not** run this against production from the agent. Paste into Supabase SQL Editor and confirm success. Note in the task report whether it was applied.

- [ ] **Step 3: Commit the migration file only**

```bash
git add supabase/migrations/20260810_quest_types_submission_quiz.sql
git commit -m "feat(quests): add migration for submission and quiz quest types"
```

---

### Task 2: Shared quest helpers + storage upload for submissions

**Files:**
- Create: `lib/quests.ts`
- Create: `lib/quests-data.ts`
- Modify: `lib/storage.ts`

**Interfaces:**
- Consumes: nothing from Task 1 at runtime beyond table names.
- Produces:
  - `export type QuestType = 'qr' | 'submission' | 'quiz'`
  - `export const QUEST_TYPE_LABEL: Record<QuestType, string>`
  - `export function isQuestType(v: string): v is QuestType`
  - `export function questWindowState(availableFrom, availableUntil, now = new Date()): { isLocked: boolean; isExpired: boolean }`
  - `export async function uploadQuestFile(file: File): Promise<{ url: string; fileName: string; mimeType: string } | null>` in `lib/storage.ts`
  - `assertQuestOpenForStudent(quest)` in `lib/quests-data.ts` — throws/returns error if deleted, inactive, locked, or expired

- [ ] **Step 1: Add `lib/quests.ts` (client-safe)**

```ts
// lib/quests.ts
export type QuestType = 'qr' | 'submission' | 'quiz'

export const QUEST_TYPE_LABEL: Record<QuestType, string> = {
  qr: 'QR',
  submission: 'Submit',
  quiz: 'Quiz',
}

export function isQuestType(v: unknown): v is QuestType {
  return v === 'qr' || v === 'submission' || v === 'quiz'
}

export function questWindowState(
  availableFrom: string | null | undefined,
  availableUntil: string | null | undefined,
  now = new Date(),
) {
  const from = availableFrom ? new Date(availableFrom) : null
  const until = availableUntil ? new Date(availableUntil) : null
  return {
    isLocked: !!(from && now < from),
    isExpired: !!(until && now > until),
  }
}
```

- [ ] **Step 2: Extend `lib/storage.ts`**

Add to `BUCKET_POLICY`:

```ts
'quest-submissions': { maxEdge: 1600, quality: 85 }, // readable photos; PDF bypasses sharp
```

Add:

```ts
const QUEST_FILE_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
])

/** Images go through shrink/WebP; PDFs are stored as-is. */
export async function uploadQuestFile(
  file: File,
): Promise<{ url: string; fileName: string; mimeType: string } | null> {
  if (!file || file.size === 0) return null
  const mime = file.type || 'application/octet-stream'
  if (!QUEST_FILE_MIME.has(mime)) return null

  const bucket = 'quest-submissions'
  await supabase.storage.createBucket(bucket, { public: true })

  const original = Buffer.from(await file.arrayBuffer())
  const isPdf = mime === 'application/pdf'
  const policy = BUCKET_POLICY[bucket] ?? DEFAULT_POLICY
  const resized =
    isPdf || policy === 'passthrough'
      ? null
      : await shrink(original, policy as { maxEdge: number; quality: number })

  const body = resized ?? original
  const ext = isPdf ? 'pdf' : resized ? 'webp' : (file.name.split('.').pop() || 'png').toLowerCase()
  const contentType = isPdf ? 'application/pdf' : resized ? 'image/webp' : mime
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: false, cacheControl: CACHE_CONTROL })
  if (error) {
    console.error(`Upload to ${bucket} failed:`, error)
    return null
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, fileName: file.name, mimeType: contentType }
}
```

- [ ] **Step 3: Add `lib/quests-data.ts` (server-only)**

Load a quest by id; return `{ ok: false, error, status }` if missing/`isDeleted`/`!isActive`/locked/expired; else `{ ok: true, quest }`. Use `questWindowState` from `lib/quests.ts`. Do **not** import this from client components.

- [ ] **Step 4: Build**

```powershell
npm run build > build.log 2>&1; echo EXIT:$LASTEXITCODE
```

Expected: `EXIT:0`, log contains `✓ Compiled successfully` and `Finished TypeScript`.

- [ ] **Step 5: Commit**

```bash
git add lib/quests.ts lib/quests-data.ts lib/storage.ts
git commit -m "feat(quests): shared types and quest-submissions upload helper"
```

---

### Task 3: Admin create/update with `type` + quiz question CRUD

**Files:**
- Modify: `app/admin/quests/actions.ts`
- Modify: `components/admin/QuestForm.tsx`
- Create: `components/admin/QuestQuestionEditor.tsx`
- Modify: `app/admin/quests/page.tsx` (select `type`; show type in table)

**Interfaces:**
- Consumes: `QuestType`, `isQuestType` from `lib/quests.ts`.
- Produces:
  - `createQuest` reads `type` (default `qr`); sets `points` from form for qr/submission; for quiz inserts with `points: 0` then questions bump sum.
  - `updateQuest` never changes `type`; for quiz ignores client `points` and keeps denormalized sum.
  - `saveQuestQuestions(questId, questionsJson)` — replaces question set **only if** no `QuestAnswer` rows exist for any question of that quest; otherwise returns error string.
  - `QuestQuestionEditor` props: `{ questId: string; initial: QuestionDraft[]; frozen: boolean }`

- [ ] **Step 1: Extend `createQuest` / `updateQuest`**

In `createQuest`, after parsing title/description:

```ts
const typeRaw = String(formData.get('type') || 'qr')
const type = isQuestType(typeRaw) ? typeRaw : 'qr'
// ...
const points =
  type === 'quiz'
    ? 0
    : parseInt(String(formData.get('points') || '0'), 10)
if (type !== 'quiz' && (!Number.isFinite(points) || points <= 0)) return

const payload: any = {
  title,
  description,
  points,
  type,
  achievementId: achievementIdOrNull(formData),
  isActive: false,
}
```

In `updateQuest`: load existing row’s `type`; do not write `type`. If `type === 'quiz'`, omit `points` from the update payload (sum owned by question saver).

- [ ] **Step 2: Add `saveQuestQuestions` action**

Accept `FormData` with `questId` + `questions` JSON:

```ts
type Draft = {
  prompt: string
  points: number
  options: { label: string; isCorrect: boolean }[]
}
```

Rules:
1. Quest must exist, `type === 'quiz'`, not deleted.
2. If any `QuestAnswer` joins through this quest’s questions → return `{ error: 'Questions are frozen after students answer.' }`.
3. Else delete existing `QuestQuestion` rows for quest (options cascade), insert new questions/options, set `Quest.points` to sum of question points.
4. `revalidatePath('/admin/quests'); revalidatePath('/quests')`.

- [ ] **Step 3: Update `QuestForm`**

- On create: `<select name="type">` with qr / submission / quiz.
- Hide points input when type is quiz (show “Points = sum of questions”).
- Hide QR-oriented help text for non-qr.
- On edit: show type as read-only badge; if quiz, render `<QuestQuestionEditor />` below the form (load questions in the server page and pass as props).

- [ ] **Step 4: Build `QuestQuestionEditor`**

Client component: list of questions, each with prompt, points, 2+ option rows, radio/checkbox for exactly one correct. Submit calls `saveQuestQuestions`. If `frozen`, disable inputs and show explanation.

- [ ] **Step 5: Admin list shows Type column**

Select `type` in `page.tsx` query; add a Type cell (`QR` / `Submit` / `Quiz`). Only show `QuestQrButton` when `type === 'qr'`.

- [ ] **Step 6: Build + commit**

```bash
git add app/admin/quests/actions.ts components/admin/QuestForm.tsx components/admin/QuestQuestionEditor.tsx app/admin/quests/page.tsx
git commit -m "feat(admin): create typed quests and quiz question editor"
```

---

### Task 4: Admin submissions queue (approve / reject)

**Files:**
- Create: `app/admin/quests/QuestTabs.tsx` (copy LunchTabs pattern; exact href match)
- Modify: `app/admin/quests/page.tsx` — render `<QuestTabs />` at top
- Create: `app/admin/quests/submissions/page.tsx`
- Modify: `app/admin/quests/actions.ts` — `approveQuestSubmission`, `rejectQuestSubmission`
- Do **not** add a second `ADMIN_NAV` entry (prefix collision with `/admin/quests`).

**Interfaces:**
- Consumes: `QuestSubmission` + files; `adjust_points` RPC.
- Produces: approve sets submission `approved`, progress `completed` + `completedAt`, awards `Quest.points` once, inserts `StudentAchievement` if linked; reject sets `rejected`.

- [ ] **Step 1: `QuestTabs.tsx`**

```tsx
const TABS = [
  { href: '/admin/quests', label: 'Quests' },
  { href: '/admin/quests/submissions', label: 'Submissions' },
]
// isActive = pathname === tab.href  (exact, like LunchTabs)
```

- [ ] **Step 2: `approveQuestSubmission(formData)`**

```ts
// Pseudocode — implement with real supabase calls + error checks
const id = String(formData.get('id') || '')
const session = await requireAdminSession() // need admin's student id for reviewedBy

const { data: sub } = await supabase
  .from('QuestSubmission')
  .select('*, quest:Quest(id, points, type, isActive, isDeleted, achievementId)')
  .eq('id', id)
  .maybeSingle()

if (!sub || sub.status !== 'awaiting_approval') return
if (sub.quest.type !== 'submission' || sub.quest.isDeleted || !sub.quest.isActive) return

const { data: updated } = await supabase
  .from('QuestSubmission')
  .update({
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: session.user.id,
  })
  .eq('id', id)
  .eq('status', 'awaiting_approval')
  .select('id')
  .maybeSingle()
if (!updated) return // lost race — idempotent

await supabase.from('QuestProgress').upsert(
  {
    studentId: sub.studentId,
    questId: sub.questId,
    status: 'completed',
    completedAt: new Date().toISOString(),
  },
  { onConflict: 'studentId,questId' },
)

await supabase.rpc('adjust_points', {
  p_student_id: sub.studentId,
  p_amount: sub.quest.points,
})

if (sub.quest.achievementId) {
  await supabase.from('StudentAchievement').upsert(
    { studentId: sub.studentId, achievementId: sub.quest.achievementId },
    { onConflict: 'studentId,achievementId' },
  )
}
revalidatePath('/admin/quests/submissions')
revalidatePath('/quests')
```

Note: confirm `StudentAchievement` unique constraint name/columns in live schema before upsert; if upsert unsupported, insert with ignore on conflict.

- [ ] **Step 3: `rejectQuestSubmission`**

Same gate on `awaiting_approval`; set `rejected` + reviewer fields; set `QuestProgress.status` to `in_progress` (or leave as-is if you only insert progress on submit — be consistent with Task 5). No points.

- [ ] **Step 4: Submissions page**

Server component, `requireAdmin` redirect. Query submissions (default filter `awaiting_approval`) with student name/email, quest title, files. Preview: `<img>` for images, `<a target=_blank>` for PDFs. Forms calling approve/reject.

- [ ] **Step 5: Build + commit**

```bash
git commit -m "feat(admin): quest submission approval queue"
```

---

### Task 5: Student submission API + board/detail UI

**Files:**
- Create: `app/api/quests/[id]/submit/route.ts`
- Modify: `app/api/quests/route.ts`
- Modify: `app/(game)/quests/page.tsx`
- Create: `components/quests/SubmissionPanel.tsx`

**Interfaces:**
- `POST /api/quests/[id]/submit` multipart field `files` (multiple). Returns `{ submissionId, status: 'awaiting_approval' }`.
- `GET /api/quests` adds `type`, `progressStatus`, `submissionStatus` (`null` | `awaiting_approval` | `approved` | `rejected`).

- [ ] **Step 1: Submit route**

```ts
// Outline
const session = await getServerSession(authOptions)
// resolve studentDbId (copy pattern from app/api/quests/route.ts)
const questGate = await assertQuestOpenForStudent(id)
if (!questGate.ok) return NextResponse.json({ error: questGate.error }, { status: questGate.status })
if (questGate.quest.type !== 'submission') {
  return NextResponse.json({ error: 'Not a submission quest' }, { status: 400 })
}
// reject if an awaiting_approval already exists
const form = await request.formData()
const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
if (files.length === 0) return NextResponse.json({ error: 'Add at least one file' }, { status: 400 })
if (files.length > 10) return NextResponse.json({ error: 'Too many files' }, { status: 400 })

const uploaded = []
for (const file of files) {
  const result = await uploadQuestFile(file)
  if (!result) return NextResponse.json({ error: `Rejected file: ${file.name}` }, { status: 400 })
  uploaded.push(result)
}

const { data: sub, error } = await supabase.from('QuestSubmission').insert({
  studentId: studentDbId,
  questId: id,
  status: 'awaiting_approval',
}).select('id').single()
// insert QuestSubmissionFile rows; upsert QuestProgress status in_progress
```

- [ ] **Step 2: Extend list API**

Select `type` on Quest. Join latest submission per student (or fetch submissions where studentId = me and map by questId — pick latest `createdAt`). Map:

```ts
progressStatus: progress?.status ?? null, // from QuestProgress — extend select beyond completedAt
submissionStatus: latestSub?.status ?? null,
isCompleted: progress?.status === 'completed',
```

Extend progress query: `.select('questId, status, completedAt')`.

- [ ] **Step 3: Board UI**

Show type badge. CTA:
- `qr` + incomplete + !locked → keep scan link to `/scan`
- `submission` → open panel / expand row
- `quiz` → open quiz panel (Task 6 can stub “coming” if splitting — prefer wiring shell now)

`SubmissionPanel`: multi `input type=file accept="image/jpeg,image/png,image/webp,application/pdf" multiple`, POST FormData, show waiting/rejected/approved states.

- [ ] **Step 4: Build + commit**

```bash
git commit -m "feat(quests): student multi-file submission flow"
```

---

### Task 6: Quiz API + student quiz UI

**Files:**
- Create: `app/api/quests/[id]/quiz/route.ts`
- Create: `components/quests/QuizPanel.tsx`
- Modify: `app/(game)/quests/page.tsx` — mount QuizPanel
- Modify: `app/api/quests/route.ts` — optional `quizCorrectCount` / `quizTotal` for badge (no answer leak)

**Interfaces:**
- `GET` → `{ questions: { id, prompt, points, options: { id, label }[], locked: boolean, selectedOptionId: string | null }[], earnedPoints, totalPoints, isPerfect }`
- `POST` body `{ answers: { questionId, optionId }[] }` — must include every non-locked question (or all questions on first attempt). Returns same shape as GET plus `awardedThisSubmit`.

- [ ] **Step 1: GET handler**

Load quest (`type === 'quiz'`, active, window). Load questions/options **without** selecting `isCorrect` for the response (you may select it server-side only to compute `locked` from existing `QuestAnswer`). For each question with `QuestAnswer.isCorrect === true`, set `locked: true` and include `selectedOptionId`. Wrong answers: `locked: false`, still show prior selection optionally.

- [ ] **Step 2: POST handler**

1. Gate quest open + type quiz.
2. Parse answers; for each question id belonging to quest:
   - If existing answer `isCorrect` → skip (ignore client).
   - Else load option; verify `option.questionId === questionId`; set `isCorrect` from DB option.
   - `awardedPoints = isCorrect ? question.points : 0`
   - Upsert `QuestAnswer`.
3. Sum `awardedPoints` for rows that **newly** became correct this request (compare previous `isCorrect`).
4. If sum > 0 → `adjust_points`.
5. Upsert `QuestProgress` to `completed` on first finish (`completedAt` now if insert).
6. If every question for quest has correct answer and quest has `achievementId` → upsert `StudentAchievement`.
7. Return refreshed GET payload + `awardedThisSubmit`.

- [ ] **Step 3: `QuizPanel`**

Client: fetch GET on open; radio per unlocked question; submit POST; show points earned; locked questions disabled with checkmark; allow retry when `!isPerfect`.

- [ ] **Step 4: Build + commit**

```bash
git commit -m "feat(quests): multiple-choice quiz attempt and retry flow"
```

---

### Task 7: Harden QR scan + admin guide note

**Files:**
- Modify: `lib/scan/quest.ts` — select `type`; if `type` present and `!== 'qr'`, return 400 `'This quest is not completed by scanning.'`
- Modify: `app/admin/guide/page.tsx` (or whichever static guide documents quests) — short section on three types + Submissions tab
- Modify: `docs/superpowers/specs/2026-08-10-quest-types-submission-quiz-design.md` status → `approved, implemented` only after all tasks done (final step)

- [ ] **Step 1: Guard in `completeQuestScan`**

```ts
.select('isActive, isDeleted, qrToken, type')
// ...
if (quest.type && quest.type !== 'qr') {
  return {
    body: { success: false, error: 'This quest is not completed by scanning.' },
    status: 400,
  }
}
```

(Treat null `type` as `qr` for unmigrated rows.)

- [ ] **Step 2: Guide blurb**

Document: create typed quest; quiz questions; submissions approval tab; students use `/quests` for submit/quiz.

- [ ] **Step 3: Full build**

```powershell
npm run build > build.log 2>&1; echo EXIT:$LASTEXITCODE
```

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(quests): block QR completion for submission and quiz types"
```

---

## Spec coverage checklist

| Spec item | Task |
| --- | --- |
| `Quest.type` + backfill | 1 |
| Child tables + RLS | 1 |
| Multi-file Storage bucket | 2, 5 |
| Admin type picker / lock type | 3 |
| Quiz question builder + freeze | 3 |
| `/admin/quests/submissions` approve/reject | 4 |
| Student submit from `/quests` | 5 |
| Quiz partial credit + retry + achievement at 100% | 6 |
| Server-side window enforce | 2 (`assertQuestOpen`), 5, 6 |
| QR unchanged but typed | 3, 7 |
| No `isCorrect` on client GET | 6 |

## Out of scope (do not implement)

Text submissions, timed quizzes, per-file approve, changing type after create, QR gate for submit/quiz, draft mid-quiz, new ADMIN_NAV rail entry for submissions.
