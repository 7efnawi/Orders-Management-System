import ExcelJS from "exceljs";
import type { CustomerListItem, CustomerListStats } from "@/services/customers";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 11 / CRM 2.0: Professional Native Excel (.xlsx) Customer Export Engine
// Generates styled, high-impact Microsoft Excel workbooks for Dark Kitchen ops
// ═══════════════════════════════════════════════════════════════════════════

export interface GenerateCustomersExcelOptions {
  generatedBy?: string;
  isAr?: boolean;
}

const SEGMENT_LABELS_AR: Record<string, string> = {
  VIP: "كبار العملاء (VIP)",
  REGULAR: "عميل دائم",
  NEW: "عميل جديد",
  AT_RISK: "معرّض للفقد ⚠️",
  INACTIVE: "عميل خامل",
};

const SEGMENT_LABELS_EN: Record<string, string> = {
  VIP: "VIP Customer",
  REGULAR: "Regular Customer",
  NEW: "New Customer",
  AT_RISK: "At Risk ⚠️",
  INACTIVE: "Inactive",
};

interface SegmentStyle {
  fgColor: string;
  fontColor: string;
  bold: boolean;
}

const SEGMENT_STYLES: Record<string, SegmentStyle> = {
  VIP: {
    fgColor: "FEF3C7", // Amber pastel
    fontColor: "92400E",
    bold: true,
  },
  REGULAR: {
    fgColor: "D1FAE5", // Emerald pastel
    fontColor: "065F46",
    bold: true,
  },
  NEW: {
    fgColor: "E0F2FE", // Sky pastel
    fontColor: "075985",
    bold: true,
  },
  AT_RISK: {
    fgColor: "FFEDD5", // Orange pastel
    fontColor: "9A3412",
    bold: true,
  },
  INACTIVE: {
    fgColor: "F1F5F9", // Slate pastel
    fontColor: "475569",
    bold: false,
  },
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

/**
 * Generates a professional Microsoft Excel (.xlsx) workbook for the customer directory.
 * Features:
 * 1. RTL direction support for Arabic reading flow.
 * 2. Executive dark kitchen branding header with metadata.
 * 3. 6 Summary KPI cards at the top for immediate executive decision-making.
 * 4. Safe phone number formatting as pure strings with leading zeros preserved.
 * 5. Pastel color-coded operational segment badges.
 * 6. Formatted currency and numbers with commas and two decimals.
 * 7. Bottom totals row with sums and weighted averages.
 */
export async function generateCustomersExcelWorkbook(
  customers: (CustomerListItem | any)[] = [],
  stats?: Partial<CustomerListStats>,
  options: GenerateCustomersExcelOptions = {}
): Promise<Buffer> {
  const isAr = options.isAr !== false; // default true
  const generatedBy = options.generatedBy || (isAr ? "مدير التشغيل" : "Operations Manager");

  const WorkbookClass = (ExcelJS as any).Workbook || (ExcelJS as any).default?.Workbook || ExcelJS;
  const workbook = new WorkbookClass();
  workbook.creator = "Order Control System";
  workbook.lastModifiedBy = generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName = isAr ? "قاعدة العملاء" : "Customers Directory";
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ rightToLeft: isAr, showGridLines: true }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // 12 Column Definitions with calibrated widths
  worksheet.columns = [
    { key: "index", width: 7 },
    { key: "name", width: 26 },
    { key: "phone", width: 18 },
    { key: "segment", width: 20 },
    { key: "orders", width: 14 },
    { key: "spent", width: 20 },
    { key: "aov", width: 18 },
    { key: "lastOrder", width: 15 },
    { key: "status", width: 13 },
    { key: "platform", width: 16 },
    { key: "address", width: 30 },
    { key: "notes", width: 32 },
  ];

  // ── ROW 1: EXECUTIVE TITLE BANNER ──────────────────────────────────────────
  worksheet.mergeCells("A1:L1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = isAr
    ? "تقرير دليل وتحليل بيانات العملاء — عمليات دارك كيتشن سوشي"
    : "Customer Directory & CRM Intelligence Report — Dark Kitchen Sushi Operations";
  titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }, // Slate-900
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 40;

  // ── ROW 2: METADATA & GENERATION AUDIT ──────────────────────────────────────
  worksheet.mergeCells("A2:L2");
  const metaCell = worksheet.getCell("A2");
  const now = new Date();
  const dateStr = now.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  metaCell.value = isAr
    ? `تاريخ الاستخراج: ${dateStr} - ${timeStr}  |  المسؤول: ${generatedBy}  |  إجمالي السجلات: ${customers.length} عميل`
    : `Generated on: ${dateStr} at ${timeStr}  |  Generated by: ${generatedBy}  |  Total Records: ${customers.length} customers`;
  metaCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
  };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 24;

  // ── ROW 3: SPACER ──────────────────────────────────────────────────────────
  worksheet.getRow(3).height = 10;

  // ── ROW 4 & 5: SUMMARY KPI CARDS (6 CARDS ACROSS 12 COLUMNS) ───────────────
  let totalSpentSum = 0;
  let totalOrdersSum = 0;
  let vipFound = 0;
  let atRiskFound = 0;

  for (const c of customers) {
    const s = Number(c.totalSpent ?? c.spent ?? 0);
    const o = Number(c.totalOrders ?? 0);
    totalSpentSum += s;
    totalOrdersSum += o;
    const seg = (c.segment || c.segmentInfo?.segment || "").toUpperCase();
    if (seg === "VIP") vipFound++;
    if (seg === "AT_RISK") atRiskFound++;
  }

  const effectiveTotalCust = stats?.totalCustomers ?? customers.length;
  const effectiveVipCount = stats?.vipCount ?? vipFound;
  const effectiveAtRiskCount = stats?.atRiskCount ?? atRiskFound;
  const effectiveNewCount = stats?.newThisMonth ?? 0;
  const effectiveAvgSpent =
    stats?.avgSpent ??
    (customers.length > 0 ? Math.round((totalSpentSum / customers.length) * 100) / 100 : 0);

  const kpis = [
    {
      cols: ["A", "B"],
      label: isAr ? "إجمالي العملاء" : "Total Customers",
      value: `${effectiveTotalCust} ${isAr ? "عميل" : "Customers"}`,
    },
    {
      cols: ["C", "D"],
      label: isAr ? "كبار العملاء (VIP)" : "VIP Customers",
      value: `${effectiveVipCount} ${isAr ? "عميل" : "VIPs"}`,
    },
    {
      cols: ["E", "F"],
      label: isAr ? "عملاء جدد (هذا الشهر)" : "New Customers (This Month)",
      value: `${effectiveNewCount} ${isAr ? "عميل" : "New"}`,
    },
    {
      cols: ["G", "H"],
      label: isAr ? "معرّضون للفقد ⚠️" : "At Risk ⚠️",
      value: `${effectiveAtRiskCount} ${isAr ? "عميل" : "At Risk"}`,
    },
    {
      cols: ["I", "J"],
      label: isAr ? "متوسط الإنفاق للعميل" : "Avg Spent per Customer",
      value: `${effectiveAvgSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isAr ? "ج.م" : "EGP"}`,
    },
    {
      cols: ["K", "L"],
      label: isAr ? "إجمالي الإنفاق المحقق" : "Total Revenue Realized",
      value: `${totalSpentSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isAr ? "ج.م" : "EGP"}`,
    },
  ];

  worksheet.getRow(4).height = 20;
  worksheet.getRow(5).height = 26;

  for (const kpi of kpis) {
    const [c1, c2] = kpi.cols;
    worksheet.mergeCells(`${c1}4:${c2}4`);
    worksheet.mergeCells(`${c1}5:${c2}5`);

    const lblCell = worksheet.getCell(`${c1}4`);
    lblCell.value = kpi.label;
    lblCell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF475569" } };
    lblCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    lblCell.alignment = { horizontal: "center", vertical: "middle" };

    const valCell = worksheet.getCell(`${c1}5`);
    valCell.value = kpi.value;
    valCell.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FF0F172A" } };
    valCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    valCell.alignment = { horizontal: "center", vertical: "middle" };

    // Apply borders
    for (const row of [4, 5]) {
      for (const col of [c1, c2]) {
        const c = worksheet.getCell(`${col}${row}`);
        c.border = BORDER_THIN;
      }
    }
  }

  // ── ROW 6: SPACER ──────────────────────────────────────────────────────────
  worksheet.getRow(6).height = 12;

  // ── ROW 7: TABLE HEADERS ───────────────────────────────────────────────────
  const headers = isAr
    ? [
        "م",
        "اسم العميل",
        "رقم الهاتف",
        "الشريحة",
        "إجمالي الطلبات",
        "إجمالي الإنفاق (ج.م)",
        "متوسط الطلب (ج.م)",
        "آخر طلب",
        "حالة الحساب",
        "المنصة المفضلة",
        "العنوان / المنطقة",
        "ملاحظات العميل",
      ]
    : [
        "#",
        "Customer Name",
        "Phone Number",
        "Segment",
        "Total Orders",
        "Total Spent (EGP)",
        "Avg Order Value (EGP)",
        "Last Order",
        "Status",
        "Preferred Platform",
        "Address / Delivery Zone",
        "Customer Notes",
      ];

  const headerRow = worksheet.getRow(7);
  headerRow.height = 30;

  headers.forEach((hdr, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = hdr;
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" }, // Slate-800
    };
    cell.alignment = {
      horizontal: idx === 1 ? (isAr ? "right" : "left") : "center",
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

  // ── DATA ROWS ──────────────────────────────────────────────────────────────
  let currentRowIndex = 8;

  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    const row = worksheet.getRow(currentRowIndex);
    row.height = 24;
    const isEven = i % 2 === 1;
    const defaultBg = isEven ? "FFF8FAFC" : "FFFFFFFF";

    const totalOrders = Number(cust.totalOrders ?? 0);
    const spent = Number(cust.totalSpent ?? cust.spent ?? 0);
    const aov = totalOrders > 0 ? Math.round((spent / totalOrders) * 100) / 100 : 0;

    // Segment
    const segRaw = (cust.segment || cust.segmentInfo?.segment || "INACTIVE").toUpperCase();
    const segLabel =
      cust.segmentInfo?.labelAr && isAr
        ? cust.segmentInfo.labelAr
        : isAr
        ? SEGMENT_LABELS_AR[segRaw] || segRaw
        : SEGMENT_LABELS_EN[segRaw] || segRaw;

    const segStyle = SEGMENT_STYLES[segRaw] || SEGMENT_STYLES.INACTIVE;

    // Last Order Date
    let lastOrderFormatted = "-";
    if (cust.lastOrderAt) {
      try {
        const d = new Date(cust.lastOrderAt);
        if (!isNaN(d.getTime())) {
          lastOrderFormatted = d.toISOString().split("T")[0];
        }
      } catch {
        lastOrderFormatted = "-";
      }
    }

    // Account Status
    const isActive = cust.isActive !== false;
    const statusLabel = isActive
      ? isAr
        ? "نشط"
        : "Active"
      : isAr
      ? "معطل"
      : "Inactive";

    // 1. Index
    const cIdx = row.getCell(1);
    cIdx.value = i + 1;
    cIdx.alignment = { horizontal: "center", vertical: "middle" };
    cIdx.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF64748B" } };
    cIdx.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cIdx.border = BORDER_THIN;

    // 2. Name
    const cName = row.getCell(2);
    cName.value = cust.name || (isAr ? "عميل بدون اسم" : "Unnamed Customer");
    cName.alignment = {
      horizontal: isAr ? "right" : "left",
      vertical: "middle",
    };
    cName.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
    cName.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cName.border = BORDER_THIN;

    // 3. Phone (Explicit string preservation to prevent Excel dropping leading zero 010...)
    const cPhone = row.getCell(3);
    const rawPhone = cust.phone ? String(cust.phone).trim() : "-";
    cPhone.value = rawPhone;
    cPhone.numFmt = "@";
    cPhone.alignment = { horizontal: "center", vertical: "middle" };
    cPhone.font = { name: "Consolas", size: 10, color: { argb: "FF1E293B" } };
    cPhone.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cPhone.border = BORDER_THIN;

    // 4. Segment (Pastel Badge)
    const cSeg = row.getCell(4);
    cSeg.value = segLabel;
    cSeg.alignment = { horizontal: "center", vertical: "middle" };
    cSeg.font = {
      name: "Segoe UI",
      size: 9.5,
      bold: segStyle.bold,
      color: { argb: `FF${segStyle.fontColor}` },
    };
    cSeg.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${segStyle.fgColor}` },
    };
    cSeg.border = BORDER_THIN;

    // 5. Total Orders
    const cOrders = row.getCell(5);
    cOrders.value = totalOrders;
    cOrders.numFmt = "#,##0";
    cOrders.alignment = { horizontal: "center", vertical: "middle" };
    cOrders.font = { name: "Segoe UI", size: 10, color: { argb: "FF0F172A" } };
    cOrders.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cOrders.border = BORDER_THIN;

    // 6. Total Spent
    const cSpent = row.getCell(6);
    cSpent.value = spent;
    cSpent.numFmt = "#,##0.00";
    cSpent.alignment = { horizontal: "right", vertical: "middle" };
    cSpent.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
    cSpent.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cSpent.border = BORDER_THIN;

    // 7. AOV
    const cAov = row.getCell(7);
    cAov.value = aov;
    cAov.numFmt = "#,##0.00";
    cAov.alignment = { horizontal: "right", vertical: "middle" };
    cAov.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF334155" } };
    cAov.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cAov.border = BORDER_THIN;

    // 8. Last Order
    const cLast = row.getCell(8);
    cLast.value = lastOrderFormatted;
    cLast.alignment = { horizontal: "center", vertical: "middle" };
    cLast.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF475569" } };
    cLast.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cLast.border = BORDER_THIN;

    // 9. Account Status
    const cStatus = row.getCell(9);
    cStatus.value = statusLabel;
    cStatus.alignment = { horizontal: "center", vertical: "middle" };
    cStatus.font = {
      name: "Segoe UI",
      size: 9.5,
      bold: true,
      color: { argb: isActive ? "FF16A34A" : "FFDC2626" },
    };
    cStatus.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cStatus.border = BORDER_THIN;

    // 10. Preferred Platform
    const cPlat = row.getCell(10);
    cPlat.value = cust.preferredPlatform || cust.preferredBrand || "-";
    cPlat.alignment = { horizontal: "center", vertical: "middle" };
    cPlat.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF334155" } };
    cPlat.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cPlat.border = BORDER_THIN;

    // 11. Address
    const cAddr = row.getCell(11);
    cAddr.value = cust.address || cust.usualDeliveryZone || "-";
    cAddr.alignment = {
      horizontal: isAr ? "right" : "left",
      vertical: "middle",
    };
    cAddr.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF475569" } };
    cAddr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cAddr.border = BORDER_THIN;

    // 12. Notes
    const cNotes = row.getCell(12);
    cNotes.value = cust.notes || "-";
    cNotes.alignment = {
      horizontal: isAr ? "right" : "left",
      vertical: "middle",
    };
    cNotes.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF64748B" } };
    cNotes.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    cNotes.border = BORDER_THIN;

    currentRowIndex++;
  }

  // ── TOTALS / SUMMARY ROW ───────────────────────────────────────────────────
  const totalsRow = worksheet.getRow(currentRowIndex);
  totalsRow.height = 28;

  const totalLabel = isAr ? "الإجمالي الكلي" : "Total Summary";
  const weightedAov =
    totalOrdersSum > 0 ? Math.round((totalSpentSum / totalOrdersSum) * 100) / 100 : 0;

  for (let c = 1; c <= 12; c++) {
    const cell = totalsRow.getCell(c);
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
  }

  totalsRow.getCell(2).value = totalLabel;
  totalsRow.getCell(2).alignment = {
    horizontal: isAr ? "right" : "left",
    vertical: "middle",
  };

  // Sum of Orders
  const cTotOrders = totalsRow.getCell(5);
  cTotOrders.value = totalOrdersSum;
  cTotOrders.numFmt = "#,##0";
  cTotOrders.alignment = { horizontal: "center", vertical: "middle" };

  // Sum of Spent
  const cTotSpent = totalsRow.getCell(6);
  cTotSpent.value = totalSpentSum;
  cTotSpent.numFmt = "#,##0.00";
  cTotSpent.alignment = { horizontal: "right", vertical: "middle" };

  // Weighted AOV
  const cTotAov = totalsRow.getCell(7);
  cTotAov.value = weightedAov;
  cTotAov.numFmt = "#,##0.00";
  cTotAov.alignment = { horizontal: "right", vertical: "middle" };

  // Auto-fit dynamic widths safely with minimum thresholds
  worksheet.columns?.forEach((column: any) => {
    let maxContentLen = 0;
    column.eachCell?.({ includeEmpty: false }, (cell: any, rowNumber: number) => {
      // Ignore title and metadata rows when calculating widths
      if (rowNumber > 6) {
        const valStr = cell.value ? String(cell.value) : "";
        if (valStr.length > maxContentLen) {
          maxContentLen = valStr.length;
        }
      }
    });
    const currentWidth = column.width || 12;
    // Allow column to expand slightly if content is longer
    if (maxContentLen + 4 > currentWidth) {
      column.width = Math.min(45, maxContentLen + 4);
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
