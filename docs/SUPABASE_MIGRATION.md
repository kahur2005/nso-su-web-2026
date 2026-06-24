# Migrating the database to Supabase

This app no longer uses Prisma. It talks to a **Supabase** PostgreSQL database
through [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript).
All database access happens on the server (server components, route handlers,
server actions) using the **service-role** key, and you browse/edit data in the
**Supabase Table Editor** instead of Prisma Studio.

> **Where this file lives:** `docs/SUPABASE_MIGRATION.md`. It's just
> documentation — nothing imports it. Keep it in the repo so the next person
> knows how the database is wired.

---

## What changed in the code

| Before (Prisma)                | After (Supabase)                                |
| ------------------------------ | ----------------------------------------------- |
| `lib/prisma.ts`                | `lib/supabase.ts` (service-role client)         |
| `prisma/schema.prisma`         | `supabase/schema.sql` (run in the SQL Editor)   |
| `prisma.config.ts`             | _(deleted)_                                      |
| `prisma.$transaction([...])`   | `scan_npc` / `adjust_points` SQL functions (RPC)|
| `DATABASE_URL`, `SHADOW_*`     | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`     |

The two multi-step "increment points" transactions can't be done atomically
from the client library, so they live in the database as `plpgsql` functions
and are called with `supabase.rpc(...)`. Everything else is plain
`supabase.from('Table')...` queries.

The SQL tables intentionally keep the **exact same names and columns** Prisma
used (`"Student"`, `"NPC"`, `"funFactsCollected"`, etc.), so every React
component keeps working without changes.

---

## One-time setup

### 1. Create a Supabase project

1. Go to <https://supabase.com> → sign in → **New project**.
2. Pick a name, a strong **database password** (save it somewhere), and a region
   close to your users.
3. Wait ~2 minutes for it to provision.

### 2. Create the tables and functions

1. In the dashboard, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy **all** of it, paste it in.
3. Click **Run**. You should see "Success. No rows returned".

> ⚠️ Re-running `schema.sql` **drops and recreates** the tables — it wipes all
> data. Only run it again when you intentionally want a clean slate.

You can now see the tables under **Table Editor**.

### 3. Get your keys

In the dashboard:

- **Project URL** → Settings → **Data API** → `Project URL` = 
- **Service role key** → Settings → **API Keys** → `service_role` (click reveal)

The `service_role` key is a **secret admin key** — it bypasses all security
rules. Never put it in client code, `NEXT_PUBLIC_*`, or commit it.

### 4. Fill in `.env`

Edit `.env` (already scaffolded for you):

```dotenv
SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ... (the service_role key)"

NEXTAUTH_SECRET="..."          # keep your existing values
NEXTAUTH_URL="http://localhost:3000"
QR_SECRET_KEY="..."
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 5. Install and run

```bash
npm install        # pulls in @supabase/supabase-js, drops prisma
npm run dev
```

Register a student at `/register`, then promote yourself to admin (next section).

---

## Common tasks

### Make yourself an admin

Admin is a boolean on the `Student` row, read into the session at login.

1. **Table Editor** → `Student` → find your row → set `isAdmin` to `true` → save.
   (Or run in **SQL Editor**:
   `update "Student" set "isAdmin" = true where email = 'you@example.com';`)
2. **Log out and back in** — the flag is cached in the JWT at sign-in.

### Browse / edit data

Use the **Table Editor** (replaces `npx prisma studio`). For ad-hoc queries use
the **SQL Editor**.

### Change the schema

Edit `supabase/schema.sql` to keep it as the source of truth, **and** apply the
change to the live database via the SQL Editor (e.g. `alter table ... add column
...`). There's no `prisma migrate` anymore — the `.sql` file _is_ the schema.

---

## How security works here

Every table has **Row Level Security enabled with no policies**, so the public
`anon` key can read/write **nothing**. The app only ever connects with the
`service_role` key (`lib/supabase.ts`), which bypasses RLS — and that client is
server-only. User auth is still handled by next-auth exactly as before.

If you later want to call Supabase directly from the browser, you'd add the
`anon` key + write RLS policies. You don't need that today.

---

## Troubleshooting

> **⚠️ First rule: after ANY edit to `.env`, fully restart the dev server.**
> Next.js reads `.env` only once, at startup — saving the file does nothing to a
> server that's already running. Press `Ctrl+C` in the terminal running
> `npm run dev`, then run `npm run dev` again.

- **`ENOTFOUND your-project-ref.supabase.co`** (or any hostname you don't
  recognize) — the running server is still using an **old/placeholder**
  `SUPABASE_URL`. Your `.env` may already be correct; you just didn't restart the
  dev server. Stop it (`Ctrl+C`) and run `npm run dev` again. `your-project-ref`
  is the placeholder this repo ships with, so seeing it means the real value
  never got loaded.
- **`ENOTFOUND <your-real-ref>.supabase.co`** — restart didn't help and the
  hostname IS yours → check for a typo in the project ref, or a network/DNS/proxy
  issue blocking `*.supabase.co`.
- **Requests hang ~7s then 500, paths look like `…/rest/v1/rest/v1/…`** —
  `SUPABASE_URL` has a trailing `/rest/v1/`. Use the **bare** project URL
  (`https://abcd.supabase.co`); `supabase-js` adds `/rest/v1/` itself.
- **"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"** — `.env` isn't filled
  in, or you didn't restart `npm run dev` after editing it.
- **Empty lists / "Failed to fetch" / `Could not find the table 'public.Student'`**
  — `schema.sql` hasn't been run (or didn't finish). Run the whole file in the
  SQL Editor, and make sure you're using the **service_role** key (not `anon`).
- **`Could not find function scan_npc`** — the RPC functions didn't get created;
  re-run the bottom half of `schema.sql`.
- **Login always fails** — register a user first; passwords are hashed with the
  app's own scrypt (`lib/password.ts`), unrelated to Supabase Auth.

### How to read the real error

The API routes log the underlying Supabase error to the **dev-server terminal**
(not the browser). When a request 500s, look at that terminal — the `message` /
`code` there tells you exactly which case above you're in.
