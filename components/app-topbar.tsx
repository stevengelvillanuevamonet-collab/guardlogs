"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { isActivePath, navFor } from "@/lib/nav";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Slim bar above the page: sidebar toggle, where you are, and who's signed in. */
export function AppTopbar({ email, role }: { email?: string | null; role: "admin" | "guard" }) {
  const pathname = usePathname();
  const items = navFor(role).flatMap((g) => g.items);
  // Longest matching href wins so /admin/guards isn't mistaken for /admin.
  const current = items
    .filter((i) => isActivePath(pathname, i))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const section = role === "admin" && pathname.startsWith("/admin") ? "Administration" : "EGardMo";
  const page = current?.label ?? (role === "admin" ? "Overview" : "Dashboard");

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 print:hidden">
      <SidebarTrigger className="-ml-2" />
      <div className="h-5 w-px bg-border" />
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">{section}</span>
        <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/60 sm:inline" />
        <span className="truncate font-medium">{page}</span>
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {role === "admin" && (
          <span className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
            Admin
          </span>
        )}
        <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
      </div>
    </header>
  );
}
