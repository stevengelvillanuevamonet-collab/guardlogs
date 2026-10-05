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