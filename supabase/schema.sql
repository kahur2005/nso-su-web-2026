-- ============================================================================
-- NSO 2026 — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. It recreates the same tables/columns Prisma used (quoted, case-sensitive
-- names) so the application code keeps the exact object shapes it had before,
-- plus two atomic RPC functions that replace the old prisma.$transaction calls.
--
-- Safe to re-run: it drops and recreates everything. THIS WIPES DATA.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto (already enabled on Supabase, but be safe)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Drop (child tables first because of foreign keys)
-- ---------------------------------------------------------------------------
drop table if exists "StudentAchievement" cascade;
drop table if exists "QuestProgress" cascade;
drop table if exists "ScanLog" cascade;
drop table if exists "Achievement" cascade;
drop table if exists "Quest" cascade;
drop table if exists "Announcement" cascade;
drop table if exists "Club" cascade;
drop table if exists "NPC" cascade;
drop table if exists "Student" cascade;
drop table if exists "Group" cascade;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table "Group" (
  "id"          text primary key default gen_random_uuid()::text,
  "name"        text not null unique,
  "emblem"      text not null,
  "emblemUrl"   text,
  "color"       text not null,
  "totalPoints" integer not null default 0,
  "createdAt"   timestamptz not null default now()
);

create table "Student" (
  "id"                text primary key default gen_random_uuid()::text,
  "studentId"         text not null unique,
  "name"              text not null,
  "email"             text not null unique,
  "faculty"           text,
  "major"             text,
  "year"              text,
  "points"            integer not null default 0,
  "level"             integer not null default 1,
  "xp"                integer not null default 0,
  "funFactsCollected" integer not null default 0,
  "groupId"           text references "Group"("id") on delete set null,
  "isAdmin"           boolean not null default false,
  "hasSeenIntro"      boolean not null default false,
  "avatarUrl"         text,
  "avatarEyes"        text,
  "avatarBrows"       text,
  "instagram"         text,
  "medicalNote"       text,
  "password"          text,
  "pastAchievements"  text,
  "hobby"             text,
  "createdAt"         timestamptz not null default now(),
  "updatedAt"         timestamptz not null default now()
);
create index "Student_groupId_idx" on "Student" ("groupId");

create table "NPC" (
  "id"            text primary key default gen_random_uuid()::text,
  "committeeName" text not null,
  "role"          text not null,
  "division"      text,
  "instagram"     text,
  "funFact"       text not null,
  "points"        integer not null default 10,
  "qrToken"       text unique,
  "qrCode"        text,
  "avatarUrl"     text,
  "isActive"      boolean not null default true,
  "scanCount"     integer not null default 0,
  "createdAt"     timestamptz not null default now()
);
create index "NPC_division_idx" on "NPC" ("division");

create table "ScanLog" (
  "id"            text primary key default gen_random_uuid()::text,
  "studentId"     text not null references "Student"("id") on delete cascade,
  "npcId"         text not null references "NPC"("id") on delete cascade,
  "pointsAwarded" integer not null,
  "scannedAt"     timestamptz not null default now(),
  unique ("studentId", "npcId")
);
create index "ScanLog_studentId_idx" on "ScanLog" ("studentId");

-- Audit trail for admin-side manual point corrections (app/admin/points).
-- Always attributed to the NPC the adjustment is standing in for (e.g. a
-- failed QR scan, an on-the-ground bonus) plus a free-text reason.
create table "PointAdjustment" (
  "id"        text primary key default gen_random_uuid()::text,
  "studentId" text not null references "Student"("id") on delete cascade,
  "npcId"     text not null references "NPC"("id") on delete set null,
  "amount"    integer not null,
  "reason"    text not null,
  "createdAt" timestamptz not null default now()
);
create index "PointAdjustment_studentId_idx" on "PointAdjustment" ("studentId");

-- A quest is a mission completed by scanning its printed QR code. One code is
-- shared by every student; QuestProgress's unique (studentId, questId) is the
-- duplicate guard, exactly as ScanLog is for fun facts.
--
-- "type"/"isHidden"/"deadline" are retired: every quest is QR-completed now.
-- They are kept nullable rather than dropped so the change stays reversible.
create table "Quest" (
  "id"            text primary key default gen_random_uuid()::text,
  "title"         text not null,
  "description"   text not null,
  "points"        integer not null,
  "isActive"      boolean not null default false,
  "isDeleted"     boolean not null default false,  -- soft delete, keeps history
  "qrToken"       text,                            -- current token; older prints are refused
  "qrCode"        text,                            -- data-URL PNG
  -- FK added after "Achievement" is created, further down.
  "achievementId" text,
  "createdAt"     timestamptz not null default now(),
  "type"          text,        -- retired
  "isHidden"      boolean not null default false,  -- retired
  "deadline"      timestamptz  -- retired
);
create index "Quest_achievementId_idx" on "Quest" ("achievementId");

create table "QuestProgress" (
  "id"          text primary key default gen_random_uuid()::text,
  "studentId"   text not null references "Student"("id") on delete cascade,
  "questId"     text not null references "Quest"("id") on delete cascade,
  "status"      text not null default 'pending',
  "completedAt" timestamptz,
  unique ("studentId", "questId")
);

-- A badge. Only ever unlocked by completing a Quest whose achievementId points
-- here, so an achievement no quest references cannot be earned.
-- "icon"/"condition" are retired in favour of "imageUrl" (uploaded art).
create table "Achievement" (
  "id"          text primary key default gen_random_uuid()::text,
  "name"        text not null,
  "description" text not null,
  "imageUrl"    text,
  "createdAt"   timestamptz not null default now(),
  "icon"        text,      -- retired
  "condition"   text       -- retired
);

-- Declared here rather than inline on "Quest" because that table is created
-- first. `on delete set null` so deleting a badge never cascades away the
-- quests that granted it — they simply stop granting anything.
alter table "Quest"
  add constraint "Quest_achievementId_fkey"
  foreign key ("achievementId") references "Achievement"("id") on delete set null;

create table "StudentAchievement" (
  "id"            text primary key default gen_random_uuid()::text,
  "studentId"     text not null references "Student"("id") on delete cascade,
  "achievementId" text not null references "Achievement"("id") on delete cascade,
  "unlockedAt"    timestamptz not null default now(),
  unique ("studentId", "achievementId")
);

create table "Announcement" (
  "id"        text primary key default gen_random_uuid()::text,
  "title"     text not null,
  "content"   text not null,
  "isActive"  boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table "Club" (
  "id"          text primary key default gen_random_uuid()::text,
  "name"        text not null,
  "category"    text not null,
  "description" text not null,
  "images"      text[] not null default '{}',
  "instagram"   text,
  "registrationUrl" text,
  "memberCount" integer not null default 0,
  "established" text,
  "iconUrl"     text,
  "contactInfo" text
);

-- ---------------------------------------------------------------------------
-- Keep Student."updatedAt" fresh (Prisma's @updatedAt did this in the app)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create trigger "Student_set_updated_at"
  before update on "Student"
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Progressive level from total XP. The step to the next level doubles each
-- time (10, 20, 40, 80, ...), so reaching level L costs 10*(2^(L-1)-1) XP.
-- Keep this in sync with lib/leveling.ts.
--
-- ⚠️ DRIFT (verified 2026-07-21): this function does NOT exist in the live
-- database, and the live scan_npc / adjust_points do not call it — they omit
-- the "level" write the definitions below show. Nothing in the app reads
-- Student."level" (every screen derives it from xp via levelProgress()), so
-- the column is stale in production and complete_quest deliberately does not
-- write it either. Run this file on a fresh database and you get the "level"
-- maintenance the live project never had.
-- ---------------------------------------------------------------------------
create or replace function level_from_xp(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
begin
  if p_xp is null or p_xp < 10 then
    return 1;
  end if;
  -- threshold to reach level (v_level+1) is 10*(2^v_level - 1)
  while p_xp >= 10 * (power(2, v_level)::integer - 1) loop
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: scan_npc — atomic replacement for the qr/scan transaction.
-- Records the scan and awards points to student / group / npc in one shot.
-- Returns a JSON payload matching the old /api/qr/scan response.
-- ---------------------------------------------------------------------------
create or replace function scan_npc(
  p_student_id text,   -- Student.id (internal), not the public studentId
  p_npc_id     text,
  p_points     integer
)
returns jsonb
language plpgsql
as $$
declare
  v_group_id text;
  v_npc      "NPC"%rowtype;
begin
  -- duplicate guard (mirrors the ScanLog unique constraint)
  if exists (
    select 1 from "ScanLog"
    where "studentId" = p_student_id and "npcId" = p_npc_id
  ) then
    return jsonb_build_object(
      'success', false,
      'alreadyCollected', true,
      'error', 'You already collected this fun fact!'
    );
  end if;

  select * into v_npc from "NPC" where "id" = p_npc_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid QR Code!');
  end if;

  insert into "ScanLog" ("studentId", "npcId", "pointsAwarded")
    values (p_student_id, p_npc_id, p_points);

  update "Student"
    set "points" = "points" + p_points,
        "xp" = "xp" + p_points,
        "level" = level_from_xp("xp" + p_points),
        "funFactsCollected" = "funFactsCollected" + 1
    where "id" = p_student_id
    returning "groupId" into v_group_id;

  if v_group_id is not null then
    update "Group" set "totalPoints" = "totalPoints" + p_points
      where "id" = v_group_id;
  end if;

  update "NPC" set "scanCount" = "scanCount" + 1 where "id" = p_npc_id;

  return jsonb_build_object(
    'success', true,
    'npcName', v_npc."committeeName",
    'npcRole', v_npc."role",
    'funFact', v_npc."funFact",
    'pointsAwarded', p_points
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: adjust_points — atomic replacement for the adminadjustPoints transaction.
-- Positive amounts also grant XP; the student's group total is kept in sync.
-- ---------------------------------------------------------------------------
create or replace function adjust_points(
  p_student_id text,   -- Student.id (internal)
  p_amount     integer
)
returns void
language plpgsql
as $$
declare
  v_group_id text;
begin
  update "Student"
    set "points" = "points" + p_amount,
        "xp" = "xp" + (case when p_amount > 0 then p_amount else 0 end),
        "level" = level_from_xp("xp" + (case when p_amount > 0 then p_amount else 0 end))
    where "id" = p_student_id
    returning "groupId" into v_group_id;

  if v_group_id is not null then
    update "Group" set "totalPoints" = "totalPoints" + p_amount
      where "id" = v_group_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- RPC: complete_quest — the quest counterpart of scan_npc.
--
-- Points come from the Quest row, never from the caller or the QR's JWT: a code
-- printed before the points were edited must not keep paying the old amount.
--
-- Does NOT touch "Group"."totalPoints" (every surface sums member points
-- instead) or "Student"."level" (nothing reads it; see the drift note above).
-- ---------------------------------------------------------------------------
create or replace function complete_quest(
  p_student_id text,   -- Student.id (internal)
  p_quest_id   text
)
returns jsonb
language plpgsql
as $$
declare
  v_quest       "Quest"%rowtype;
  v_achievement "Achievement"%rowtype;
begin
  if exists (
    select 1 from "QuestProgress"
    where "studentId" = p_student_id and "questId" = p_quest_id
  ) then
    return jsonb_build_object(
      'success', false,
      'alreadyCompleted', true,
      'error', 'You already completed this quest!'
    );
  end if;

  select * into v_quest from "Quest" where "id" = p_quest_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid QR Code!');
  end if;
  if v_quest."isDeleted" or not v_quest."isActive" then
    return jsonb_build_object('success', false, 'error', 'This quest is not active.');
  end if;

  insert into "QuestProgress" ("studentId", "questId", "status", "completedAt")
    values (p_student_id, p_quest_id, 'completed', now());

  update "Student"
    set "points" = "points" + v_quest."points",
        "xp"     = "xp" + v_quest."points"
    where "id" = p_student_id;

  if v_quest."achievementId" is not null then
    insert into "StudentAchievement" ("studentId", "achievementId")
      values (p_student_id, v_quest."achievementId")
      on conflict ("studentId", "achievementId") do nothing;

    select * into v_achievement
      from "Achievement" where "id" = v_quest."achievementId";
  end if;

  return jsonb_build_object(
    'success', true,
    'questTitle', v_quest."title",
    'questDescription', v_quest."description",
    'pointsAwarded', v_quest."points",
    'achievement', case
      when v_achievement."id" is null then null
      else jsonb_build_object(
        'name', v_achievement."name",
        'description', v_achievement."description",
        'imageUrl', v_achievement."imageUrl"
      )
    end
  );
end;
$$;

-- Row Level Security: lock every table to the anon/public role. The app only
-- ever connects with the service_role key (see lib/supabase.ts), which bypasses
-- RLS, so this is pure defense-in-depth — no policies are needed.
-- ---------------------------------------------------------------------------
alter table "Group"              enable row level security;
alter table "Student"            enable row level security;
alter table "NPC"                enable row level security;
alter table "ScanLog"            enable row level security;
alter table "Quest"              enable row level security;
alter table "QuestProgress"      enable row level security;
alter table "Achievement"        enable row level security;
alter table "StudentAchievement" enable row level security;
alter table "Announcement"       enable row level security;
alter table "Club"               enable row level security;

-- ---------------------------------------------------------------------------
-- Seed: the 15 canonical NSO 2026 groups.
-- Logos are extracted from public/images/group/group-logo.svg by
-- scripts/extract-group-logos.mjs and served as static files.
-- ---------------------------------------------------------------------------

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
