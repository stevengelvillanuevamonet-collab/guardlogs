import { NextResponse, type NextRequest } from "next/server";
import { getReport, parsePeriod } from "@/lib/reports";
import { buildDocx, buildXlsx } from "@/lib/report-exports";
import { isValidDateString, todayInCampus } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * GET /api/reports/export?period=daily|monthly|yearly&date=YYYY-MM-DD&format=xlsx|docx
 *
 * `date` is any day inside the period you want (the month or year containing it
 * is reported). It defaults to today; `period` defaults to daily.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const period = parsePeriod(params.get("period"));
  const date = params.get("date") || todayInCampus();
  const format = params.get("format") || "xlsx";

  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
  }
  if (format !== "xlsx" && format !== "docx") {
    return NextResponse.json({ error: "Format must be xlsx or docx." }, { status: 400 });
  }

  try {
    const report = await getReport(period, date);
    const body = format === "xlsx" ? await buildXlsx(report) : await buildDocx(report);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": format === "xlsx" ? XLSX_MIME : DOCX_MIME,
        "Content-Disposition": `attachment; filename="visitor-report-${period}-${report.fileSlug}.${format}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not build report.";
    return NextResponse.json({ error: message }, { status: message === "Not signed in." ? 401 : 500 });
  }
}
