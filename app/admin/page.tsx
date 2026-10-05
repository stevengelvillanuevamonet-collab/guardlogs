import Link from "next/link";
import { ArrowRight, DoorOpen, UserCheck, UserPlus, Users } from "lucide-react";
import { getAdminOverview } from "@/lib/admin-actions";
import { formatDateAndTime } from "@/lib/utils";
import { PageTitle } from "@/components/admin/page-title";
import { LiveRefresh } from "@/components/live-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin — EGardMo" };

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();

  const stats = [
    { label: "Inside campus now", value: o.insideNow, icon: DoorOpen, href: "/admin/logs?status=inside" },
    { label: "Visitors today", value: o.visitorsToday, icon: UserCheck, href: "/reports" },
    { label: "Active guards", value: o.activeGuards, icon: Users, href: "/admin/guards" },
    {
      label: "Applications to review",
      value: o.pendingApplications,
      icon: UserPlus,
      href: "/admin/applications",
      highlight: o.pendingApplications > 0,
    },
  ];

  return (
    <>
      <PageTitle
        title="Administration"
        description="Manage who guards the gate, review applicants, and keep an eye on every visitor entry."
        action={<LiveRefresh />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
          >
            <div className="flex items-center justify-between">
              <Icon className={highlight ? "h-5 w-5 text-accent" : "h-5 w-5 text-muted-foreground"} />
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="font-mono-tabular mt-3 text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Waiting for review</CardTitle>
              <CardDescription className="mt-1.5">Newest guard applications.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/applications">Review all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {o.recentApplications.length === 0 ? (
              <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                No applications are waiting.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {o.recentApplications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.years_experience} {a.years_experience === 1 ? "year" : "years"} experience ·{" "}
                        {a.shift_preference} shift
                      </p>
                    </div>
                    <p className="font-mono-tabular shrink-0 text-xs text-muted-foreground">
                      {formatDateAndTime(a.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Latest visitors</CardTitle>
              <CardDescription className="mt-1.5">Most recent check-ins.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/logs">All logs</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {o.recentLogs.length === 0 ? (
              <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                No visitors have been logged yet.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {o.recentLogs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.visitor_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDateAndTime(l.time_in)}
                        {l.logged_by_name ? ` · by ${l.logged_by_name}` : ""}
                      </p>
                    </div>
                    <Badge variant={l.status === "Inside Campus" ? "inside" : "out"} dot className="shrink-0">
                      {l.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
