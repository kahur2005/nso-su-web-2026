-- ============================================================================
-- NSO 2026 — DB Migrations for Blockers & Gaps
-- Run these in the Supabase SQL Editor in the order listed.
-- Each section is idempotent (safe to re-run).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Blocker 2: Time-gated Quests
-- Add availableFrom / availableUntil to Quest.
-- Quests without these fields remain permanently available (existing behaviour).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Quest"
  ADD COLUMN IF NOT EXISTS "availableFrom"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "availableUntil" TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- Blocker 3: Gender field on Student
-- 'M' | 'F' | 'other' | NULL (not provided / prefer not to say)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "gender" TEXT
  CHECK ("gender" IN ('M', 'F', 'other'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Blocker 4: Fix complete_quest — add Group.totalPoints update
-- The original function never updated the group total when a quest was
-- completed. Redefine it to mirror what scan_npc already does.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_quest(
  p_student_id TEXT,   -- Student.id (internal)
  p_quest_id   TEXT
)
RETURNS JSONB
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_quest       "Quest"%ROWTYPE;
  v_achievement "Achievement"%ROWTYPE;
  v_group_id    TEXT;
BEGIN
  -- Duplicate guard
  IF EXISTS (
    SELECT 1 FROM "QuestProgress"
    WHERE "studentId" = p_student_id AND "questId" = p_quest_id
  ) THEN
    RETURN JSONB_BUILD_OBJECT(
      'success', false,
      'alreadyCompleted', true,
      'error', 'You already completed this quest!'
    );
  END IF;

  SELECT * INTO v_quest FROM "Quest" WHERE "id" = p_quest_id;
  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('success', false, 'error', 'Invalid QR Code!');
  END IF;
  IF v_quest."isDeleted" OR NOT v_quest."isActive" THEN
    RETURN JSONB_BUILD_OBJECT('success', false, 'error', 'This quest is not active.');
  END IF;

  -- Record completion
  INSERT INTO "QuestProgress" ("studentId", "questId", "status", "completedAt")
    VALUES (p_student_id, p_quest_id, 'completed', NOW());

  -- Award points to student AND sync group total (was missing before)
  UPDATE "Student"
    SET "points" = "points" + v_quest."points",
        "xp"     = "xp"     + v_quest."points"
    WHERE "id" = p_student_id
    RETURNING "groupId" INTO v_group_id;

  -- ← NEW: keep Group.totalPoints in sync
  IF v_group_id IS NOT NULL THEN
    UPDATE "Group"
      SET "totalPoints" = "totalPoints" + v_quest."points"
      WHERE "id" = v_group_id;
  END IF;

  -- Achievement unlock
  IF v_quest."achievementId" IS NOT NULL THEN
    INSERT INTO "StudentAchievement" ("studentId", "achievementId")
      VALUES (p_student_id, v_quest."achievementId")
      ON CONFLICT ("studentId", "achievementId") DO NOTHING;

    SELECT * INTO v_achievement
      FROM "Achievement" WHERE "id" = v_quest."achievementId";
  END IF;

  RETURN JSONB_BUILD_OBJECT(
    'success', true,
    'questTitle', v_quest."title",
    'questDescription', v_quest."description",
    'pointsAwarded', v_quest."points",
    'achievement', CASE
      WHEN v_achievement."id" IS NULL THEN NULL
      ELSE JSONB_BUILD_OBJECT(
        'name', v_achievement."name",
        'description', v_achievement."description",
        'imageUrl', v_achievement."imageUrl"
      )
    END
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Gap 2: NPC maxScans — auto-deactivate after N students scan
-- NPC.scanCount already exists. Add maxScans (NULL = unlimited).
-- The auto-deactivate logic runs in lib/scan/npc.ts after the scan_npc RPC.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "NPC"
  ADD COLUMN IF NOT EXISTS "maxScans" INTEGER;  -- NULL = unlimited

-- ─────────────────────────────────────────────────────────────────────────────
-- Gap 3: Role tier on Student
-- 'student' | 'gl' (group leader) | 'committee' | 'admin'
-- Existing isAdmin=true rows should be backfilled to role='admin'.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'student'
  CHECK ("role" IN ('student', 'gl', 'committee', 'admin'));

-- Back-fill existing admins
UPDATE "Student" SET "role" = 'admin' WHERE "isAdmin" = TRUE AND "role" = 'student';

-- ─────────────────────────────────────────────────────────────────────────────
-- Blocker 4 (bonus): one-time Group totalPoints resync
-- Recalculates every group's total from actual member points in case any
-- previous quest completions left totals stale.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Group" g
  SET "totalPoints" = (
    SELECT COALESCE(SUM(s."points"), 0)
    FROM "Student" s
    WHERE s."groupId" = g."id"
  );
