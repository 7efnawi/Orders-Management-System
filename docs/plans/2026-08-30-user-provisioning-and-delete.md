# User Provisioning Fix & Delete Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** إصلاح تسجيل الدخول للمستخدمين الجدد عبر ربط إنشاء حساب Supabase Auth بإضافة المستخدم، وإضافة ميزة حذف المستخدم مع صلاحيات منضبطة.

**Architecture:**
النظام يعتمد على **طبقتين منفصلتين للهوية**: Supabase Auth (كلمة المرور + الجلسة) + جدول `User` المحلي في Postgres (الاسم، الدور، `isActive`). عند إضافة مستخدم من واجهة الأونر، ينشئ record فقط في جدول `User` المحلي **بدون** إنشاء حساب في Supabase Auth — لذلك لما يحاول الكاشير يسجل دخول، بيفشل. الحل: استخدام `supabase.auth.admin.createUser()` من الـ service_role key لإنشاء حساب Auth مع كلمة مرور مؤقتة أثناء إضافة المستخدم.
حذف المستخدم = حذف حساب Supabase Auth بالـ UUID (lookup بالإيميل عبر admin API) + `isActive=false` في الـ local DB.

**Tech Stack:** Next.js 16, React 19, Prisma 7, Supabase (Auth + Postgres), `@supabase/supabase-js` (admin client), next-intl, shadcn/ui.

**Spec:** `docs/SRS.md` — FR-AUTH-01, FR-AUTH-02 | `AGENTS.md` — No Hard Delete rule

---

## Global Constraints

- `SUPABASE_SERVICE_ROLE_KEY` **server-only** — لا يظهر أبداً في الـ client bundle (يبدأ بـ `service_role` مش `anon`).
- أي كتابة على `User` تمر **حصراً** من `src/services/users.ts`.
- الـ audit يُستدعى من `src/services/` داخل نفس transaction.
- صلاحيات الحذف: **المالك** يحذف أي مستخدم غير نفسه، **المدير** يحذف الكاشير فقط.
- No Hard Delete للـ `User` record — الحذف = إلغاء Supabase Auth + `isActive=false`.
- كل API route تبدأ بـ `requireApiRole(...)` في أول سطر.

---

## User Review Required

> [!IMPORTANT]
> **كلمة المرور المؤقتة:** كلمة المرور المؤقتة العشوائية (12 حرف) ستُعرض **مرة واحدة فقط** في مودال الإضافة للمالك/المدير، ويعطيها للموظف يدوياً مع زر Copy. المستخدم الجديد يسجل دخوله بها مباشرة (لا يوجد رابط invitation email في هذه المرحلة).

> [!IMPORTANT]
> **`SUPABASE_SERVICE_ROLE_KEY`:** خطوة يدوية **قبل التشغيل**: اذهب لـ Supabase Dashboard > Settings > API > copy الـ `service_role` key (ليس `anon`) وأضفه في `.env` الخاص بك.

> [!IMPORTANT]
> **صلاحية المدير على صفحة المستخدمين:** حالياً الـ API مقيدة بـ OWNER فقط. الخطة ستفتح صلاحية المدير لـ: عرض الكاشيرات + إضافة كاشير + حذف كاشير. المدير لا يستطيع إنشاء/حذف OWNER أو MANAGER آخر.

---

## Proposed Changes

---

### Task 1: Supabase Admin Client + `.env`
- [x] Create `src/lib/supabase/admin.ts`
- [x] Update `.env.example` with `SUPABASE_SERVICE_ROLE_KEY`

---

### Task 2: `createUser` — إصلاح Provisioning (الخطأ الجوهري)
- [x] Update `createUser` in `src/services/users.ts` to provision Supabase Auth account with temp password
- [x] Update `POST /api/users` in `src/app/api/users/route.ts` to generate and return `tempPassword`

---

### Task 3: `deleteUser` — الحذف بصلاحيات منضبطة
- [x] Implement `deleteUser` in `src/services/users.ts` with Supabase Auth deletion, local soft delete, and audit
- [x] Add `DELETE /api/users/[id]` in `src/app/api/users/[id]/route.ts` with role guards

---

### Task 4: API permissions — فتح صلاحية المدير
- [x] Enable `OWNER` & `MANAGER` access on `/users` page and API routes with Cashier-only scoping for Managers

---

### Task 5: UI — عرض كلمة المرور المؤقتة
- [x] Update `src/components/users/user-dialog.tsx` with copyable Temporary Password card step

---

### Task 6: UI — زر الحذف مع تأكيد
- [x] Update `src/components/users/users-client.tsx` with Delete action and confirmation modal

---

### Task 7: Translations + Tests
- [x] Update `src/messages/ar.json` and `en.json` with temporary password and delete messages
- [x] Update and verify `scripts/verify-phase9.ts` and E2E test suite

---

## Verification Plan

### Automated Tests
```bash
npm run typecheck
npm run test:e2e
npx tsx scripts/verify-phase9.ts
```

### Manual Verification
1. أضف مستخدم جديد من `/users` → احفظ كلمة المرور المؤقتة.
2. افتح incognito → `/login` → سجل دخول → تأكد نجاح الوصول للداشبورد.
3. احذف المستخدم من المالك → حاول تسجيل الدخول → يُرفض.
4. أعد إضافة المستخدم → يعمل.
