import { AppShell } from "@/components/app-shell";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Every page under /admin renders inside this layout, so the admin check and
// sidebar live in one place. (middleware.ts blocks non-admins first; this is the
// second, server-side line of defence.)
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();

  return (
    <AppShell email={user.email} role="admin">
      <main className="container py-5 sm:py-8">{children}</main>
    </AppShell>
  );
}
