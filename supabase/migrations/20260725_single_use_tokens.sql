-- Add SingleUseToken table to track consumed 1-time QR nonces / link tokens
CREATE TABLE IF NOT EXISTS "SingleUseToken" (
  "jti"       TEXT PRIMARY KEY,
  "usedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "scannedBy" TEXT REFERENCES "Student"("id") ON DELETE SET NULL
);

ALTER TABLE "SingleUseToken" ENABLE ROW LEVEL SECURITY;
