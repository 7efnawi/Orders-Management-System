/**
 * src/lib/exportExcel.ts
 *
 * Professional formatted Excel (.xls) export engine.
 * Generates an XML/HTML spreadsheet compatible with Microsoft Excel and Google Sheets,
 * complete with UTF-8 BOM, RTL direction, official branding header, filter metadata,
 * KPI summary cards, zebra-striped styled data tables, and bold totals row.
 */

export interface ExcelExportColumn {
  header: string;
  key: string;
  align?: "left" | "center" | "right";
  width?: number;
}

export interface ExcelExportKpi {
  label: string;
  value: string | number;
  unit?: string;
}

export interface ExcelExportOptions {
  title: string;
  subtitle?: string;
  dateRange: { startDate: string; endDate: string };
  brandName?: string;
  platformName?: string;
  generatedAt?: Date | string;
  kpis?: ExcelExportKpi[];
  columns: ExcelExportColumn[];
  rows: Array<Record<string, any>>;
  totalsRow?: Record<string, any>;
  sheetName?: string;
}

function escapeHtml(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateExcelSpreadsheetHtml(options: ExcelExportOptions): string {
  const {
    title,
    subtitle = "Sushi Flower — Dark Kitchen Order Control System",
    dateRange,
    brandName,
    platformName,
    generatedAt = new Date(),
    kpis = [],
    columns,
    rows,
    totalsRow,
    sheetName = "تقرير المبيعات",
  } = options;

  const formattedDate =
    typeof generatedAt === "string"
      ? generatedAt
      : generatedAt.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

  const totalCols = Math.max(columns.length, 4);

  // Build KPI Cards HTML
  let kpisHtml = "";
  if (kpis.length > 0) {
    const kpiCells = kpis
      .map(
        (k) => `
      <td style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; text-align: center; vertical-align: middle;">
        <div style="font-size: 11pt; color: #64748b; font-weight: normal; margin-bottom: 4px;">${escapeHtml(k.label)}</div>
        <div style="font-size: 16pt; color: #0f172a; font-weight: bold; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
          ${escapeHtml(k.value)}${k.unit ? ` <span style="font-size: 11pt; color: #475569;">${escapeHtml(k.unit)}</span>` : ""}
        </div>
      </td>`
      )
      .join("");

    kpisHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        ${kpiCells}
      </tr>
    </table>
    <br/>`;
  }

  // Build Table Headers
  const thHtml = columns
    .map((col) => {
      const align = col.align || "center";
      const widthStyle = col.width ? `width: ${col.width}px;` : "";
      return `<th style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 12pt; padding: 10px 8px; border: 1px solid #334155; text-align: ${align}; ${widthStyle}">
        ${escapeHtml(col.header)}
      </th>`;
    })
    .join("");

  // Build Data Rows
  const rowsHtml = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = columns
        .map((col) => {
          const val = row[col.key] ?? "-";
          const align = col.align || (typeof val === "number" ? "center" : "right");
          return `<td style="background-color: ${bg}; color: #1e293b; font-size: 11pt; padding: 8px 8px; border: 1px solid #e2e8f0; text-align: ${align};">
            ${escapeHtml(val)}
          </td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("\n");

  // Build Totals Row
  let totalsHtml = "";
  if (totalsRow) {
    const cells = columns
      .map((col) => {
        const val = totalsRow[col.key] ?? "";
        const align = col.align || "center";
        return `<td style="background-color: #f1f5f9; color: #0f172a; font-size: 12pt; font-weight: bold; padding: 10px 8px; border-top: 2px solid #0f172a; border-bottom: 3px double #0f172a; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; text-align: ${align};">
          ${escapeHtml(val)}
        </td>`;
      })
      .join("");
    totalsHtml = `<tr>${cells}</tr>`;
  }

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${escapeHtml(sheetName)}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:DisplayRightToLeft/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif;
      direction: rtl;
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body dir="rtl">
  <!-- Brand & Official Letterhead -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr>
      <td colspan="${totalCols}" style="background-color: #0f172a; color: #ffffff; padding: 16px 20px; border-radius: 6px; text-align: center;">
        <div style="font-size: 18pt; font-weight: bold; letter-spacing: 0.5px;">🍣 ${escapeHtml(title)}</div>
        <div style="font-size: 11pt; color: #94a3b8; margin-top: 4px;">${escapeHtml(subtitle)}</div>
      </td>
    </tr>
  </table>

  <!-- Filter & Metadata Bar -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1;">
    <tr>
      <td style="padding: 10px 14px; font-size: 11pt; color: #334155;">
        <strong>الفترة الزمنية:</strong> ${escapeHtml(dateRange.startDate)} &nbsp;إلى&nbsp; ${escapeHtml(dateRange.endDate)}
        ${brandName ? ` &nbsp;|&nbsp; <strong>البراند:</strong> ${escapeHtml(brandName)}` : " &nbsp;|&nbsp; <strong>البراند:</strong> جميع البراندات"}
        ${platformName ? ` &nbsp;|&nbsp; <strong>المنصة:</strong> ${escapeHtml(platformName)}` : " &nbsp;|&nbsp; <strong>المنصة:</strong> جميع المنصات"}
      </td>
      <td style="padding: 10px 14px; font-size: 10pt; color: #64748b; text-align: left;">
        <strong>تاريخ وتوقيت الاستخراج:</strong> ${escapeHtml(formattedDate)}
      </td>
    </tr>
  </table>

  <!-- KPI Cards Summary -->
  ${kpisHtml}

  <!-- Main Structured Data Table -->
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #334155;">
    <thead>
      <tr>
        ${thHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${totalsHtml}
    </tbody>
  </table>

  <!-- Footer Notice -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
    <tr>
      <td colspan="${totalCols}" style="text-align: center; font-size: 10pt; color: #94a3b8; padding: 12px; border-top: 1px solid #e2e8f0;">
        تم استخراج هذا التقرير آلياً عبر نظام إدارة وتشغيل الطلبات — Sushi Flower Dark Kitchen Control System
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Browser helper to download the professional styled Excel spreadsheet (.xls)
 */
export function exportReportToExcel(options: ExcelExportOptions, filename: string): void {
  if (typeof window === "undefined") return;

  const html = generateExcelSpreadsheetHtml(options);
  // Prepend UTF-8 BOM so Arabic displays correctly in Excel
  const blob = new Blob(["\uFEFF" + html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const cleanFilename = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
