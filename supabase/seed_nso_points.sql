-- ============================================================================
-- NSO 2026 — Points System Seed
-- Based on the official scoring rules provided by the committee.
-- Run AFTER schema.sql and AFTER seed_committee_and_quests.sql.
-- ----------------------------------------------------------------------------
-- This file:
--   1. Updates NPC scan points to 1 pt each (per the fun-fact rules).
--   2. Truncates placeholder quests and inserts all activities as Quest rows.
--   3. Inserts Achievement definitions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix NPC (fun fact) scan points: 1 point per fun fact collected
-- ---------------------------------------------------------------------------
UPDATE "NPC"
SET "points" = 1
WHERE "isActive" = true;

-- ---------------------------------------------------------------------------
-- 2. Quests — one row per scorable activity
-- ---------------------------------------------------------------------------
-- Wipe placeholder quests from the dev seed (safe: nuking old data)
DELETE FROM "QuestProgress";
DELETE FROM "Quest";

INSERT INTO "Quest" ("id", "title", "description", "points", "isActive", "type", "createdAt")
VALUES

-- ── Technical Meet: Main Sessions (admin-awarded, QR at each station) ───────
(gen_random_uuid()::text,
 'Opening Ceremony',
 'Attend the Remarks & Opening session on Day 1.',
 5, true, 'qr', now()),

(gen_random_uuid()::text,
 'Campus Tour',
 'Complete the campus tour on Day 1.',
 5, true, 'qr', now()),

(gen_random_uuid()::text,
 'Academic Integrity Session',
 'Attend the Academic Integrity session on Day 2.',
 5, true, 'qr', now()),

(gen_random_uuid()::text,
 'Campus Services Session',
 'Attend the Campus Services session on Day 3.',
 5, true, 'qr', now()),

(gen_random_uuid()::text,
 '7 Tips for Student Success',
 'Attend the 7 Tips for Student Success talk on Day 3.',
 5, true, 'qr', now()),

(gen_random_uuid()::text,
 'SAA, Student Organization & BEM SU Session',
 'Attend the student organization briefing on Day 4.',
 5, true, 'qr', now()),

-- ── Scavenger Hunt ───────────────────────────────────────────────────────────
-- Placement prizes are admin-awarded to the house group, not individual QRs.
-- Completion badge IS individual (scan QR at finish line).
(gen_random_uuid()::text,
 'Scavenger Hunt — Completed',
 'You completed the Scavenger Hunt! Placement bonus is awarded separately to your house.',
 5, true, 'qr', now()),

-- ── UKM Fair ─────────────────────────────────────────────────────────────────
-- Each UKM visited = 2 pts. Generate one quest per UKM (or use admin manual award).
-- Using a single repeatable "Visit a UKM" quest is simplest for now;
-- swap for per-UKM QRs when you know all UKM names.
(gen_random_uuid()::text,
 'UKM Fair — Visit a UKM Booth',
 'Scan the QR at a UKM booth during the UKM Fair on Day 4. Repeatable per booth.',
 2, true, 'qr', now()),

(gen_random_uuid()::text,
 'UKM Fair — Group Session Bonus',
 'Join a UKM session with at least 3 members from your house.',
 3, true, 'qr', now()),

-- ── Booth Fest ───────────────────────────────────────────────────────────────
-- Best Booth is a group award — admin will manually adjust group points.
-- Individual attendance award:
(gen_random_uuid()::text,
 'Booth Fest — Attend',
 'Attend the Booth Fest on Day 5.',
 5, true, 'qr', now()),

-- ── Games & Bingo ─────────────────────────────────────────────────────────────
(gen_random_uuid()::text,
 'Bingo — Completed',
 'Complete a full bingo card during the Games Session.',
 5, true, 'qr', now()),

(gen_random_uuid()::text,
 'Games Session — Participate',
 'Participate in any Games Session activity.',
 3, true, 'qr', now()),

-- ── Kahoot ───────────────────────────────────────────────────────────────────
-- Placements are admin-awarded per session; these are the prize values.
-- Create one quest per Kahoot session when running the event.
(gen_random_uuid()::text,
 'Kahoot — Top 3 Finish',
 'Finish in the top 3 of a Kahoot session. Awarded by admin.',
 5, true, 'qr', now()),

-- ── Q&A ──────────────────────────────────────────────────────────────────────
(gen_random_uuid()::text,
 'Q&A — First 3 Questions',
 'Be one of the first 3 people to ask a question in any session. Awarded by admin.',
 5, true, 'qr', now()),

-- ── Easter Eggs ──────────────────────────────────────────────────────────────
(gen_random_uuid()::text,
 'Easter Egg Found!',
 'You found a hidden Easter Egg QR code. Good eyes!',
 5, true, 'qr', now()),

-- ── Guidebook ────────────────────────────────────────────────────────────────
(gen_random_uuid()::text,
 'Read the NSO Guidebook',
 'Scan the QR code inside your NSO 2026 Guidebook.',
 5, true, 'qr', now());


-- ---------------------------------------------------------------------------
-- 3. Achievements — milestones displayed on the Profile page
-- ---------------------------------------------------------------------------
DELETE FROM "StudentAchievement";
DELETE FROM "Achievement";

INSERT INTO "Achievement" ("id", "name", "description", "imageUrl", "createdAt")
VALUES

-- Fun fact milestones
(gen_random_uuid()::text,
 'First Contact',
 'Scan your first committee member and collect a fun fact.',
 null, now()),

(gen_random_uuid()::text,
 'Social Butterfly',
 'Collect 10 committee fun facts.',
 null, now()),

(gen_random_uuid()::text,
 'Encyclopedia',
 'Collect ALL committee fun facts. +1 bonus point!',
 null, now()),

-- Points milestones
(gen_random_uuid()::text,
 'Getting Started',
 'Earn your first 10 points.',
 null, now()),

(gen_random_uuid()::text,
 'Rising Star',
 'Earn 50 points total.',
 null, now()),

(gen_random_uuid()::text,
 'Legend of NSO',
 'Earn 100 points total.',
 null, now()),

-- Quest milestones
(gen_random_uuid()::text,
 'Quest Beginner',
 'Complete your first quest.',
 null, now()),

(gen_random_uuid()::text,
 'Quest Veteran',
 'Complete 5 quests.',
 null, now()),

-- Easter egg
(gen_random_uuid()::text,
 'Egg Hunter',
 'Found a hidden Easter Egg!',
 null, now()),

-- Bingo
(gen_random_uuid()::text,
 'Bingo Champion',
 'Completed a Bingo card.',
 null, now());


-- ---------------------------------------------------------------------------
-- 4. Scavenger Hunt group placement — insert as admin-only Quest records
--    (actual award requires your admin panel to adjust group totalPoints)
-- ---------------------------------------------------------------------------
-- These are reference values; the admin tool will use them to award bonuses.
-- They are NOT inserted as scannable quests; they're manual admin adjustments.
--
-- House 1st: +20 pts  (admin adjusts Group.totalPoints + each member's points)
-- House 2nd: +15 pts
-- House 3rd: +10 pts

-- ---------------------------------------------------------------------------
-- Done. Run in Supabase SQL Editor > New query > paste > Run.
-- ---------------------------------------------------------------------------
