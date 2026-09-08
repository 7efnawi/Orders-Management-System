/**
 * محرك توليد وطباعة التقارير الإدارية والمالية المعزول (A4 Printable Report Engine)
 * يعزل وثيقة الطباعة داخل Iframe خفي نقي 100% لمنع تشوهات الشاشة، وفقدان الصفحات المتعددة،
 * أو قيود الـ overflow والـ scroll lock الخاصة بـ Radix Dialog.
 */

export interface PrintableReportKPI {
  label: string;
  value: string | number;
}

export interface PrintableReportOptions {
  title: string;
  dateRange: { startDate: string; endDate: string };
  brandName?: string;
  platformName?: string;
  kpis: PrintableReportKPI[];
  tableHtml: string;
  generatedBy?: string;
  timestamp?: string;
}

export function generatePrintableReportHtml(options: PrintableReportOptions): string {
  const {
    title,
    dateRange,
    brandName = "جميع البراندات (Flower, Mastery, Niwa, Tobiko)",
    platformName = "جميع المنصات المعتمدة",
    kpis = [],
    tableHtml = "",
    generatedBy = "إدارة النظام (System Administrator)",
    timestamp,
  } = options;

  const formattedDate =
    timestamp ||
    new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const kpisHtml = kpis
    .map(
      (kpi) => `
      <div class="kpi-card">
        <span class="kpi-label">${kpi.label}</span>
        <span class="kpi-value">${kpi.value}</span>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Sushi Flower</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.5;
      color: #0f172a;
      background-color: #ffffff;
      direction: rtl;
      text-align: right;
    }

    .report-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .report-subtitle {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }

    .header-left {
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .badge-official {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .meta-timestamp {
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    .meta-val {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
    }

    .ltr-val {
      direction: ltr;
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background-color: #ffffff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .kpi-label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }

    .kpi-value {
      display: block;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Tables */
    .table-section {
      margin-bottom: 24px;
    }

    .table-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e2e8f0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      page-break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background-color: #0f172a !important;
      color: #ffffff !important;
      font-weight: 700;
      padding: 7px 8px;
      border: 1px solid #334155;
      text-align: center;
    }

    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }

    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tfoot tr {
      background-color: #f1f5f9 !important;
      font-weight: 700;
      border-top: 2px solid #0f172a;
    }

    tfoot td {
      border: 1px solid #cbd5e1;
      padding: 7px 8px;
    }

    /* Signatures */
    .signatures-block {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #cbd5e1;
      padding-top: 16px;
      margin-top: 24px;
      page-break-inside: avoid;
    }

    .sig-col {
      width: 42%;
    }

    .sig-title {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 24px;
      display: block;
    }

    .sig-line {
      border-bottom: 1px dashed #94a3b8;
      height: 1px;
      margin-bottom: 6px;
      width: 100%;
    }

    .sig-caption {
      font-size: 9.5px;
      color: #64748b;
      display: block;
    }

    /* Footer */
    .footer-notice {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 24px;
      text-align: center;
      font-size: 9.5px;
      color: #94a3b8;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- 1. Header -->
    <div class="header">
      <div class="header-right">
        <div class="brand-title">
          <span>🍣</span>
          <span>Sushi Flower — Dark Kitchen Management</span>
        </div>
        <div class="report-subtitle">${title}</div>
      </div>
      <div class="header-left">
        <div class="badge-official">تقرير إداري رسمي معتمد</div>
        <div class="meta-timestamp">تاريخ الاستخراج: <span dir="ltr">${formattedDate}</span></div>
      </div>
    </div>

    <!-- 2. Meta Grid -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">النطاق الزمني</span>
        <span class="meta-val ltr-val">${dateRange.startDate} → ${dateRange.endDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">البراند</span>
        <span class="meta-val">${brandName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">المنصة</span>
        <span class="meta-val">${platformName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">جهة الإصدار</span>
        <span class="meta-val">${generatedBy}</span>
      </div>
    </div>

    <!-- 3. KPI Summary -->
    ${kpis.length > 0 ? `<div class="kpi-grid">${kpisHtml}</div>` : ""}

    <!-- 4. Table -->
    <div class="table-section">
      <div class="table-title">جدول البيانات المفصل — ${title}</div>
      ${tableHtml}
    </div>

    <!-- 5. Signatures -->
    <div class="signatures-block">
      <div class="sig-col">
        <span class="sig-title">إدارة العمليات والتشغيل</span>
        <div class="sig-line"></div>
        <span class="sig-caption">التوقيع والتاريخ</span>
      </div>
      <div class="sig-col" style="text-align: left;">
        <span class="sig-title" style="text-align: left;">الإدارة المالية والمراجعة</span>
        <div class="sig-line"></div>
        <span class="sig-caption" style="text-align: left;">الختم والاعتماد المالي</span>
      </div>
    </div>

    <!-- 6. Footer -->
    <div class="footer-notice">
      مستند رسمي صادر آلياً من نظام إدارة ومراقبة الأوردرات — Sushi Flower Dark Kitchen. سري وللاستخدام الداخلي فقط.
    </div>
  </div>
</body>
</html>`;
}

export interface ReportTableData {
  mainData: {
    summary: {
      netRevenue: number;
      totalOrders: number;
      totalExpenses: number;
      netProfit: number;
      grossSales: number;
      totalDiscounts: number;
      totalDeliveryFees: number;
      deliveredOrders: number;
      cancelledOrders: number;
      aov: number;
      cashTotal: number;
      visaTotal: number;
      onlineTotal: number;
    };
    dailyBreakdown: Array<{
      date: string;
      orders: number;
      delivered: number;
      cancelled: number;
      sales: number;
      deliveryFees: number;
      expenses: number;
      net: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      quantity: number;
      ordersCount: number;
      revenue: number;
    }>;
    platformBrand: Array<{
      platformName: string;
      brandName: string;
      orders: number;
      sales: number;
    }>;
  };
  peakData?: {
    hourly: Array<{
      hour: number;
      orders: number;
      revenue: number;
    }>;
  } | null;
  empData?: {
    employees: Array<{
      cashierId: string;
      cashierName: string;
      totalOrders: number;
      cancelledOrders: number;
      totalRevenue: number;
      avgOrderValue: number;
      discountsApproved: number;
      discountsApprovedValue: number;
    }>;
  } | null;
  formatCurrency: (val: number) => string;
}

export function generateReportTableHtml(
  tab: string,
  data: ReportTableData
): string {
  const { mainData, peakData, empData, formatCurrency } = data;

  switch (tab) {
    case "sales": {
      const rows = mainData.dailyBreakdown
        .map(
          (r, i) => `
        <tr style="${i % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="text-align: center; font-family: monospace;">${r.date}</td>
          <td style="text-align: center; font-family: monospace;">${r.orders}</td>
          <td style="text-align: center; font-family: monospace; color: #047857;">${r.delivered}</td>
          <td style="text-align: center; font-family: monospace; color: #b91c1c;">${r.cancelled}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(r.sales)}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(r.deliveryFees)}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(r.expenses)}</td>
          <td style="text-align: left; font-family: monospace; font-weight: 700;">${formatCurrency(r.net)}</td>
        </tr>`
        )
        .join("");

      const totalOrders = mainData.dailyBreakdown.reduce((s, r) => s + r.orders, 0);
      const totalDelivered = mainData.dailyBreakdown.reduce((s, r) => s + r.delivered, 0);
      const totalCancelled = mainData.dailyBreakdown.reduce((s, r) => s + r.cancelled, 0);
      const totalSales = mainData.dailyBreakdown.reduce((s, r) => s + r.sales, 0);
      const totalDelivery = mainData.dailyBreakdown.reduce((s, r) => s + r.deliveryFees, 0);
      const totalExp = mainData.dailyBreakdown.reduce((s, r) => s + r.expenses, 0);
      const totalNet = mainData.dailyBreakdown.reduce((s, r) => s + r.net, 0);

      return `<table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>الطلبات</th>
            <th>المسلمة</th>
            <th>الملغاة</th>
            <th style="text-align: left;">المبيعات</th>
            <th style="text-align: left;">التوصيل</th>
            <th style="text-align: left;">المصروفات</th>
            <th style="text-align: left;">الصافي</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td style="text-align: center;">الإجمالي</td>
            <td style="text-align: center; font-family: monospace;">${totalOrders}</td>
            <td style="text-align: center; font-family: monospace; color: #047857;">${totalDelivered}</td>
            <td style="text-align: center; font-family: monospace; color: #b91c1c;">${totalCancelled}</td>
            <td style="text-align: left; font-family: monospace;">${formatCurrency(totalSales)}</td>
            <td style="text-align: left; font-family: monospace;">${formatCurrency(totalDelivery)}</td>
            <td style="text-align: left; font-family: monospace;">${formatCurrency(totalExp)}</td>
            <td style="text-align: left; font-family: monospace; color: #065f46;">${formatCurrency(totalNet)}</td>
          </tr>
        </tfoot>
      </table>`;
    }

    case "products": {
      const rows = mainData.topProducts
        .map(
          (p, idx) => `
        <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="font-weight: 600;">${p.productName}</td>
          <td style="text-align: center; font-family: monospace;">${p.quantity}</td>
          <td style="text-align: center; font-family: monospace;">${p.ordersCount}</td>
          <td style="text-align: left; font-family: monospace; font-weight: 600;">${formatCurrency(p.revenue)}</td>
        </tr>`
        )
        .join("");

      const totalQty = mainData.topProducts.reduce((s, p) => s + p.quantity, 0);
      const totalOrdersCount = mainData.topProducts.reduce((s, p) => s + p.ordersCount, 0);
      const totalRev = mainData.topProducts.reduce((s, p) => s + p.revenue, 0);

      return `<table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="text-align: right;">اسم الصنف</th>
            <th>الكمية المباعة</th>
            <th>عدد مرات الطلب</th>
            <th style="text-align: left;">إجمالي الإيراد</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td style="text-align: center;" colspan="2">الإجمالي العام</td>
            <td style="text-align: center; font-family: monospace;">${totalQty}</td>
            <td style="text-align: center; font-family: monospace;">${totalOrdersCount}</td>
            <td style="text-align: left; font-family: monospace; color: #065f46;">${formatCurrency(totalRev)}</td>
          </tr>
        </tfoot>
      </table>`;
    }

    case "payment": {
      const net = mainData.summary.netRevenue || 1;
      const cashPct = Math.round((mainData.summary.cashTotal / net) * 100);
      const visaPct = Math.round((mainData.summary.visaTotal / net) * 100);
      const onlinePct = Math.round((mainData.summary.onlineTotal / net) * 100);

      return `<table>
        <thead>
          <tr>
            <th>طريقة الدفع</th>
            <th style="text-align: left;">المبلغ المحصل</th>
            <th>النسبة المئوية</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 600;">كاش (نقدي)</td>
            <td style="text-align: left; font-family: monospace;">${formatCurrency(mainData.summary.cashTotal)}</td>
            <td style="text-align: center; font-family: monospace;">${cashPct}%</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="font-weight: 600;">فيزا (بطاقة ائتمانية)</td>
            <td style="text-align: left; font-family: monospace;">${formatCurrency(mainData.summary.visaTotal)}</td>
            <td style="text-align: center; font-family: monospace;">${visaPct}%</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">أونلاين (دفع إلكتروني)</td>
            <td style="text-align: left; font-family: monospace;">${formatCurrency(mainData.summary.onlineTotal)}</td>
            <td style="text-align: center; font-family: monospace;">${onlinePct}%</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style="text-align: center;">الإجمالي المحصل</td>
            <td style="text-align: left; font-family: monospace; color: #065f46;">${formatCurrency(mainData.summary.netRevenue)}</td>
            <td style="text-align: center; font-family: monospace;">100%</td>
          </tr>
        </tfoot>
      </table>`;
    }

    case "order-sources": {
      const rows = mainData.platformBrand
        .map(
          (pb, idx) => `
        <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="text-align: center; font-weight: 600;">${pb.platformName}</td>
          <td style="text-align: center; font-weight: 600;">${pb.brandName}</td>
          <td style="text-align: center; font-family: monospace;">${pb.orders}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(pb.sales)}</td>
        </tr>`
        )
        .join("");

      const totalOrders = mainData.platformBrand.reduce((s, pb) => s + pb.orders, 0);
      const totalSales = mainData.platformBrand.reduce((s, pb) => s + pb.sales, 0);

      return `<table>
        <thead>
          <tr>
            <th>المنصة</th>
            <th>البراند</th>
            <th>عدد الطلبات</th>
            <th style="text-align: left;">إجمالي المبيعات</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td style="text-align: center;" colspan="2">الإجمالي</td>
            <td style="text-align: center; font-family: monospace;">${totalOrders}</td>
            <td style="text-align: left; font-family: monospace; color: #065f46;">${formatCurrency(totalSales)}</td>
          </tr>
        </tfoot>
      </table>`;
    }

    case "employees": {
      const rows = (empData?.employees || [])
        .map(
          (e, idx) => `
        <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="font-weight: 600;">${e.cashierName}</td>
          <td style="text-align: center; font-family: monospace;">${e.totalOrders}</td>
          <td style="text-align: center; font-family: monospace; color: #b91c1c;">${e.cancelledOrders}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(e.totalRevenue)}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(e.avgOrderValue)}</td>
          <td style="text-align: center; font-family: monospace;">${e.discountsApproved}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(e.discountsApprovedValue)}</td>
        </tr>`
        )
        .join("");

      return `<table>
        <thead>
          <tr>
            <th style="text-align: right;">اسم الكاشير</th>
            <th>إجمالي الطلبات</th>
            <th>الطلبات الملغاة</th>
            <th style="text-align: left;">إجمالي الإيراد</th>
            <th style="text-align: left;">متوسط الطلب</th>
            <th>خصومات معتمدة</th>
            <th style="text-align: left;">قيمة الخصم</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" style="text-align:center;">لا توجد بيانات متاحة</td></tr>'}
        </tbody>
      </table>`;
    }

    case "peak-hours": {
      const rows = (peakData?.hourly || [])
        .map(
          (h, idx) => `
        <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="text-align: center; font-family: monospace;">${String(h.hour).padStart(2, "0")}:00 - ${String(h.hour + 1).padStart(2, "0")}:00</td>
          <td style="text-align: center; font-family: monospace;">${h.orders}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(h.revenue)}</td>
          <td style="text-align: left; font-family: monospace;">${formatCurrency(h.orders > 0 ? Math.round(h.revenue / h.orders) : 0)}</td>
        </tr>`
        )
        .join("");

      return `<table>
        <thead>
          <tr>
            <th>الساعة</th>
            <th>عدد الطلبات</th>
            <th style="text-align: left;">إجمالي المبيعات</th>
            <th style="text-align: left;">متوسط الطلب</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="text-align:center;">لا توجد بيانات متاحة</td></tr>'}
        </tbody>
      </table>`;
    }

    default: {
      return `<table>
        <thead>
          <tr>
            <th style="text-align: right;">المؤشر الإحصائي / المالي</th>
            <th style="text-align: left;">القيمة المحققة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>إجمالي المبيعات الخام (Gross Sales)</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600;">${formatCurrency(mainData.summary.grossSales)}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td>إجمالي الخصومات الممنوحة</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600; color: #b91c1c;">${formatCurrency(mainData.summary.totalDiscounts)}</td>
          </tr>
          <tr>
            <td>إجمالي رسوم التوصيل</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600;">${formatCurrency(mainData.summary.totalDeliveryFees)}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="font-weight: 700;">صافي الإيرادات (Net Revenue)</td>
            <td style="text-align: left; font-family: monospace; font-weight: 800; color: #0f172a;">${formatCurrency(mainData.summary.netRevenue)}</td>
          </tr>
          <tr>
            <td>إجمالي المصروفات التشغيلية</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600; color: #b45309;">${formatCurrency(mainData.summary.totalExpenses)}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="font-weight: 700;">صافي الأرباح التشغيلية (Net Profit)</td>
            <td style="text-align: left; font-family: monospace; font-weight: 800; color: #065f46;">${formatCurrency(mainData.summary.netProfit)}</td>
          </tr>
          <tr>
            <td>إجمالي الطلبات المسجلة</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600;">${mainData.summary.totalOrders}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td>الطلبات المسلمة بنجاح</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600; color: #047857;">${mainData.summary.deliveredOrders}</td>
          </tr>
          <tr>
            <td>الطلبات الملغاة</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600; color: #b91c1c;">${mainData.summary.cancelledOrders}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td>متوسط قيمة الطلب (AOV)</td>
            <td style="text-align: left; font-family: monospace; font-weight: 600;">${formatCurrency(mainData.summary.aov)}</td>
          </tr>
        </tbody>
      </table>`;
    }
  }
}

/**
 * دالة استدعاء الطباعة المعزولة عبر Iframe خفي.
 * تنشئ Iframe نظيف بدون أي أنماط من الـ parent window،
 * وتحقن الـ HTML المنسق للـ A4 وتستدعي print() مباشرة.
 */
export function printHtmlViaIframe(html: string): void {
  if (typeof window === "undefined" || !document) return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // انتظر تحميل الخطوط والمحتوى قبل فتح شاشة الطباعة
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print via iframe failed, falling back to window.print()", e);
      window.print();
    } finally {
      // إزالة الـ iframe بعد إغلاق نافذة الطباعة
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    }
  };

  if (iframe.contentWindow) {
    iframe.contentWindow.onload = triggerPrint;
    // Fallback if onload doesn't fire promptly
    setTimeout(triggerPrint, 350);
  } else {
    triggerPrint();
  }
}
