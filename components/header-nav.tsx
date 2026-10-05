"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Match this path exactly instead of as a prefix. */
  exact?: boolean;
};

const GUARD_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/reports", label: "Reports", icon: FileText },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: ShieldCheck, exact: true },
  { href: "/admin/applications", label: "Applications", icon: UserPlus },
  { href: "/admin/guards", label: "Guards", icon: Users },
  { href: "/admin/logs", label: "Visitor logs", icon: ScrollText },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/", label: "Guard desk", icon: ClipboardList, exact: true },
];

export function HeaderNav({
  role,
  pendingApplications = 0,
  variant,
}: {
  role: "admin" | "guard";
  pendingApplications?: number;
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_NAV : GUARD_NAV;

  return (
    <nav
      aria-label="Main"
      className={cn(
        "items-center gap-1",
        variant === "desktop"
          ? "ml-2 hidden sm:flex"
          : "container flex overflow-x-auto pb-3 sm:hidden"
      )}
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary-foreground/10 text-primary-foreground"
                : "text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {href === "/admin/applications" && pendingApplications > 0 && (
              <span className="ml-0.5 rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-5 text-accent-foreground">
                {pendingApplications}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
