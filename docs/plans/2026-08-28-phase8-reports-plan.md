# Phase 8 — Reports & Analytics Dashboard Implementation Plan

> المصدر الملزم للمتطلبات: `docs/SRS.md` — FR-RPT-01 … FR-RPT-07
> الترقيم حسب `ENGINEERING_DIRECTIVES.md` §5 (البند 8: Reports) — جولة الـ UI/UX المسجلة سابقًا في PROJECT_LOG (M1–M5، 8.5، 8.6) تبقى كما هي في السجل التاريخي.
> **لا يوجد أي تغيير على `prisma/schema.prisma` في هذه المرحلة.**
> **أسلوب التنفيذ:** مهمات صغيرة متسلسلة — كل مهمة لا تُعتمد إلا بعد اجتياز التيست الخاص بيها (typecheck / test:e2e) قبل الانتقال للي بعدها.

## Global Constraints

- **FR-RPT-07 (Backend enforced):** كل مسارات `/api/reports/*` تستدعي `requireApiRole("OWNER", "MANAGER")` في أول سطر — الكاشير ياخد 403 من الـ API نفسه، مش بس إخفاء الرابط.
- **Directives §2:** كل الحسابات المالية في `src/lib/reports.ts` (دوال pure) — ممنوع حساب في الـ UI. الصفحة تعرض النتائج فقط.
- **Decimal-safe:** كل القيم المالية تعبر عبر `toNumber`/`roundCurrency` من `src/lib/closing.ts` — نفس أسلوب الإغلاق اليومي.
- **اتفاقية الإيراد:** الأوردر الملغي (CANCELLED) لا يدخل في أي رقم مبيعات أو رسوم — نفس قاعدة `calculateShiftSummary`. الخصم المرفوض (discountStatus = REJECTED) لا يُحسب — نفس اتفاقية `getDashboardOverview`.
- **اتفاقية التواريخ:** الأوردرات تُفلتر بـ `createdAt` بحدود منتصف الليل المحلي (نفس اتفاقية `listOrders`)، والمصروفات بعمود `date` بحدود UTC يومية (نفس اتفاقية `listExpenses`).
- **No Hard Delete:** التقارير قراءة فقط — لا يوجد أي endpoint كتابة في هذه المرحلة.
- الترجمة إجبارية في `src/messages/ar.json` + `en.json` (مفاتيح `nav.reports` موجودة بالفعل).

## File Structure & Responsibilities

| File | Responsibility |
|---|---|
| `src/lib/reports.ts` | محرك حسابات التقارير (pure): ملخص المبيعات، المبيعات حسب منصة×براند، التحليل اليومي، تحصيل كاش المناديب، أعلى المنتجات، AOV |
| `src/services/reports.ts` | قراءة الـ Order/Expense من الداتابيز حسب النطاق الزمني وتغذية محرك الحسابات — قراءة فقط، بدون Audit (لا يوجد كتابة) |
| `src/app/api/reports/route.ts` | GET واحد بفلاتر `startDate/endDate/brandId/platformId` — `requireApiRole("OWNER","MANAGER")` أول سطر |
| `src/app/[locale]/(dashboard)/reports/page.tsx` | صفحة سيرفر: `requirePageUser` + redirect للكاشير + جلب البيانات الأولية للشهر الحالي |
| `src/components/reports/reports-client.tsx` | العميل: فلاتر التاريخ، بطاقات KPI، جداول التحليل اليومي / منصة×براند / المناديب / أعلى المنتجات |
| `src/components/layout/dashboard-header.tsx` | إضافة تبويب "التقارير" للـ OWNER/MANAGER فقط (icon: `BarChart3`) |
| `src/messages/ar.json` + `en.json` | قسم `reports` كامل باللغتين |
| `scripts/verify-phase8.ts` | بوابة تحقق المرحلة: بذر بيانات اختبار + أرقام مطابقة بالسنت + تنظيف |
| `tests/e2e/tier1-feature-coverage.test.ts` | إضافة قسم F14: التقارير (حسابات pure على mock data) |

## Tasks (كل مهمة تتقفل بعد اختبارها)

### Task 8.1: Pure Calculation Engine (`src/lib/reports.ts`) + اختباراته
- [x] `calculateSalesSummary(orders, expenses)` → ملخص: إجمالي الأوردرات، المسلمة، الملغاة، النشطة، إجمالي المبيعات قبل/بعد الخصم، رسوم التوصيل، صافي الإيراد (subtotal − discount + fee)، المصروفات، صافي الربح، AOV، وتوزيع CASH/VISA/ONLINE
- [x] `groupSalesByPlatformBrand(orders)` → صفوف (منصة × براند): عدد الأوردرات + المبيعات، مرتبة تنازليًا بالمبيعات
- [x] `buildDailyBreakdown(orders, expenses)` → صف يومي لكل يوم في النطاق: أوردرات، مسلمة، ملغاة، مبيعات، رسوم، مصروفات، صافي
- [x] `calculateDriverCashCollection(orders)` → لكل مندوب (أو بدون مندوب): أوردراته الكلية، أوردراته الكاش، والمبلغ المحصّل كاش
- [x] `calculateTopProducts(orders, limit)` → من OrderItems للأوردرات غير الملغاة: الكمية، الإيراد، عدد الأوردرات — مرتبة بالكمية
- [x] **Gate:** قسم F14 في `tests/e2e/tier1-feature-coverage.test.ts` + `npm run test:e2e` أخضر + `npm run typecheck` أخضر

### Task 8.2: Read Service & API (`src/services/reports.ts` + `/api/reports`)
- [x] `getReportsData({startDate, endDate, brandId?, platformId?})` — استعلامان متوازيان (orders + expenses) ثم استدعاء محرك الحسابات
- [x] التحقق من صحة النطاق: تواريخ صالحة، startDate ≤ endDate، وسقف معقول للنطاق (سنتان)
- [x] GET `/api/reports` — دور المالك/المدير فقط، أخطاء `{code, message}` موحدة عبر `wrapApi`
- [x] **Gate:** `npm run typecheck` أخضر (والمنطق مجرّب بالكامل في 8.1 والبوابة النهائية في 8.4)

### Task 8.3: Reports UI (`/reports` page + `reports-client.tsx` + nav)
- [x] صفحة سيرفر بجلب الشهر الحالي افتراضيًا + حجب الكاشير (redirect)
- [x] فلاتر (من تاريخ / إلى تاريخ) مع إعادة الجلب من `/api/reports` وحالات تحميل وخطأ
- [x] بطاقات KPI متوافقة مع نظام المقاسات الموحد (h-10، max-w-[1440px]، gap-6)
- [x] 4 جداول: التحليل اليومي، منصة×براند، تحصيل المناديب، أعلى المنتجات — فارغة تعرض حالة "لا بيانات"
- [x] تبويب "التقارير" في الهيدر للمالك/المدير فقط + ترجمات `reports.*` في ar/en
- [x] **Gate:** `npm run typecheck` + `npm run lint` أخضر

### Task 8.4: Verification Gate & PROJECT_LOG
- [x] `scripts/verify-phase8.ts`: بذر (كاشير/براند/منصة/منطقتين/مندوب/3 منتجات) + 4 أوردرات (كاش مع مندوب، فيزا مع مندوب، أونلاين بدون مندوب، ملغي) + مصروفين → مطابقة أرقام الملخص والمصفوفة والمناديب وأعلى المنتجات بالسنت → تنظيف كامل
- [x] `npm run typecheck` + `npm run lint` + `npm run test:e2e` + `npm run build` + `npx tsx scripts/verify-phase8.ts` — كلهم خضراء
- [x] تحديث `PROJECT_LOG.md` في نفس الـ commit

## Out of Scope (لاحقًا)

- تصدير PDF/Excel (FR-RPT-06 — Should): مرحلة منفصلة بعد استقرار التقارير نفسها
- تقارير الفرع/المخزون — غير موجودة في الـ schema أصلًا
