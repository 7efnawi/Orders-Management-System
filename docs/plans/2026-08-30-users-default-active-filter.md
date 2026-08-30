# Users Page Default Active Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ضبط الفلتر الافتراضي في صفحة إدارة المستخدمين ليعرض **الحسابات النشطة فقط** (`ACTIVE`) افتراضياً، بحيث يختفي أي مستخدم محذوف أو معطل تلقائياً من الجدول عند الدخول أو عمل Refresh، مع الحفاظ على دقة إحصائيات الـ KPI وإمكانية استعراض المعطلين عند التبديل اليدوي للفلتر.

**Architecture:**
1. تغيير الحالة الابتدائية لـ `selectedStatus` في `src/components/users/users-client.tsx` من `"ALL"` إلى `"ACTIVE"`.
2. تحديث `handleDeleteUser` ليقوم بتحديث حالة المستخدم في الذاكرة المحلية إلى `isActive: false` بدلاً من مسحه كلياً من مصفوفة `usersList`، مما يتيح للفلتر استبعاده فورياً من الجدول وفي نفس الوقت تحديث بطاقات الـ KPI (إجمالي الحسابات والنشطين) بدقة دون الحاجة لطلب شبكة إضافي.
3. إمكانية رؤية الحسابات المحذوفة/المعطلة في أي وقت فقط عند قيام المالك أو المدير بالضغط صراحةً على فلتر **"المعطلين فقط"**.

**Tech Stack:** Next.js 16, React 19, next-intl, Tailwind CSS v4, Lucide Icons.

**Spec:** `docs/SRS.md` — FR-AUTH-02 | `AGENTS.md`

---

## Proposed Changes

### Task 1: Update Default Status Filter in `users-client.tsx`
- [x] Set `selectedStatus` initial state to `"ACTIVE"`
- [x] Update `handleDeleteUser` to set `isActive: false` in local state

---

## Verification Plan

### Automated Tests
```bash
npm run typecheck
npm run test:e2e
npx tsx scripts/verify-phase9.ts
```

### Manual Verification
1. افتح صفحة `/users` ➔ تأكد أن الفلتر الافتراضي المحدد هو "النشطين فقط".
2. احذف أحد المستخدمين ➔ يختفي فوراً من القائمة النشطة، وينخفض عداد الحسابات النشطة في الـ KPI بـ 1.
3. قم بعمل Refresh للصفحة ➔ يظل المستخدم المحذوف مخفياً ولا يظهر في الجدول.
4. اضغط على فلتر "المعطلين فقط" ➔ يظهر المستخدم المحذوف هناك بحالته المعطلة.
