# User Reactivation & Credentials Provisioning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تمكين المالك والمدير من إعادة تفعيل الحسابات المحذوفة أو المعطلة بسلاسة، مع إعادة إنشاء حساب Supabase Auth المرتبط بها تلقائياً وتوليد كلمة مرور مؤقتة جديدة وعرضها في نافذة قابلة للنسخ لتسليمها للموظف.

**Architecture:**
1. عند حذف المستخدم سابقاً، تم حذف حسابه من Supabase Auth وتعطيله محلياً (`isActive: false`).
2. لإعادة التفعيل، نقوم بتحديث دالة `updateUser` ومسار `PATCH /api/users/[id]` بحيث عند تحويل الحساب من `isActive: false` إلى `isActive: true`:
   - يتم التحقق من الصلاحيات (المالك يعيد تفعيل أي حساب، المدير يعيد تفعيل الكاشير فقط).
   - يتم توليد كلمة مرور مؤقتة جديدة عشوائياً.
   - يتم استدعاء Supabase Admin API لإعادة إنشاء/تحديث حساب Auth وتأكيده تلقائياً.
   - تُعاد الاستجابة متضمنة `{ user, tempPassword }`.
3. في واجهة المستخدم `users-client.tsx`:
   - إضافة زر إجراء صريح **"إعادة تفعيل" (Reactivate / Restore)** على صفوف الحسابات المعطلة/المحذوفة.
   - إتاحة التبديل أيضاً عبر الـ Switch.
   - عند نجاح إعادة التفعيل، تُعرض بطاقة **كلمة المرور المؤقتة الجديدة** للمالك/المدير لنسخها فوراً، وتنتقل حالة المستخدم في الواجهة إلى نشط (`isActive: true`).

**Tech Stack:** Next.js 16, React 19, Supabase Auth Admin, Prisma 7, next-intl, shadcn/ui.

**Spec:** `docs/SRS.md` — FR-AUTH-01, FR-AUTH-02 | `AGENTS.md`

---

## Proposed Changes

### Task 1: Update Service & API for Reactivation Provisioning
- [x] Update `UpdateUserInput` in `src/services/users.ts` with `tempPassword` and Supabase Auth provisioning on reactivation
- [x] Update `PATCH /api/users/[id]` in `src/app/api/users/[id]/route.ts` to generate `tempPassword` and return `{ user, tempPassword }`

### Task 2: UI — Reactivate Action & Credentials Dialog
- [x] Add explicit Reactivate action button and handle credentials modal in `src/components/users/users-client.tsx`
- [x] Update `src/messages/ar.json` & `en.json` with reactivation strings

---

## Verification Plan

### Automated Tests
```bash
npm run typecheck
npx tsx scripts/verify-phase9.ts
npm run test:e2e
```

### Manual Verification
1. احذف مستخدم كاشير ➔ يختفي من قائمة النشطين.
2. انتقل لفلتر "المعطلين فقط" ➔ يظهر الكاشير المحذوف مع زر "إعادة تفعيل".
3. اضغط "إعادة تفعيل" ➔ يظهر مودال كلمة المرور المؤقتة الجديدة مع زر نسخ.
4. افتح المتصفح الخفي وسجل دخول بالبريد وكلمة المرور الجديدة ➔ ينجح الدخول للداشبورد.
