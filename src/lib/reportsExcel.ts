import ExcelJS from "exceljs";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 12 / Reports 2.0: Professional Native Excel (.xlsx) Report Generator
// Generates styled, high-impact Microsoft Excel workbooks for Dark Kitchen ops
// Supports RTL views, executive KPI banners, number formatting & multi-sheets
// ═══════════════════════════════════════════════════════════════════════════

export interface ExcelReportColumn {
  header: string;
  key: string;
  align?: "left" | "center" | "right";
  width?: number;
  numFmt?: string;
}

export interface ExcelReportKpi {
  label: string;
  value: string | number;
  unit?: string;
}

export interface ExcelReportSheetData {
  sheetName: string;
  title: string;
  subtitle?: string;
  brandName?: string;
  platformName?: string;
  kpis?: ExcelReportKpi[];
  columns: ExcelReportColumn[];
  rows: Array<Record<string, any>>;
  totalsRow?: Record<string, any>;
}

export interface ReportsExcelWorkbookOptions {
  isAr?: boolean;
  generatedBy?: string;
  dateRange: { startDate: string; endDate: string };
  isMultiSheet?: boolean;
  // If single sheet:
  sheetName?: string;
  title?: string;
  brandName?: string;
  platformName?: string;
  kpis?: ExcelReportKpi[];
  columns?: ExcelReportColumn[];
  rows?: Array<Record<string, any>>;
  totalsRow?: Record<string, any>;
  // If multi sheet:
  sheets?: ExcelReportSheetData[];
}

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

/**
 * Generates a native Microsoft Excel (.xlsx) workbook buffer with executive styling.
 */
export async function generateReportsExcelWorkbook(
  options: ReportsExcelWorkbookOptions
): Promise<Buffer> {
  const isAr = options.isAr !== false; // default true
  const generatedBy = options.generatedBy || (isAr ? "مدير التشغيل" : "Operations Manager");

  // Safe constructor resolver for exceljs in Next.js / ESM environments
  const WorkbookClass = (ExcelJS as any).Workbook || (ExcelJS as any).default?.Workbook || ExcelJS;
  const workbook = new WorkbookClass();
  workbook.creator = "Order Control System";
  workbook.lastModifiedBy = generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  // Determine sheets to process
  const sheetsToProcess: ExcelReportSheetData[] =
    options.isMultiSheet && options.sheets && options.sheets.length > 0
      ? options.sheets
      : [
          {
            sheetName: options.sheetName || (isAr ? "التقرير" : "Report"),
            title: options.title || (isAr ? "تقرير العمليات" : "Operations Report"),
            brandName: options.brandName,
            platformName: options.platformName,
            kpis: options.kpis,
            columns: options.columns || [],
            rows: options.rows || [],
            totalsRow: options.totalsRow,
          },
        ];

  for (const sheetData of sheetsToProcess) {
    const kpis = sheetData.kpis || [];
    const hasKpis = kpis.length > 0;
    const columns = sheetData.columns || [];
    const totalCols = Math.max(columns.length, hasKpis ? kpis.length : 1);

    const worksheet = workbook.addWorksheet(sheetData.sheetName, {
      views: [{ rightToLeft: isAr, showGridLines: true }],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // Set initial column widths based on provided columns
    worksheet.columns = Array.from({ length: totalCols }).map((_, idx) => {
      const colDef = columns[idx];
      return {
        key: colDef?.key || `col_${idx + 1}`,
        width: colDef?.width || 16,
      };
    });

    // ── ROW 1: EXECUTIVE TITLE BANNER ──────────────────────────────────────────
    if (totalCols > 1) {
      worksheet.mergeCells(1, 1, 1, totalCols);
    }
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = sheetData.title;
    titleCell.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Slate-900
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 38;

    // ── ROW 2: METADATA ROW ────────────────────────────────────────────────────
    if (totalCols > 1) {
      worksheet.mergeCells(2, 1, 2, totalCols);
    }
    const metaCell = worksheet.getCell(2, 1);
    const now = new Date();
    const dateStr = now.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = now.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const metaParts: string[] = [];
    if (options.dateRange) {
      metaParts.push(
        isAr
          ? `الفترة: ${options.dateRange.startDate} إلى ${options.dateRange.endDate}`
          : `Date Range: ${options.dateRange.startDate} to ${options.dateRange.endDate}`
      );
    }
    if (sheetData.brandName) {
      metaParts.push(isAr ? `البراند: ${sheetData.brandName}` : `Brand: ${sheetData.brandName}`);
    }
    if (sheetData.platformName) {
      metaParts.push(isAr ? `المنصة: ${sheetData.platformName}` : `Platform: ${sheetData.platformName}`);
    }
    metaParts.push(
      isAr
        ? `تاريخ الاستخراج: ${dateStr} - ${timeStr}`
        : `Generated: ${dateStr} at ${timeStr}`
    );
    metaParts.push(isAr ? `المسؤول: ${generatedBy}` : `By: ${generatedBy}`);

    metaCell.value = metaParts.join("  |  ");
    metaCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF475569" } };
    metaCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" },
    };
    metaCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 22;

    // ── ROW 3: SPACER ──────────────────────────────────────────────────────────
    worksheet.getRow(3).height = 8;

    let currentRow = 4;

    // ── ROWS 4 & 5: KPI CARDS (IF PROVIDED) ───────────────────────────────────
    if (hasKpis) {
      const kpiCount = kpis.length;
      const spanPerCard = Math.max(1, Math.floor(totalCols / kpiCount));
      let currentCol = 1;

      worksheet.getRow(4).height = 20;
      worksheet.getRow(5).height = 26;

      for (let i = 0; i < kpiCount; i++) {
        const kpi = kpis[i];
        const isLast = i === kpiCount - 1;
        const startCol = currentCol;
        const endCol = isLast ? totalCols : Math.min(totalCols, startCol + spanPerCard - 1);
        currentCol = endCol + 1;

        if (startCol < endCol) {
          worksheet.mergeCells(4, startCol, 4, endCol);
          worksheet.mergeCells(5, startCol, 5, endCol);
        }

        const lblCell = worksheet.getCell(4, startCol);
        lblCell.value = kpi.label;
        lblCell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF475569" } };
        lblCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
        lblCell.alignment = { horizontal: "center", vertical: "middle" };

        const valCell = worksheet.getCell(5, startCol);
        const displayVal = kpi.unit ? `${kpi.value} ${kpi.unit}` : kpi.value;
        valCell.value = displayVal;
        valCell.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF0F172A" } };
        valCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
        valCell.alignment = { horizontal: "center", vertical: "middle" };

        // Apply borders across all cells of the card
        for (let r = 4; r <= 5; r++) {
          for (let c = startCol; c <= endCol; c++) {
            worksheet.getCell(r, c).border = BORDER_THIN;
          }
        }
      }

      // Spacer row after KPIs
      worksheet.getRow(6).height = 10;
      currentRow = 7;
    }

    // ── TABLE HEADERS ──────────────────────────────────────────────────────────
    const headerRow = worksheet.getRow(currentRow);
    headerRow.height = 28;

    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E293B" }, // Slate-800
      };
      cell.alignment = {
        horizontal: col.align || (idx === 0 && isAr ? "right" : idx === 0 ? "left" : "center"),
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF0F172A" } },
        bottom: { style: "medium", color: { argb: "FF0F172A" } },
        left: { style: "thin", color: { argb: "FF334155" } },
        right: { style: "thin", color: { argb: "FF334155" } },
      };
    });
    currentRow++;

    // ── DATA ROWS ──────────────────────────────────────────────────────────────
    sheetData.rows.forEach((rowData, rowIdx) => {
      const row = worksheet.getRow(currentRow);
      row.height = 24;
      const isEven = rowIdx % 2 === 1;
      const defaultBg = isEven ? "FFF8FAFC" : "FFFFFFFF";

      columns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        const rawVal = rowData[col.key];

        if (typeof rawVal === "number") {
          cell.value = rawVal;
          if (col.numFmt) cell.numFmt = col.numFmt;
        } else if (
          rawVal !== null &&
          rawVal !== undefined &&
          rawVal !== "" &&
          !isNaN(Number(rawVal)) &&
          col.numFmt
        ) {
          cell.value = Number(rawVal);
          cell.numFmt = col.numFmt;
        } else {
          cell.value = rawVal ?? "-";
          if (col.numFmt) cell.numFmt = col.numFmt;
        }

        cell.alignment = {
          horizontal: col.align || (colIdx === 0 && isAr ? "right" : colIdx === 0 ? "left" : "center"),
          vertical: "middle",
        };

        cell.font = {
          name: "Segoe UI",
          size: 10,
          color: { argb: "FF0F172A" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: defaultBg },
        };
        cell.border = BORDER_THIN;
      });
      currentRow++;
    });

    // ── TOTALS ROW ─────────────────────────────────────────────────────────────
    if (sheetData.totalsRow) {
      const totalsRow = worksheet.getRow(currentRow);
      totalsRow.height = 28;

      columns.forEach((col, colIdx) => {
        const cell = totalsRow.getCell(colIdx + 1);
        const rawVal = sheetData.totalsRow![col.key];

        if (typeof rawVal === "number") {
          cell.value = rawVal;
          if (col.numFmt) cell.numFmt = col.numFmt;
        } else if (
          rawVal !== null &&
          rawVal !== undefined &&
          rawVal !== "" &&
          !isNaN(Number(rawVal)) &&
          col.numFmt
        ) {
          cell.value = Number(rawVal);
          cell.numFmt = col.numFmt;
        } else {
          cell.value = rawVal ?? (colIdx === 0 ? (isAr ? "الإجمالي" : "Total") : "");
        }

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" }, // Slate-100
        };
        cell.border = {
          top: { style: "medium", color: { argb: "FF0F172A" } },
          bottom: { style: "double", color: { argb: "FF0F172A" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF0F172A" } };
        cell.alignment = {
          horizontal: col.align || (colIdx === 0 && isAr ? "right" : colIdx === 0 ? "left" : "center"),
          vertical: "middle",
        };
      });
      currentRow++;
    }

    // ── COLUMN WIDTH AUTO-FIT WITH SAFE CALIBRATION ────────────────────────────
    const headerRowNumber = hasKpis ? 7 : 4;
    worksheet.columns?.forEach((column: any) => {
      let maxContentLen = 0;
      column.eachCell?.({ includeEmpty: false }, (cell: any, rowNumber: number) => {
        if (rowNumber >= headerRowNumber) {
          const valStr = cell.value ? String(cell.value) : "";
          if (valStr.length > maxContentLen) {
            maxContentLen = valStr.length;
          }
        }
      });
      const currentWidth = column.width || 14;
      if (maxContentLen + 4 > currentWidth) {
        column.width = Math.min(45, maxContentLen + 4);
      }
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Client-side helper to download the generated .xlsx workbook as a Blob.
 */
export async function exportReportsToExcelBlob(
  options: ReportsExcelWorkbookOptions,
  filename: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const buffer = await generateReportsExcelWorkbook(options);
  const blob = new Blob([buffer as any], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanFilename = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 200);
}
