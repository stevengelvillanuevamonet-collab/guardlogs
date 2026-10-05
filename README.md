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

## Roles, admin panel & reports (added)

**Roles.** Every account is either an `admin` or a `guard`. The role lives in
the user's `app_metadata.role` — only the service-role key can write it, so no
one can promote themselves. Accounts with no role (every guard created before
this update) are treated as guards.

**Setup (one time):**

1. Run `supabase/migrations/003_roles_and_applications.sql` in the Supabase SQL
   Editor (after 001 and 002). It adds `profiles` and `guard_applications`.
2. Create your first admin:
   `node --env-file=.env.local scripts/create-admin.mjs you@example.com "a-strong-password" "Your Name"`
   (if the email already exists, it is promoted to admin). Then sign in — admins
   land on `/admin`.

**Admin panel (`/admin`)**

| Page | What it does |
| --- | --- |
| Overview | Who is inside now, today's visitors, active guards, applications waiting |
| Applications | Review guard applications; **Approve** creates the guard login, **Reject** closes it |
| Guards | Register a guard directly, reset a password, deactivate / reactivate |
| Visitor logs | Search and filter every visitor entry (name, host, plate, status, dates), with ID photos and which guard checked each person in/out |
| Reports | Same reports page guards use, available from the admin nav |

Applicants use the public form at **`/apply`** (linked from the login page).
There is no email service, so when an application is approved or a guard is
added, the admin sees the temporary password **once** and hands it over. Reset
the password from the Guards page if it gets lost.

**Reports.** `/reports` now has **Daily / Monthly / Yearly** tabs. Monthly and
yearly reports add a per-day / per-month summary ahead of the full visitor
list, and export to Excel (extra *Summary* sheet) and Word. Download URL:
`/api/reports/export?period=daily|monthly|yearly&date=YYYY-MM-DD&format=xlsx|docx`
(the old `/api/reports/daily` URL still works).
