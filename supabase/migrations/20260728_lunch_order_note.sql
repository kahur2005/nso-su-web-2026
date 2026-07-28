-- 20260728_lunch_order_note.sql
-- A free-text note the student attaches to their whole order: "sambal dipisah",
-- "extra timun", "ayam paha atas". The warung needs these to cook correctly, so
-- they are reproduced under every dish in the /admin/lunch/recap copy-out.
--
-- Deliberately ONE note per order rather than one per line. That matches how
-- students actually write them ("semuanya extra timun yaa" covers the whole
-- order) and keeps the cart UI to a single box.
--
-- Idempotent, like every other file here.

alter table "LunchOrder"
  add column if not exists "note" text;
