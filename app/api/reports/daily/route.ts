// The original daily-report download URL keeps working: with no `period`
// parameter the shared export handler defaults to a daily report.
export { GET } from "../export/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
