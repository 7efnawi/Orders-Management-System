# AGENTS.md — Order Control System

نظام ويب لإدارة طلبات dark kitchen سوشي (4 براندات × 6 منصات: Talabat, InstaShop, Harry App, Elmenus, Facebook, Phone). Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Prisma 7 + Supabase (Postgres + Auth). عربي RTL افتراضي + إنجليزي.

## الأوامر

- `npm run dev` — سيرفر التطوير (port 3000)
- `npm run typecheck` — **البوابة الإجبارية** — `tsc --noEmit` لازم يعدّي قبل أي commit (الـ build بيشغله تلقائيًا كذلك)
- `npm run lint` — ESLint (flat config)
- `npm run build` — إنتاج (Turbopack) — بيفشل لو typecheck فشل
- `npx prisma migrate dev --name <x>` — تطبيق تغييرات الـ schema (بيستخدم `DIRECT_URL` من `prisma.config.ts`)
- `npm run test:e2e` — سويت اختبارات منطقية مخصص بـ tsx (`tests/e2e/run-all.ts`، 4 tiers + adversarial) — مفيش Playwright/pytest. سكربتات بوابة المراحل: `npx tsx scripts/verify-phase4.ts` … `verify-phase7.ts`

## قواعد المشروع الملزمة (من ENGINEERING_DIRECTIVES.md)

1. **`PROJECT_LOG.md` في الجذر يتحدث في نفس الـ commit** مع أي: تعديل schema، قرار معماري، ميزة جديدة، إجابة عميل — مش "بعدين"
2. منطق الأعمال في `src/lib/` (حسابات، قواعد) و`src/services/` (الكتابة على الداتابيز) — **ممنوع منطق في الـ UI**
3. **Single Source of Truth:**
   - انتقالات الأوردر → `src/lib/orderStateMachine.ts`
   - الـ Audit → `src/lib/audit.ts` يُستدعى من `src/services/` فقط، داخل نفس transaction
   - الصلاحيات → `src/lib/auth.ts` (`requireRole`) في أول سطر من كل API route
4. **No Hard Delete** لأي أوردر — إلغاء بسبب إجباري فقط. الـ Lookup tables بـ `isActive=false`
5. أي كتابة على Order تمر من `src/services/orders.ts` — ممنوع Prisma مباشر من الصفحات/الراوتات
6. **تصدير الإكسل `.xlsx` فقط (Native Excel):** أي تصدير إكسل يجب أن يولّد ملف `.xlsx` حقيقي أصلي عبر `exceljs` مع تفعيل اتجاه RTL (`rightToLeft: true`) وتنسيق الهواتف كنص وتلوين الشرائح والـ KPIs، وتجنب الـ `.csv`.
7. **تناظر الترجمة الصارم (i18n Symmetry):** أي مفتاح يُستدعى بـ `t("...")` يجب أن يُضاف متناظراً في `ar.json` و `en.json` فوراً لمنع أخطاء `MISSING_MESSAGE`.
8. **نموذج الدارك كيتشن 100% دليفري:** كل العمليات توصيل دليفري فقط (ممنوع Pickup/Takeaway/Dine-in).
9. **تناظر الجداول والحاويات:** شاشات التحكم بحاوية `max-w-[1536px]`، وجداول البيانات بـ `table-fixed w-full` ونسب مئوية مجموعها 100%.

## فخاخ تقنية (اتدفع ثمنها قبل كده — اقراها)

- **PowerShell يتعامل مع `[locale]` كـ wildcard!** أي عملية ملفات على مسارات `src/app/[locale]/` لازم `-LiteralPath`. حذف بدون LiteralPath فشل بصمت مرة وخرب البناء (صفحة قديمة فضلت تترندر)
- **`src/proxy.ts`** هو الـ middleware في Next 16 (مش `middleware.ts`). الـ matcher **لازم يستثني `api`** — لو اتشال، الـ i18n middleware بيرد 404 على كل API routes
- **Prisma 7:** الـ connection URLs في `prisma.config.ts` مش في الـ schema. الـ client بيتعمل بـ adapter: `new PrismaClient({ adapter: new PrismaPg({...}) })` — شوف `src/lib/prisma.ts`
- **الـ i18n:** استخدم `usePathname` من `@/i18n/navigation` (بتشيل locale prefix) — نسخة `next/navigation` بتضاعفه (`/ar/en`)
- **تبديل اللغة:** مكوّن `src/components/language-switcher.tsx` — يعيد استخدام مش لينكات ثابتة على `/login`
- سيرفرات يتيمة (node.exe من dev/اختبارات سابقة) تفضل ماسكة البورتات — قبل ما تحكم إن في bug، اتأكد إن مفيش `node.exe` قديم (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`)

## قاعدة البيانات (Supabase)

- الاتصال: `DATABASE_URL` (pooler :6543) للـ runtime، `DIRECT_URL` (:5432) للـ migrations — الاتنين في `.env` (غير مرفوع، المرجع `.env.example`)
- **RLS مفعّل deny-all على كل الجداول** — التطبيق بيتصل كـ postgres owner مباشرة. لو احتجنا Supabase APIs مستقبلًا: أضف policies، متفكرش الـ RLS
- Bootstrap أول Owner: أول login بيتسجل تلقائيًا Owner (بشرط `OWNER_EMAIL` لو متاحة) — باقي المستخدمين من UI الأونر (Phase 10)
- الجداول بأسماء الـ models كما هي (PascalCase، بدون `@@map`) — استعلام SQL يدوي يحتاج quotes: `"User"`

## التدفق

- كل المحتوى ديناميكي من الداتابيز — مفيش hardcoded copy في الشاشات
- الترجمة: `src/messages/ar.json` + `en.json` — أي نص UI جديد في الاتنين
- المسارات: `src/app/[locale]/(dashboard)/...` — راوت جديد فوق أي catch-all، والحماية في الـ layout عبر `requirePageUser()`
- الـ API: `src/app/api/...` — بره `[locale]`، بترجع أخطاء `{ code, message }`

## المراجع

- المواصفة: `docs/specs/2026-08-25-data-model-design.md` (المخطط الملزم)
- المتطلبات: `docs/SRS.md` • حالات الاستخدام: `docs/USE_CASES.md` • NFR: `docs/NON_FUNCTIONAL_REQUIREMENTS.md`
- خطط التنفيذ: `docs/plans/`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
