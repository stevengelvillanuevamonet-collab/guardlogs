// Manually provisions a guard account in Supabase Auth. Since this app has
// no public sign-up page, this (or the Supabase dashboard — see README) is
// how an administrator adds a new guard.
//
// Usage:
//   node --env-file=.env.local scripts/create-guard.mjs guard@example.com "S0meStrongPassword!"
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to be set
// (already in .env.local if you followed the README).

import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/create-guard.mjs <email> <password>'
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run this with --env-file=.env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // skip the confirmation email — the admin is vouching for this guard
});

if (error) {
  console.error("Failed to create guard account:", error.message);
  process.exit(1);
}

console.log(`Guard account created: ${data.user.email} (${data.user.id})`);
