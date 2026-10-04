import Link from "next/link";
import { FileText, LayoutDashboard } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

export function AppHeader({
  email,
  active,
}: {
  email?: string | null;
  active: "dashboard" | "reports";
}) {
  const link = (isActive: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
      isActive
        ? "bg-primary-foreground/10 text-primary-foreground"
        : "text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
    );

  return (
    <header className="relative bg-primary text-primary-foreground print:hidden">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/40 bg-accent/15">
              <LogoMark className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold tracking-tight">EGardMo</p>
              <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60">
                Visitor Check-in &amp; ID Register
              </p>
            </div>
          </div>
          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <Link href="/" className={link(active === "dashboard")}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/reports" className={link(active === "reports")}>
              <FileText className="h-4 w-4" /> Daily Report
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-primary-foreground/70 md:inline">{email}</span>
          <SignOutButton />
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="container flex items-center gap-1 pb-3 sm:hidden">
        <Link href="/" className={link(active === "dashboard")}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>
        <Link href="/reports" className={link(active === "reports")}>
          <FileText className="h-4 w-4" /> Daily Report
        </Link>
      </nav>
      <div className="h-px brass-rule" />
    </header>
  );
}
