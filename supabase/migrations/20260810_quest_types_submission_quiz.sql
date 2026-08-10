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
