import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getAdminVisitorLogs, type VisitorLogFilters } from "@/lib/admin-actions";
import { isValidDateString } from "@/lib/utils";
import { LogsTable } from "@/components/admin/logs-table";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = { title: "Visitor logs — EGardMo" };

type SearchParams = { q?: string; status?: string; from?: string; to?: string; page?: string };

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  const status: VisitorLogFilters["status"] = sp.status === "inside" || sp.status === "out" ? sp.status : "all";
  const from = sp.from && isValidDateString(sp.from) ? sp.from : "";
  const to = sp.to && isValidDateString(sp.to) ? sp.to : "";
  const q = (sp.q ?? "").slice(0, 80);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const result = await getAdminVisitorLogs({ q, status, from, to, page });
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const hasFilters = !!(q || from || to || status !== "all");

  const linkTo = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/logs${qs ? `?${qs}` : ""}`;
  };

  const firstRow = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const lastRow = Math.min(result.total, result.page * result.pageSize);

  return (
    <>
      <PageTitle
        title="Visitor logs"
        description="Every visitor entry across all guards. Search by name, host, plate or purpose."
      />

      <Card>
        <CardHeader>
          {/* A plain GET form: filters live in the URL, so results can be bookmarked or shared. */}
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_auto] lg:items-end">
            <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="q" name="q" defaultValue={q} placeholder="Name, host, plate…" className="pl-9" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All</option>
                <option value="inside">Inside campus</option>
                <option value="out">Checked out</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" name="from" type="date" defaultValue={from} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="date" defaultValue={to} />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <Button type="submit" className="flex-1 lg:flex-none">
                Apply
              </Button>
              {hasFilters && (
                <Button asChild variant="ghost">
                  <Link href="/admin/logs">Clear</Link>
                </Button>
              )}
            </div>
          </form>
        </CardHeader>

        <CardContent>
          {result.logs.length === 0 ? (
            <div className="rounded-md border border-dashed py-12 text-center">
              <p className="text-sm font-medium">{hasFilters ? "No entries match these filters." : "No visitors have been logged yet."}</p>
              {hasFilters && <p className="text-sm text-muted-foreground">Try a wider date range or a shorter search.</p>}
            </div>
          ) : (
            <>
              <LogsTable logs={result.logs} />
              <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="font-mono-tabular text-sm text-muted-foreground">
                  {firstRow}–{lastRow} of {result.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className={result.page <= 1 ? "pointer-events-none opacity-50" : ""}>
                    <Link href={linkTo(result.page - 1)} aria-disabled={result.page <= 1} tabIndex={result.page <= 1 ? -1 : undefined}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Link>
                  </Button>
                  <span className="font-mono-tabular px-2 text-sm text-muted-foreground">
                    {result.page} / {pageCount}
                  </span>
                  <Button asChild variant="outline" size="sm" className={result.page >= pageCount ? "pointer-events-none opacity-50" : ""}>
                    <Link href={linkTo(result.page + 1)} aria-disabled={result.page >= pageCount} tabIndex={result.page >= pageCount ? -1 : undefined}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
