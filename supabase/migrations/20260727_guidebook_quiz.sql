-- 20260727_guidebook_quiz.sql
-- Guidebook chapter quizzes: two questions on the last page of each of the
-- eight chapters, worth +2 points per chapter (16 max).
--
-- One row per (student, chapter). The unique constraint IS the one-try rule —
-- same pattern as "ScanLog"'s (studentId, npcId) guard. The row is written at
-- submit time whether the answers were right or wrong, so a wrong attempt
-- permanently locks that chapter's quiz.
--
-- "claimedAt" is separate from "isCorrect" because submitting and claiming are
-- two distinct actions: submitting grades and locks, claiming awards the points
-- via the adjust_points RPC. A null "claimedAt" on a correct row means the
-- student has earned the points but not pressed Claim yet.
--
-- Apply by hand in the Supabase SQL Editor, like the other files here.

create table if not exists "GuidebookQuizAttempt" (
  "id"            text primary key default gen_random_uuid()::text,
  "studentId"     text not null references "Student"("id") on delete cascade,
  "chapterId"     text not null,
  "isCorrect"     boolean not null,
  "pointsAwarded" integer not null default 0,
  "submittedAt"   timestamptz not null default now(),
  "claimedAt"     timestamptz,
  unique ("studentId", "chapterId")
);

-- The profile activity log reads a student's whole history at once.
create index if not exists "GuidebookQuizAttempt_studentId_idx"
  on "GuidebookQuizAttempt" ("studentId");

-- Every other table in this schema has RLS on with no policies, so the anon
-- key can reach nothing and only the service-role client (server-side) can
-- read or write. Match that.
alter table "GuidebookQuizAttempt" enable row level security;
