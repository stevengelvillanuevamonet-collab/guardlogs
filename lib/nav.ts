import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match this path exactly instead of as a prefix. */
  exact?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

export const GUARD_NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Administration",
    items: [
      { href: "/admin", label: "Overview", icon: ShieldCheck, exact: true },
      { href: "/admin/applications", label: "Applications", icon: UserPlus },
      { href: "/admin/guards", label: "Guards", icon: Users },
      { href: "/admin/logs", label: "Visitor logs", icon: ScrollText },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/", label: "Guard desk", icon: ClipboardList, exact: true },
    ],
  },
];

export function navFor(role: "admin" | "guard"): NavGroup[] {
  return role === "admin" ? ADMIN_NAV : GUARD_NAV;
}

export function isActivePath(pathname: string, { href, exact }: NavItem): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
