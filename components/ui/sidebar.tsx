"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot as SlotLike } from "@radix-ui/react-slot";
import { ChevronLeft, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar";

/**
 * shadcn/ui-style Sidebar (Provider / Sidebar / Header / Content / Group / Menu /
 * Trigger / Rail / Inset) — collapses to an icon rail on desktop, becomes a
 * slide-in sheet on mobile, remembers its state in a cookie and toggles with Ctrl/Cmd+B.
 */

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const DESKTOP_QUERY = "(min-width: 1024px)";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.");
  return ctx;
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  children,
}: {
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpenState] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  const setOpen = React.useCallback((value: boolean) => {
    setOpenState(value);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches) setOpen(!open);
    else setOpenMobile((v) => !v);
  }, [open, setOpen]);

  // Ctrl/Cmd + B
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  // Close the mobile sheet after navigating, or when the window grows to desktop size.
  React.useEffect(() => setOpenMobile(false), [pathname]);
  React.useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => mql.matches && setOpenMobile(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div className={cn("flex min-h-dvh w-full bg-background print:block print:bg-white", className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = useSidebar();
  const collapsed = ctx.state === "collapsed";

  return (
    <>
      {/* Desktop: sticky column that animates between full width and the icon rail */}
      <aside
        data-state={ctx.state}
        className={cn(
          "sticky top-0 z-30 hidden h-dvh shrink-0 self-start lg:block print:hidden",
          "transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "w-[4.25rem]" : "w-[16.5rem]"
        )}
      >
        <div
          className={cn(
            "sidebar-surface flex h-full w-full flex-col overflow-hidden border-r border-sidebar-border text-sidebar-foreground",
            className
          )}
        >
          {children}
        </div>
        <SidebarRail />
      </aside>

      {/* Mobile: slide-in sheet (always shown expanded) */}
      <DialogPrimitive.Root open={ctx.openMobile} onOpenChange={ctx.setOpenMobile}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
          <DialogPrimitive.Content
            className="sidebar-surface fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] border-r border-sidebar-border text-sidebar-foreground shadow-2xl outline-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Main navigation menu
            </DialogPrimitive.Description>
            <SidebarContext.Provider value={{ ...ctx, state: "expanded" }}>
              <div className={cn("flex h-full w-full flex-col overflow-hidden", className)}>{children}</div>
            </SidebarContext.Provider>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

/** Button that collapses/expands the sidebar (opens the sheet on mobile). */
export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title="Toggle sidebar (Ctrl+B)"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <PanelLeft className="h-[1.125rem] w-[1.125rem]" />
      <span className="sr-only">Toggle sidebar</span>
    </button>
  );
}

/** Edge handle: a hover line along the sidebar edge plus a round chevron button. */
export function SidebarRail() {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <>
      <button
        type="button"
        aria-label="Toggle sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        className={cn(
          "group/rail absolute inset-y-0 -right-1.5 z-40 w-3 transition-colors",
          collapsed ? "cursor-e-resize" : "cursor-w-resize"
        )}
      >
        <span className="absolute inset-y-0 left-1/2 w-px bg-transparent transition-colors group-hover/rail:bg-accent/70" />
      </button>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[4.1rem] z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-md transition-all hover:scale-110 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")}
        />
      </button>
    </>
  );
}

/** The page area beside the sidebar. */
export function SidebarInset({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-clip print:block", className)}>
      {children}
    </div>
  );
}

export function SidebarHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex h-20 shrink-0 items-center px-3", className)}>
      {children}
    </div>
  );
}

export function SidebarContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex shrink-0 flex-col gap-1 border-t border-sidebar-border p-3", className)}>{children}</div>;
}

export function SidebarGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col pb-2", className)}>{children}</div>;
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <div className="relative mb-1.5 flex h-6 items-center">
      <span
        className={cn(
          "whitespace-nowrap px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted transition-opacity duration-200",
          collapsed && "opacity-0"
        )}
      >
        {children}
      </span>
      {/* In the icon rail the label gives way to a short divider */}
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 bg-sidebar-border transition-opacity duration-200",
          collapsed ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-1">{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li className="relative">{children}</li>;
}

type MenuButtonProps = React.ComponentProps<"button"> & {
  /** Render as the child element (e.g. next/link) instead of a <button>. */
  asChild?: boolean;
  isActive?: boolean;
  /** Label shown in a floating tooltip while the sidebar is collapsed. */
  tooltip?: string;
};

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  children,
  ...props
}: MenuButtonProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [tip, setTip] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (!collapsed) setTip(null);
  }, [collapsed]);

  const show = (e: React.SyntheticEvent<HTMLElement>) => {
    if (!collapsed || !tooltip) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ top: r.top + r.height / 2, left: r.right + 14 });
  };
  const hide = () => setTip(null);

  const Comp = asChild ? SlotLike : "button";

  return (
    <>
      <Comp
        data-active={isActive || undefined}
        aria-current={isActive ? "page" : undefined}
        {...props}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn(
          "relative flex h-11 w-full items-center gap-3.5 whitespace-nowrap rounded-lg px-[13px] text-sm font-medium outline-none transition-colors duration-150",
          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          "[&>svg]:h-[1.125rem] [&>svg]:w-[1.125rem] [&>svg]:shrink-0 [&>svg]:transition-colors",
          "[&>span]:truncate [&>span]:transition-opacity [&>span]:duration-200",
          collapsed && "[&>span]:opacity-0",
          isActive &&
            "bg-sidebar-accent text-white shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),inset_0_0_0_1px_hsl(0_0%_100%/0.04)] [&>svg]:text-accent",
          isActive &&
            "before:absolute before:-left-3 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-accent before:shadow-[0_0_12px_hsl(var(--accent)/0.7)]",
          className
        )}
      >
        {children}
      </Comp>
      {tip && tooltip && (
        <span
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
          className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground shadow-xl animate-in fade-in-0 slide-in-from-left-1"
        >
          {tooltip}
        </span>
      )}
    </>
  );
}

/** Pill shown beside a menu item (a count); shrinks to a corner dot in the icon rail. */
export function SidebarMenuBadge({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <span
      className={cn(
        "pointer-events-none absolute flex items-center justify-center rounded-full bg-accent font-semibold tabular-nums leading-none text-accent-foreground shadow-sm transition-all duration-200",
        collapsed
          ? "right-0 top-0.5 h-4 min-w-4 px-1 text-[10px]"
          : "right-3 top-1/2 h-5 min-w-5 -translate-y-1/2 px-1.5 text-[11px]"
      )}
    >
      {children}
    </span>
  );
}
