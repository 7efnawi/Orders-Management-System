# Role-Based Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تخصيص صفحة الـ Dashboard لتعرض محتوى مختلفاً بالكامل بحسب الدور (Cashier / Manager / Owner).

**Architecture:** نُفرّق البيانات في الـ service، ونُقسّم الـ UI إلى 3 كومبوننتات مستقلة تختارها `DashboardOverviewClient` بحسب `user.role`.

**Tech Stack:** Next.js 16, React 19, Prisma 7, next-intl, Tailwind v4, Lucide Icons, shadcn/ui.

**Spec:** `docs/SRS.md` — FR-AUTH-02, FR-DASH | `AGENTS.md`

## Global Constraints
- لا Hard Delete — فقط `isActive` في الـ DB.
- كل الـ i18n في `src/messages/ar.json` + `en.json` معاً.
- لا Prisma مباشر من الـ UI — فقط عبر `src/services/`.
- `npm run typecheck` لازم يعدّي قبل أي commit.
- استخدام `-LiteralPath` في PowerShell لأي عملية على مسارات تحتوي `[locale]`.

---

## ملخص التصاميم حسب الدور

| القسم | الكاشير | المدير | المالك |
|---|---|---|---|
| **Hero Bar** | شيفته + وقت + زر طلب جديد | الشيفتات المفتوحة + زر لوحة المطبخ | نظرة أعمال شاملة + روابط إدارية |
| **KPI Cards** | طلبات الشيفت، مسلمة، كاش، مصروفات | طلبات نشطة، إيرادات، مسلمة، مصروفات | اليوم vs. أمس (إيراد%، طلبات%، إلغاء%، موظفين) |
| **الجدول الرئيسي** | آخر 8 طلبات شيفته | آخر 10 طلبات كل الشيفتات | جدول ملخص اليوم |
| **العمود الجانبي** | Pipeline مراحل السوشي + زر إغلاق الشيفت | براندات + منصات + pipeline | براندات% + منصات% + نبذة الفريق |

---

## Proposed Changes

### Task 1: توسيع `DashboardOverview` بـ بيانات Owner Insights
- [x] تعديل `DashboardOverview` interface في `src/services/orders.ts` لإضافة:
  ```ts
  ownerInsights?: {
    todayRevenue: number;
    yesterdayRevenue: number;
    todayOrders: number;
    yesterdayOrders: number;
    todayCancelled: number;
    yesterdayCancelled: number;
    todayActiveOrders: number;
    activeUsersCount: number;
    activeDriversCount: number;
  };
  ```
- [x] تعديل `getDashboardOverview` لتجلب بيانات الأمس + عدد المستخدمين النشطين عند `role === "OWNER"`

### Task 2: ترجمات i18n للأدوار الثلاثة
- [x] إضافة مفاتيح `dashboard.cashier.*`, `dashboard.manager.*`, `dashboard.owner.*` في `src/messages/ar.json`
- [x] نفس المفاتيح في `src/messages/en.json`

### Task 3: كومبوننت `CashierDashboard`
- [x] إنشاء `src/components/dashboard/cashier-dashboard.tsx`
- [x] Hero + 4 KPIs + جدول الطلبات الأخيرة + سايدبار Pipeline

### Task 4: كومبوننت `ManagerDashboard`
- [x] إنشاء `src/components/dashboard/manager-dashboard.tsx`
- [x] Hero إشرافي + 4 KPIs إيرادية + جدول طلبات كاملة + سايدبار براندات/منصات

### Task 5: كومبوننت `OwnerDashboard`
- [x] إنشاء `src/components/dashboard/owner-dashboard.tsx`
- [x] Hero إداري + 4 KPI Delta Cards (اليوم vs. أمس مع نسبة %) + جدول + سايدبار %

### Task 6: تحويل `dashboard-overview.tsx` إلى Router
- [x] تعديل `src/components/dashboard/dashboard-overview.tsx` ليختار الكومبوننت المناسب بحسب `user.role`

---

## Verification Plan

### Automated Tests
```bash
npm run typecheck
npm run test:e2e
```

### Manual Verification
1. **كاشير:** دخول بحساب كاشير ➔ يظهر "شاشة الكاشير" مع شيفته وطلباته وزر "طلب جديد".
2. **مدير:** دخول بحساب مدير ➔ يظهر "لوحة المشرف" مع KPIs الإيرادية وجميع الطلبات.
3. **مالك:** دخول بحساب مالك ➔ يظهر "لوحة المالك" مع بطاقات مقارنة اليوم vs. الأمس.
