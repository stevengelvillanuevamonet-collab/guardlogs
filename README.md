# Guardhouse Visitor Logbook & ID Surrender

A digital replacement for the paper guardhouse logbook: guards check visitors
in (name, plate number, host, purpose), the system timestamps it automatically,
and visitors show up on a live "Inside Campus" board until they're checked out.

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind/shadcn-ui
frontend, Next.js Server Actions as the backend, Supabase (Postgres + Auth)
as the database and login system, deployed on Vercel.

**Auth model:** there is no public sign-up page. Guard accounts are created
manually by an administrator — either from the Supabase dashboard or with the
included CLI script — which is the more secure/controlled setup you asked
for. A guard can only get in with credentials an admin gave them.

Everything below assumes **you have nothing installed yet**. Follow it in order.

---

## 1. Install Node.js

You need Node.js 20.6 or newer (the guard-creation script uses `--env-file`,
added in 20.6).

1. Go to https://nodejs.org and download the **LTS** installer for your OS.
2. Run the installer (accept the defaults).
3. Confirm it worked — open a terminal (Terminal on Mac, PowerShell/Command
   Prompt on Windows) and run:
   ```bash
   node -v
   npm -v
   ```
   Both should print a version number (Node should read 20.6.0 or higher).

## 2. Unzip and install the project

1. Unzip the `guardhouse.zip` file you downloaded anywhere on your computer.
2. Open a terminal, `cd` into the unzipped `guardhouse` folder.
3. Install dependencies:
   ```bash
   npm install
   ```

## 3. Create a Supabase project (database + auth)

1. Go to https://supabase.com, sign up, and click **New project**.
2. Pick any name/region/password (save the DB password somewhere safe).
3. Once the project finishes provisioning, open **SQL Editor** in the left
   sidebar, paste in the contents of `supabase/migrations/001_visitor_logs.sql`
   from this project, and click **Run**. This creates the `visitor_logs`
   table with Row Level Security enabled (only signed-in guards can read/write).
   Then do the same with `supabase/migrations/002_visitor_id_photos.sql` —
   this adds ID-photo support (a private storage bucket + its own RLS
   policies). Run them in that order; the second depends on the first.
4. Go to **Project Settings → API**. You'll need:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (click "Reveal" — keep this one secret)
5. (Recommended) Go to **Authentication → Sign In / Providers → Email** and
   turn **off** "Allow new users to sign up" if you see that toggle. Since
   accounts are only ever created by an admin (step 5 below), this closes off
   any accidental public registration route.

## 4. Set your environment variables

1. In the project folder, copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in the three Supabase values from step 3.

## 5. Create your first guard account

Since there's no sign-up page, you need to create at least one login before
you can use the app. Two ways to do this — pick whichever is easier:

**Option A — Supabase dashboard (no terminal needed):**
1. Go to **Authentication → Users** in your Supabase project.
2. Click **Add user → Create new user**.
3. Enter the guard's email and a password, and check **Auto Confirm User**.
4. Click **Create user**. Repeat for each guard.

**Option B — the included script (handy for scripting/bulk adds):**
```bash
node --env-file=.env.local scripts/create-guard.mjs guard@example.com "S0meStrongPassword!"
```
This calls Supabase's admin API to create the account directly and requires
`SUPABASE_SERVICE_ROLE_KEY` to be set in `.env.local`.

To add more guards later, an admin repeats either option — there's no
self-service path for a new guard to create their own login.

## 6. Run it locally

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with
the email/password you created in step 5.

Try it: fill in the check-in form on the left, submit, and the visitor
appears in the **Inside Campus** table on the right with an automatic
check-in time. Click **Check Out** and it disappears from "Inside Campus"
and shows up in **Recent activity** with a check-out time.

## 7. Push to a fresh GitHub repository

If you already have this project connected to a GitHub repo, skip to step 8.
Otherwise, starting from scratch:

1. **Install Git** if you don't have it: download from https://git-scm.com,
   run the installer with defaults, then confirm with `git --version` in a
   terminal.
2. **Create an empty repository on GitHub:** sign in at https://github.com,
   click the **+** in the top-right corner → **New repository**. Give it a
   name (e.g. `guardhouse-logbook`) and leave it **empty** — don't check
   "Add a README" or ".gitignore", since this project already has both.
   Click **Create repository** and copy the URL it shows you
   (`https://github.com/your-username/guardhouse-logbook.git`).
3. **Turn the project folder into a git repo and commit everything**, running
   each line separately in a terminal inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: guardhouse logbook app"
   ```
   (First time using git on this machine? It may ask you to set an identity
   first — run `git config --global user.name "Your Name"` and
   `git config --global user.email "you@example.com"`, then repeat the
   commands above.)
4. **Connect it to GitHub and push:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/your-username/guardhouse-logbook.git
   git push -u origin main
   ```
   If GitHub asks for a password, it won't accept your normal account
   password for git operations — use a Personal Access Token instead
   (GitHub → Settings → Developer settings → Personal access tokens), or
   follow the browser sign-in prompt if one appears.

From here on, any time you make changes: `git add .`, then
`git commit -m "describe what changed"`, then `git push`.

## 8. Deploy to Vercel

1. Go to https://vercel.com, sign up (choosing **Continue with GitHub** links
   the two accounts automatically), click **Add New → Project**, and import
   your GitHub repo.
2. In the import screen, expand **Environment Variables** and add the three
   keys from your `.env.local` file (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Click **Deploy**. Vercel builds and gives you a live URL. From now on,
   every `git push` to `main` triggers an automatic redeploy.
4. To create guard accounts against the deployed project, run the script
   locally pointed at the same `.env.local` (it talks directly to Supabase,
   not to Vercel) — or use the Supabase dashboard as in step 5.

> **Working inside a OneDrive/Dropbox/Google Drive-synced folder?** These
> cloud-sync tools constantly watch and lock files, which can cause
> `npm install` or `git` commands to fail with confusing "file in use" or
> "directory not empty" errors — especially with `node_modules`, which has
> tens of thousands of small files. If you hit that, either pause syncing
> while you work, or better, move the project to a non-synced folder like
> `C:\Projects\guardhouse`.

---

## How the "easy to code" parts actually work

- **One table:** `visitor_logs` (`supabase/migrations/001_visitor_logs.sql`) —
  `visitor_name`, `plate_number`, `host_name`, `purpose`, `status`, `time_in`,
  `time_out`.
- **Visual simplicity:** `components/active-visitors-table.tsx` renders a
  shadcn `<Table>` filtered to `status = 'Inside Campus'` only.
- **Timestamp magic:** `lib/actions.ts` — `checkInVisitor` and
  `checkOutVisitor` are Next.js Server Actions that stamp `new Date()` at the
  moment they run. No manual time entry, no client clock trust issues (the
  timestamp is generated on the server).
- **Manual accounts:** `scripts/create-guard.mjs` + Row Level Security
  policies scoped `to authenticated` mean any guard an admin creates can use
  the app, and nobody else can even read the table (no anonymous access, no
  self-sign-up).

## Project structure

```
app/
  layout.tsx              Fonts + toaster (no auth provider needed — Supabase
                           Auth is just cookies, handled by middleware.ts)
  page.tsx                Guard dashboard (Server Component, fetches data)
  globals.css              Design tokens
  login/page.tsx           Sign-in only — no sign-up route exists
components/
  login-form.tsx           Email/password sign-in (Client Component)
  sign-out-button.tsx       Signs out and redirects to /login
  check-in-form.tsx         The check-in form (Client Component)
  id-photo-upload.tsx        Take photo / upload / drag & drop control for ID photos
  camera-capture.tsx         Live in-browser camera dialog
  app-header.tsx             Shared header + navigation
  report-toolbar.tsx         Date picker + print/Word/Excel buttons for the report
  active-visitors-table.tsx  Live "Inside Campus" table + Check Out button + photo viewer
  recent-log-table.tsx      History of check-ins/outs
  ui/                        shadcn/ui primitives (button, input, table, card, dialog...)
lib/
  actions.ts                Server Actions: checkInVisitor, checkOutVisitor,
                             getActiveVisitors, getRecentLogs
  supabase/client.ts         Browser Supabase client (used by login/sign-out)
  supabase/server.ts         Server Supabase client (cookie session) + admin client
  supabase/middleware.ts      Session refresh + redirect logic
  types.ts                   Shared TypeScript types
middleware.ts                Route protection (redirects signed-out guards to /login)
scripts/create-guard.mjs     CLI to manually provision a guard account
supabase/migrations/         SQL schema, ID photo storage bucket, and RLS policies
```

## ID photo capture

Guards can optionally photograph or upload the visitor's surrendered ID
during check-in. **Take photo** opens a live camera view right in the browser
(laptop webcam or tablet/phone camera, with a *Switch camera* button);
**Upload file** picks an existing image, and drag & drop also works. Live
camera needs `https` (Vercel provides it) or `localhost`; on plain `http` the
app falls back to the device's file/camera picker. It's stored securely, not
as a casual attachment:

- The photo goes into a **private** Supabase Storage bucket (`visitor-ids`)
  — there is no public URL for it, ever.
- The database only stores the file's **path**, never a URL.
- When the dashboard needs to *show* a photo, the server generates a
  **signed URL that expires after 5 minutes** (`getActiveVisitors` /
  `getRecentLogs` in `lib/actions.ts`) — so a leaked link goes stale almost
  immediately, unlike a permanent public image URL.
- Row Level Security policies on `storage.objects` mean only a signed-in
  guard can upload, view, or delete files in that bucket — same model as
  the `visitor_logs` table itself.

This requires running the second migration file,
`supabase/migrations/002_visitor_id_photos.sql`, in the Supabase SQL Editor
(after the first one) — it adds the `id_photo_path` column and creates the
bucket + its policies. See step 3 above.

## Daily visitor report (print / Word / Excel)

Open **Daily Report** in the top navigation (`/reports`). Pick a date (or step
with the arrows) to see every visitor who checked in that day, with totals,
time in/out, time inside and status.

- **Print** — print-friendly A4 landscape layout (use *Save as PDF* in the
  print dialog to keep a digital copy). Header and buttons are hidden, the
  table header repeats on each page, and signature lines are included.
- **Word (.docx)** and **Excel (.xlsx)** — download the same report as a file
  (`/api/reports/daily?date=YYYY-MM-DD&format=docx|xlsx`). Both are set up to
  print on A4 landscape; the Excel sheet has frozen headers and filters.

Days run midnight to midnight in campus time (`Asia/Manila`, see
`lib/utils.ts`). A visitor belongs to the day they checked in; if they check
out on a later day, the time-out column shows the date too. No database
changes are needed for this feature.

## Extending it further

- **Roles (guard vs. admin):** add a `guards` table with a `role` column
  keyed by `auth.uid()`, then tighten the RLS policies in
  `001_visitor_logs.sql` to check the guard's role instead of `using (true)`.
- **Force a password reset on first login:** Supabase Auth supports this via
  `supabase.auth.admin.generateLink({ type: "recovery", ... })` — send the
  guard that link instead of handing them a plain password.
- **Realtime board on a second screen:** the migration already adds
  `visitor_logs` to the `supabase_realtime` publication — subscribe to it
  client-side with `supabase.channel(...)` if you want a lobby-facing display
  that updates without a page refresh.
