-- Per-student claim for /secret-between-me-and-you.
--
-- WHY THIS SHAPE:
--
-- * One row per student (unique "studentId") is the "already claimed" flag.
--   First POST inserts; later GETs just check existence. No multi-row race that
--   needs an RPC — a unique violation on a double-click is treated as success.
--
-- * "studentId" is TEXT FK to "Student"."id" (uuid-as-text), matching every
--   other student-scoped table in this project.
--
-- * RLS on, no policies: the app only touches this via the service-role client.

CREATE TABLE IF NOT EXISTS "SecretClaim" (
  "id"        TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "studentId" TEXT NOT NULL UNIQUE REFERENCES "Student"("id") ON DELETE CASCADE,
  "claimedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "SecretClaim" ENABLE ROW LEVEL SECURITY;
