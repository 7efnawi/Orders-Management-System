# PROJECT_LOG.md — Order Control System

> Architecture Decision Record مبسّط — يتحدث **في نفس اللحظة** مع أي تغيير (Directives §0).
> الإدخال الجديد فوق، والأقدم تحت.

---

## Open Questions
| السؤال | الحالة | مؤثر على |
|---|---|---|
| هيكل المنيو / Variants (عينات الرسيتات) | ⏳ منتظرين العميل | Product / OrderItem |
| القائمة النهائية للمنصات | ⏳ العيل يظبطها من UI | Platform seed |

## [2026-08-26] المرحلة 5 — واجهات إدارة التوصيل والمناطق والمناديب ثنائية اللغة (Delivery Management UI)
**النوع:** Feature / UI
**اللي اتعمل:** بناء واجهات متكاملة وتفاعلية لإدارة التوصيل والمناطق والمناديب مع الدعم الكامل للغتين العربية والإنجليزية:
1. ترجمة ثنائية كاملة في `src/messages/ar.json` و `src/messages/en.json` تحت namespace `delivery`:
   - التبويبات، رؤوس الجداول، رسائل النماذج، التحقق، أنواع المناديب (`OWN`, `APP`, `EXTERNAL`, `PICKUP`)، وإشعارات Sonner.
2. بناء مودال إدارة مناطق التوصيل `src/components/delivery/zone-dialog.tsx`:
   - إضافة وتعديل المناطق مع التحقق عبر Zod من الاسم والرسوم (`fee >= 0`).
   - الاتصال بـ `POST /api/delivery/zones` و `PATCH /api/delivery/zones/[id]`.
3. بناء مودال إدارة المناديب `src/components/delivery/driver-dialog.tsx`:
   - إضافة وتعديل المناديب مع التحقق عبر Zod واختيار أسطول المندوب.
   - الاتصال بـ `POST /api/delivery/drivers` و `PATCH /api/delivery/drivers/[id]`.
4. بناء مكوّن لوحة إدارة التوصيل الرئيسي `src/components/delivery/delivery-client.tsx`:
   - تبويبات سريعة للمناطق والمناديب مع عدادات حية.
   - بحث فوري وفلاتر نوع الأسطول وحالة التفعيل (الكل / النشط / الموقوف).
   - جداول وبطاقات متجاوبة (Responsive Table + Mobile Cards) مع مفاتيح التفعيل الفوري (Optimistic Status Switch) وأزرار التعديل.
   - ألوان مميزة لكل نوع أسطول ومؤشرات للحالات الموقوفة.
5. صفحة التوصيل المحمية `src/app/[locale]/(dashboard)/delivery/page.tsx`:
   - قصر الوصول على `OWNER` و `MANAGER` وتوجيه الكاشير تلقائيًا للرئيسية.
   - جلب البيانات الأولية من طبقة الخدمات وتمريرها للواجهة.
6. إضافة رابط التوصيل في شريط التنقل الرئيسي `src/app/[locale]/(dashboard)/layout.tsx` للمدير والمالك.
**السبب:** توفير تجربة مستخدم سلسة واستجابة فورية للمديرين وأصحاب المطعم لإدارة مناطق التوصيل والمناديب بسهولة (SRS §FR-DEL, USE_CASES UC-09, UC-11).
**الملفات المتأثرة:** `src/messages/ar.json`, `src/messages/en.json`, `src/components/delivery/zone-dialog.tsx`, `src/components/delivery/driver-dialog.tsx`, `src/components/delivery/delivery-client.tsx`, `src/app/[locale]/(dashboard)/delivery/page.tsx`, `src/app/[locale]/(dashboard)/layout.tsx`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال الواجهات المخصصة لإدارة التوصيل، والتمهيد لمودال إسناد السائق في جدول الطلبات (Task 4).

## [2026-08-26] المرحلة 5 — راوتات الـ API لإدارة التوصيل والمناطق والمناديب وإسناد الطلبات (Delivery API Endpoints)
**النوع:** Feature / API
**اللي اتعمل:** بناء وتأمين راوتات الـ API الخاصة بنظام التوصيل مع الفحص والتحقق الصارم عبر Zod والصلاحيات:
1. `GET /api/delivery/zones`:
   - متاح لـ (`OWNER`, `MANAGER`, `CASHIER`).
   - استرجاع مناطق التوصيل مع دعم معامل `includeInactive`.
2. `POST /api/delivery/zones`:
   - متاح لـ (`OWNER`, `MANAGER`) فقط ورفض الكاشير بـ 403.
   - التحقق من البيانات عبر Zod (`name: min(1)`, `fee: nonnegative()`) وإنشاء المنطقة وتسجيل الـ Audit.
3. `PATCH /api/delivery/zones/[id]`:
   - متاح لـ (`OWNER`, `MANAGER`) فقط.
   - تعديل المنطقة (`name`, `fee`, `isActive`) مع التحقق عبر Zod وتسجيل الـ Audit.
4. `GET /api/delivery/drivers`:
   - متاح لـ (`OWNER`, `MANAGER`, `CASHIER`).
   - استرجاع المناديب مع دعم معاملات `includeInactive` ونوع المندوب `type` (`OWN`, `APP`, `EXTERNAL`, `PICKUP`).
5. `POST /api/delivery/drivers`:
   - متاح لـ (`OWNER`, `MANAGER`) فقط.
   - التحقق من البيانات عبر Zod (`name: min(1)`, `type: DriverType`) وإنشاء المندوب وتسجيل الـ Audit.
6. `PATCH /api/delivery/drivers/[id]`:
   - متاح لـ (`OWNER`, `MANAGER`) فقط.
   - تعديل بيانات المندوب (`name`, `type`, `isActive`) مع التحقق عبر Zod وتسجيل الـ Audit.
7. `PATCH /api/orders/[id]/driver`:
   - متاح لـ (`OWNER`, `MANAGER`, `CASHIER`).
   - إسناد مندوب للطلب مع التحقق من صحة `driverId` كـ UUID وإعادة احتساب رسوم التوصيل تلقائيًا وتوثيق الـ AuditLog.
8. ترقية معالج الأخطاء الموحّد `wrapApi` في `src/lib/api.ts` للتعامل تلقائيًا مع أخطاء التوصيل ونطاق العمليات (`*_NOT_FOUND`, `INVALID_*`, `DRIVER_INACTIVE`).
9. إنشاء سكريبت فحص واختبار مخططات التحقق `scripts/test-delivery-api-schemas.ts`.
**السبب:** توفير واجهات برمجية آمنة ومحمية للصلاحيات تفصل منطق الأعمال وتسمح للواجهات الأمامية بإدارة التوصيل وإسناد المناديب بسلاسة (Directives §2, §3, §5).
**الملفات المتأثرة:** `src/app/api/delivery/zones/route.ts`, `src/app/api/delivery/zones/[id]/route.ts`, `src/app/api/delivery/drivers/route.ts`, `src/app/api/delivery/drivers/[id]/route.ts`, `src/app/api/orders/[id]/driver/route.ts`, `src/lib/api.ts`, `scripts/test-delivery-api-schemas.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** تمهيد لواجهات إدارة التوصيل (Task 3: Delivery Management UI) ومودال إسناد المناديب في شاشات الطلبات (Task 4).

## [2026-08-26] المرحلة 5 — طبقة خدمات التوصيل والمناطق والمناديب وسجل التدقيق الذري (Delivery Service Layer)
**النوع:** Feature / Service
**اللي اتعمل:** بناء طبقة خدمات التوصيل `src/services/delivery.ts` لإدارة مناطق التوصيل والمناديب وتعيين المناديب للطلبات:
1. `listDeliveryZones(includeInactive)` و `createDeliveryZone` و `updateDeliveryZone`:
   - استرجاع المناطق وفلترتها وترتيبها أبجديًا.
   - التحقق من الاسم وسعر التوصيل (fee >= 0).
   - توثيق عمليات الإنشاء والتعديل ذرّيًا في `AuditLog` داخل نفس المعاملة `prisma.$transaction`.
2. `listDeliveryDrivers(includeInactive, type)` و `createDeliveryDriver` و `updateDeliveryDriver`:
   - استرجاع المناديب وفلترتهم بالنوع (`OWN`, `APP`, `EXTERNAL`, `PICKUP`) وحالة التفعيل.
   - التحقق من صحة الاسم ونوع المندوب.
   - توثيق عمليات الإنشاء والتعديل ذرّيًا في `AuditLog` داخل نفس المعاملة `prisma.$transaction`.
3. `assignDriverToOrder(userId, orderId, driverId)`:
   - التحقق من وجود الطلب والمندوب وكون المندوب نشطًا `isActive: true`.
   - تحديث `driverId` للطلب.
   - إعادة احتساب رسوم التوصيل الصافية تلقائيًا: تصفير الرسوم لأسطول التطبيقات `APP` والاستلام `PICKUP`، أو استرجاع رسوم المنطقة لأسطول المطعم `OWN` أو الخارجي `EXTERNAL`.
   - توثيق سجل التدقيق `AuditLog` لإسناد المندوب وتغير الرسوم مع تسجيل القيم السابقة والجديدة.
4. إنشاء سكريبت اختبارات وفحص القواعد `scripts/test-delivery-service.ts` والتحقق من اجتياز كافة القواعد ونقاط الفحص.
**السبب:** الالتزام بقواعد هندسة النظام (Directives §2 و§3 و§4) وحصر كافة عمليات كتابة وتعديل التوصيل وتعيين المناديب والرسوم وسجل التدقيق داخل طبقة الخدمات.
**الملفات المتأثرة:** `src/services/delivery.ts`, `scripts/test-delivery-service.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** تمهيد لبناء راوتات الـ API الخاصة بالتوصيل في `src/app/api/delivery/` و`src/app/api/orders/[id]/driver/` (Task 2).

## [2026-08-26] اكتمال المرحلة 4 — نظام إدارة الطلبات وسجل التدقيق المركزي (Phase 4 Verification & Gate Passed)
**النوع:** Verification / Milestone
**اللي اتعمل:**
1. إنشاء سكريبت التحقق الشامل الآلي `scripts/verify-phase4.ts` لمحاكاة دورة حياة الطلبات كاملة مع قاعدة البيانات والخدمات:
   - فحص وتجهيز البيانات المرجعية (براند، تصنيف، أصناف، منصة، منطقة توصيل، مستخدم كاشير، مستخدم مدير).
   - إنشاء طلب جديد Order A بصنفي سوشي وحساب رسوم التوصيل والتحقق من رقم الطلب التسلسلي `ORD-YYYYMMDD-XXXX`، وتثبيت لقطات الأسعار الثابتة `OrderItem.unitPrice`، وتسجيل حدث `CREATE` في `AuditLog`.
   - ترقية حالة الطلب عبر المسار الشرعي المتسلسل (`NEW` -> `CONFIRMED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) مع التحقق من توثيق الطوابع الزمنية في كل خطوة وتسجيل 5 أحداث `STATUS_CHANGE` في سجل التدقيق.
   - التحقق من رفض أي قفزات أو انتقالات غير شرعية من الحالة النهائية `DELIVERED` ومنع الإلغاء أو الرجوع للخلف.
   - إنشاء الطلب Order B ومحاكاة الإلغاء مع فرض سبب الإلغاء الإجباري `CancelReason` وتوثيق حدث `CANCEL` في `AuditLog`.
   - إنشاء الطلب Order C مع خصم من قِبل الكاشير والتأكد من تحوله لحالة التعليق `PENDING`.
   - اعتماد الخصم على الطلب Order C بواسطة المدير والتحقق من تحول الحالة إلى `APPROVED` وتوثيق حدث `DISCOUNT_APPROVE` في `AuditLog`.
   - فحص استعلامات الفلترة المتعددة `listOrders` بالبراند، المنصة، الحالة، والبحث برقم الطلب وهاتف العميل، وجلب التفاصيل الكاملة `getOrderById`.
2. تشغيل السكريبت ونجاحه بنسبة 100% (8/8 خطوات).
3. اجتياز بوابات الفحص الكاملة بنجاح تام:
   - `npm run typecheck` (`tsc --noEmit` — 0 أخطاء)
   - `npm run lint` (`eslint` — 0 أخطاء)
   - `npm run build` (`next build` مع Next.js 16 و Turbopack — بناء سليم 22/22 مسار)
**السبب:** التحقق الشامل من تكامل محرك الطلبات وسجل التدقيق والامتثال لقواعد المواصفة ووثائق المتطلبات (FR-ORD, FR-AUD, FR-CUST, UC-01 .. UC-07).
**الملفات المتأثرة:** `scripts/verify-phase4.ts`, `package.json`, `docs/plans/2026-08-26-phase4-orders-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال المرحلة 4 بالكامل والجاهزية للانتقال إلى المرحلة 5 (المصروفات والشيفتات والإغلاق اليومي - Cash & Shifts & Expenses).

## [2026-08-26] المرحلة 4 — لوحة متابعة الطلبات الحية ومودالات سير العمل (Live Orders Dashboard & Modal Workflows)
**النوع:** Feature / UI
**اللي اتعمل:** بناء شاشات ومودالات متابعة الطلبات الحية مع التفاعل الفوري وترقية الحالات:
1. `src/components/orders/orders-table.tsx`:
   - لوحة تفاعلية متجاوبة (جدول للشاشات الكبيرة + بطاقات للشاشات الصغيرة والتابلت) لمتابعة الطلبات وتحديثها لحظيًا.
   - تبويبات سريعة للحالات (الكل، النشطة، تم التسليم، الملغاة) مع عدادات أوردرات حية.
   - تصفية متعددة بالبراند، المنصة، التاريخ، والبحث النصي برقم الطلب والهاتف واسم العميل.
   - زر بنقرة واحدة (1-click action) للانتقال للحالة التالية الشرعية (`NEW` -> `CONFIRMED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
   - تنبيه فوري ومميز للخصومات المعلقة `PENDING` مع زر مخصص للمدير/المالك لفتح نافذة الاعتماد.
   - دعم التحديث التلقائي الدوري (Polling كل 15 ثانية) وإمكانية التحديث اليدوي الفوري.
2. `src/components/orders/cancel-dialog.tsx`:
   - مودال إجباري لاختيار سبب الإلغاء `CancelReason` من الخيارات المعتمدة وتأكيد الإلغاء عبر `PATCH /api/orders/[id]/status`.
3. `src/components/orders/discount-dialog.tsx`:
   - مودال مخصص للمدير/المالك لاتخاذ قرار اعتماد أو رفض الخصم `APPROVED` / `REJECTED` عبر `POST /api/orders/[id]/discount/decide`.
4. `src/components/orders/order-details-modal.tsx`:
   - مودال تفصيلي لعرض الطلب، الخط الزمني للتوقيتات، لقطة الأصناف بالأسعار الثابتة، والبيانات المالية وملاحظات العميل والمطبخ.
5. `src/app/[locale]/(dashboard)/orders/page.tsx`:
   - صفحة لوحة متابعة الطلبات المحمية والمربوطة بالخدمات والصلاحيات وزر إنشاء طلب جديد.
6. `src/messages/ar.json` و `src/messages/en.json`:
   - إضافة كافة مفاتيح الترجمة للوحة والمودالات باللغتين العربية والإنجليزية.
**السبب:** تحقيق متطلبات إدارة ومتابعة الطلبات المباشرة وسير العمل للمطبخ والطيارين واعتماد الخصومات (FR-ORD-02, FR-ORD-03, FR-ORD-05, UC-02, UC-03, UC-04, UC-05).
**الملفات المتأثرة:** `src/components/orders/orders-table.tsx`, `src/components/orders/cancel-dialog.tsx`, `src/components/orders/discount-dialog.tsx`, `src/components/orders/order-details-modal.tsx`, `src/app/[locale]/(dashboard)/orders/page.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال واجهات المرحلة 4 والجاهزية لاختبارات التحقق الشاملة (Task 6).

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
