-- ============================================================================
-- NSO 2026 — Milestone Achievements (20 & 49 Fun Facts)
-- ----------------------------------------------------------------------------
-- Run this in Supabase SQL Editor to seed the two milestone badges and
-- backfill them for any players who already collected >= 20 or >= 49 fun facts.
-- ============================================================================

-- 1. Insert/update the milestone achievement definitions
INSERT INTO "Achievement" ("id", "name", "description", "imageUrl")
VALUES
  (
    'achv-funfact-20',
    'Social Butterfly',
    'Collected 20 fun facts from committee members!',
    'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/users.svg'
  ),
  (
    'achv-funfact-49',
    'Master Networker',
    'Collected 49 fun facts from committee members!',
    'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/award.svg'
  )
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "imageUrl" = EXCLUDED."imageUrl";

-- 2. Backfill: Award 'Social Butterfly' (20 fun facts) to all eligible students
INSERT INTO "StudentAchievement" ("studentId", "achievementId", "unlockedAt")
SELECT
  s."id" AS "studentId",
  'achv-funfact-20' AS "achievementId",
  NOW() AS "unlockedAt"
FROM "Student" s
WHERE (
  SELECT COUNT(*) FROM "ScanLog" sl WHERE sl."studentId" = s."id"
) >= 20
ON CONFLICT ("studentId", "achievementId") DO NOTHING;

-- 3. Backfill: Award 'Master Networker' (49 fun facts) to all eligible students
INSERT INTO "StudentAchievement" ("studentId", "achievementId", "unlockedAt")
SELECT
  s."id" AS "studentId",
  'achv-funfact-49' AS "achievementId",
  NOW() AS "unlockedAt"
FROM "Student" s
WHERE (
  SELECT COUNT(*) FROM "ScanLog" sl WHERE sl."studentId" = s."id"
) >= 49
ON CONFLICT ("studentId", "achievementId") DO NOTHING;
