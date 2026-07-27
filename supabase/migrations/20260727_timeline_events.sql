-- 20260727_timeline_events.sql
-- Makes the /info/timeline agenda editable from /admin/timeline.
--
-- Only the agenda rows live here. The six days themselves (TM, Day 1-5) and
-- their dates are fixed for NSO 2026, so they stay in lib/timeline.ts as code
-- rather than becoming editable data — "dayKey" is the join back to that list.
--
-- The seed reproduces exactly what was hardcoded in
-- components/dashboard/Timeline.tsx before this change, so applying the
-- migration is a no-op visually. It is guarded by a NOT EXISTS on the whole
-- table, so re-running the file cannot duplicate the agenda.

create table if not exists "TimelineEvent" (
  "id"        text primary key default gen_random_uuid()::text,
  "dayKey"    text not null,
  "time"      text not null,
  "activity"  text not null,
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create index if not exists "TimelineEvent_dayKey_sortOrder_idx"
  on "TimelineEvent" ("dayKey", "sortOrder");

-- Matches every other table: RLS on with no policies, so only the server-side
-- service-role client can read or write.
alter table "TimelineEvent" enable row level security;

insert into "TimelineEvent" ("dayKey", "time", "activity", "sortOrder")
select v."dayKey", v."time", v."activity", v."sortOrder"
from (values
  -- Technical Meeting (online) — 11 Aug 2026
  ('tm', '09:00 - 09:05', 'Opening Greetings',              1),
  ('tm', '09:05 - 09:55', 'NSO Technical Meeting',          2),
  ('tm', '09:55 - 10:15', 'Games Session',                  3),
  ('tm', '10:15 - 10:45', 'Gem Sorting Ceremony',           4),
  ('tm', '10:45 - 11:00', 'Web Explanation',                5),
  ('tm', '11:00 - 11:35', 'Gems Discussion',                6),

  -- Day 1 — 18 Aug 2026
  ('1',  '09:00 - 09:05', 'Opening Greetings',              1),
  ('1',  '09:05 - 09:55', 'NSO Technical Meeting',          2),
  ('1',  '09:55 - 10:15', 'Games Session',                  3),
  ('1',  '10:15 - 10:45', 'Gem Sorting Ceremony',           4),
  ('1',  '10:45 - 11:00', 'Web Explanation',                5),
  ('1',  '11:00 - 11:35', 'Gems Discussion',                6),
  ('1',  '09:00 - 09:05', 'Opening Greetings',              7),
  ('1',  '09:05 - 09:55', 'NSO Technical Meeting',          8),
  ('1',  '09:55 - 10:15', 'Games Session',                  9),
  ('1',  '10:15 - 10:45', 'Gem Sorting Ceremony',          10),
  ('1',  '10:45 - 11:00', 'Web Explanation',               11),

  -- Day 2 — 19 Aug 2026
  ('2',  '08:00 - 09:00', 'Morning Assembly & Briefing',    1),
  ('2',  '09:00 - 12:00', 'Faculty & Campus Exploration',   2),
  ('2',  '12:00 - 13:00', 'Lunch Break & Club Booths',      3),
  ('2',  '13:00 - 16:00', 'Team Building Challenges',       4),

  -- Day 3 — 20 Aug 2026
  ('3',  '08:00 - 09:00', 'Morning Warm-up',                1),
  ('3',  '09:00 - 12:00', 'Quest Rally & QR Scanning',      2),
  ('3',  '12:00 - 13:00', 'Lunch Break',                    3),
  ('3',  '13:00 - 16:00', 'Talent Showcase & Games',        4),

  -- Day 4 — 21 Aug 2026
  ('4',  '08:00 - 09:00', 'Group Reflection',               1),
  ('4',  '09:00 - 12:00', 'UKM Clubs Exhibition',           2),
  ('4',  '12:00 - 13:00', 'Lunch Break',                    3),
  ('4',  '13:00 - 16:00', 'Closing Ceremony Preparation',   4),

  -- Day 5 — 22 Aug 2026
  ('5',  '09:00 - 12:00', 'Final Leaderboard Announcement', 1),
  ('5',  '12:00 - 13:00', 'Celebration Lunch',              2),
  ('5',  '13:00 - 17:00', 'NSO 2026 Grand Closing Ceremony', 3)
) as v("dayKey", "time", "activity", "sortOrder")
where not exists (select 1 from "TimelineEvent");
