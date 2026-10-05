import { createClient } from "@supabase/supabase-js";

const [, , email, password, ...nameParts] = process.argv;
const fullName = nameParts.join(" ").trim();

if (!email || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> ["Full Name"]'
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

// If the email already has an account, promote it instead of failing.
const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error("Could not look up existing accounts:", listError.message);
  process.exit(1);
}
const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

let userId;
if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    app_metadata: { ...existing.app_metadata, role: "admin", disabled: false },
    ban_duration: "none",
  });
  if (error) {
    console.error("Failed to promote account:", error.message);
    process.exit(1);
  }
  userId = existing.id;
  console.log(`Existing account promoted to admin: ${email}`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error) {
    console.error("Failed to create admin account:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Admin account created: ${email} (${userId})`);
}

// Keep the profile row in step (needs migration 003 to have been run).
const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  email,
  full_name: fullName || null,
  role: "admin",
  is_active: true,
});
if (profileError) {
  console.warn(
    `Note: could not update public.profiles (${profileError.message}). ` +
      "Run supabase/migrations/003_roles_and_applications.sql, then run this script again."
  );
}

console.log("Sign in at /login — admins land on /admin.");
