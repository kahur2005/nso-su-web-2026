-- 20260728_lunch_ordering.sql
-- The /lunch pre-order feature: students pick an event day, pick one
-- restaurant, build an order, pay via a dynamic QRIS code, upload proof of
-- payment, and get a receipt that committee approves from /admin/lunch.
--
-- Design notes worth keeping in mind before you edit any of this:
--
--  * Money is INTEGER RUPIAH everywhere. No decimals, no numeric, no floats.
--    The QRIS "54" amount tag takes a plain digit string, so anything else
--    would need rounding logic at the one place that must never be wrong.
--
--  * The order tables carry SNAPSHOTS ("restaurantName", "nameSnapshot",
--    "unitPrice", "price") rather than relying on joins back to the menu.
--    That is the whole point of the shape: an admin editing a price next
--    Tuesday must not silently rewrite the total on a receipt a student
--    already paid.
--
--  * "dayKey" joins back to lib/timeline.ts TIMELINE_DAYS, exactly like
--    TimelineEvent.dayKey. Only days 1-5 are seeded — the Technical Meeting
--    ('tm') is online, so there is no lunch to order.
--
--  * No Postgres functions here. Unlike scan_npc / complete_quest there is no
--    uniqueness race to arbitrate: a student may place any number of orders.
--
-- Idempotent, like every other file in this directory: safe to re-run.

-- ---------------------------------------------------------------- menu ----

create table if not exists "LunchRestaurant" (
  "id"          text primary key default gen_random_uuid()::text,
  "name"        text not null,
  "description" text,
  "imageUrl"    text,
  "sortOrder"   integer not null default 0,
  "isActive"    boolean not null default true,
  "isDeleted"   boolean not null default false,
  "createdAt"   timestamptz not null default now()
);

create table if not exists "LunchMenuItem" (
  "id"           text primary key default gen_random_uuid()::text,
  "restaurantId" text not null references "LunchRestaurant"("id") on delete cascade,
  "name"         text not null,
  "description"  text,
  "price"        integer not null default 0 check ("price" >= 0),
  "imageUrl"     text,
  "sortOrder"    integer not null default 0,
  "isActive"     boolean not null default true,
  "isDeleted"    boolean not null default false,
  "createdAt"    timestamptz not null default now()
);

create table if not exists "LunchAddOn" (
  "id"         text primary key default gen_random_uuid()::text,
  "menuItemId" text not null references "LunchMenuItem"("id") on delete cascade,
  "name"       text not null,
  "price"      integer not null default 0 check ("price" >= 0),
  "sortOrder"  integer not null default 0,
  "isActive"   boolean not null default true,
  "createdAt"  timestamptz not null default now()
);

create index if not exists "LunchMenuItem_restaurantId_sortOrder_idx"
  on "LunchMenuItem" ("restaurantId", "sortOrder");

create index if not exists "LunchAddOn_menuItemId_sortOrder_idx"
  on "LunchAddOn" ("menuItemId", "sortOrder");

-- ------------------------------------------------------------ settings ----

-- One row per event day. "isOpen" is the master switch; "orderDeadline" is the
-- cutoff after which POST /api/lunch/orders refuses the day. Both are enforced
-- SERVER-SIDE in that route — do not make this display-only the way quest
-- availableFrom/availableUntil currently is.
create table if not exists "LunchDay" (
  "dayKey"        text primary key,
  "isOpen"        boolean not null default false,
  "orderDeadline" timestamptz
);

insert into "LunchDay" ("dayKey")
values ('1'), ('2'), ('3'), ('4'), ('5')
on conflict ("dayKey") do nothing;

-- Single-row config table. The check constraint is what makes it single-row:
-- there is exactly one QRIS merchant payload for the whole event, editable at
-- /admin/lunch/settings so committee can rotate it without a redeploy.
create table if not exists "LunchSetting" (
  "id"         text primary key default 'default' check ("id" = 'default'),
  "qrisStatic" text not null default '',
  "updatedAt"  timestamptz not null default now()
);

insert into "LunchSetting" ("id") values ('default')
on conflict ("id") do nothing;

-- -------------------------------------------------------------- orders ----

create table if not exists "LunchOrder" (
  "id"              text primary key default gen_random_uuid()::text,
  "orderCode"       text not null unique,
  "studentId"       text not null references "Student"("id") on delete cascade,
  "dayKey"          text not null,
  "restaurantId"    text references "LunchRestaurant"("id") on delete set null,
  -- Snapshot: survives the restaurant being renamed or soft-deleted.
  "restaurantName"  text not null,
  "subtotal"        integer not null default 0 check ("subtotal" >= 0),
  "status"          text not null default 'pending_payment'
                    check ("status" in ('pending_payment', 'awaiting_approval', 'approved', 'rejected')),
  -- The generated dynamic QRIS string. Stored so re-opening the pay screen
  -- re-renders the identical code instead of minting a new one.
  "qrisPayload"     text,
  "paymentProofUrl" text,
  "rejectionReason" text,
  "createdAt"       timestamptz not null default now(),
  "submittedAt"     timestamptz,
  "reviewedAt"      timestamptz,
  "reviewedBy"      text
);

create table if not exists "LunchOrderItem" (
  "id"           text primary key default gen_random_uuid()::text,
  "orderId"      text not null references "LunchOrder"("id") on delete cascade,
  "menuItemId"   text,
  "nameSnapshot" text not null,
  "unitPrice"    integer not null default 0 check ("unitPrice" >= 0),
  "quantity"     integer not null default 1 check ("quantity" > 0),
  -- (unitPrice + sum of add-on prices) * quantity, computed server-side.
  "lineTotal"    integer not null default 0 check ("lineTotal" >= 0)
);

create table if not exists "LunchOrderItemAddOn" (
  "id"           text primary key default gen_random_uuid()::text,
  "orderItemId"  text not null references "LunchOrderItem"("id") on delete cascade,
  "addOnId"      text,
  "nameSnapshot" text not null,
  "price"        integer not null default 0 check ("price" >= 0)
);

create index if not exists "LunchOrder_studentId_createdAt_idx"
  on "LunchOrder" ("studentId", "createdAt" desc);

create index if not exists "LunchOrder_status_dayKey_idx"
  on "LunchOrder" ("status", "dayKey");

create index if not exists "LunchOrderItem_orderId_idx"
  on "LunchOrderItem" ("orderId");

create index if not exists "LunchOrderItemAddOn_orderItemId_idx"
  on "LunchOrderItemAddOn" ("orderItemId");

-- ----------------------------------------------------------------- rls ----

-- Matches every other table in this schema: RLS on with no policies, so only
-- the server-side service-role client can read or write. Do not add client-side
-- Supabase calls against these tables without writing policies first.
alter table "LunchRestaurant"      enable row level security;
alter table "LunchMenuItem"        enable row level security;
alter table "LunchAddOn"           enable row level security;
alter table "LunchDay"             enable row level security;
alter table "LunchSetting"         enable row level security;
alter table "LunchOrder"           enable row level security;
alter table "LunchOrderItem"       enable row level security;
alter table "LunchOrderItemAddOn"  enable row level security;
