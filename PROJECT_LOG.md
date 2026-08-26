# PROJECT_LOG.md — Order Control System

> Architecture Decision Record مبسّط — يتحدث **في نفس اللحظة** مع أي تغيير (Directives §0).
> الإدخال الجديد فوق، والأقدم تحت.

---

## Open Questions
| السؤال | الحالة | مؤثر على |
|---|---|---|
| هيكل المنيو / Variants (عينات الرسيتات) | ⏳ منتظرين العميل | Product / OrderItem |
| القائمة النهائية للمنصات | ⏳ العيل يظبطها من UI | Platform seed |

## [2026-08-26] المرحلة 4 — واجهة نقطة البيع (POS) السريعة لإنشاء الطلبات للكاشير
**النوع:** Feature / UI
**اللي اتعمل:** بناء واجهة نقطة البيع السريعة `OrderForm` المتوافقة مع أجهزة التابلت والشاشات التي تعمل باللمس ودعم كامل لـ RTL/LTR:
1. `src/components/orders/order-form.tsx`:
   - اختيار البراند عبر pills تفاعلية مع جلب المنيو والتصنيفات ديناميكيًا من `/api/menu/categories?brandId=...`.
   - اختيار المنصة (Talabat, elmenus, InstaShop, HarryApp, Phone) وحقل معرف الطلب الخارجي.
   - البحث التلقائي السريع عن العميل بالهاتف مع debouncing والتعبئة التلقائية للبيانات والتمييز بين العميل الجديد والمسجل.
   - شبكة بطاقات الأصناف بالأسعار والأوصاف مع إضافة وزيادة سريعة للسلة.
   - سلة طلب متكاملة مع تعديل الكميات وحذف الأصناف.
   - اختيار منطقة التوصيل والطيار وحساب رسوم التوصيل الصافية لحظيًا.
   - اختيار طريقة الدفع (كاش / فيزا / أونلاين).
   - حقل الخصم مع فرض سبب الخصم وإظهار تنبيه الاعتماد حسب دور المستخدم (فوري للمدير / معلق للكاشير).
   - ملخص مالي فوري (المجموع الفرعي، الخصم، رسوم التوصيل، الإجمالي النهائي).
   - إرسال الطلب لـ `POST /api/orders` وعرض إشعارات نجاح `sonner` ومودال تأكيد بنقرة واحدة لإنشاء طلب جديد أو الانتقال لقائمة الطلبات.
2. `src/app/[locale]/(dashboard)/orders/new/page.tsx`: صفحة محمية لكافة الأدوار (`CASHIER`, `MANAGER`, `OWNER`) تجمّع البيانات الأولية.
3. `src/services/lookups.ts` و`src/app/api/lookups/route.ts`: خدمات وراوتات استرجاع المنصات ومناطق التوصيل والطيارين.
4. `src/messages/ar.json` و`src/messages/en.json`: ترجمات شاملة لجميع نصوص وفئات الطلبات وحالاتها وأسباب الإلغاء.
**السبب:** تحقيق متطلبات سرعة إدخال الطلبات للكاشير في أقل من 30 ثانية (FR-ORD-01, FR-ORD-06, UC-01).
**الملفات المتأثرة:** `src/components/orders/order-form.tsx`, `src/app/[locale]/(dashboard)/orders/new/page.tsx`, `src/services/lookups.ts`, `src/app/api/lookups/route.ts`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** تمهيد لواجهة جدول الطلبات الحية (Task 5).

## [2026-08-26] المرحلة 4 — راوتات الـ API للطلبات والخصومات والعملاء وفرض الصلاحيات
**النوع:** Feature / API
**اللي اتعمل:** بناء وتأمين جميع راوتات الـ API الخاصة بالطلبات والعملاء:
1. `src/app/api/orders/route.ts`: إنشاء الطلبات (POST) برقم تسلسلي وحسابات مالية وفحص Zod، واسترجاع الطلبات بفلترة متعددة (GET).
2. `src/app/api/orders/[id]/route.ts`: جلب تفاصيل الطلب الكاملة مع الأصناف والعميل والمندوب والمنصة وسجل الاعتمادات (GET).
3. `src/app/api/orders/[id]/status/route.ts`: تنفيذ انتقالات دورة حياة الطلب وتوثيق سبب الإلغاء الإجباري عند الإلغاء (PATCH).
4. `src/app/api/orders/[id]/discount/route.ts`: طلب وتطبيق الخصومات (PATCH).
5. `src/app/api/orders/[id]/discount/decide/route.ts`: اعتماد أو رفض طلبات الخصم المعلقة مقتصرة حصرًا على OWNER و MANAGER (POST).
6. `src/app/api/customers/search/route.ts`: البحث السريع عن العملاء برقم الهاتف للـ Cashier POS (GET).
تغليف كل الراوتات بـ `wrapApi` وتوحيد رسائل وأكواد الأخطاء `{ code, message }`، مع تغطية شاملة لمخططات Zod عبر `scripts/test-orders-api-schemas.ts`.
**السبب:** الالتزام الصارم بـ Single Source of Truth وسياسات الصلاحيات وحماية نقاط النهاية (Directives §0 و §3 و §8).
**الملفات المتأثرة:** `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/api/orders/[id]/status/route.ts`, `src/app/api/orders/[id]/discount/route.ts`, `src/app/api/orders/[id]/discount/decide/route.ts`, `src/app/api/customers/search/route.ts`, `src/lib/api.ts`, `scripts/test-orders-api-schemas.ts`
**تأثير على أجزاء تانية:** واجهات الكاشير والداشبورد الحية (Tasks 4 & 5) ستتصل مباشرة بهذه النقاط.

## [2026-08-26] المرحلة 4 — طبقة خدمات العملاء والطلبات وتسجيل الـ Audit الذري (Service Layer)
**النوع:** Feature / Service
**اللي اتعمل:** بناء طبقة الخدمات للعملاء `src/services/customers.ts` (`findOrCreateCustomer`, `searchCustomersByPhone`) والطلبات `src/services/orders.ts` (`createOrder`, `transitionOrderStatus`, `decideDiscount`, `requestDiscount`, `listOrders`, `getOrderById`). تضمن المنطق: أخذ أسعار Snapshot ثابتة لكل صنف، تصفير رسوم التوصيل لأسطول التطبيقات واستلام الفرع، توليد رقم يومي تسلسلي نظيف `ORD-YYYYMMDD-XXXX`، تطبيق سياسات الخصم التلقائي للمديرين وطلب الاعتماد `PENDING` للكاشير، وتوثيق سجل رقابي ذري `AuditLog` داخل نفس المعاملة `prisma.$transaction`.
**السبب:** الالتزام بقواعد هندسة النظام (Directives §2 و§3 و§4) بحصر الكتابة وقواعد الأعمال وسجل التدقيق الإجباري داخل طبقة الخدمات بدون أي تجاوز من الـ UI أو الراوتات.
**الملفات المتأثرة:** `src/services/customers.ts`, `src/services/orders.ts`, `src/lib/orderStateMachine.ts`, `scripts/test-orders-service.ts`
**تأثير على أجزاء تانية:** راوتات الـ API في `src/app/api/orders/` و`src/app/api/customers/` في المهام القادمة ستعتمد كليًا على دوال هذه الطبقة.

## [2026-08-26] المرحلة 4 — Order State Machine & Calculation Engine (Pure Logic)
**النوع:** Feature / Logic
**اللي اتعمل:** بناء منطق آلة حالات الطلبات `assertTransition` مع التحقق الصارم من الانتقالات الخطية، منع القفزات غير الشرعية، فرض سبب الإلغاء `cancelReason`، حظر الانتقال من الحالات النهائية `DELIVERED`/`CANCELLED`، وحساب إجماليات الأوردر وتصفير رسوم التوصيل لأسطول التطبيقات واستلام العميل `calculateOrderTotals`. تغطية كاملة باختبارات وحدة `scripts/test-order-logic.ts`.
**السبب:** الالتزام بقواعد Single Source of Truth (Directives §3) ومنع المنطق في شاشات الـ UI.
**الملفات المتأثرة:** `src/lib/orderStateMachine.ts`, `scripts/test-order-logic.ts`
**تأثير على أجزاء تانية:** طبقة الـ Services (`src/services/orders.ts`) وراوتات الـ API ستعتمد كليًا على هذه الدوال.

## [2026-08-25] اعتماد مواصفة مخطط البيانات وقواعد الفرض
**النوع:** Decision
**اللي اتعمل:** حسم التناقضات بين الشيت والتوثيق وكتابة المواصفة النهائية: سعر زون واحد (الأعمدة كانت قديم/جديد)، خصم بحالة NONE/PENDING/APPROVED/REJECTED على الـ Order نفسها (الوضعان: تطبيق مباشر بالمدير + طلب PENDING من الكاشير)، بدون رصيد خزنة تراكمي، المندوب يرجّع كل الكاش، البداية على نضيف بدون استيراد الإكسل.
**السبب:** قرارات Stakeholder جلسة 2026-08-25 بعد فحص فعلي لملف الإكسل؛ تبسيط الـ Schema وتجنب YAGNI مع الحفاظ على قابلية إضافة Variants لاحقًا.
**الملفات المتأثرة:** `docs/specs/2026-08-25-data-model-design.md`, `docs/plans/2026-08-25-phase1-foundation-plan.md`
**تأثير على أجزاء تانية:** كل مراحل التنفيذ القادمة مبنية على هذه المواصفة؛ لا seed file؛ مرحلة 1 تبدأ فورًا.

## [2026-08-25] إنشاء المستندات التأسيسية قبل أول كود
**النوع:** Decision
**اللي اتعمل:** توثيق SRS/NFR/Use Cases + قواعد هندسية ملزمة (ENGINEERING_DIRECTIVES.md) وخطة تنفيذ من 10 مراحل.
**السبب:** استبدال workflow الـ Google Sheets بنظام ويب يحتاج أساس متفق عليه قبل الكود؛ ضمان فهم موحد للأدوار وحالات الأوردر وقواعد الأمانة (No Hard Delete + Audit).
**الملفات المتأثرة:** `docs/SRS.md`, `docs/USE_CASES.md`, `docs/NON_FUNCTIONAL_REQUIREMENTS.md`, `ENGINEERING_DIRECTIVES.md`
**تأثير على أجزاء تانية:** لا يوجد

## [2026-08-25] Prisma 7 — نقل الـ connection URLs لـ prisma.config.ts
**النوع:** Decision
**اللي اتعمل:** اعتماد Prisma 7: الـ datasource في schema.prisma بدون url، وملف prisma.config.ts بيقرأ DIRECT_URL (أو DATABASE_URL كبديل) للـ migrations، والعميل runtime بيتعمل بـ @prisma/adapter-pg على الـ Transaction Pooler (:6543).
**السبب:** Prisma 7 شال url/directUrl من الـ schema — الترقية مقصودة للإصدار المستقر الحالي بدل التثبيت على إصدار قديم.
**الملفات المتأثرة:** prisma/schema.prisma, prisma.config.ts, src/lib/prisma.ts, .env.example, package.json
**تأثير على أجزاء تانية:** مرحلة 2 (Auth) هتستخدم نفس src/lib/prisma.ts

## [2026-08-25] المرحلة 1 مكتملة — الأساس شغال بدون داتابيز
**النوع:** Feature
**اللي اتعمل:** i18n عربي/إنجليزي (next-intl، ar افتراضي RTL، localePrefix as-needed) + خط Cairo + هيكل src/app/[locale] + proxy.ts (بديل middleware في Next 16) + هيكل src/lib (orderStateMachine بخريطة الانتقالات، audit وauth بتوقيعات ثابتة) + src/services/README بسياسة طبقة الخدمات.
**السبب:** تنفيذ خطة المرحلة 1 — الفرض المبكر لقواعد المواصفة في هياكل ثابتة يمنع إعادة كتابة لاحقًا.
**الملفات المتأثرة:** src/i18n/*, src/messages/*, src/proxy.ts, src/app/[locale]/*, src/lib/*, src/services/*
**تأثير على أجزاء تانية:** مرحلة 2 تبني requireRole على نفس التوقيع؛ متبقي من المرحلة: تطبيق migration أول ما DATABASE_URL/DIRECT_URL يتوفرا من Supabase

## [2026-08-25] تطبيق الـ migrations على Supabase + قفل RLS
**النوع:** Feature / Security
**اللي اتعمل:** migration init (15 جدول + 7 enum) ثم rls_lockdown: تفعيل RLS على كل الجداول وسحب كل صلاحيات anon/authenticated — الـ Data API مقفول تمامًا، والتطبيق يتصل كـ postgres owner مباشرة.
**السبب:** قاعدة Supabase الأساسية: أي جدول في schema مكشوف لازم RLS يتفعل افتراضيًا؛ منع أي وصول للبيانات خارج التطبيق.
**الملفات المتأثرة:** prisma/migrations/*, .env (غير مرفوع)
**تأثير على أجزاء تانية:** Phase 2 لو احتجنا Supabase APIs يضيف policies بدل فك القفل

## [2026-08-25] المرحلة 2 — Supabase Auth والأدوار
**النوع:** Feature / Decision
**اللي اتعمل:** تسجيل دخول Email+Password عبر @supabase/ssr (server-side في route handler عشان الكوكيز HttpOnly)؛ session refresh في proxy.ts مدموج مع next-intl؛ requireRole/requirePageUser بيقراو الدور من جدول User المحلي؛ bootstrap آمن لأول Owner (بشرط OWNER_EMAIL لو متاحة أو جدول فاضي) وأي إيميل غير معروف بيرفض وبيتسجل خروج فورًا.
**السبب:** الدور مصدره جدول User (المواصفة §4) مش JWT metadata القابلة للتعديل؛ الرفض الصريح للحسابات غير المضافة = Fail-Safe Defaults (Directives §4).
**الملفات المتأثرة:** src/lib/auth.ts, src/lib/supabase/*, src/services/users.ts, src/proxy.ts, src/app/api/auth/*, src/app/[locale]/login/*, src/app/[locale]/(dashboard)/*, src/components/auth/*, src/messages/*
**تأثير على أجزاء تانية:** كل API routes الجاية هتبني على requireRole؛ ملاحظة TDD: منطق المرحلة دي integration-heavy — التحقق عبر اختبار متصفح حي، والـ TDD النقي يبدأ من مرحلة الأوردرات

## [2026-08-25] إصلاح proxy matcher + اختبار E2E ناجح للمرحلة 2
**النوع:** Bug Fix / Verification
**اللي اتعمل:** راجعت matcher في proxy.ts كان شال استثناء api/ فكان الـ i18n middleware بيرد 404 على راوتات الـ API — رجّع الاستثناء. اختبار متصفح حي (Playwright) 14/14: redirect للـ login، رسالة خطأ باسورد غلط بالعربي، دخول Owner → داشبورد RTL، شارة الدور مالك، تبديل EN/LTR، خروج، وحماية الراوتات بعد الخروج.
**السبب:** أي مسار جديد في proxy لازم يستثني api/ وإلا الـ intl middleware يتدخل فيه.
**الملفات المتأثرة:** src/proxy.ts
**تأثير على أجزاء تانية:** كل API routes الجاية محمية تلقائيًا من تداخل الـ intl

## [2026-08-25] جولة صيانة قبل المرحلة 3
**النوع:** Bug Fix / Chore
**اللي اتعمل:** (1) LanguageSwitcher جديد بيبدّل اللغة مع الحفاظ على نفس الصفحة — كان اللينك ثابت على /login فالتبديل من الداشبورد بيرجّعك عربي، وكمان usePathname من next/navigation كان بيضاعف الـ prefix (/ar/en) — الحل نسخة next-intl. (2) .gitignore كان بيستبعد .env.example بسبب نمط .env.* — اتضاف !.env.example والملف رجع. (3) README.md بمعلومات التشغيل والقواعد. (4) تنظيف سيرفرات يتيمة من الاختبارات.
**السبب:** مراجعة شاملة قبل المرحلة 3؛ bug اللغة هيبان أول ما المستخدم يبدل من جوه النظام.
**الملفات المتأثرة:** src/components/language-switcher.tsx, src/app/[locale]/(dashboard)/layout.tsx, src/app/[locale]/login/page.tsx, .gitignore, .env.example, README.md
**تأثير على أجزاء تانية:** الشاشات الجاية تستخدم LanguageSwitcher في أي header

## [2026-08-25] رفض Star Schema — الإبقاء على المخطط التشغيلي الطبيعي
**النوع:** Decision
**اللي اتعمل:** قرار بعدم إضافة مخطط نجمي (dimensional model) — قاعدة البيانات تفضل OLTP مطبيعية كما هي في المواصفة، والتقارير استعلامات تجميع مباشرة بـ indexes.
**السبب:** الحجم الحالي ~45-100 أوردر/يوم يعني ~150k صف بعد 5 سنين — استعلامات PostgreSQL بسيطة تديرها في مللي ثانية؛ الـ star schema يضيف مخططين متزامنين وETL بدون أي مكسب بهذا الحجم، ويخالف YAGNI. مسار الترقية المستقبلي (لو تعددت الفروع): materialized views ← read replica ← طبقة تحليلية منفصلة.
**الملفات المتأثرة:** لا يوجد (قرار بعدم تغيير)
**تأثير على أجزاء تانية:** مرحلة 8 (التقارير) تبني على استعلامات مباشرة + indexes الموجودة في الـ schema

## [2026-08-25] بدء المرحلة 3 — إدارة المنيو
**النوع:** Feature
**اللي اتعمل:** كتابة خطة المرحلة 3 (docs/plans/2026-08-25-phase3-menu-plan.md) + AGENTS.md للجلسات الجاية + تحديث قسم الأسئلة المعلقة في ENGINEERING_DIRECTIVES (4 من 5 اتحسموا). قرار: بناء المنيو الآن بالنموذج البسيط (Category+Product) — الرسيتات المعلقة بتأثر على Variants فقط كإضافة لاحقة، والعميل هيدخل بيانات منيوه بنفسه من UI.
**السبب:** المرحلة 4 (الأوردرات) معتمدة على وجود منتجات؛ الانتظار بيأجل كل حاجة بدون مكسب.
**الملفات المتأثرة:** AGENTS.md, ENGINEERING_DIRECTIVES.md, docs/plans/2026-08-25-phase3-menu-plan.md
**تأثير على أجزاء تانية:** Variants لما توصل الرسيتات = جداول جديدة بدون تعديل Category/Product
