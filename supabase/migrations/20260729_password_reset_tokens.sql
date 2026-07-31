-- Password reset tokens for the "Forgot password?" flow on /login.
--
-- WHY THIS SHAPE:
--
-- * Only a SHA-256 hash of the token is stored ("tokenHash"), never the raw
--   value. The raw token exists in exactly one place — the email we send. A
--   leaked database snapshot therefore yields no usable reset links. The unique
--   constraint is on the hash because that is what we look tokens up by.
--
-- * "studentId" is TEXT, not UUID. "Student"."id" is text (defaulted to
--   gen_random_uuid()::text), so a uuid column here would fail to create the
--   foreign key. Match the existing casing/typing exactly.
--
-- * ON DELETE CASCADE: a deleted student's pending reset links are meaningless,
--   and we never want an orphan row that could be claimed.
--
-- * "usedAt" (nullable) is the single-use guard. Claiming a token is a single
--   conditional UPDATE ... WHERE "usedAt" IS NULL AND "expiresAt" > now(),
--   which is atomic on its own — unlike scan_npc/complete_quest there is no
--   multi-row invariant here, so this table needs no Postgres function.
--
-- * On a successful reset the app marks EVERY outstanding token for that
--   student used, so an older link still sitting in their inbox dies too.
--
-- * The same table backs the 60-second request throttle (see
--   app/api/auth/forgot-password/route.ts): "does an unused, unexpired token
--   already exist for this student?". That keeps the throttle stateless across
--   serverless cold starts without any new infrastructure, and matters because
--   the mailer is Gmail SMTP with a ~500/day cap.
--
-- RLS is enabled with no policies, matching every other table in this schema:
-- the app reaches it only through the service-role client in lib/supabase.ts.

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id"        TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "PasswordResetToken_studentId_idx"
  ON "PasswordResetToken" ("studentId");

ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
