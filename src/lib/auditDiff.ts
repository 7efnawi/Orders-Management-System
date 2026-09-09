import { AuditAction, Role } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 10: Audit Semantic Diff Engine & Pure Utilities (Client + Server Safe)
// ═══════════════════════════════════════════════════════════════════════════

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogWithUser {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface FieldDiff {
  field: string;
  labelAr: string;
  labelEn: string;
  oldValue: any;
  newValue: any;
  type: "text" | "currency" | "status" | "boolean" | "role" | "json";
}

export interface AuditSummaryStats {
  totalLogs: number;
  todayCount: number;
  statusChangeCount: number;
  criticalCount: number;
}

export interface FieldMeta {
  labelAr: string;
  labelEn: string;
  type: "text" | "currency" | "status" | "boolean" | "role" | "json";
}

/**
 * قاموس حقول النطاق لترجمة الفوارق إلى لغة واضحة للمستخدم
 */
export const AUDIT_FIELD_DICTIONARY: Record<string, FieldMeta> = {
  status: { labelAr: "حالة الطلب", labelEn: "Status", type: "status" },
  orderStatus: { labelAr: "حالة الطلب", labelEn: "Order Status", type: "status" },
  role: { labelAr: "الدور الصلاحي", labelEn: "Role", type: "role" },
  discountAmount: { labelAr: "مبلغ الخصم", labelEn: "Discount Amount", type: "currency" },
  discount: { labelAr: "مبلغ الخصم", labelEn: "Discount", type: "currency" },
  discountStatus: { labelAr: "حالة الخصم", labelEn: "Discount Status", type: "status" },
  discountReason: { labelAr: "سبب الخصم", labelEn: "Discount Reason", type: "text" },
  discountApprovedBy: { labelAr: "معتمد الخصم", labelEn: "Discount Approved By", type: "text" },
  cancelReason: { labelAr: "سبب الإلغاء", labelEn: "Cancel Reason", type: "text" },
  cancelNotes: { labelAr: "ملاحظات الإلغاء", labelEn: "Cancel Notes", type: "text" },
  subtotal: { labelAr: "المجموع الفرعي", labelEn: "Subtotal", type: "currency" },
  total: { labelAr: "الإجمالي", labelEn: "Total", type: "currency" },
  deliveryFee: { labelAr: "رسوم التوصيل", labelEn: "Delivery Fee", type: "currency" },
  tax: { labelAr: "الضريبة", labelEn: "Tax", type: "currency" },
  isActive: { labelAr: "حالة الحساب", labelEn: "Account Status", type: "boolean" },
  name: { labelAr: "الاسم", labelEn: "Name", type: "text" },
  email: { labelAr: "البريد الإلكتروني", labelEn: "Email", type: "text" },
  notes: { labelAr: "الملاحظات", labelEn: "Notes", type: "text" },
  category: { labelAr: "التصنيف", labelEn: "Category", type: "text" },
  brand: { labelAr: "البراند", labelEn: "Brand", type: "text" },
  brandId: { labelAr: "معرّف البراند", labelEn: "Brand ID", type: "text" },
  platform: { labelAr: "المنصة", labelEn: "Platform", type: "text" },
  platformId: { labelAr: "معرّف المنصة", labelEn: "Platform ID", type: "text" },
  driverId: { labelAr: "معرّف السائق", labelEn: "Driver ID", type: "text" },
  driver: { labelAr: "سائق التوصيل", labelEn: "Delivery Driver", type: "text" },
  shift: { labelAr: "الوردية", labelEn: "Shift", type: "text" },
  customer: { labelAr: "العميل", labelEn: "Customer", type: "text" },
  shiftId: { labelAr: "معرّف الوردية", labelEn: "Shift ID", type: "text" },
  closedAt: { labelAr: "وقت الإغلاق", labelEn: "Closed At", type: "text" },
  openedAt: { labelAr: "وقت الفتح", labelEn: "Opened At", type: "text" },
  actualCash: { labelAr: "النقد الفعلي", labelEn: "Actual Cash", type: "currency" },
  expectedCash: { labelAr: "النقد المتوقع", labelEn: "Expected Cash", type: "currency" },
  difference: { labelAr: "فارق النقدية", labelEn: "Cash Difference", type: "currency" },
  paymentMethod: { labelAr: "طريقة الدفع", labelEn: "Payment Method", type: "text" },
  paymentStatus: { labelAr: "حالة الدفع", labelEn: "Payment Status", type: "status" },
  price: { labelAr: "السعر", labelEn: "Price", type: "currency" },
  amount: { labelAr: "المبلغ", labelEn: "Amount", type: "currency" },
  description: { labelAr: "الوصف", labelEn: "Description", type: "text" },
  phone: { labelAr: "الهاتف", labelEn: "Phone", type: "text" },
  address: { labelAr: "العنوان", labelEn: "Address", type: "text" },
  items: { labelAr: "الأصناف", labelEn: "Items", type: "json" },
  orderType: { labelAr: "نوع الطلب", labelEn: "Order Type", type: "text" },
  source: { labelAr: "المصدر", labelEn: "Source", type: "text" },
};

export const STATUS_MAP_AR: Record<string, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
  PENDING: "معلق",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  PAID: "مدفوع",
  UNPAID: "غير مدفوع",
};

export const STATUS_MAP_EN: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  UNPAID: "Unpaid",
};

export const ROLE_MAP_AR: Record<string, string> = {
  OWNER: "مالك",
  MANAGER: "مدير",
  CASHIER: "كاشير",
};

export const ROLE_MAP_EN: Record<string, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  CASHIER: "Cashier",
};

/**
 * دالة مساعدة لفك كائنات JSON بأمان
 */
export function parsePayload(val: any): any {
  if (val == null) return null;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return { value: val };
    }
  }
  if (typeof val === "object") return val;
  return { value: val };
}

/**
 * تحويل القيم البرمجية إلى صياغة طبيعية وواضحة للمستخدم
 */
export function formatDomainValue(
  value: any,
  field: string,
  type?: string,
  isAr: boolean = true
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  // Booleans
  if (typeof value === "boolean") {
    if (field === "isActive") {
      return value ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive");
    }
    return value ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
  }

  // String booleans
  if (value === "true" || value === "false") {
    const bool = value === "true";
    if (field === "isActive") {
      return bool ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive");
    }
    return bool ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
  }

  // Status mapping
  const strVal = String(value);
  const upper = strVal.toUpperCase();

  if (type === "status" || field.toLowerCase().includes("status") || STATUS_MAP_AR[upper]) {
    if (isAr && STATUS_MAP_AR[upper]) return STATUS_MAP_AR[upper];
    if (!isAr && STATUS_MAP_EN[upper]) return STATUS_MAP_EN[upper];
  }

  // Role mapping
  if (type === "role" || field === "role" || ROLE_MAP_AR[upper]) {
    if (isAr && ROLE_MAP_AR[upper]) return ROLE_MAP_AR[upper];
    if (!isAr && ROLE_MAP_EN[upper]) return ROLE_MAP_EN[upper];
  }

  // Currency formatting
  if (
    type === "currency" ||
    (typeof value === "number" &&
      (field === "total" ||
        field === "price" ||
        field === "amount" ||
        field === "subtotal" ||
        field === "discount" ||
        field === "discountAmount" ||
        field === "actualCash" ||
        field === "expectedCash" ||
        field === "difference" ||
        field === "deliveryFee" ||
        field === "tax"))
  ) {
    const num = Number(value);
    if (!isNaN(num)) {
      return isAr ? `${num.toFixed(2)} ج.م` : `${num.toFixed(2)} EGP`;
    }
  }

  // Objects
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return strVal;
}

/**
 * صياغة ملخص بشري واضح بلغة عربية طبيعية بدون رموز برمجية أو انزلاقات BiDi
 */
export function formatHumanSummary(log: AuditLogWithUser, isAr: boolean = true): string {
  if (!log) return "";

  const oldObj = parsePayload(log.oldValue) || {};
  const newObj = parsePayload(log.newValue) || {};

  // 1. تفعيل أو تعطيل الحساب (isActive)
  if (
    ("isActive" in oldObj || "isActive" in newObj) &&
    oldObj.isActive !== newObj.isActive
  ) {
    if (newObj.isActive === false) {
      return isAr ? "إيقاف النشاط (تعطيل الحساب)" : "Account Deactivated";
    }
    if (newObj.isActive === true) {
      return isAr ? "تفعيل النشاط (تنشيط الحساب)" : "Account Activated";
    }
  }

  // 2. تحديث الحالة
  if (log.action === "STATUS_CHANGE") {
    const oldStatus = oldObj.status ?? oldObj.orderStatus;
    const newStatus = newObj.status ?? newObj.orderStatus;
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      const oldFormatted = formatDomainValue(oldStatus, "status", "status", isAr);
      const newFormatted = formatDomainValue(newStatus, "status", "status", isAr);
      return isAr
        ? `تحديث الحالة: ${oldFormatted} ➔ ${newFormatted}`
        : `Status updated: ${oldFormatted} ➔ ${newFormatted}`;
    }
    if (newStatus) {
      const newFormatted = formatDomainValue(newStatus, "status", "status", isAr);
      return isAr
        ? `تحديث الحالة إلى: ${newFormatted}`
        : `Status set to: ${newFormatted}`;
    }
    return isAr ? "تحديث حالة الطلب" : "Order status updated";
  }

  // 3. الخصومات (اعتماد، رفض، طلب)
  if (log.action === "DISCOUNT_APPROVE") {
    const amt =
      newObj.discountAmount ?? oldObj.discountAmount ?? newObj.discount ?? oldObj.discount;
    if (amt != null) {
      const formattedAmt = formatDomainValue(amt, "discountAmount", "currency", isAr);
      return isAr ? `اعتماد خصم بقيمة ${formattedAmt}` : `Approved discount of ${formattedAmt}`;
    }
    return isAr ? "اعتماد طلب الخصم" : "Discount request approved";
  }

  if (log.action === "DISCOUNT_REJECT") {
    return isAr ? "رفض طلب الخصم" : "Discount request rejected";
  }

  if (log.action === "DISCOUNT_REQUEST") {
    const amt = newObj.discountAmount ?? oldObj.discountAmount;
    if (amt != null) {
      const formattedAmt = formatDomainValue(amt, "discountAmount", "currency", isAr);
      return isAr ? `طلب خصم بقيمة ${formattedAmt}` : `Requested discount of ${formattedAmt}`;
    }
    return isAr ? "تقديم طلب خصم جديد" : "New discount requested";
  }

  // 4. الإلغاء
  if (log.action === "CANCEL") {
    const reason = newObj.cancelReason ?? oldObj.cancelReason;
    if (reason) {
      return isAr ? `إلغاء الطلب: ${reason}` : `Order cancelled: ${reason}`;
    }
    return isAr ? "إلغاء الطلب" : "Order cancelled";
  }

  // 5. الإنشاء
  if (log.action === "CREATE") {
    const entityMapAr: Record<string, string> = {
      Order: "طلب جديد",
      User: "مستخدم جديد",
      Expense: "مصروف تشغيلي جديد",
      Product: "منتج جديد",
      Category: "تصنيف جديد",
      Shift: "وردية عمل جديدة",
      DailyClosing: "إغلاق يومي جديد",
      DeliveryDriver: "سائق توصيل جديد",
      Driver: "سائق جديد",
      DeliveryZone: "منطقة توصيل جديدة",
      Customer: "عميل جديد",
      Brand: "براند جديد",
      Platform: "منصة جديدة",
    };
    const label = entityMapAr[log.entityType] || (isAr ? log.entityType : `new ${log.entityType}`);
    return isAr ? `إنشاء ${label}` : `Created new ${log.entityType}`;
  }

  // 6. التعديل
  if (log.action === "UPDATE") {
    // تعديل الدور
    if (oldObj.role && newObj.role && oldObj.role !== newObj.role) {
      const oldRole = formatDomainValue(oldObj.role, "role", "role", isAr);
      const newRole = formatDomainValue(newObj.role, "role", "role", isAr);
      return isAr ? `تعديل الدور: ${oldRole} ➔ ${newRole}` : `Role updated: ${oldRole} ➔ ${newRole}`;
    }

    // تعديل الحالة عبر UPDATE
    if (oldObj.status && newObj.status && oldObj.status !== newObj.status) {
      const oldStatus = formatDomainValue(oldObj.status, "status", "status", isAr);
      const newStatus = formatDomainValue(newObj.status, "status", "status", isAr);
      return isAr
        ? `تحديث الحالة: ${oldStatus} ➔ ${newStatus}`
        : `Status updated: ${oldStatus} ➔ ${newStatus}`;
    }

    // الفوارق المحسوبة
    const diffs = computeAuditDiff(oldObj, newObj);
    if (diffs.length === 1) {
      const d = diffs[0];
      const fieldLabel = isAr ? d.labelAr : d.labelEn;
      const oldVal = formatDomainValue(d.oldValue, d.field, d.type, isAr);
      const newVal = formatDomainValue(d.newValue, d.field, d.type, isAr);
      return isAr ? `تعديل ${fieldLabel}: ${oldVal} ➔ ${newVal}` : `Updated ${fieldLabel}: ${oldVal} ➔ ${newVal}`;
    }

    if (diffs.length > 1) {
      const labels = diffs.slice(0, 3).map((d) => (isAr ? d.labelAr : d.labelEn));
      const joined = labels.join(isAr ? "، " : ", ");
      const extra = diffs.length > 3 ? (isAr ? ` (+${diffs.length - 3})` : ` (+${diffs.length - 3})`) : "";
      return isAr ? `تحديث بيانات: ${joined}${extra}` : `Updated: ${joined}${extra}`;
    }

    return isAr ? "تحديث بيانات السجل" : "Record updated";
  }

  return isAr ? "عملية مسجلة" : "Audit event recorded";
}

/**
 * صياغة معرّف الكيان بشكل آمن للاتجاه (LTR) ومختصر ومقروء للمستخدم
 */
export function formatHumanEntityId(log: {
  entityType?: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
}): { display: string; full: string; isCode: boolean } {
  const full = String(log.entityId || "");
  const oldObj = parsePayload(log.oldValue);
  const newObj = parsePayload(log.newValue);

  // If orderNumber is present
  const orderNumber = newObj?.orderNumber ?? oldObj?.orderNumber;
  if (orderNumber != null && String(orderNumber).trim().length > 0) {
    const numStr = String(orderNumber).trim();
    const display = numStr.startsWith("#") ? numStr : `#${numStr}`;
    return { display, full, isCode: true };
  }

  // UUID (e.g. 8c0f2069-6121-4e44-8193-ce8233595841)
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    full
  );
  if (isUuid) {
    return {
      display: `#${full.slice(0, 8)}`,
      full,
      isCode: true,
    };
  }

  if (full.startsWith("#")) {
    return { display: full, full, isCode: true };
  }

  if (full.length <= 12) {
    return { display: `#${full}`, full, isCode: true };
  }

  return { display: `#${full.slice(0, 8)}`, full, isCode: true };
}

/**
 * تحليل ومقارنة كائني JSON لحساب الفوارق الدلالية (Semantic Diff Engine)
 */
export function computeAuditDiff(oldValue: any, newValue: any): FieldDiff[] {
  if (!oldValue && !newValue) {
    return [];
  }

  const oldObj = parsePayload(oldValue);
  const newObj = parsePayload(newValue);

  if (!oldObj && !newObj) {
    return [];
  }

  if (oldObj && newObj && JSON.stringify(oldObj) === JSON.stringify(newObj)) {
    return [];
  }

  const oldRecord = oldObj ?? {};
  const newRecord = newObj ?? {};

  const allKeys = Array.from(new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]));
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const valOld = Object.prototype.hasOwnProperty.call(oldRecord, key) ? oldRecord[key] : null;
    const valNew = Object.prototype.hasOwnProperty.call(newRecord, key) ? newRecord[key] : null;

    if (JSON.stringify(valOld) === JSON.stringify(valNew)) {
      continue;
    }

    const meta = AUDIT_FIELD_DICTIONARY[key] || {
      labelAr: key,
      labelEn: key,
      type:
        typeof valNew === "number" || typeof valOld === "number"
          ? "currency"
          : typeof valNew === "boolean" || typeof valOld === "boolean"
          ? "boolean"
          : typeof valNew === "object" || typeof valOld === "object"
          ? "json"
          : "text",
    };

    diffs.push({
      field: key,
      labelAr: meta.labelAr,
      labelEn: meta.labelEn,
      oldValue: valOld,
      newValue: valNew,
      type: meta.type,
    });
  }

  return diffs;
}

/**
 * حساب مؤشرات وإحصائيات سجل التدقيق التجميعية في الذاكرة (للاختبارات والـ Mock)
 */
export function calculateMockAuditStats(
  logs: { action: string; timestamp: Date | string }[]
): AuditSummaryStats {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;

  let totalLogs = logs.length;
  let todayCount = 0;
  let statusChangeCount = 0;
  let criticalCount = 0;

  for (const log of logs) {
    const time = new Date(log.timestamp).getTime();
    if (time >= startOfToday && time < endOfToday) {
      todayCount++;
    }
    if (log.action === "STATUS_CHANGE") {
      statusChangeCount++;
    }
    if (
      log.action === "CANCEL" ||
      log.action === "DISCOUNT_APPROVE" ||
      log.action === "DISCOUNT_REJECT"
    ) {
      criticalCount++;
    }
  }

  return {
    totalLogs,
    todayCount,
    statusChangeCount,
    criticalCount,
  };
}

/**
 * بناء جملة where للفلترة والبحث في سجل التدقيق
 */
export function buildAuditWhereClause(filters?: AuditLogFilter): any {
  const where: any = {};

  if (!filters) {
    return where;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.search && filters.search.trim().length > 0) {
    where.entityId = {
      contains: filters.search.trim(),
      mode: "insensitive",
    };
  } else if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
        start.setUTCHours(0, 0, 0, 0);
      }
      where.timestamp.gte = start;
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
        end.setUTCHours(23, 59, 59, 999);
      }
      where.timestamp.lte = end;
    }
  }

  return where;
}
