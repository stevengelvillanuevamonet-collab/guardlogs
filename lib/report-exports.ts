import ExcelJS from "exceljs";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeightRule,
  PageOrientation,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { DailyReport } from "./reports";

const REPORT_TITLE = "Daily Visitor Report";
const ORG_LINE = "EGardMo — Guardhouse Visitor Check-in & ID Register";
const NAVY = "141B2E";
const HEADERS = [
  "No.",
  "Visitor",
  "Plate #",
  "Visiting",
  "Purpose of visit",
  "Time in",
  "Time out",
  "Time inside",
  "Status",
];

function summaryLine(r: DailyReport) {
  const { total, checkedOut, stillInside, withVehicle } = r.stats;
  return `Total visitors: ${total}   |   Checked out: ${checkedOut}   |   Still inside: ${stillInside}   |   With vehicle: ${withVehicle}`;
}

/* ───────────────────────── Excel ───────────────────────── */

export async function buildXlsx(report: DailyReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EGardMo";
  wb.created = new Date();

  const ws = wb.addWorksheet("Visitor Log", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: `&L&8Generated ${report.generatedAt}&C&8Page &P of &N&R&8${REPORT_TITLE}`,
    },
  });

  ws.columns = [
    { width: 6 },
    { width: 28 },
    { width: 14 },
    { width: 24 },
    { width: 38 },
    { width: 18 },
    { width: 18 },
    { width: 13 },
    { width: 14 },
  ];
  const lastCol = HEADERS.length;

  const merged = (row: number, text: string, font: Partial<ExcelJS.Font>, height?: number) => {
    ws.mergeCells(row, 1, row, lastCol);
    const cell = ws.getCell(row, 1);
    cell.value = text;
    cell.font = font;
    cell.alignment = { horizontal: "left", vertical: "middle" };
    if (height) ws.getRow(row).height = height;
  };

  merged(1, REPORT_TITLE, { name: "Calibri", size: 18, bold: true, color: { argb: `FF${NAVY}` } }, 28);
  merged(2, ORG_LINE, { name: "Calibri", size: 10, color: { argb: "FF6B7280" } });
  merged(3, report.label, { name: "Calibri", size: 13, bold: true }, 22);
  merged(4, summaryLine(report), { name: "Calibri", size: 10 }, 20);

  const headerRowIndex = 6;
  const headerRow = ws.getRow(headerRowIndex);
  HEADERS.forEach((h, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = h;
    c.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${NAVY}` } };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "center" : "left", wrapText: true };
  });
  headerRow.height = 24;

  const thin = { style: "thin" as const, color: { argb: "FFD1D5DB" } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  report.rows.forEach((r, idx) => {
    const row = ws.getRow(headerRowIndex + 1 + idx);
    [r.no, r.visitor, r.plate, r.host, r.purpose, r.timeIn, r.timeOut, r.duration, r.status].forEach(
      (v, i) => {
        const c = row.getCell(i + 1);
        c.value = v;
        c.font = { name: "Calibri", size: 10.5 };
        c.border = border;
        c.alignment = {
          vertical: "top",
          horizontal: i === 0 ? "center" : "left",
          wrapText: true,
        };
        if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      }
    );
    if (r.inside) row.getCell(9).font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF9A3412" } };
  });

  if (report.rows.length === 0) {
    const row = headerRowIndex + 1;
    ws.mergeCells(row, 1, row, lastCol);
    const c = ws.getCell(row, 1);
    c.value = "No visitors were logged on this date.";
    c.font = { name: "Calibri", italic: true, color: { argb: "FF6B7280" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(row).height = 28;
  } else {
    ws.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex + report.rows.length, column: lastCol },
    };
  }

  // Signature block
  const sigRow = headerRowIndex + Math.max(report.rows.length, 1) + 3;
  ws.getCell(sigRow, 2).value = "Prepared by (Guard on duty):";
  ws.getCell(sigRow, 5).value = "Noted by (Security head):";
  [2, 5].forEach((col) => {
    ws.getCell(sigRow, col).font = { name: "Calibri", size: 10, color: { argb: "FF374151" } };
    ws.getCell(sigRow + 2, col).value = "______________________________";
    ws.getCell(sigRow + 3, col).value = "Signature over printed name / Date";
    ws.getCell(sigRow + 3, col).font = { name: "Calibri", size: 9, color: { argb: "FF6B7280" } };
  });

  ws.views = [{ state: "frozen", ySplit: headerRowIndex }];
  ws.pageSetup.printTitlesRow = `${headerRowIndex}:${headerRowIndex}`;

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/* ───────────────────────── Word ───────────────────────── */

// A4 landscape with 0.5" margins → content width in DXA (twentieths of a point)
const COL_WIDTHS = [600, 2400, 1300, 2200, 3598, 1200, 1200, 1200, 1700];
const TABLE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0); // 15398

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function textCell(text: string, i: number, opts: { header?: boolean; shade?: boolean; bold?: boolean } = {}) {
  return new TableCell({
    width: { size: COL_WIDTHS[i], type: WidthType.DXA },
    borders,
    verticalAlign: opts.header ? VerticalAlign.CENTER : VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: opts.header
      ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" }
      : opts.shade
        ? { type: ShadingType.CLEAR, fill: "F3F4F6", color: "auto" }
        : undefined,
    children: [
      new Paragraph({
        alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            font: "Calibri",
            size: opts.header ? 20 : 20,
            bold: opts.header || opts.bold,
            color: opts.header ? "FFFFFF" : undefined,
          }),
        ],
      }),
    ],
  });
}

export async function buildDocx(report: DailyReport): Promise<Buffer> {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: 420, rule: HeightRule.ATLEAST },
    children: HEADERS.map((h, i) => textCell(h, i, { header: true })),
  });

  const bodyRows = report.rows.map(
    (r, idx) =>
      new TableRow({
        cantSplit: true,
        children: [
          r.no,
          r.visitor,
          r.plate,
          r.host,
          r.purpose,
          r.timeIn,
          r.timeOut,
          r.duration,
          r.status,
        ].map((v, i) => textCell(String(v), i, { shade: idx % 2 === 1, bold: i === 8 && r.inside })),
      })
  );

  const emptyRow =
    report.rows.length === 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: HEADERS.length,
                width: { size: TABLE_WIDTH, type: WidthType.DXA },
                borders,
                margins: { top: 200, bottom: 200, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: "No visitors were logged on this date.",
                        italics: true,
                        color: "6B7280",
                        font: "Calibri",
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]
      : [];

  const sigLine = (label: string) =>
    new TableCell({
      width: { size: 5000, type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "374151" },
      },
      children: [new Paragraph({ children: [new TextRun({ text: label, font: "Calibri", size: 18, color: "374151" })] })],
    });
  const gap = new TableCell({
    width: { size: 1000, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    children: [new Paragraph("")],
  });

  const doc = new Document({
    creator: "EGardMo",
    title: `${REPORT_TITLE} — ${report.label}`,
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Generated ${report.generatedAt}   •   Page `, size: 16, color: "6B7280" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "6B7280" }),
                  new TextRun({ text: " of ", size: 16, color: "6B7280" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "6B7280" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: REPORT_TITLE, bold: true, size: 40, color: NAVY })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: ORG_LINE, size: 18, color: "6B7280" })],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: report.label, bold: true, size: 26 })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: summaryLine(report), size: 20 })],
          }),
          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: COL_WIDTHS,
            layout: TableLayoutType.FIXED,
            rows: [headerRow, ...bodyRows, ...emptyRow],
          }),
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Table({
            width: { size: 11000, type: WidthType.DXA },
            columnWidths: [5000, 1000, 5000],
            layout: TableLayoutType.FIXED,
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                height: { value: 500, rule: HeightRule.ATLEAST },
                children: [sigLine(""), gap, sigLine("")],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5000, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Prepared by (Guard on duty) — signature over printed name / date", size: 16, color: "6B7280" })],
                      }),
                    ],
                  }),
                  gap,
                  new TableCell({
                    width: { size: 5000, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Noted by (Security head) — signature over printed name / date", size: 16, color: "6B7280" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
