# QR Quests & Achievements — design

**Date:** 2026-07-21
**Status:** approved, in implementation

## Problem

Fun facts work: a committee member carries a QR, a student scans it, points land and
the fact unlocks in their codex. We want the same mechanic for **quests** — missions
that are not tied to a person. Scanning a quest QR awards points, marks the quest
complete in the student's library, and may unlock an **achievement**.

## Decisions

| Question | Decision |
| --- | --- |
| Relationship to the existing `Quest` table | Every quest is QR-completed. `type` / `deadline` / `isHidden` retired. |
| Achievement "logo" | Uploaded image via `lib/storage.ts` `uploadImage()`, same path as clubs. |
| Deleting a quest | Soft delete (`isDeleted`), distinct from deactivate (`isActive`). |
| Quest visibility before completion | Fully visible — `/quests` is a mission board, not a codex. |
| Scan integration | One endpoint. `/api/qr/scan` verifies the JWT, then dispatches. |
| Quest QR expiry | 120 days (not the NPC path's 7). |
| Admin onboarding | Rewritten to cover every admin tab, not just quest upload. |

Existing data at design time: `Quest` 2 rows (test), `QuestProgress` 0,
`Achievement` 0, `StudentAchievement` 0. Nothing to migrate.

## Schema

Additive only. The columns the design retires (`Quest.type`, `deadline`,
`isHidden`, `Achievement.icon`, `condition`) are **made nullable rather than
dropped** — dropping is the one irreversible step in this change and it buys
nothing. They can be dropped later once the feature has settled.

```sql
alter table "Quest"
  add column "qrToken" text,
  add column "qrCode" text,
  add column "achievementId" text references "Achievement"("id") on delete set null,
  add column "isDeleted" boolean not null default false;
alter table "Quest" alter column "type" drop not null;

alter table "Achievement"
  add column "imageUrl" text,
  add column "createdAt" timestamptz not null default now();
alter table "Achievement" alter column "icon" drop not null;
alter table "Achievement" alter column "condition" drop not null;
```

`achievementId` is nullable — a quest that grants nothing is the common case.
`on delete set null` so deleting an achievement never cascades away quests.

`QuestProgress` and `StudentAchievement` are unchanged: their `unique`
constraints are already the duplicate guards, exactly as `ScanLog` is for scans.

## `complete_quest` RPC

One atomic call, mirroring `scan_npc`:

1. Reject if a `QuestProgress` row already exists (duplicate scan).
2. Load the quest; reject if missing, `isDeleted`, or not `isActive`.
3. Insert `QuestProgress` (`status = 'completed'`).
4. Add the quest's points to the student's `points` and `xp`, recompute `level`.
5. If `achievementId` is set, insert `StudentAchievement` (`on conflict do nothing`).
6. Return the payload the scan UI renders.

**Points are read from the Quest row inside the function, never from the JWT.**
A code printed before an edit would otherwise pay the old amount forever.

It deliberately does **not** touch `Group.totalPoints`. Every surface derives
group totals from member points now; a second writer to a column nothing reads
would revive the desync bug fixed on 2026-07-21.

## Scan flow

- `POST /api/quests/qr` (admin) — signs `{ kind: 'quest', questId }` with
  `QR_SECRET_KEY`, renders a QR pointing at `/scan?token=…`, stores
  `qrToken` + `qrCode` on the quest.
- `POST /api/qr/scan` — verifies the JWT once, then dispatches on its claims:
  `questId` present → `lib/scan/quest.ts`, otherwise → `lib/scan/npc.ts`.

Dispatching on `questId` rather than requiring `kind` keeps every fun-fact QR
already in the wild working: those tokens predate the discriminator.

`lib/scan/quest.ts` repeats all three guards the NPC path uses — exists, active,
and `qrToken === token` so a regenerated code supersedes the old printout. The
RPC does not check these itself, so the dispatcher is the only gate.

## Admin

Two new `ADMIN_NAV` entries: **Quests**, **Achievements**.

- `/admin/quests` — rebuilt in the `AdminShell` style the rest of the panel uses
  (it currently renders dark pixel styling via the orphaned `AdminHeader`).
  List with points, linked achievement, completion count, active toggle, QR
  generate/print, edit, soft delete. Create/edit form: title, description,
  points, optional achievement.
- `/admin/achievements` — new. Name, description, image upload.
- `/admin/quests/onboarding` — rewritten as an onboarding guide covering **every**
  admin tab and what it is for.

Server actions co-located per area (`app/admin/quests/actions.ts`,
`app/admin/achievements/actions.ts`) rather than growing `app/admin/actions.ts`.
Each starts with `requireAdmin()` and ends with `revalidatePath(...)`.

## Student

- `/quests` — mission board. Every active, non-deleted quest with name,
  description, points and the badge it grants; completed ones stamped.
- `/profile` — the hardcoded emoji array (matched unlocked badges by *name
  string*) is replaced by a real read of `Achievement` + `StudentAchievement`,
  rendering locked/unlocked with the uploaded art.
- `/scan` — gains a quest result variant; its success UI is NPC-shaped today
  (`npcName` / `role` / `funFact`).

## Risks

- The migration runs against **production** — there is no staging project.
  Mitigated by keeping it additive.
- An achievement with no quest linked to it is unobtainable. Admin should say so.
- `Quest.title` is kept (not renamed to `name`): it is referenced by the
  leaderboard feed and the quests API, and the rename buys nothing.
- The leaderboard feed maps `questType` from the retired `Quest.type` for its
  icon; it needs a single quest icon instead.
