-- AppSetting: single-row app flags (leaderboard suspense / final-day reveal)
CREATE TABLE IF NOT EXISTS "AppSetting" (
  "id" text PRIMARY KEY,
  "leaderboardSuspense" boolean NOT NULL DEFAULT false
);

INSERT INTO "AppSetting" ("id", "leaderboardSuspense")
VALUES ('default', false)
ON CONFLICT ("id") DO NOTHING;
