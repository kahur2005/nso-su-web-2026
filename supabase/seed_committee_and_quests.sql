-- ============================================================================
-- NSO 2026 — Committee NPC & Quest Seed Template
-- ----------------------------------------------------------------------------
-- Run this in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- This script populates sample committee members across all 6 divisions,
-- as well as sample quests and linked achievement badges.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Committee Members (NPCs)
-- ----------------------------------------------------------------------------
INSERT INTO "NPC" ("id", "committeeName", "role", "division", "instagram", "funFact", "points", "avatarUrl", "isActive")
VALUES
  -- SC (Steering Committee)
  (gen_random_uuid()::text, 'Jessica Tan', 'Project Leader', 'SC', 'jessicatan_su', 'Speaks 4 languages fluently and can solve a Rubiks cube in under 30 seconds!', 3, null, true),
  (gen_random_uuid()::text, 'Budi Santoso', 'Vice Project Leader', 'SC', 'budisantoso_nso', 'Has attended every single SU orientation since 2022!', 3, null, true),

  -- BPH (Badan Pengurus Harian)
  (gen_random_uuid()::text, 'Amanda Putri', 'Secretary General', 'BPH', 'amanda_p', 'Obsessed with pixel art games and coded her first site at age 12.', 3, null, true),
  (gen_random_uuid()::text, 'Daniel Wijaya', 'Treasurer', 'BPH', 'danielw_su', 'Can calculate budget splits in his head faster than Excel!', 3, null, true),

  -- ACAD (Academics & Events)
  (gen_random_uuid()::text, 'Clara Lee', 'Event Coordinator', 'ACAD', 'claralee_event', 'Has hosted over 50 campus stage shows and concerts.', 3, null, true),
  (gen_random_uuid()::text, 'Kevin Pratama', 'Academic Mentor Lead', 'ACAD', 'kevinp_acad', 'Won 1st place in the national science olympiad in high school.', 3, null, true),

  -- SPONSOR (Sponsorship & Partnership)
  (gen_random_uuid()::text, 'Rian Hidayat', 'Head of Sponsorship', 'SPONSOR', 'rian_sponsorship', 'Secured 15 major brand partners for NSO 2026 in just two weeks!', 3, null, true),
  (gen_random_uuid()::text, 'Siti Rahma', 'Partner Liaison', 'SPONSOR', 'siti_partner', 'Loves coffee and has tried over 100 different specialty beans.', 3, null, true),

  -- DOCS (Documentation & Design)
  (gen_random_uuid()::text, 'Maya Kusuma', 'Creative Lead', 'DOCS', 'maya_docs', 'Designed the pixel UI theme and banners for NSO 2026!', 3, null, true),
  (gen_random_uuid()::text, 'Fikri Haikal', 'Head Photographer', 'DOCS', 'fikri_photos', 'Never goes anywhere without his vintage film camera.', 3, null, true),

  -- LOG (Logistics & Operations)
  (gen_random_uuid()::text, 'Alex Chen', 'Head of Logistics', 'LOG', 'alexchen_su', 'Has drunk 5 cups of matcha every single day of orientation planning!', 3, null, true),
  (gen_random_uuid()::text, 'Nadia Utami', 'Venue Coordinator', 'LOG', 'nadia_logistics', 'Knows every secret shortcut and hidden room across the entire campus.', 3, null, true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Achievements (Badges for Quests)
-- ----------------------------------------------------------------------------
INSERT INTO "Achievement" ("id", "name", "description", "imageUrl")
VALUES
  ('achv-welcome-hero', 'Orientation Pioneer', 'Unlocked by completing the NSO 2026 Welcome Quest!', 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/award.svg'),
  ('achv-campus-explorer', 'Campus Navigator', 'Unlocked by locating and scanning all main campus landmark spots.', 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/map-pin.svg'),
  ('achv-social-butterfly', 'Social Butterfly', 'Unlocked by scanning 5 committee members from different divisions.', 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/users.svg')
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "imageUrl" = EXCLUDED."imageUrl";

-- ----------------------------------------------------------------------------
-- 3. Quests (Missions)
-- ----------------------------------------------------------------------------
INSERT INTO "Quest" ("id", "title", "description", "points", "isActive", "achievementId")
VALUES
  ('quest-welcome-01', 'Welcome to NSO 2026', 'Locate the main orientation welcome banner at the Main Hall and scan the QR code.', 20, true, 'achv-welcome-hero'),
  ('quest-explorer-01', 'Campus Landmarks Quest', 'Find the secret emblem hidden in the central plaza and scan it to claim your reward.', 30, true, 'achv-campus-explorer'),
  ('quest-social-01', 'Meet the Committee', 'Find and scan 5 committee members from 5 different divisions to earn points!', 25, true, 'achv-social-butterfly')
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "points" = EXCLUDED."points",
  "isActive" = EXCLUDED."isActive",
  "achievementId" = EXCLUDED."achievementId";
