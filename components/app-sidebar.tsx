"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isActivePath, navFor } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Role = "admin" | "guard";

function Brand({ role }: { role: Role }) {
  const collapsed = useSidebar().state === "collapsed";
  return (
    <Link
      href={role === "admin" ? "/admin" : "/"}
      className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 shadow-[0_0_24px_hsl(var(--accent)/0.18)]">
        <LogoMark className="h-[1.375rem] w-[1.375rem]" />
      </div>
      <div
        className={cn(
          "min-w-0 leading-tight transition-opacity duration-200",
          collapsed && "opacity-0"
        )}
      >
        <p className="font-serif text-lg font-semibold tracking-tight text-white">EGardMo</p>
        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-sidebar-muted">
          {role === "admin" ? "Administration" : "Visitor Register"}
        </p>
      </div>
    </Link>
  );
}

function UserCard({ email, role }: { email?: string | null; role: Role }) {
  const collapsed = useSidebar().state === "collapsed";
  const initial = (email?.trim()[0] ?? "?").toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg py-1">
      <div
        title={email ?? undefined}
        className="ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-gradient-to-br from-accent/30 to-accent/10 text-sm font-semibold text-accent"
      >
        {initial}
      </div>
      <div className={cn("min-w-0 leading-tight transition-opacity duration-200", collapsed && "opacity-0")}>
        <p className="truncate text-sm font-medium text-white">{email ?? "Signed in"}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-accent">
          {role === "admin" ? "Administrator" : "Security guard"}
        </p>
      </div>
    </div>
  );
}

export function AppSidebar({
  email,
  role,
  pendingApplications = 0,
}: {
  email?: string | null;
  role: Role;
  pendingApplications?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Brand role={role} />
      </SidebarHeader>
      <div className="brass-rule h-px shrink-0" />

      <SidebarContent>
        {navFor(role).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const badge = item.href === "/admin/applications" ? pendingApplications : 0;
                return (
                  <SidebarMenuItem key={`${group.label}-${item.href}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item)}
                      tooltip={badge > 0 ? `${item.label} · ${badge} pending` : item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserCard email={email} role={role} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-red-200 disabled:opacity-60"
            >
              <LogOut />
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
