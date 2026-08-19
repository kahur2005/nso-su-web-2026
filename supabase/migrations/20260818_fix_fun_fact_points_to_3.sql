-- ============================================================================
-- Migration: Fix Fun Fact (NPC) QR Code Points to 3
-- ----------------------------------------------------------------------------
-- 1. Alter default points column value for "NPC" table to 3.
-- 2. Update all existing NPC rows to have points = 3.
-- ============================================================================

ALTER TABLE "NPC" ALTER COLUMN "points" SET DEFAULT 3;

UPDATE "NPC"
SET "points" = 3;
