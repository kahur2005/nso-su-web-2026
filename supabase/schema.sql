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
  "funFact"       text not null,
  "points"        integer not null default 10,
  "qrToken"       text unique,
  "qrCode"        text,
  "avatarUrl"     text,
  "isActive"      boolean not null default true,
  "scanCount"     integer not null default 0,
  "createdAt"     timestamptz not null default now()
);

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

create table "Quest" (
  "id"          text primary key default gen_random_uuid()::text,
  "title"       text not null,
  "description" text not null,
  "type"        text not null,
  "points"      integer not null,
  "isActive"    boolean not null default false,
  "isHidden"    boolean not null default false,
  "deadline"    timestamptz,
  "createdAt"   timestamptz not null default now()
);

create table "QuestProgress" (
  "id"          text primary key default gen_random_uuid()::text,
  "studentId"   text not null references "Student"("id") on delete cascade,
  "questId"     text not null references "Quest"("id") on delete cascade,
  "status"      text not null default 'pending',
  "completedAt" timestamptz,
  unique ("studentId", "questId")
);

create table "Achievement" (
  "id"          text primary key default gen_random_uuid()::text,
  "name"        text not null,
  "description" text not null,
  "icon"        text not null,
  "condition"   text not null
);

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
