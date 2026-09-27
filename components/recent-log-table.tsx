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
                  <Badge variant={v.status === "Inside Campus" ? "inside" : "out"}>
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
      </CardContent>
    </Card>
  );
}
