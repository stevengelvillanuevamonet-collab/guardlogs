import type { VisitorLog } from "@/lib/types";
import { formatDateAndTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RecentLogTable({ logs }: { logs: VisitorLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Last {logs.length} entries, most recent first.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Phones: compact list */}
        <ul className="divide-y rounded-lg border md:hidden">
          {logs.map((v) => (
            <li key={v.id} className="flex flex-col gap-1.5 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-medium">{v.visitor_name}</p>
                <Badge variant={v.status === "Inside Campus" ? "inside" : "out"} dot className="shrink-0">
                  {v.status}
                </Badge>
              </div>
              <p className="font-mono-tabular text-xs text-muted-foreground">
                {formatDateAndTime(v.time_in)}
                {" → "}
                {v.time_out ? formatDateAndTime(v.time_out) : "still inside"}
              </p>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time in</TableHead>
              <TableHead>Time out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.visitor_name}</TableCell>
                <TableCell>
                  <Badge variant={v.status === "Inside Campus" ? "inside" : "out"} dot>
                    {v.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono-tabular text-muted-foreground">
                  {formatDateAndTime(v.time_in)}
                </TableCell>
                <TableCell className="font-mono-tabular text-muted-foreground">
                  {v.time_out ? formatDateAndTime(v.time_out) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
