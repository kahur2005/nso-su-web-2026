# Quest types: submission + quiz — design

**Date:** 2026-08-10  
**Status:** approved, implemented  
**Approach:** Revive `Quest.type` + child tables (Approach 1)

## Problem

Today every quest is QR-completed: one printed code → `complete_quest` → points.
NSO needs two more mission shapes that students start from `/quests` (no QR):

1. **Submission** — upload file(s); admin approves before points.
2. **Quiz** — multiple-choice questions with per-question points; partial credit and retries.

Existing QR quests stay as a third type.

## Decisions

| Question | Decision |
| --- | --- |
| How students start submission/quiz | From `/quests` only — no QR gate |
| Submission payload | Multi-file upload: images (jpg/png/webp) + PDF |
| Submission points timing | After admin approve |
| Reject | Allowed; student may resubmit a new file set |
| File storage | Supabase Storage bucket (e.g. `quest-submissions`) via server upload helper |
| Quiz scoring | Per-question points (admin sets each); quest total = sum |
| Quiz award timing | On full-quiz finish: pay newly correct questions; reopen to retry wrongs for remaining points |
| Quiz achievement | Only when every question is correct (100%) |
| QR quests | Keep as type `'qr'` alongside `'submission'` and `'quiz'` |
| Admin review UI | New tab `/admin/quests/submissions` (quests sub-nav like lunch) |
| Type after create | Locked — cannot change `Quest.type` once created |
| Question edits after attempts | Freeze question set once any `QuestAnswer` exists |
| Mid-quiz abandon | No draft — answers persist only on full submit of an attempt |
| Window / inactive | Enforced server-side on submit and quiz APIs |

## Schema

Additive migration. Reuse nullable `Quest.type` (retired earlier) as the discriminator.

```text
Quest.type: 'qr' | 'submission' | 'quiz'
```

- Backfill existing rows: `type = 'qr'` where null.
- `Quest.points`: payout for `qr` and `submission`; for `quiz`, denormalized sum of question points (recomputed on admin question edits).
- `qrToken` / `qrCode`: only meaningful for `qr`; leave null for other types.

### New tables

**QuestQuestion**

| Column | Notes |
| --- | --- |
| id | text PK |
| questId | FK → Quest |
| prompt | text |
| points | integer > 0 |
| sortOrder | integer |

**QuestQuestionOption**

| Column | Notes |
| --- | --- |
| id | text PK |
| questionId | FK → QuestQuestion |
| label | text |
| isCorrect | boolean |
| sortOrder | integer |

Constraint (app-enforced or DB check via unique partial): exactly one `isCorrect = true` per question.

**QuestSubmission**

| Column | Notes |
| --- | --- |
| id | text PK |
| studentId | FK → Student |
| questId | FK → Quest |
| status | `awaiting_approval` \| `approved` \| `rejected` |
| createdAt / reviewedAt | timestamptz |
| reviewedBy | optional text (admin student id) |

One logical submission attempt. Reject does not delete history; student creates a **new** submission row to resubmit. At most one `awaiting_approval` per `(studentId, questId)` (unique partial index).

**QuestSubmissionFile**

| Column | Notes |
| --- | --- |
| id | text PK |
| submissionId | FK → QuestSubmission |
| fileUrl | public Storage URL |
| fileName | original name |
| mimeType | text |
| sortOrder | integer |

**QuestAnswer**

| Column | Notes |
| --- | --- |
| id | text PK |
| studentId | FK → Student |
| questionId | FK → QuestQuestion |
| optionId | FK → selected QuestQuestionOption |
| isCorrect | boolean |
| awardedPoints | integer (0 if wrong; question.points once paid) |
| answeredAt | timestamptz |

Unique `(studentId, questionId)`. Correct rows are locked; retries update only rows where `isCorrect = false` (or equivalent server rule: never reduce/`re-award` an already-correct answer).

**QuestProgress** (existing)

| Status use | Meaning |
| --- | --- |
| `in_progress` | Submission awaiting approval (or rejected awaiting resubmit — board can show “rejected”); quiz started is optional — v1 may skip until first finish |
| `completed` | QR done; submission approved; quiz finished at least once |

Achievement for quiz: grant `StudentAchievement` only when all questions for that quest have `QuestAnswer.isCorrect = true`, even if progress is already `completed`.

## Student flows

### Mission board (`/quests`)

List active quests with a type badge (`QR` / `Submit` / `Quiz`) and status. Tap opens type-specific UI. QR completion path unchanged (`/scan` → `/api/qr/scan` → `complete_quest`).

### Submission

1. Detail: description + multi-file picker (images + PDF).
2. Upload → server stores each file in `quest-submissions` → `QuestSubmission` + `QuestSubmissionFile` rows, status `awaiting_approval` → progress `in_progress`.
3. UI: waiting for approval.
4. Approve → award `Quest.points` once via points RPC (mirror `complete_quest` group/xp behaviour) → progress `completed` → achievement if linked.
5. Reject → status `rejected`; student may submit again (new submission + new files). Prior files remain in Storage for audit.

### Quiz

1. Detail: load questions + options **without** `isCorrect`.
2. Student answers all questions and submits.
3. Server grades, upserts `QuestAnswer`, awards sum of points for answers that newly become correct, sets progress `completed` on first finish.
4. Reopen: correct questions locked; wrong questions retryable; each newly correct answer awards that question’s points.
5. Achievement when 100% correct.

## Admin

### `/admin/quests`

- Create form: type picker (`qr` | `submission` | `quiz`), then type-specific fields.
- **QR:** existing form (points, QR generate, achievement, windows).
- **Submission:** title, description, points, achievement, windows — no QR.
- **Quiz:** title, description, achievement, windows; question builder (prompt, points, ≥2 options, one correct). Displayed quest points = sum of questions.
- Type locked after create.
- Sub-nav tabs: `Quests` | `Submissions` (same pattern as lunch).

### `/admin/quests/submissions`

- Queue filtered by status (default `awaiting_approval`), quest, student.
- Preview images / open PDFs for all files on the submission.
- Approve / Reject as one decision for the whole submission.
- History of reviewed rows available via status filter.

## API / actions (sketch)

| Surface | Role |
| --- | --- |
| Admin quest CRUD (+ questions) | Server actions under `app/admin/quests/` |
| Approve / reject submission | Server actions; `requireAdmin()` |
| `POST` student submission upload | Auth session; mime allowlist; multi-file; writes Storage + rows |
| `GET`/`POST` quiz attempt | Auth; return questions without keys; grade + award server-side |
| Existing QR scan | Unchanged; only `type = 'qr'` |

Points and XP always go through the existing `adjust_points` RPC (or thin wrappers that also bump `Group.totalPoints` consistently with current `complete_quest`). Do not bare-`.update()` student `xp`.

## Storage

- Bucket: `quest-submissions` (public URL pattern like other admin/student uploads).
- Images: reuse `lib/storage.ts` resize/WebP policy (or extend `BUCKET_POLICY`).
- PDF: passthrough (no sharp); preserve original bytes.
- Object names: random UUIDs; `cacheControl` long-lived.

## Security

- Never expose `isCorrect` to the client before/during answering.
- Never trust client-reported scores; server recomputes from option ids.
- Submission approve is idempotent (second approve no-ops / errors).
- Mime + size allowlist on upload.
- Inactive or outside `availableFrom`/`availableUntil`: reject mutations server-side.

## Out of scope (v1)

- Text-only submissions
- Timed quizzes / question banks
- Per-file approve/reject
- Changing quest type after create
- QR gate for submission/quiz
- Draft saves mid-quiz

## Implementation notes

- Prefer a dated file under `supabase/migrations/`; apply in SQL Editor (CLI push unused).
- Update `schema.sql` intent only if the team wants the file to stay the “rebuild from scratch” source — migrations remain the live path.
- Student UI stays in the pixel/`game-column` system; admin stays ERP/slate.
- `/api/quests` response should include `type` and enough status fields for board badges without leaking quiz answers.
