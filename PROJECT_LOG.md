# PROJECT_LOG.md — Order Control System

> Architecture Decision Record مبسّط — يتحدث **في نفس اللحظة** مع أي تغيير (Directives §0).
> الإدخال الجديد فوق، والأقدم تحت.

---

## Open Questions
| السؤال | الحالة | مؤثر على |
|---|---|---|
| القائمة النهائية للمنصات | ✅ حُسمت (Talabat, InstaShop, Harry App, Elmenus, Facebook, Phone) | Platform seed & Visual Tokens |

## [2026-09-12] إدارة العملاء — شاشة الدليل ولوحة مؤشرات الـ CRM والتنقل الثابت (Customer Directory Dashboard, Filter Bar, Fixed Table & Navigation)
**النوع:** UI/UX Architecture & Enterprise CRM Dashboard (TDD, Task 11.4)
**الدافع والمشكلة:**
- يحتاج فريق التشغيل (الكاشير، المدير، والمالك) إلى لوحة تحكم تنفيذية مركزية لاستعراض العملاء، تتبع نمو القاعدة الجماهيرية ونسب كبار العملاء VIP، والوصول الفوري لأي عميل بالاسم أو رقم الهاتف.
- الحاجة لتوفير فلترة ذكية لعزل "العملاء أصحاب المشاكل" لحل شكاواهم استباقياً، وفلترة العملاء حسب شرائح الولاء (Bronze/Silver/Gold/Platinum/New).
- ضمان ثبات تخطيط الجدول التشغيلي عبر `table-fixed` لمنع اهتزاز الأعمدة، وعزل اتجاه أرقام الهواتف عبر `dir="ltr"` لمنع أي تشوه بصري للأرقام في اتجاه الـ RTL.
- تضمين رابط العملاء في شريط التنقل العلوي (`/customers`) مع الحفاظ الصارم على معيار عدم تداخل شريط التنقل (Zero-Overlap Invariant).
**اللي اتعمل:**
- **بناء بطاقات المؤشرات التنفيذية `src/components/customers/customer-kpi-cards.tsx`:**
  - 4 بطاقات تفاعلية أنيقة: إجمالي العملاء، الجدد هذا الشهر، كبار العملاء (VIP)، ومتوسط إنفاق العميل بالجنيه المصري (EGP).
  - دعم كامل للوضع الداكن والتدرجات اللونية المعبرة وأرقام بخطوط `font-mono` و `tabular-nums`.
- **بناء شريط البحث والفلترة `src/components/customers/customer-filter-bar.tsx`:**
  - حقل بحث فوري يدعم الاسم ورقم الهاتف مع زر مسح سريع.
  - قائمة منسدلة لاختيار شريحة الولاء (كافة الشرائح، جدد، برونزي، فضي، ذهبي، بلاتيني).
  - زر تبديل بارز عالي التباين لعزل العملاء أصحاب المشاكل (`hasProblemsOnly`) مع أيقونة تنبيه ملفتة.
  - زري التحديث التلقائي وإعادة الضبط.
- **بناء جدول العملاء المتناظر `src/components/customers/customer-table.tsx`:**
  - استخدام `table-fixed w-full` مع نسب عرض محددة لكل عمود لمنع انكسار التخطيط.
  - وسم رقم الهاتف معزول الاتجاه `dir="ltr"` مع إمكانية النسخ بنقرة واحدة وتأكيد بصري فوري.
  - أوسمة ملونة لكل شريحة ولاء، وعدّاد الطلبات مع وسم تحذيري لأي عميل لديه طلبات مشاكل سابقة.
  - تذييل ترقيم مرن يدعم التنقل السريع بين الصفحات.
- **بناء المكون العميل الرئيسي `src/components/customers/customers-client.tsx`:**
  - تنظيم حالة البحث مع Debounce بمقدار 300ms لترشيد الاستعلامات نحو `/api/customers`.
  - إدارة متزامنة لحالات الفلترة والترقيم والتحميل.
- **بناء صفحة الخادم `src/app/[locale]/(dashboard)/customers/page.tsx`:**
  - حماية المسار عبر `requirePageUser()` مع التحقق من الأدوار (OWNER, MANAGER, CASHIER).
  - الجلب المسبق للبيانات الأولية عبر `listCustomers` مع تأمين التسلسل للـ App Router.
- **تحديث شريط التنقل `src/components/layout/dashboard-header.tsx`:**
  - إضافة أيقونة `Contact` وعنصر التنقل `/customers` في `coreDesktopNavItems` بعد الأوردرات مباشرة لكافة الأدوار التشغيلية.
  - الحفاظ التام على قيود `min-w-0`, `no-scrollbar`, `overflow-x-auto` وحماية الشاشات الصغيرة.
- **الاختبارات وبوابات الجودة (TDD):**
  - إضافة الاختبار `C7.20` في `tests/e2e/tier3-cross-feature.test.ts`.
  - التحقق من طور الفشل (Red phase) ثم اجتياز الاختبار بنجاح (Green phase).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (225/225 اختبار، 100%).
**الملفات المتأثرة:** `src/components/customers/customer-kpi-cards.tsx`, `src/components/customers/customer-filter-bar.tsx`, `src/components/customers/customer-table.tsx`, `src/components/customers/customers-client.tsx`, `src/app/[locale]/(dashboard)/customers/page.tsx`, `src/components/layout/dashboard-header.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-12] إدارة العملاء — قواميس الترجمة ثنائية اللغة والتوطين المتناظر (Bilingual Customer CRM Translation Dictionaries)
**النوع:** Internationalization & UI Localization (TDD, Task 11.3)
**الدافع والمشكلة:**
- توفير تجربة مستخدم عربية كاملة وثرية مع تناظر دقيق باللغة الإنجليزية لوحدة إدارة العملاء وقاعدة بيانات الـ CRM، طبقاً لمعايير التصميم الرفيعة `/ui-ux-pro-max` و `/frontend-design`.
- توطين شامل لمؤشرات الأداء الرئيسية (KPIs)، فلاتر البحث والشرائح، جداول استعراض العملاء، وسام شرائح الولاء، تنبيهات الطلبات المشاكل، ومحرر ملاحظات العميل.
**اللي اتعمل:**
- **إضافة ترجمات شريط التنقل (`nav.customers`):**
  - إضافة `"customers": "العملاء"` في `src/messages/ar.json`.
  - إضافة `"customers": "Customers"` في `src/messages/en.json`.
- **بناء النطاق الكامل لترجمات العملاء (`customers` namespace):**
  - شمل المفاتيح الرئيسية للواجهة: `title`, `subtitle`.
  - مؤشرات الأداء: `kpis` (`totalCustomers`, `newThisMonth`, `vipCount`, `avgSpent`).
  - الفلاتر وأدوات التحكم: `filters` (`searchPlaceholder`, `allTiers`, `tierNew`, `tierBronze`, `tierSilver`, `tierGold`, `tierPlatinum`, `hasProblemsOnly`, `reset`, `refresh`).
  - جدول العملاء: `table` (`customer`, `phone`, `tier`, `ordersCount`, `lastOrder`, `actions`, `viewProfile`, `empty`, `showingResults`, `problemBadge`, `page`, `of`, `previous`, `next`).
  - وسوم شرائح الولاء: `tiers` (`NEW`, `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`).
  - صفحة البروفايل وفاحص المشاكل: `profile` (`backToList`, `basicInfo`, `firstOrder`, `lastOrder`, `lifetimeSpent`, `totalOrders`, `aov`, `preferredBrand`, `notesTitle`, `notesPlaceholder`, `saveNotes`, `savingNotes`, `notesSaved`, `notesError`, `orderHistory`, `problemOrdersTitle`, `problemOrdersDesc`, `noOrders`, `call`, `copyPhone`, `phoneCopied`, `address`, `noAddress`, `orderNumber`, `brand`, `platform`, `status`, `total`, `date`, `cancelReason`, `deliveryNotes`, `items`, `noProblems`, `problemCancelled`, `problemDelivery`, `problemQuality`).
- **الاختبارات وبوابات الجودة (TDD):**
  - إضافة الاختبار `C7.19` في `tests/e2e/tier3-cross-feature.test.ts`.
  - التحقق من طور الفشل (Red phase) ثم اجتياز الاختبار بنجاح (Green phase).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (224/224 اختبار، 100%).
**الملفات المتأثرة:** `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-12] إدارة العملاء — مسارات الـ API المحمية وسجل التدقيق وحظر الحذف (Customer CRM API Routes, RBAC Protection & Deletion Immutability)
**النوع:** API Architecture & Role-Based Security (TDD, Task 11.2)
**الدافع والمشكلة:**
- توفير واجهات برمجية آمنة ومحمية بالصلاحيات تسمح للأدوار التشغيلية (المالك والمدير والكاشير) بالبحث في قاعدة بيانات العملاء واسترجاع الملف الشخصي الشامل وتحديث الملاحظات والبيانات.
- فرض الالتزام الصارم بقواعد عدم الحذف النهائي (No Hard Delete): منع أي محاولة لحذف سجلات العملاء عبر واجهة برمجة التطبيقات وإرجاع كود `405 Method Not Allowed`.
- التحقق الإجباري من مدخلات الاستعلام والتعديل باستخدام مخططات Zod لضمان سلامة البيانات وحماية النظام من القيم غير الصالحة.
**اللي اتعمل:**
- **بناء مسار مجموعة العملاء `src/app/api/customers/route.ts`:**
  - بناء وتصدير مخطط التحقق `customerQuerySchema`: يفرض قيود الترقيم الافتراضية (`page: 1`, `limit: 25`, بحد أقصى `100`) والتحقق من نصوص البحث وشرائح الولاء وحالة الطلبات المشاكل.
  - تأمين معالج `GET` بفحص الأدوار `requireApiRole("OWNER", "MANAGER", "CASHIER")` وتمرير الاستعلام لطبقة الخدمات `listCustomers`.
  - تطبيق معالجات الرفض الصارم `POST`, `PUT`, `PATCH`, و `DELETE` مع إرجاع كود `405 Method Not Allowed` ورسالة خطأ توضح حظر حذف أو تعديل المجموعة عشوائياً.
- **بناء مسار ملف العميل `src/app/api/customers/[id]/route.ts`:**
  - معالج `GET`: التحقق من صلاحية المستخدم واستدعاء `getCustomerProfile(id)`، وإرجاع كود `404` عند عدم وجود العميل أو `200` مع الملف الشامل للعميل وسجل طلباته ومؤشراته.
  - معالج `PATCH`: التحقق من الصلاحيات وتدقيق جسم الطلب عبر `updateCustomerBodySchema` (لتعديل الملاحظات أو العنوان أو الاسم)، واستدعاء خدمة التحديث مع تسجيل التغيير فورياً في `AuditLog` باسم المستخدم المنفذ.
  - معالج `DELETE`: إرجاع `405 Method Not Allowed` لضمان عدم حذف أي عميل نهائياً.
- **الاختبارات وبوابات الجودة (TDD):**
  - إضافة الاختبار `F17.6` في `tests/e2e/tier1-feature-coverage.test.ts` والتحقق من طور الفشل (Red phase) ثم النجاح التام (Green phase).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (223/223 اختبار، 100%).
**الملفات المتأثرة:** `src/app/api/customers/route.ts`, `src/app/api/customers/[id]/route.ts`, `tests/e2e/tier1-feature-coverage.test.ts`, `PROJECT_LOG.md`

## [2026-09-12] إدارة العملاء — محرك حسابات النطاق وطبقة الخدمات وسجل التدقيق (Customer Domain Calculations, CRM Service Layer & Audit Trail)
**النوع:** Core Domain & Service Layer Architecture (TDD, Task 11.1)
**الدافع والمشكلة:**
- تتطلب إدارة مطبخ السوشي الداكن (Dark Kitchen) سجلاً مركزياً للعملاء يربط أرقام الهواتف الفريدة بسجل الطلبات والمشاكل التشغيلية، وحساب شرائح ولاء العميل بدقة (Bronze, Silver, Gold, Platinum) وتصنيف العميل (First-Time vs Returning).
- الحاجة لحساب مؤشرات القيمة الإجمالية للعميل (LTV و AOV والبراند المفضل) مع استبعاد الأوردرات الملغية مالياً من حسابات الإيراد، ورصد الطلبات التي واجهت مشاكل (إلغاء، مشاكل توصيل، أو جودة) لحماية تجربة العميل.
- الالتزام التام بقواعد المشروع: حظر الحذف النهائي للعملاء (No Hard Delete)، وتسجيل كافة التعديلات في جدول `AuditLog` داخل نفس المعاملة (Transaction).
**اللي اتعمل:**
- **إنشاء محرك حسابات النطاق في `src/lib/customers.ts` (دوال نقية بدون أثر جانبي):**
  - بناء `determineLoyaltyTier`: تحديد شريحة الولاء (Bronze: 1-4، Silver: 5-14، Gold: 15-29، Platinum: 30+) وتصنيف العميل كضيف جديد لأول مرة (`totalOrders <= 1`) أو عميل متكرر عائد (`totalOrders > 1`).
  - بناء `calculateCustomerStats`: حساب إجمالي إنفاق العميل Lifetime Spent ومتوسط قيمة الطلب AOV مع استبعاد الأوردرات الملغية، وتحديد تاريخ آخر طلب، وتحديد البراند المفضل الأكثر طلباً.
  - بناء `identifyProblemOrders`: فحص وتصنيف الطلبات التي واجهت مشاكل تشغيلية (الملغية، مشاكل التوصيل، مشاكل الجودة).
  - بناء `formatCustomerPhone`: تنميط أرقام الهواتف المصرية (إزالة الفواصل والأكواد الدولية وتوحيد البادئة) وعزل الاتجاه بواسطة محارف `\u202A` و `\u202C` لضمان التوافق التام مع اتجاه RTL دون أي انقلاب للأرقام.
- **توسيع طبقة الخدمات في `src/services/customers.ts`:**
  - بناء `listCustomers`: استعلام مرقم ومفلتر (بالبحث، والشريحة، والطلبات المشاكل) مع حساب الإحصائيات التنفيذية (إجمالي العملاء، الجدد هذا الشهر، كبار العملاء VIP، ومتوسط الإنفاق).
  - بناء `getCustomerProfile`: جلب الملف الشامل للعميل مع الأوردرات والمنتجات ومؤشرات النطاق والطلبات المشاكل وشريحة الولاء.
  - بناء `updateCustomerNotes` و `updateCustomer`: تحديث ملاحظات وبيانات العميل داخل `prisma.$transaction` مع تسجيل الحدث في `AuditLog` (action: "UPDATE", entityType: "Customer").
  - الحظر الصارم لأي دوال حذف لبيانات العميل (Zero delete exports).
- **الاختبارات وبوابات الجودة (TDD):**
  - إضافة الاختبارات `F17.1` حتى `F17.5` في `tests/e2e/tier1-feature-coverage.test.ts`.
  - التحقق من طور الفشل (Red phase) ثم النجاح التام (Green phase).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (222/222 اختبار، 100%).
**الملفات المتأثرة:** `src/lib/customers.ts`, `src/services/customers.ts`, `tests/e2e/tier1-feature-coverage.test.ts`, `PROJECT_LOG.md`


## [2026-09-09] سجل المراقبة — تجاوز قيد العرض التجاوبي وتوسيع نافذة فحص الفوارق لشاشات سطح المكتب والتناظر التام (Audit Diff Modal Responsive Max-Width Override & Symmetrical Layout)
**النوع:** UI/UX Bugfix & Layout Engineering (TDD)
**الدافع والمشكلة:**
- بالرغم من تعيين `max-w-4xl` على `AuditDiffDialog` سابقاً، كانت النافذة تظل تترندر بحجم صغير ضيق (384px فقط) على شاشات الكمبيوتر والتابلت للمستخدم.
- التحليل الجذري كشف أن المكون الأساسي `DialogContent` في `src/components/ui/dialog.tsx` يحتوي على الصنف الافتراضي `sm:max-w-sm`. وبسبب قواعد أسبقية ميديا كويري في CSS وTailwind، فإن تعيين `max-w-4xl` بدون بادئة `sm:` لم يكن يلغي `sm:max-w-sm` عند نقاط توقف الشاشات الأكبر من 640px، مما أبقى النافذة محصورة في عرض 24rem (384px) فقط!
**اللي اتعمل:**
- **تجاوز قيد العرض التجاوبي في `src/components/audit/audit-diff-dialog.tsx`:**
  - تعيين `w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[88vh]`:
    - على الموبايل: عرض `w-[95vw]` لاستغلال المساحة المتاحة.
    - على أجهزة التابلت الصغيرة (`sm`): إلغاء `sm:max-w-sm` فورياً والتوسيع إلى `sm:max-w-3xl` (768px).
    - على التابلت والشاشات المتوسطة (`md`): التوسيع إلى `md:max-w-4xl` (896px).
    - على شاشات سطح المكتب (`lg` و`xl`): التوسيع إلى `lg:max-w-5xl` (1024px) لتوفير نافذة تنفيذية رحبة وواسعة جداً.
- **إعادة هندسة تناظر وتوازن بطاقات مقارنة الفوارق:**
  - تطبيق شبكة `grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-stretch gap-3 sm:gap-4`:
    - تمدد البطاقتين (القيمة السابقة والقيمة الجديدة) بنفس الارتفاع الدقيق (`items-stretch`).
    - تساوي عرض العمودين بنسبة 50/50 على شاشات التابلت والكمبيوتر (`1fr` لكل بطاقة) مع توسيط أيقونة الانتقال في عقدة دائرية أنيقة.
    - إضافة بادج `-` و`+` مميز بألوان هادئة ومتناسقة مع تباين عالي للأرقام والنصوص.
    - تنسيق شريط ترويسة البيانات الوصفية (Metadata Summary Banner) بشبكة من 4 أعمدة متوازنة على `md+`.
- **الاختبارات وبوابات الجودة (TDD):**
  - إضافة الاختبار التراجعي `C7.18` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من طور الفشل (Red) ثم النجاح (Green).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (217/217 اختبار، 100%).
  - اجتياز سكربت الفحص المخصص للمرحلة 10 `scripts/verify-phase10.ts` بنجاح (6/6 خطوات).
**الملفات المتأثرة:** `src/components/audit/audit-diff-dialog.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-09] سجل المراقبة — توسيع نافذة فحص الفوارق وإزالة فاحص JSON والمصطلحات التقنية (Spacious max-w-4xl Diff Modal & Elimination of Raw JSON & Tech Jargon)
**النوع:** UI/UX Excellence & Human-Centric Dialogue Design (TDD, Task 4)
**الدافع والمشكلة:**
- كانت نافذة فحص الفوارق السابقة ضيقة نسبيًا (`max-w-2xl`)، وتحتوي على مفتش بيانات JSON الخام مع أزرار نسخ ورموز برمجية غير موجهة لرجال الأعمال والإدارة.
- ظهور أسماء الحقول الإنجليزية البرمجية (`field`) كشرائح داخل بنود المقارنة وقيم الحالات والأدوار كأكواد غير مترجمة، مما يشتت المالك ويقلل من سلاسة التجربة التنفيذية.
**اللي اتعمل:**
- **توسيع أبعاد النافذة إلى `max-w-4xl` في `src/components/audit/audit-diff-dialog.tsx`:**
  - زيادة العرض إلى `max-w-4xl max-h-[85vh]` مع مساحات تنفس وحشوات واسعة `p-4 sm:p-7` وبطاقات مقارنة رحبة من عمودين بتصميم عالي التباين والأناقة.
- **إزالة مفتش بيانات JSON الخام بالكامل:**
  - التخلص من حالة `showRawJson` ودوال النسخ للحافظة `copyToClipboard` والأيقونات البرمجية والكتلة القابلة للطي.
- **تطهير واجهة المقارنة من الأكواد التقنية والمصطلحات البرمجية:**
  - إزالة شريحة اسم الحقل الإنجليزي (`diff.field`) والاكتفاء بالاسم العربي الفصيح (`diff.labelAr`).
  - تنسيق قيم الحالات (`status`) والأدوار (`role`) والقيم المنطقية (`isActive -> نشط / معطل`) والعملات النقدية باستخدام محرك `formatDomainValue` التلقائي.
- **تنسيق معرّف الكيان في الترويسة:**
  - استدعاء `formatHumanEntityId` وعرض المعرّف بشكل معزول الاتجاه `dir="ltr"` مع حفظ المعرّف الكامل في تلميح الفأرة `title`.
- **الاختبارات وبوابات الجودة (TDD):**
  - كتابة الاختبار التراجعي `C7.17` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من طور الفشل (Red) ثم النجاح (Green).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (216/216 اختبار).
**الملفات المتأثرة:** `src/components/audit/audit-diff-dialog.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-09] سجل المراقبة — تصميم شبكي متناظر ومحكم للجدول مع حماية الاتجاه (Symmetric Table-Fixed Grid & Direction-Safe Entity Layout)
**النوع:** UI/UX Balance & Tabular Architecture Refinement (TDD, Task 3)
**الدافع والمشكلة:**
- جدول سجل التدقيق كان يعاني من عدم ثبات وتناظر عرض الأعمدة مع اختلاف طول النصوص (Column Drift)، وتكدس بعض الخلايا وانكماش أخرى على شاشات المراقبة.
- علامة الهاش `#` في معرّفات الكيانات والأوردرات كانت تنقلب إلى يسار المعرّف أو وسطه تحت اتجاه RTL العام للصفحة، مما يسبب إرباكًا بصريًا.
**اللي اتعمل:**
- **تطبيق الشبكة الثابتة المتناظرة `table-fixed w-full` في `src/components/audit/audit-table.tsx`:**
  - تثبيت أوزان ونسب الأعمدة الستة بدقة تامة لمنع أي انزلاق:
    1. الوقت والتاريخ: `w-[15%] min-w-[130px]` (تاريخ بارز + توقيت دقيق مع أيقونة `Clock` وأرقام مجدولة).
    2. المنفّذ / المستخدم: `w-[17%] min-w-[150px]` (أفاتار ملون برمزين + اسم المستخدم ودوره).
    3. نوع الإجراء: `w-[11%] min-w-[95px]` (وسام ملون موحد العرض `w-24 justify-center py-1` بنقطة حيوية).
    4. الكيان والمعرّف: `w-[17%] min-w-[150px]` (وسام الكيان المترجم + شريحة المعرّف المعزولة).
    5. ملخص التغيير: `w-[28%] min-w-[200px]` (استخدام محرك `formatHumanSummary` مع قص آمن وتلميح كامل `title`).
    6. زر فحص الفارق: `w-[12%] min-w-[100px] text-center` (توسيط الزر التفاعلي وتوحيد حجمه).
- **عزل اتجاه المعرّفات البرمجية (`dir="ltr"`):**
  - فرض اتجاه من اليسار لليمين `dir="ltr"` على شريحة المعرّف مع خط الرموز المجدولة `tabular-nums font-mono` لمنع انقلاب رمز `#` في النصوص العربية.
- **الاختبارات وبوابات الجودة (TDD):**
  - كتابة الاختبار التراجعي `C7.16` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من طور الفشل (Red) ثم النجاح (Green).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (215/215 اختبار).
**الملفات المتأثرة:** `src/components/audit/audit-table.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-09] سجل المراقبة — محرك الصياغة البشرية باللغة العربية وتنسيق معرّفات الكيانات الآمن للاتجاه (Human-Centric Arabic Summary Engine & Direction-Safe Entity Formatter)
**النوع:** Core Domain Engine & Human Experience Architecture (TDD, Task 2)
**الدافع والمشكلة:**
- كانت شاشات المراقبة تعرض نصوصًا برمجية خام وقيم Boolean جافة (`true -> false`) وأسماء حقول ومعرّفات UUID طويلة تفيض خارج حدود الخلايا وتسبب تشوهات بصرية، بالإضافة إلى انقلاب علامة `#` في اتجاه RTL لعدم عزل اتجاه النصوص البرمجية (`dir="ltr"`).
- الحاجة إلى محرك ذكي يحوّل أحداث التدقيق التقنية فوراً إلى لغة عربية طبيعية فصيحة ومباشرة (مثل: "إيقاف النشاط (تعطيل الحساب)"، "تحديث الحالة: جديد ➔ مؤكد"، "تعديل الدور: كاشير ➔ مدير").
**اللي اتعمل:**
- **تحديث وتوسيع قاموس حقول النطاق `AUDIT_FIELD_DICTIONARY` في `src/lib/auditDiff.ts`:**
  - تعديل ترجمة `isActive` إلى "حالة الحساب" (`labelAr: "حالة الحساب"`).
  - إضافة كافة حقول النطاق الناقصة: `shift`, `driver`, `customer`, `shiftId`, `closedAt`, `openedAt`, `actualCash`, `expectedCash`, `difference`.
- **بناء دالة تحويل قيم النطاق `formatDomainValue`:**
  - ترجمة الحالات والأدوار والقيم المنطقية والعملات (`EGP` و `ج.م`) تلقائيًا مع منع تسرب أي مصطلحات برمجية.
- **بناء محرك الملخص البشري الطبيعي `formatHumanSummary`:**
  - صياغة سردية عربية ذكية لعمليات: `CREATE`, `STATUS_CHANGE`, `CANCEL`, `DISCOUNT_APPROVE`, `DISCOUNT_REJECT`, `DISCOUNT_REQUEST`, و `UPDATE`.
  - معالجة ذكية لتغييرات `isActive` (تفعيل الحساب / تعطيل الحساب) وتغييرات الحالات باستخدام الأسهم النظيفة `➔` دون أي تشوه في الترتيب (Zero BiDi flips).
- **بناء منسق معرّفات الكيانات الذكي `formatHumanEntityId`:**
  - التعرف على أرقام الطلبات وعرضها مسبوقة بـ `#`.
  - اختصار معرّفات UUID الطويلة (36 حرفاً) إلى شريحة موجزة `#8c0f2069` مع حفظ المعرّف الكامل في خاصية `full`.
- **الاختبارات وبوابات الجودة (TDD):**
  - إضافة الاختبار التراجعي `F16.7` في `tests/e2e/tier1-feature-coverage.test.ts` والتحقق من طور الفشل (Red) ثم النجاح (Green).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (214/214 اختبار).
**الملفات المتأثرة:** `src/lib/auditDiff.ts`, `tests/e2e/tier1-feature-coverage.test.ts`, `PROJECT_LOG.md`

## [2026-09-09] سجل المراقبة — إزالة تصدير CSV وتوسيع ترجمات الكيانات الشاملة (Audit UI: Remove CSV Export & Expand Entity Translations)
**النوع:** UI Refinement & i18n Completeness (TDD, Task 1)
**الدافع والمشكلة:**
- بناءً على طلب المستخدم وإعادة تركيز واجهة سجل المراقبة كأداة مراقبة حية تنفيذية فورية للمالك، تم استبعاد ميزة تصدير CSV لتقليل التعقيد والحفاظ على نظافة وترتيب الشريط العلوي.
- وجود بعض الكيانات التشغيلية في النظام مثل الورديات (`Shift`)، مناديب التوصيل (`DeliveryDriver`)، العملاء (`Customer`)، البراندات (`Brand`)، والمنصات (`Platform`) تفتقر إلى ترجمات متناظرة مخصصة في قاموس سجل التدقيق، مما كان يسبب ظهور الأسماء البرمجية بالإنجليزية في شاشات المراقبة.
**اللي اتعمل:**
- **إزالة تصدير CSV بالكامل من `src/components/audit/audit-client.tsx`:**
  - إزالة أيقونة `Download` وحالة التحميل `isExporting` ودالة التصدير `handleExportCsv`.
  - إزالة زر التصدير من شريط الهيدر لتحقيق صفاء بصري متناسق يركز على مؤشرات الأداء الحيوية (KPIs) وجدول السجلات.
- **توسيع قاموس الكيانات في ملفات الترجمة `src/messages/ar.json` و `src/messages/en.json`:**
  - إضافة ترجمات متناظرة لجميع الكيانات الناقصة:
    - `"Shift"`: "وردية تشغيل" / "Shift"
    - `"DeliveryDriver"`: "سائق توصيل" / "Delivery Driver"
    - `"Customer"`: "عميل" / "Customer"
    - `"Brand"`: "براند" / "Brand"
    - `"Platform"`: "منصة" / "Platform"
- **الاختبارات وبوابات الجودة (TDD):**
  - كتابة الاختبار التراجعي `C7.15` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من طور الفشل (Red) ثم النجاح (Green).
  - اجتياز فحص الأنواع `npm run typecheck` بنسبة 100% (0 أخطاء).
  - اجتياز سويت الاختبارات الشامل `npm run test:e2e` بنجاح (213/213 اختبار).
**الملفات المتأثرة:** `src/components/audit/audit-client.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-09] إصلاح التجاوز والتداخل في شريط التنقل العلوي وتصميم متجاوب محكم (Navbar Responsive Overflow & Zero-Overlap Architecture)
**النوع:** Bugfix & Responsive Architecture Refinement (TDD, UI/UX Pro Max)
**الدافع والمشكلة:**
- بعد اكتمال المرحلة 10 وإضافة التبويب الثامن (`سجل المراقبة`) لحسابات المالك (`OWNER`)، ظهر تداخل بصري حرج على شاشات الحواسب المحمولة والشاشات المتوسطة (عرض 1024px إلى 1440px) حيث تداخل زر الإجراء الدائم `+ طلب جديد` مع تبويب `المستخدمين` وأخفى جزءاً منه.
- السبب الجذري: حاوية التبويبات `<nav>` كانت تفتقر إلى `min-w-0` و `overflow-x-auto`، مع وجود نصوص اسم المستخدم والبراند الكاملة التي استهلكت أكثر من 250px إضافية من عرض الهيدر، مما دفع التبويبات للتمدد خارج حدود الفليكس وتخطي الحاوية لتتصادم فيزيائيًا مع عناصر التحكم اليمنى.
**اللي اتعمل:**
- **تصميم استجابي ذكي ومحكم للشاشات (UI/UX Pro Max & Frontend Design):**
  1. **حماية الفليكس المطلقة (Zero-Overlap Architectural Invariant):** إضافة `min-w-0 overflow-x-auto no-scrollbar scroll-smooth` لحاوية التبويبات `<nav>`، مع ضبط حاوية عناصر التحكم اليمنى بـ `shrink-0 z-10`. هذا يمنع رياضيًا وفيزيائيًا أي تداخل أو تجاوز لعناصر التحكم مهما بلغت كثافة التبويبات أو صغر عرض النافذة.
  2. **تحسين وترشيد استهلاك المساحة الأفقية (استعادة أكثر من 260px):**
     - تحويل عرض نص اسم المستخدم ودوره (`user.name` و `tRoles(user.role)`) إلى الظهور فقط على شاشات `2xl:flex` (1536px فما فوق). على الشاشات الأصغر (1024px إلى 1535px)، يظهر زر المستخدم كأيقونة رمزية مدمجة أنيقة (`YM` مع نقطة حالة الدور وسهم منسدل وتلميح `title={user.name}`)، مما يوفر ~120px كاملة!
     - إخفاء الشعار الفرعي للبراند (`brandTag`: "إدارة الطلبات والتشغيل") على الشاشات الأقل من `2xl` (`hidden 2xl:inline`)، مما يوفر ~65px.
     - ضبط مقاس وحشوات التبويبات إلى `px-2 xl:px-2.5 py-1 text-xs xl:text-[13px] h-8 xl:h-8.5 gap-1 xl:gap-1.5`، مما يوفر أكثر من 70px عبر التبويبات الثمانية.
  3. **القائمة المنسدلة الإدارية الذكية «الإدارة ▾» (Compact Viewports lg:max-xl):**
     - على الشاشات المدمجة من 1024px إلى 1279px (`lg:max-xl`)، يتم تجميع العناصر الإدارية والرقابية (`المستخدمين` و `سجل المراقبة`) تلقائيًا داخل زر منسدل أنيق «الإدارة ▾» بأيقونة `ShieldCheck` وحالة نشطة مدمجة، مما يسمح بعرض كافة التبويبات التشغيلية دون الحاجة لأي تمرير أفقي!
     - على الشاشات الكبيرة (1280px فما فوق `xl`)، يتم عرض كافة التبويبات الثمانية كأزرار مستقلة مع مساحة راحة وتنفس تتجاوز 150px إلى 250px.
  4. **إضافة فئة التمرير النظيف في CSS:** إضافة `@utility no-scrollbar` في `src/app/globals.css` لتمكين التمرير الأفقي فائق النعومة بدون إظهار أشرطة التمرير القبيحة.
  5. **الترجمة المتناظرة:** إضافة مفتاح `"management": "الإدارة"` في `src/messages/ar.json` و `"management": "Management"` في `src/messages/en.json`.
  6. **سويت اختبارات التراجع الموجه بالسلوك (TDD):** إضافة الاختبار `C7.14` في `tests/e2e/tier3-cross-feature.test.ts` للتحقق من وجود المفاتيح وقواعد الأمان الهندسية في ملف الهيدر.
- **بوابات الجودة الصارمة:**
  - اجتياز اختبار التراجع `npm run test:e2e` بنسبة 100% (212/212 اختبار ناجح).
  - اجتياز فحص الأنواع الصارم `npm run typecheck` بنجاح (0 أخطاء).
  - اجتياز سكربت بوابة التحقق الآلي للمرحلة العاشرة `npx tsx scripts/verify-phase10.ts` بنجاح 100%.
  - اجتياز بناء الإنتاج الكامل `npm run build` بنجاح لكافة المسارات الـ 46.
**الملفات المتأثرة:** `src/components/layout/dashboard-header.tsx`, `src/app/globals.css`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

## [2026-09-09] اكتمال المرحلة 10 — سجل تدقيق العمليات ومراقبة الأنشطة وبوابة التحقق الآلي (Phase 10: Audit Log UI & Activity Monitoring Completion)
**النوع:** Quality Assurance & Automated Gate Verification (TDD)
**اللي اتعمل:**
- إنشاء سكربت بوابة التحقق الآلي الشامل للمرحلة العاشرة `scripts/verify-phase10.ts` مع تنفيذ 6 خطوات فحص تكاملي وعدائي بنسبة نجاح 100%:
  1. **الخطوة 1: التهيئة والنظافة البيئية والتجهيز (Setup & Pre-verification Cleanliness):**
     - إنشاء وتأمين مستخدمي الاختبار الثلاثة: المالك (`owner-verify-phase10@sushi.local`)، المدير (`manager-verify-phase10@sushi.local`)، والكاشير (`cashier-verify-phase10@sushi.local`).
     - تهيئة التبعيات (البراند، التصنيف، المنتج، المنصة، ونوع المصروف).
  2. **الخطوة 2: توليد سجل التدقيق الذري لعمليات الأعمال الحقيقية (Atomic Audit Generation on Real Workflows):**
     - إنشاء طلب عبر خدمة `createOrder` بواسطة الكاشير مع طلب خصم (`PENDING`) والتحقق من حفظ سجل `CREATE` للطلب ذرّيًا.
     - تدرج حالة الطلب (`NEW -> CONFIRMED -> PREPARING`) عبر `transitionOrderStatus` والتحقق من تسجيل سجلين ذرّيين من نوع `STATUS_CHANGE` بالحالات السابقة والجديدة بدقة.
     - اعتماد الخصم بواسطة المالك عبر `decideDiscount` والتحقق من توليد سجل ذرّي من نوع `DISCOUNT_APPROVE`.
     - تسجيل مصروف بواسطة الكاشير عبر `createExpense` والتحقق من سجل التدقيق `CREATE` لمصروفات التشغيل.
     - ترقية دور الكاشير إلى مدير بواسطة المالك عبر `updateUser` والتحقق من سجل `UPDATE` مع الفوارق الدلالية (`CASHIER -> MANAGER`).
  3. **الخطوة 3: التحقق من استعلامات وفلاتر الخدمة متعددة المعايير (Multi-Criteria Service Filtering):**
     - فحص الفلترة بنوع الإجراء (`action: "STATUS_CHANGE"`).
     - فحص الفلترة بنوع الكيان (`entityType: "Order"` مقابل `entityType: "User"`).
     - فحص الفلترة بمعرّف المستخدم (`userId: cashierUserId`).
     - فحص الفلترة بالنطاق الزمني (`startDate`/`endDate`).
     - فحص الترقيم (`page: 1, limit: 2` مع `totalPages`).
     - فحص دقة إحصائيات `getAuditStats` التجميعية (`totalLogs`, `todayCount`, `statusChangeCount`, `criticalCount`).
  4. **الخطوة 4: التحقق الصارم من التحكم في الوصول والصلاحيات (FR-AUD-03 RBAC):**
     - التحقق من قبول `requireRole("OWNER")` لجلسة المالك.
     - التحقق من رفض `requireRole("OWNER")` لجلسات المدراء والكاشيرات ورمي استثناء `AuthError("FORBIDDEN")`.
     - التحقق من رفض الراوت `GET /api/audit` لغير المالكين وإرجاع HTTP 403 مع رمز `"FORBIDDEN"`.
     - التحقق من استجابة `GET /api/audit` بنجاح HTTP 200 وحمولة البيانات للمالك.
  5. **الخطوة 5: التحقق من عدم القابلية للتعديل بتاتاً (FR-AUD-02 Absolute Immutability):**
     - التحقق من خلو طبقة الخدمة `src/services/audit.ts` تماماً من أي دوال حذف أو تعديل (صفر دوال `delete`/`update`/`clear`/`purge`).
     - التحقق من حظر كافة طرق التعديل في واجهة البرمجة (`POST`, `PUT`, `PATCH`, `DELETE`) وإرجاع كود الاستجابة الموحد `405 Method Not Allowed` مع `"METHOD_NOT_ALLOWED"`.
  6. **الخطوة 6: دقة محرك الفوارق الدلالية (Semantic Diff Engine Precision):**
     - فحص دقة `computeAuditDiff` عبر حقول الحالة والخصومات وتغييرات الأدوار مع المعجم العربي الدقيق (`حالة الطلب`، `مبلغ الخصم`، `الدور الصلاحي`).
     - فصل محرك الفوارق والأدوات الآمنة للعميل في `src/lib/auditDiff.ts` لتفادي حزم حزم قاعدة البيانات (`pg` و `fs`) داخل متصفح العميل أثناء بناء الإنتاج.
  - التنظيف التلقائي الشامل لكافة بيانات وسجلات الاختبار في كتلة `finally`.
- **بوابات الجودة الصارمة:**
  - اجتياز سكربت الفحص الآلي `scripts/verify-phase10.ts` بنسبة 100%.
  - اجتياز الفحص النمطي `npm run typecheck` (`tsc --noEmit`) بنجاح (0 أخطاء).
  - اجتياز سويت الاختبارات الكامل `npm run test:e2e` بنسبة 100% (211/211 اختبار بنجاح تام).
  - اجتياز بناء الإنتاج `npm run build` لكافة المسارات الـ 46 بنجاح.
**الملفات المتأثرة:** `scripts/verify-phase10.ts`, `src/lib/auditDiff.ts`, `src/services/audit.ts`, `src/lib/auth.ts`, `src/components/audit/audit-diff-dialog.tsx`, `src/components/audit/audit-table.tsx`, `src/components/audit/audit-client.tsx`, `docs/plans/2026-09-09-phase10-audit-plan.md`, `PROJECT_LOG.md`

---

## [2026-09-09] المرحلة 10 — واجهة سجل المراقبة ومفتش الفوارق البصري والتنقل الحصري (Task 10.3: Audit UI, Diff Modal & Navigation)
**النوع:** UI/UX Excellence & Frontend Architecture (TDD)
**اللي اتعمل:**
- بناء واجهة سجل التدقيق والمراقبة الشاملة للمالك حصراً وفق معايير `ui-ux-pro-max` وتصميم الـ Dark Kitchen عالي التباين:
  - مفتش الفوارق البصري (`AuditDiffDialog` في `src/components/audit/audit-diff-dialog.tsx`):
    - مقارنة تفاعلية حقل بحقل بين الحالة القديمة والجديدة مستندة إلى `computeAuditDiff`.
    - تمييز لوني دقيق: بطاقة القيمة السابقة (`-`) باللون الأحمر الخافت، وسهم الانتقال الحركي المتجاوب مع اتجاه القراءة RTL، وبطاقة القيمة الجديدة (`+`) باللون الأخضر الزمرّدي البارز.
    - تنسيق ذكي مخصص حسب نوع الحقل: العملات (`EGP`)، الحالات (`Status Badges`)، الصلاحيات (`Role Badges`)، والمنطق (`Active/Inactive`).
    - نافذة متقدمة قابلة للطي لفحص حمولة JSON الأصلية (Raw JSON Disclosure) مع أزرار نسخ فوري للحافظة.
  - شريط الفلترة متعدد المعايير (`AuditFilterBar` في `src/components/audit/audit-filter-bar.tsx`):
    - أزرار الفترات الزمنية السريعة (اليوم، أمس، آخر 7 أيام، هذا الشهر، كل الأوقات).
    - قوائم منسدلة لاختيار نوع العملية (`AuditAction`)، نوع الكيان (`Order`, `Expense`, `User`, إلخ)، ومستخدم النظام.
    - حقل بحث فوري مع تأخير ذكي (Debounced Search بـ 300ms) للبحث بمعرّف الكيان أو رقم الأوردر.
    - أزرار إعادة ضبط الفلاتر والتحديث اللحظي مع مؤشر تحميل دوّار.
  - جدول السجلات عالي الاستجابة (`AuditTable` في `src/components/audit/audit-table.tsx`):
    - أعمدة: الوقت والتاريخ (مع التوقيت اللحظي بدقة الثواني)، المستخدم (الأيقونة، الاسم، وصلاحية الدور)، العملية (أوسمة ملونة)، الكيان والمعرّف، ملخص التغيير الدلالي، وزر فحص الفارق ("فحص الفارق" مع أيقونة `Eye`).
    - شريط تذييل وترقيم كامل (Pagination): مؤشر النطاق المعروض، محدد حجم الصفحة (15، 25، 50)، وأزرار التنقل بين الصفحات السابقة والتالية.
  - المنسق التفاعلي للعميل (`AuditClient` في `src/components/audit/audit-client.tsx`):
    - 4 بطاقات مؤشرات تنفيذية عليا (KPIs): إجمالي العمليات (`Activity`)، نشاط اليوم (`Clock`)، تغييرات الحالات (`ArrowRightLeft`)، والعمليات الحساسة (`ShieldAlert`).
    - زر تصدير CSV فوري بترميز UTF-8 مع BOM (`\uFEFF`) لضمان التوافق التام مع اللغة العربية في Microsoft Excel.
  - حماية صفحة الخادم (`src/app/[locale]/(dashboard)/audit/page.tsx`):
    - حراسة المسار عبر `requirePageUser()` وإعادة توجيه أي مستخدم غير مالك (`user.role !== "OWNER"`) فوراً إلى الصفحة الرئيسية `/`.
    - جلب البيانات الأولية من الخادم (`listAuditLogs`, `getAuditStats`, وقائمة المستخدمين).
  - تحديث شريط التنقل الرئيسي (`src/components/layout/dashboard-header.tsx`):
    - إضافة تبويب "سجل المراقبة" (`/audit`) بأيقونة `ShieldCheck` حصراً لدور المالك (`roles: ["OWNER"]`) في شريط الحواسيب والقائمة الجانبية للأجهزة المحمولة.
  - اكتمال المعجم اللغوي الثنائي المتطابق في `src/messages/ar.json` و `src/messages/en.json` تحت نطاق `audit`.
- إضافة اختبار TDD التوافقي `C7.13` في `tests/e2e/tier3-cross-feature.test.ts`.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` بنجاح (0 أخطاء).
  - اجتياز `npm run test:e2e` بنجاح 100% (211/211 اختبار — Red -> Green).
**الملفات المتأثرة:** `src/components/audit/audit-diff-dialog.tsx`, `src/components/audit/audit-filter-bar.tsx`, `src/components/audit/audit-table.tsx`, `src/components/audit/audit-client.tsx`, `src/app/[locale]/(dashboard)/audit/page.tsx`, `src/components/layout/dashboard-header.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-09] المرحلة 10 — مسار API سجل المراقبة المحمي للمالك وفرض عدم التعديل (Task 10.2: Protected Audit API Route)
**النوع:** Core Feature & Security Architecture (TDD)
**اللي اتعمل:**
- إنشاء وتأمين مسار API لسجل المراقبة والتدقيق `src/app/api/audit/route.ts` وفق متطلبات المرحلة العاشرة (Audit Log UI & Activity Monitoring — FR-AUD-02 & FR-AUD-03):
  - حراسة المسار بصلاحيات المالك حصراً (`FR-AUD-03`):
    - فحص الصلاحية في أول سطر عبر `requireRole("OWNER")`.
    - إرجاع خطأ `401 Unauthorized` للمستخدمين غير المسجلين، و `403 Forbidden` (`Forbidden: Owner role required`) لغير المالكين (المدراء والكاشيرات).
  - التحقق الصارم من معايير الاستعلام (Query Validation Schema):
    - تصدير مخطط الفحص `auditQuerySchema` باستخدام Zod للتحقق من:
      - رقم الصفحة والحد الأقصى (`page` الافتراضي 1، و `limit` الافتراضي 25 ومقيد بحد أقصى 100).
      - نوع الإجراء المقبول (`action` من `AuditAction`).
      - نوع الكيان (`entityType`) ومعرّف الكيان أو البحث النصي (`search`/`entityId`).
      - معرّف المستخدم (`userId` كـ UUID).
      - التواريخ بتنسيق ISO صالح (`startDate`, `endDate` بتنسيق `YYYY-MM-DD`).
    - إرجاع `400 Validation Error` مع تفاصيل الأخطاء عند تمرير معايير غير صالحة.
  - تكامل طبقة الخدمة وإرجاع البيانات:
    - تفويض الاستعلام إلى `listAuditLogs(query)` و `getAuditStats(...)` بالتوازي عبر `Promise.all`.
    - إرجاع استجابة قياسية منسقة تتضمن: السجلات مع بيانات المستخدم، الإجمالي، رقم الصفحة، الحد، إجمالي الصفحات، والإحصائيات التجميعية للمؤشرات الرئيسية (`stats`).
  - فرض عدم القابلية للتعديل المطلقة (`FR-AUD-02` — Immutability Enforcement):
    - حظر كافة طلبات التعديل أو الحذف أو الإضافة عبر تصدير معالجات `POST` و `PUT` و `PATCH` و `DELETE` وإرجاع `405 Method Not Allowed` مع رسالة صريحة بأن سجل التدقيق إلحاقي فقط وغير قابل للتعديل برمجياً.
- إضافة اختبار TDD المعياري `F16.6` في `tests/e2e/tier1-feature-coverage.test.ts` للتحقق من صحة المخطط، والقيم الافتراضية، وقيد الحد الأقصى (clamp max 100)، ورفض الإجراءات غير المعرفة.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` بنجاح (0 أخطاء).
  - اجتياز `npm run test:e2e` بنجاح 100% (210/210 اختبار — Red -> Green).
**الملفات المتأثرة:** `src/app/api/audit/route.ts`, `tests/e2e/tier1-feature-coverage.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-09] المرحلة 10 — طبقة خدمة سجل المراقبة ومحرك فحص الفوارق (Task 10.1: Audit Service Layer & Semantic Diff Engine)
**النوع:** Core Feature & Security Architecture (TDD)
**اللي اتعمل:**
- إنشاء طبقة خدمة سجل المراقبة والتدقيق `src/services/audit.ts` لدعم المرحلة العاشرة (Audit Log UI & Activity Monitoring — FR-AUD-01..05):
  - بناء محرك حساب الفوارق الدلالي (`computeAuditDiff`):
    - مقارنة كائني JSON القديم والجديد (`oldValue` و `newValue`) وتحليل التغييرات بدقة وتصنيفها.
    - دعم قاموس حقول النطاق العربي والإنجليزي (`AUDIT_FIELD_DICTIONARY`) لترجمة الحقول (`status`, `role`, `discountAmount`, `cancelReason`, `notes`, `subtotal`, `total`, `isActive`, إلخ) مع تحديد نوع العرض (`status`, `currency`, `boolean`, `role`, `text`, `json`).
    - معالجة الحقول المضافة (`oldValue: null`) والحقول المحذوفة ومطابقة الكائنات المتطابقة بإرجاع مصفوفة فارغة.
  - حساب الإحصائيات التجميعية الحية والمحاكاة (`getAuditStats` و `calculateMockAuditStats`):
    - إحصائيات المؤشرات التنفيذية: إجمالي السجلات (`totalLogs`)، سجلات اليوم (`todayCount`)، تغييرات الحالة (`statusChangeCount`)، والعمليات الحرجة (`criticalCount`: الإلغاء، واعتمادات ورفض الخصومات).
  - بناء منشئ شروط البحث والاستعلام (`buildAuditWhereClause`):
    - دعم الفلترة متعددة المعايير: المستخدم (`userId`)، نوع الإجراء (`action`)، نوع الكيان (`entityType`)، معرّف الكيان أو البحث النصي (`search`/`entityId`)، والمدى الزمني (`startDate`, `endDate`).
  - محرك جلب السجلات والترقيم (`listAuditLogs` و `getAuditLogById`):
    - دعم الـ Pagination (`page`, `limit`)، والترتيب التنازلي حسب الوقت (`timestamp: desc`)، وتضمين بيانات المستخدم صاحب الإجراء (`id`, `name`, `email`, `role`).
  - إثبات خاصية عدم القابلية للتعديل (Immutability — FR-AUD-02): سجل التدقيق إلحاقي فقط (Append-Only) بدون تصدير أي دوال تعديل أو حذف (`deleteAuditLog`, `updateAuditLog`, `clearAuditLogs`).
- إضافة حزمة اختبارات E2E للخاصية 16 (`F16.1` حتى `F16.5`) في `tests/e2e/tier1-feature-coverage.test.ts`.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` (0 أخطاء).
  - اجتياز `npm run test:e2e` بنجاح 100% (209/209 اختبار — Red -> Green).
**الملفات المتأثرة:** `src/services/audit.ts`, `tests/e2e/tier1-feature-coverage.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-09] توسيع وضبط نافذة معاينة طباعة الـ PDF وأدوات التكبير والعرض (Enlarge & Polish PDF Preview Modal with Zoom & Viewport Controls)
**النوع:** UI/UX Excellence & Interactive Preview Tooling (TDD)
**اللي اتعمل:**
- حل مشكلة ضيق وتقييد نافذة المعاينة السابقة:
  - معالجة التقييد الافتراضي `sm:max-w-sm` الموروث من `DialogContent` عبر تطبيق استجابة عريضة فاخرة:
    `w-[96vw] sm:max-w-[95vw] md:max-w-[94vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1480px] h-[94vh] max-h-[94vh]`
    مما يتيح مساحة قراءة رحبة وتنفيذية على كافة شاشات الحواسيب والأجهزة اللوحية دون أي انضغاط.
  - إضافة زر ملء الشاشة الفوري (Maximize/Restore Toggle) بنقرة زر واحدة للتمدد الكامل `100vw × 100vh`.
- بناء شريط أدوات تحكم تفاعلي ذكي في رأس نافذة المعاينة:
  - محوّل نمط عرض الصفحة: التبديل بين "حجم A4 قياسي" (`max-w-[880px]`) و"عرض عريض للقراءة" (`max-w-[1140px]`).
  - أدوات التكبير والتصغير المباشرة (Live Zoom Controls): تكبير وتصغير سلس بنطاق من 60% إلى 150% مع زر إعادة الضبط السريع `[ 100% ]` الذي يعتمد على خاصية الـ CSS `zoom` النظيفة لمنع تشويه النصوص أو قص الأطراف.
  - دعم اختصار لوحة المفاتيح السريع: الضغط على `Ctrl + P` (أو `Cmd + P`) أثناء فتح المعاينة يشغّل الطباعة فوراً.
- تحسين المظهر البصري لورقة التقرير: ظل ناعم عميق (`shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)]`) مع إطار خفيف يعكس تجربة مستند تنفيذي رسمي حقيقي.
- إضافة مفاتيح الترجمة المعيارية في `src/messages/ar.json` و `src/messages/en.json` (`zoomIn`, `zoomOut`, `zoomReset`, `standardWidth`, `fitWidth`, `maximize`, `restore`, `paperBadge`, `shortcutHint`).
- إضافة اختبار TDD المعياري `C7.12` في `tests/e2e/tier3-cross-feature.test.ts`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (204/204 اختبار).
**الملفات المتأثرة:** `src/components/reports/reports-print-modal.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-09] إعادة تصميم رسم وترتيب أفضل الأصناف مبيعاً (Top Products Leaderboard & Chart Redesign)
**النوع:** UI/UX Excellence & Data Visualization Redesign (TDD)
**اللي اتعمل:**
- حل جذري لمشكلة تداخل النصوص العربية مع أعمدة الرسم البياني (SVG RTL Overlap bug في مكتبة Recharts عند استخدام `layout="vertical"` داخل بيئة RTL):
  - استبدال العرض القديم بـ **شريط الأداء التنفيذي (Executive Leaderboard)** كنمط افتراضي مطابق لأرقى لوحات بيانات الـ SaaS (Shopify/Stripe):
    - صفوف بيانية عصرية مزودة بأوسمة المراكز الذهبية والفضية والبرونزية (`#1`, `#2`, `#3`) مع حلقات تمييز ناعمة.
    - عرض الاسم العربي الكامل للصنف بوضوح تام دون أي اقتطاع قسري مع tooltip أصلي عند تمرير الماوس.
    - إحصائيات دقيقة ومحاذاة في أقصى اليسار: عدد الطلبات، وصافي الإيراد بالجنيه المصري (`formatCurrency`)، وشارة كبسولة مدمجة للكمية المباعة (`15 قطعة`).
    - مسارات تقدم انسيابية (Progress Tracks) بتدرج لوني جذاب `from-violet-600 via-purple-500 to-indigo-500` تتناسب بدقة مع حصة المنتج من المبيعات.
    - تفاعل سلس عند التمرير (`hover:bg-muted/40`) دون حجب المحتوى أو تشويه المظهر.
  - توفير محوّل أوضاع العرض (View Mode Switcher) في ترويسة البطاقة:
    - خيار 1: "شريط الأداء" (Leaderboard — الافتراضي).
    - خيار 2: "رسم بياني" (Upward Column Chart) بنمط أعمدة رأسية صاعدة (`layout="horizontal"`) تلغي نهائياً مشكلة تداخل النصوص في SVG تحت اتجاه RTL.
  - إصلاح صندوق التلميحات (Tooltip): تصميم بنية Flex متوافقة مع `dir="rtl"` تمنع قلب اتجاه النقطتين الرأسيتين (`:`) وتضمن قراءة احترافية للأرقام والمسميات.
- إضافة مفاتيح الترجمة المعيارية في `src/messages/ar.json` و `src/messages/en.json` (`leaderboard`, `barChart`, `item`, `soldCount`).
- إضافة اختبار TDD المعياري `C7.11` في `tests/e2e/tier3-cross-feature.test.ts`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (203/203 اختبار).
**الملفات المتأثرة:** `src/components/reports/charts/top-products-chart.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] محرك الطباعة والـ PDF المعزول المثالي (Task 3: Perfect Isolated Iframe Print Engine for PDF Export)
**النوع:** Core Feature & Printable Document Architecture (TDD)
**اللي اتعمل:**
- إنشاء محرك الطباعة المستقل `src/lib/printReport.ts`:
  - دالة `generatePrintableReportHtml`: توليد مستند HTML تنفيذي متكامل بحجم A4 قياسي (`@page { size: A4 portrait; margin: 12mm 15mm; }`) يدعم خط Cairo العربي، وترويسة رسمية معتمدة لـ Sushi Flower، وشبكة بيانات الفلاتر، و 4 بطاقات إحصائية للمؤشرات الرئيسية، وجدول تفصيلي مع قواعد طباعة صارمة (`tr { page-break-inside: avoid; }`) تمنع قص الجداول عبر الصفحات المتعددة، ومساحة توقيعات للإدارة واعتماد مالي، وإشعار سرية في التذييل.
  - دالة `generateReportTableHtml`: بناء الجداول المتخصصة لكل تبويب (المبيعات، المنتجات، طرق الدفع، مصادر الطلبات، الموظفون، ساعات الذروة، النظرة العامة) دون أي منطق أعمال في واجهة المستخدم (Directives §2).
  - دالة `printHtmlViaIframe`: تشغيل الطباعة أو التصدير لملف PDF عبر إنشاء عنصر Iframe خفي ومؤقت، وكتابة المستند المعزول داخله واستدعاء `iframe.contentWindow.print()`، ثم تنظيف الـ iframe تلقائياً بعد اكتمال الطباعة. هذا يعزل التقرير تماماً عن قيود نافذة الـ Dialog وعن `overflow: hidden` و `position: fixed` التي كانت تتسبب في قص وتلف المستند.
- تحديث `src/components/reports/reports-print-modal.tsx`:
  - ربط زر الطباعة بدالة `handlePrint` التي تستدعي `printHtmlViaIframe` مع توليد المستند بالكامل.
  - إزالة قواعد `@media print` المشوهة السابقة والاحتفاظ بالمعاينة البصرية داخل المودال مطابقة تماماً لمخرجات الـ PDF.
- إضافة اختبار TDD `C7.10` في `tests/e2e/tier3-cross-feature.test.ts`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (202/202 اختبار).
**الملفات المتأثرة:** `src/lib/printReport.ts`, `src/components/reports/reports-print-modal.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] إصلاح اقتطاع أسماء المنتجات وتوسيع المحور Y في الرسم البياني لأعلى الأصناف (Task 2: Fix Top Products Chart Labels Truncation & Expand Y-Axis Width)
**النوع:** UI/UX Polish & Data Visualization
**اللي اتعمل:**
- تعديل مكوّن `src/components/reports/charts/top-products-chart.tsx`:
  - إزالة الاقتطاع القسري القديم (12 حرفاً) واستبداله بعرض الاسم كاملاً حتى 28 حرفاً مع نقط الحذف اللطيفة للأطول، مما يسمح بظهور أسماء الرولات المركبة ("سالمون كافيار كريمي", "فيلادلفيا رول كلاسيك", "كريسبي كاليفورنيا").
  - توسيع عرض المحور الرأسي `YAxis` من 90px إلى 165px مع تطبيق محاذاة النص العربية الصحيحة `textAnchor="end"` و `className="text-xs fill-foreground font-medium"`.
  - تحديث هوامش الرسم البياني `margin={{ top: 10, right: 35, left: 10, bottom: 5 }}` لمنع أي تداخل مع الأرقام الجانبية.
  - إضافة `LabelList` من `recharts` فوق أعمدة المبيعات مباشرة بموقع `position="right"` لإظهار عدد القطع المباعة بدقة بجوار كل شريط.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (201/201 اختبار).
**الملفات المتأثرة:** `src/components/reports/charts/top-products-chart.tsx`, `PROJECT_LOG.md`

---

## [2026-09-08] تنظيف منصات وبراندات التيست وحصر التقارير على المنصات والبراندات الـ 6 القياسية (Task 1: Eliminate Test Platforms & Enforce Canonical Matrix)
**النوع:** Data Integrity & Reports Architecture (TDD)
**اللي اتعمل:**
- تحديث `src/lib/reports.ts`:
  - تصدير قوائم المنصات والبراندات الرسمية المعتمدة: `STANDARD_PLATFORM_NAMES` (Talabat, InstaShop, Harry App, Elmenus, Facebook, Phone) و `STANDARD_BRAND_NAMES` (Flower, Mastery, Niwa, Tobiko).
  - إضافة دوال توحيد التسميات `normalizePlatformName` و `normalizeBrandName` (توحيد `elmenus` إلى `Elmenus` القياسية).
  - تحديث دالة `groupSalesByPlatformBrand(orders, standardOnly = true)` لدعم الفلترة الحصرية وعزل أي منصات أو براندات تجريبية/اختبارية تلقائياً عن التقارير الإدارية والمالية.
- تحديث `src/services/reports.ts` لضمان إرسال `standardOnly: true` في مصفوفة مبيعات المنصات والبراندات.
- إنشاء وتشغيل سكربت التطهير لقاعدة البيانات `scripts/cleanup-test-platforms.ts`:
  - ترحيل 6 طلبات من `Verification Talabat` إلى منصة `Talabat` الرسمية وحذف منصة التيست.
  - ترحيل طلبات `Phase 5 Direct` و `Phase 7 Direct Platform` إلى منصة `Phone` الرسمية وحذف منصات التيست.
  - ترحيل 18 طلباً من منصة `elmenus` الصغيرة إلى `Elmenus` الرسمية وحذف المنصة المكررة.
  - ترحيل طلبات وأصناف براندات التيست (`Verification Brand Sushi`, `Phase 5 Brand Sushi`, `Phase 7 Verification Brand`, `Flower Sushi`, `وايت`) إلى براند `Flower` الرسمي وحذفها بالكامل.
- إضافة اختبار TDD `C7.9` في `tests/e2e/tier3-cross-feature.test.ts`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (201/201 اختبار).
**الملفات المتأثرة:** `src/lib/reports.ts`, `src/services/reports.ts`, `scripts/cleanup-test-platforms.ts`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] مستند ومعاينة التقرير الرسمي المطبوع للـ PDF (Task 4: Executive PDF Printable Report Modal)
**النوع:** Core Feature & Printable Document Architecture (TDD)
**اللي اتعمل:**
- إنشاء مكوّن المعاينة والطباعة المتقدم `src/components/reports/reports-print-modal.tsx`:
  - فتح نافذة معاينة رسمية فاخرة (Print Preview Modal) عند الضغط على زر "طباعة / PDF" في شريط الفلاتر.
  - عرض مستند تنفيذي متكامل بحجم صفحة A4 مخصص للإدارة وأصحاب المطعم:
    - ترويسة رسمية للمطعم `Sushi Flower — Dark Kitchen Management` مع شارة تقرير إداري معتمد ووقت وتاريخ الإصدار الدقيق.
    - شبكة بيانات الفلاتر (النطاق الزمني، البراند، المنصة، وجهة الإصدار والاعتماد).
    - 4 بطاقات إحصائية رئيسية (صافي الإيرادات، عدد الطلبات، المصروفات، وصافي الأرباح).
    - جدول بيانات متكامل ومتخصص بحسب التبويب النشط (المبيعات، المنتجات، طرق الدفع، ساعات الذروة، الكاشيرية، أو النظرة العامة) مع صف الإجمالي العام.
    - مساحة توقيعات رسمية معتمدة لإدارة التشغيل والإدارة المالية وختم المطعم.
    - حقن قواعد الطباعة `@media print` لعزل المستند الرسمي بدقة متناهية وإخفاء أزرار الواجهة والـ backdrop والـ sidebar لطباعة نقية 100% أو الحفظ كملف PDF عالي الجودة.
- ربط المكوّن في `src/components/reports/reports-client.tsx` وإضافة مفاتيح الترجمة في `src/messages/ar.json` و`src/messages/en.json`.
- إضافة اختبار TDD `C7.8` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من صحة مفاتيح الترجمة.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (200/200 اختبار).
**الملفات المتأثرة:** `src/components/reports/reports-print-modal.tsx`, `src/components/reports/reports-client.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] محرك تصدير Excel الاحترافي المنسق (Task 3: Professional Formatted Excel Export Engine)
**النوع:** Core Feature & Export Architecture (TDD)
**اللي اتعمل:**
- إنشاء محرك التصدير الاحترافي `src/lib/exportExcel.ts`:
  - استبدال التصدير البدائي النصي (Raw CSV) بتوليد مستند Excel رسمي غني (`.xls` بتنسيق XML/HTML Spreadsheet المتوافق مع Microsoft Excel و Google Sheets).
  - دعم التوجيه العربي `dir="rtl"` وتصدير UTF-8 BOM لحماية النصوص العربية من أي تشوه.
  - ترويسة رسمية للمطعم بشعار واسم البراند `Sushi Flower — Dark Kitchen Order Control System` وعنوان التقرير وزمن الاستخراج الدقيق.
  - شريط ميتا للفلاتر المطبقة (الفترة الزمنية المحددة، البراند، والمنصة).
  - بطاقات ملخص إحصائي (KPI Summary Cards) بأهم الأرقام في أعلى ورقة العمل.
  - جدول بيانات رئيسي بتصميم فاخر: رؤوس أعمدة كحلية أنيقة (`#0f172a`) بخط أبيض عريض، حدود خلايا واضحة، صفوف متبادلة الألوان (Zebra striping)، ومحاذاة مناسبة للمبالغ والأرقام والنصوص.
  - صف إجمالي سفلي بخط عريض وإطار مزدوج مميز (`border-bottom: 3px double #0f172a`).
- ربط المحرك في `src/components/reports/reports-client.tsx` لدعم كافة التبويبات (المبيعات اليومية، المنتجات، المنصات والبراندات، طرق الدفع، ساعات الذروة، الموظفون، والنظرة العامة).
- إضافة اختبار TDD `C7.7` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من صحة المستند المُولّد.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (199/199 اختبار).
**الملفات المتأثرة:** `src/lib/exportExcel.ts`, `src/components/reports/reports-client.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] ضخ بيانات اختبارية واقعية لمطعم سوشي حقيقي (Task 2: Realistic Dark Kitchen Dataset Seeding)
**النوع:** Developer Tooling & Realistic Dataset
**اللي اتعمل:**
- إنشاء وتشغيل سكربت `scripts/seed-realistic-reports-data.ts`:
  - إضافة وتأكيد البراندات الأربعة: Flower, Mastery, Niwa, Tobiko.
  - إضافة وتأكيد المنصات الستة: Talabat, elmenus, InstaShop, Harry App, Facebook, Phone.
  - إضافة أصناف سوشي حقيقية كاملة بأسعارها وفئاتها (كاليفورنيا، فيلادلفيا، كريسبي سالمون، دراجون رول، كومبو 30 و50 قطعة، ساشيمي، سلطات، ومقبلات).
  - إضافة عملاء مصريين بأسماء وأرقام هواتف حقيقية، وكاشيرية حقيقيين بشفتات صباحية ومسائية وويك إند، ومناديب أسطول ومناطق توصيل.
  - ضخ 135+ طلباً واقعياً موزعاً على الـ 30 يوماً الماضية، مع توزيع ساعي يعكس ذروة الغداء والعشاء، وحالات تسليم وإلغاء واقعية وخصومات معتمدة ومرفوضة.
  - إضافة 20+ بند مصروفات واقعية لتوريدات الأسماك والسالمون والخامات وفواتير التشغيل.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (198/198 اختبار).
**الملفات المتأثرة:** `scripts/seed-realistic-reports-data.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] تمييز الفترة الزمنية المختارة في شريط فلاتر التقارير (Reports Quick Range Highlighting)
**النوع:** Frontend UX & UI Polish (TDD)
**اللي اتعمل:**
- إضافة دالة `isQuickRangeActive` في `src/components/reports/reports-filter-bar.tsx` لمطابقة التواريخ المحددة مع الفترات السريعة (اليوم، أمس، آخر 7 أيام، هذا الشهر، الشهر السابق).
- تطبيق تمييز بصري فوري للزر المختار (`bg-primary text-primary-foreground font-bold shadow-xs ring-1 ring-primary/40`) ليوضح للمستخدم بلمحة واحدة الفترة الزمنية النشطة حالياً.
- إضافة اختبار TDD `C7.6` في `tests/e2e/tier3-cross-feature.test.ts` والتحقق من دقته (198/198 اختبار).
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (198/198 اختبار).
**الملفات المتأثرة:** `src/components/reports/reports-filter-bar.tsx`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] تحديث مفاتيح الترجمة العربية والإنجليزية واختبارات التحقق (Task 8: Reports Translations & i18n E2E Tests)
**النوع:** Localization & i18n (TDD)
**اللي اتعمل:**
- تحديث شامل لمساحة أسماء التقارير في `src/messages/ar.json` و`src/messages/en.json`:
  - إضافة أسماء ومسميات التبويبات السبعة: `overview`, `sales`, `products`, `peakHours`, `orderSources`, `payment`, `employees`.
  - إضافة مفاتيح أزرار التصدير لـ Excel والطباعة لـ PDF ورسائل النجاح والخطأ.
  - إضافة نصوص ومسميات جداول وتحليلات المبيعات، المنتجات، ساعات الذروة، مصادر الطلبات، والمدفوعات.
  - إضافة نصوص ومسميات تقارير أداء الكاشيرية وسجل الخصومات (العادية والمعتمدة والمرفوضة).
- تحديث اختبارات `C2.[i18n Keys]` في `tests/e2e/tier3-cross-feature.test.ts` لتغطية جميع المفاتيح الجديدة وضمان عدم حدوث أي استثناءات `MISSING_MESSAGE`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] إعادة هيكلة الحاوية الرئيسية لصفحة التقارير وميزة التصدير (Task 7: ReportsClient Rewrite & Export Engine)
**النوع:** Frontend Architecture & UI/UX Redesign
**اللي اتعمل:**
- إعادة كتابة `src/components/reports/reports-client.tsx` بالكامل:
  - تحويل الشاشة إلى مركز تحليلات منظم بـ 7 تبويبات متخصصة تفصل البيانات وتمنع التشتت والازدحام البصري.
  - دعم التحميل الكسول (Lazy Loading) لبيانات ساعات الذروة (`/api/reports/peak-hours`) والموظفين (`/api/reports/employees`) عند التبديل فقط لحفظ الذاكرة والسرعة.
  - دعم تصدير ملفات Microsoft Excel بتنسيق UTF-8 BOM لحماية الحروف العربية من التشوه، مع تصدير ديناميكي حسب محتوى التبويب النشط.
  - دعم الطباعة والتصدير كـ PDF عبر `window.print()` مع تنسيقات `@media print` واستثناء الأزرار وشريط الفلاتر.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/components/reports/reports-client.tsx`, `PROJECT_LOG.md`

---

## [2026-09-08] مكونات التبويبات السبعة المتخصصة للتقارير (Task 6: Specialized Report Tab Components)
**النوع:** Frontend Architecture & UI Components
**اللي اتعمل:**
- تحديث `ReportsKpiGrid` لدعم شارات مقارنة الفترات (% deltas) مع مؤشرات صعود/هبوط ملونة.
- إنشاء 7 تبويبات مستقلة في `src/components/reports/tabs/`:
  - `overview-tab.tsx`: بطاقات المؤشرات المالية ومخططي الإيراد والمنصات.
  - `sales-tab.tsx`: بطاقات ملخص المبيعات الخام والخصومات، ومسار الإيراد، وجدول التحليل اليومي الشامل.
  - `products-tab.tsx`: مخطط أعلى 10 أصناف مبيعاً ومقارنة البراندات، وجدول تفصيلي بالحصص المئوية.
  - `peak-hours-tab.tsx`: دمج مصفوفة ومخطط ساعات الذروة والـ Heatmap.
  - `order-sources-tab.tsx`: الحصص السوقية للتطبيقات ومصفوفة المنصات × البراندات.
  - `payment-tab.tsx`: مخطط طرق الدفع الدائري مع جدول الإيراد والنقدية.
  - `employees-tab.tsx`: أداء فريق الكاشيرية وسجل الخصومات (Approved / Rejected) مع إمكانية التبديل السريع.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/components/reports/reports-kpi-grid.tsx`, `src/components/reports/tabs/*`, `PROJECT_LOG.md`

---

## [2026-09-08] مخطط تحليل وتوزيع طرق الدفع (Task 5: Payment Breakdown Donut Chart)
**النوع:** Frontend Feature & Data Visualization
**اللي اتعمل:**
- إنشاء مكوّن `src/components/reports/charts/payment-breakdown-chart.tsx`:
  - مخطط دائري مجوف (Donut Chart) مبني بـ Recharts يوضح حصص الدفع: كاش (زمردي)، فيزا (أزرق)، وأونلاين (بنفسجي).
  - قائمة إحصائية مفصلة بالنسب المئوية وقيم المبالغ مع تلميحات بالعملة المترجمة `ج.م` / `EGP`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/components/reports/charts/payment-breakdown-chart.tsx`, `PROJECT_LOG.md`

---

## [2026-09-08] مخطط ساعات الذروة والـ Heatmap (Task 4: Peak Hours Heatmap Chart)
**النوع:** Frontend Feature & Data Visualization
**اللي اتعمل:**
- إنشاء مكوّن `src/components/reports/charts/peak-hours-heatmap.tsx`:
  - مصفوفة تفاعلية متجاوبة 7 أيام × 24 ساعة تعرض أعداد الطلبات بتدرجات لونية معبرة عن الكثافة (Heatmap intensity).
  - تحديد دقيق لساعة الذروة (Peak Hour) وأيام الضغط في الـ dark kitchen لمساعدة الإدارة في توزيع الشفتات والعمالة.
  - مخطط أعمدة إحصائي للساعات مع تلميحات (Tooltips) لقيمة الإيراد وأعداد الطلبات لكل ساعة.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/components/reports/charts/peak-hours-heatmap.tsx`, `PROJECT_LOG.md`

---

## [2026-09-08] شريط فلاتر التقارير الموحد وتصدير البيانات (Task 3: Shared Reports Filter Bar & Export)
**النوع:** Frontend Feature & UI Components
**اللي اتعمل:**
- إنشاء مكوّن `src/components/reports/reports-filter-bar.tsx` المشترك:
  - تصفية التاريخ (من/إلى) مع أزرار الفترات السريعة (اليوم، أمس، آخر 7 أيام، هذا الشهر، الشهر السابق).
  - تصفية حسب البراند والمنصة.
  - دعم تصدير ملفات Excel/CSV والطباعة إلى PDF عبر زرين مخصصين بدعم الوضع الطباعي `print:hidden`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/components/reports/reports-filter-bar.tsx`, `PROJECT_LOG.md`

---

## [2026-09-08] خدمات ونقاط نهاية تقارير ساعات الذروة والموظفين ومقارنة الفترات (Task 2: Reports Services & API Routes)
**النوع:** Backend Feature & API Design
**اللي اتعمل:**
- تحديث `src/services/reports.ts`:
  - إضافة حساب مقارنة الفترة السابقة تلقائياً بالتوازي عبر `Promise.all` وحساب `% deltas` لبطاقات الـ KPI دون أي overhead إضافي.
  - إضافة خدمة `getPeakHoursData` لتجميع طلبات ساعات الذروة ومصفوفة الـ Heatmap.
  - إضافة خدمة `getEmployeesData` لتجميع أداء الموظفين وسجل الخصومات.
- إنشاء نقاط نهاية API آمنة تحت `requireApiRole("OWNER", "MANAGER")`:
  - `GET /api/reports/peak-hours`: لاسترجاع بيانات ساعات الذروة والـ heatmap.
  - `GET /api/reports/employees`: لاسترجاع بيانات أداء الكاشيرية وسجل الخصومات.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (197/197 اختبار).
**الملفات المتأثرة:** `src/services/reports.ts`, `src/app/api/reports/peak-hours/route.ts`, `src/app/api/reports/employees/route.ts`, `PROJECT_LOG.md`

---

## [2026-09-08] محرك تحليلات التقارير — ساعات الذروة، الموظفون، ومقارنة الفترات (Task 1: Reports Engine Extensions)
**النوع:** Feature & Domain Modeling (TDD)
**اللي اتعمل:**
- إضافة دوال حسابية نقية (Pure Functions) في `src/lib/reports.ts`:
  - `buildHourlyBreakdown`: توزيع الطلبات والإيراد على 24 ساعة (مع استبعاد الملغى).
  - `buildDayHourHeatmap`: مصفوفة 7×24 (168 خلية) لتغذية Heatmap ساعات الذروة.
  - `calculateEmployeeReport`: إحصائيات كل كاشير (الطلبات، الإلغاء، الإيرادات، AOV، الخصومات المعتمدة وقيمتها).
  - `extractDiscountRows`: استخراج سجل الخصومات (APPROVED / REJECTED) مرتباً بالتاريخ.
  - `calculateSalesComparison`: حساب نسب التغير بين فترتين لبطاقات الـ KPI (% deltas).
- اتباع دورة TDD كاملة: إضافة اختبارات C7 في `tests/e2e/tier3-cross-feature.test.ts` واجتيازها بنجاح (197/197 اختبار).
- **بوابات الجودة:** `npm run typecheck` (0 أخطاء)، `npm run test:e2e` (197/197 ناجح).
**الملفات المتأثرة:** `src/lib/reports.ts`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-08-31] إصلاح مفاتيح ترجمة إغلاق الشيفت (Fix missing closing.cashier & closing.notesPlaceholder i18n keys)
**النوع:** Bug Fix (TDD)
**اللي اتعمل:**
- حل خطأ `MISSING_MESSAGE: Could not resolve closing.cashier in messages for locale ar` في مكوّن `reopen-shift-dialog.tsx`.
- حل خطأ `MISSING_MESSAGE: Could not resolve closing.notesPlaceholder in messages for locale ar` في مكوّن `edit-closing-notes-dialog.tsx`.
- إضافة المفاتيح `"cashier"` و`"notesPlaceholder"` في `src/messages/ar.json` و`src/messages/en.json` تحت مساحة الأسماء `"closing"`.
- اتباع دورة TDD كاملة: تحديث اختبار فحص مفاتيح الترجمة في `tests/e2e/tier3-cross-feature.test.ts` (Red ➔ Green).
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (192/192 اختبار).
**الملفات المتأثرة:** `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-08-31] إصلاح مفتاح ترجمة هاتف العميل في معاينة الإيصال (Fix missing orders.phone i18n key)
**النوع:** Bug Fix (TDD)
**اللي اتعمل:**
- حل خطأ `MISSING_MESSAGE: Could not resolve orders.phone in messages for locale ar` في مكوّن `receipt-ticket-preview.tsx`.
- إضافة مفتاح `"phone": "رقم الهاتف"` في `src/messages/ar.json` و`"phone": "Phone"` في `src/messages/en.json` تحت مساحة الأسماء `"orders"`.
- اتباع دورة TDD كاملة: كتابة اختبار فحص مفاتيح الترجمة في `tests/e2e/tier3-cross-feature.test.ts` (Red ➔ Green).
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `npm run test:e2e` بنجاح 100% (192/192 اختبار).
**الملفات المتأثرة:** `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier3-cross-feature.test.ts`, `PROJECT_LOG.md`

---

## [2026-08-30] تخصيص لوحة التحكم الرئيسية حسب الدور والصلاحيات (Role-Based Customized Dashboard)
**النوع:** Feature & UI/UX Architecture
**اللي اتعمل:**
- **تخصيص لوحة التحكم حسب الدور:**
  - **الكاشير (`CashierDashboard`):** شاشة عمليات سريعة موجهة لتسجيل وتتبع طلبات الشيفت الجاري، بدون أي بيانات مالية تاريخية أو تحليلية مربكة، مع بطاقات مؤشرات الشيفت (إجمالي الطلبات، المسلم، كاش الخزينة، المصروفات) ولوحة مراحل السوشي (Pipeline).
  - **المدير (`ManagerDashboard`):** لوحة إشراف تشغيلي شاملة لمتابعة كافة الشيفتات المفتوحة، وتدفق الطلبات عبر القنوات، وإيرادات اليوم ومصروفات التشغيل، مع تفكيك حجم الطلبات حسب البراندات والمنصات.
  - **المالك (`OwnerDashboard`):** لوحة قيادة تنفيذية تتضمن مقارنة ذكية للأداء بين **اليوم والأمس** (Delta % ونسب التغير بالإيرادات والطلبات ونسب الإلغاء)، وحصص البراندات والمنصات بالنسبة المئوية ومخططات التقدم، ومؤشرات الطاقة التشغيلية للفريق والمناديب.
- **توسيع طبقة الخدمات (`getDashboardOverview`):**
  - حساب مؤشرات مقارنة الأمس (`yesterdayRevenue`, `yesterdayOrders`, `yesterdayCancelled`) وحصر المستخدمين والمناديب النشطين للـ Owner.
- **إعادة هيكلة العرض كـ Role Router:**
  - تحويل `DashboardOverviewClient` إلى موجه نظيف يختار المكون المناسب لكل مستخدم تلقائياً.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `scripts/verify-phase9.ts` بنجاح 100%، واجتياز `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/services/orders.ts`, `src/components/dashboard/dashboard-overview.tsx`, `src/components/dashboard/cashier-dashboard.tsx`, `src/components/dashboard/manager-dashboard.tsx`, `src/components/dashboard/owner-dashboard.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`

---

## [2026-08-30] تمكين إعادة تفعيل الحسابات المحذوفة وتوليد بيانات الدخول تلقائياً (User Reactivation & Credentials Provisioning)
**النوع:** Feature & Bug Fix
**اللي اتعمل:**
- **دعم إعادة التفعيل في طبقة الخدمات والـ API:**
  - تحديث دالة `updateUser` في `src/services/users.ts` ومسار `PATCH /api/users/[id]` لتوليد كلمة مرور مؤقتة عشوائية وإعادة إنشاء/تنشيط حساب الدخول في **Supabase Auth** تلقائياً عند تحويل حالة المستخدم من معطل (`isActive: false`) إلى نشط (`isActive: true`).
- **تحسين واجهة المستخدم وتجربة الاستعادة:**
  - إضافة زر إجراء صريح **"إعادة تفعيل" (`table.reactivate`)** في صفوف الحسابات المعطلة/المحذوفة باللون الأخضر المميز.
  - دعم إعادة التفعيل أيضاً عبر الـ Switch ونافذة تعديل المستخدم (`user-dialog.tsx`).
  - عند اكتمال إعادة التفعيل بنجاح، تظهر تلقائياً نافذة **"كلمة المرور المؤقتة الجديدة"** مع زر نسخ بنقرة واحدة لتسليمها للموظف، وتعود حالة الحساب لنشط فوراً في الواجهة والـ KPI.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` (0 أخطاء).
  - اجتياز `scripts/verify-phase9.ts` بنجاح 100% (شاملاً اختبار إعادة التفعيل وتوليد كلمات المرور وفحص الـ Audit Logs).
  - اجتياز `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/services/users.ts`, `src/app/api/users/[id]/route.ts`, `src/components/users/users-client.tsx`, `src/components/users/user-dialog.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `scripts/verify-phase9.ts`, `PROJECT_LOG.md`

---

## [2026-08-30] ضبط الفلتر الافتراضي لصفحة المستخدمين على الحسابات النشطة فقط (Set Default User Filter to Active Only)
**النوع:** UX Enhancement & State Sync
**اللي اتعمل:**
- تعديل الحالة الابتدائية للفلتر `selectedStatus` في `src/components/users/users-client.tsx` لتكون `"ACTIVE"` (النشطين فقط) افتراضياً.
- تحديث دالة `handleDeleteUser` لتقوم بتعيين `isActive: false` في الذاكرة المحلية عند نجاح الحذف، مما يُسقط المستخدم المحذوف تلقائياً وفورياً من جدول النشطين مع تحديث بطاقات إحصائيات الـ KPI بدقة متناهية.
- ضمان عدم ظهور المستخدمين المحذوفين أو المعطلين بعد أي تحديث للصفحة (Refresh) إلا عند اختيار فلتر "المعطلين فقط" يدوياً.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء)، واجتياز `scripts/verify-phase9.ts` بنجاح 100%، واجتياز `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/components/users/users-client.tsx`, `PROJECT_LOG.md`

---

## [2026-08-30] إصلاح تسجيل دخول المستخدمين الجدد وتوفير ميزة حذف الحسابات بالصلاحيات (User Provisioning Fix & Delete Feature)
**النوع:** Bug Fix & Feature
**اللي اتعمل:**
- **إصلاح تسجيل دخول المستخدمين الجدد (Supabase Auth Provisioning):**
  - إنشاء `src/lib/supabase/admin.ts` باستخدام `service_role` key لربط إضافة المستخدمين الجدد بإنشاء حساب في Supabase Auth تلقائياً مع توليد كلمة مرور مؤقتة آمنة عشوائياً.
  - عرض بطاقة "كلمة المرور المؤقتة" مرة واحدة في واجهة المالك/المدير مع زر نسخ وملاحظة توجيهية للموظف.
  - دعم إعادة تفعيل الحسابات المحذوفة سابقاً عند إعادة إضافتها بنفس البريد الإلكتروني.
- **ميزة حذف المستخدم (Delete User with Role-Based Guards):**
  - إضافة دالة `deleteUser` في `src/services/users.ts` ومسار `DELETE /api/users/[id]`.
  - حماية المالك من حذف حسابه الشخصي (`CANNOT_DELETE_SELF`).
  - السماح للمدير بحذف الكاشير فقط ومنعه من حذف أي مدير آخر أو مالك (`FORBIDDEN_DELETE`).
  - عند الحذف: إلغاء حساب Supabase Auth فوراً لمنعه من الدخول، وتعطيل الحساب محلياً (`isActive = false`) مع توثيق العملية ذرياً في جدول الـ `AuditLog`.
- **فتح وصول المدير لصفحة المستخدمين:**
  - إتاحة تبويب وصفحة المستخدمين للمدير مع تقييد نطاق العرض والإضافة والتعديل والحذف للكاشيرات فقط.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` (0 أخطاء).
  - اجتياز `scripts/verify-phase9.ts` بنجاح 100% (يشمل 7 خطوات اختبارية للحذف والصلاحيات وتوليد كلمات المرور).
  - اجتياز `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/lib/supabase/admin.ts`, `.env.example`, `src/services/users.ts`, `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`, `src/app/[locale]/(dashboard)/users/page.tsx`, `src/components/layout/dashboard-header.tsx`, `src/components/users/user-dialog.tsx`, `src/components/users/users-client.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `scripts/verify-phase9.ts`, `PROJECT_LOG.md`

---

## [2026-08-30] إصلاح خطأ عدم تطابق الـ Hydration لتنسيق التاريخ في صفحة المستخدمين (Fix Locale Date Hydration Mismatch in Users Page)
**النوع:** Bug Fix
**اللي اتعمل:**
- استبدال `toLocaleDateString(undefined)` بـ `format.dateTime(...)` من `useFormatter()` التابع لـ `next-intl` لضمان توحيد لغة تنسيق التاريخ حتمياً بين السيرفر والمتصفح بحسب الـ Locale الفعلي للمستخدم.
- إضافة `suppressHydrationWarning` لعنصر عرض التاريخ في جدول المستخدمين.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء) و `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/components/users/users-client.tsx`, `PROJECT_LOG.md`

---

## [2026-08-30] توحيد وموازنة أبعاد وعناصر صفحة إدارة المستخدمين (Users Page UI/UX & Layout Harmonization)
**النوع:** UI/UX & Refactoring
**اللي اتعمل:**
- **توحيد الحاوية وهوامش الصفحة:**
  - تعديل الحاوية الرئيسية لتتبع المعيار المعتمد بالنظام (`mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8`) لتتطابق في المحاذاة والهوامش مع باقي الشاشات.
- **ضبط شبكة كروت الإحصائيات (KPI Grid):**
  - توحيد ارتفاع وأبعاد الكروت الخمسة بحجم أيقونات معتمد `size-11` وأرقام عريضة متناسقة بخاصية `tabular-nums`.
- **تنسيق شريط البحث والفلاتر:**
  - إعادة توزيع حقل البحث ومجموعتي الأزرار المقسمة (أدوار المستخدمين وحالات التفعيل) لتتجاوب بسلاسة دون تداخل أو قص.
- **تحسين جدول المستخدمين:**
  - اعتماد أفاتار دائري مميز لكل مستخدم مع ألوان متدرجة بحسب الدور (أصفر للمالك، نيلي للمدير، زمردي للكاشير)، وتحسين مساحات الأعمدة وأزرار التفعيل والتعديل.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` (0 أخطاء)، `npm run test:e2e` (191/191 بنجاح 100%)، و `scripts/verify-phase9.ts` (100% بنجاح).
**الملفات المتأثرة:** `src/components/users/users-client.tsx`, `src/components/users/user-dialog.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `docs/plans/2026-08-30-users-page-harmonization-plan.md`, `PROJECT_LOG.md`

---

## [2026-08-30] إعادة تصميم شريط التنقل العلوي وتحديث الهوية البصرية (Navigation Bar UI/UX Redesign & Brand Polish)
**النوع:** UI/UX & Refactoring
**اللي اتعمل:**
- **تحديث الهوية التجارية واسم النظام:**
  - اعتماد اسم براند واقعي وفاخر **Sushi Flower** (سوشي فلاور) ووصف تشغيلي دقيق: **إدارة الطلبات والتشغيل** / **OPERATIONS & ORDER CONTROL**.
- **إصلاح تشوه رابط الشعار والصفحة الرئيسية:**
  - إزالة الإطار الرمادي النشط والحدود المحيطة بالشعار في الصفحة الرئيسية، وبناء شعار نظيف وفاخر بأيقونة متدرجة ناعمة تبرز هوية البراند دون أي تشوه بصري عند التفعيل.
- **حل مشكلة اختفاء وقص زر "المستخدمين":**
  - إعادة موازنة مساحات الشريط العلوي وتعديل الـ padding والـ gap للتبويبات السبعة (`الأوردرات`، `المنيو`، `التوصيل`، `المصاريف`، `إغلاق اليوم`، `التقارير`، `المستخدمين`) لضمان ظهور كافة التبويبات بنصوصها وأيقوناتها كاملة على جميع مقاسات الشاشات من 1024px فما فوق وبدون أي قص.
- **تطوير شريحة المستخدم وقائمة الحساب المنسدلة (User Profile Dropdown):**
  - استبدال الصندوق الثقيل القديم بـ Avatar دائري عصري فائق الأناقة مع نقطة لونية ذكية توضح الدور (أصفر للمالك، نيلي للمدير، أخضر للكاشير).
  - إضافة قائمة منسدلة أنيقة تشمل بطاقة بيانات المستخدم، البريد، شارة الدور، روابط التنقل السريعة، وزر تسجيل الخروج السلس.
- **بوابات الجودة:**
  - اجتياز `npm run typecheck` (0 أخطاء) و `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/components/layout/dashboard-header.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `docs/plans/2026-08-30-navbar-ui-ux-redesign-plan.md`, `PROJECT_LOG.md`

---

## [2026-08-30] إصلاح خطأ عدم تطابق الـ Hydration الناتج عن إضافات المتصفح (Fix Browser Extension Hydration Mismatch on Body Tag)
**النوع:** Bug Fix
**اللي اتعمل:**
- إضافة خاصية `suppressHydrationWarning` إلى وسم `<body ...>` في `src/app/[locale]/layout.tsx`.
- **السبب:** إضافات المتصفح (مثل Grammarly التي تحقن خصائص `data-new-gr-c-s-check-loaded` و `data-gr-ext-installed` على وسم `<body>` قبل اكتمال الـ Hydration في React 19) كانت تتسبب في إطلاق تحذير React Hydration Error. تم حل المشكلة نهائياً بتفعيل تجاهل تحذيرات المطابقة على عنصر `body` بجانب `html`.
- **بوابات الجودة:** اجتياز `npm run typecheck` (0 أخطاء) و `npm run test:e2e` (191/191 اختبار بنجاح 100%).
**الملفات المتأثرة:** `src/app/[locale]/layout.tsx`, `PROJECT_LOG.md`

---

## [2026-08-30] تعديل منظومة التوصيل: حذف استلام العميل وتبسيط تعيين طياري التطبيقات والشركات الخارجية (Delivery Refinement & Pickup Removal)
**النوع:** Feature & Refactoring
**اللي اتعمل:**
- **حذف استلام العميل من المطعم (`PICKUP`) بالكامل:**
  - بما أن النظام مخصص لمطبخ سحابي (Dark Kitchen) توصيل فقط، تم حذف خيار `PICKUP` نهائياً من كافة الواجهات والحقول والفلاتر ونوافذ الحوار وشاشات الطلبات والـ POS والـ State Machine والترجمات.
- **تبسيط طياري التطبيقات (`APP`) والشركات الخارجية (`EXTERNAL`):**
  - التفريق المعماري بين طيار المطعم الداخلي (`OWN`) وطياري المنصات والشحن (`APP` / `EXTERNAL`):
    - طيار المطعم (`OWN`): يسجل بالاسم كفرد وموظف لمتابعة كاش الشيفتات والتسليمات الفردية.
    - طيار المنصة (`APP`) وشركة الشحن (`EXTERNAL`): لا يتطلبان تسجيل اسم شخصي مسبقاً، ويتم تعيينهما بنوع الأسطول بضغطة زر واحدة.
  - إضافة دالة `getOrCreateSystemDriver` في `src/services/delivery.ts` لضمان وجود سجلات النظام لطياري التطبيقات والشركات الخارجية تلقائياً.
- **تحديث واجهات التعيين والـ POS (`AssignDriverDialog` & `OrderForm`):**
  - إعادة تصميم نافذة تعيين المندوب (`AssignDriverDialog`) لتشمل بطاقات سريعة بلمسة واحدة:
    - 🟣 **طيار التطبيق (APP Fleet)** (تصفير رسوم التوصيل المحصلة للمطعم).
    - 🔵 **شركة شحن خارجية (EXTERNAL Courier)** (احتساب رسوم المنطقة).
    - 🟢 **طياري أسطول المطعم (OWN Fleet)** مع بحث مخصص وقائمة للمناديب المسجلين بالاسم.
  - تنظيف قائمة اختيار المندوب في شاشة إنشاء الطلب السريع (`POS / OrderForm`) وتحديث شاشة تفاصيل الطلب (`OrderDetailsModal`).
- **اجتياز بوابات الجودة بالكامل:**
  - `npm run typecheck` (0 أخطاء).
  - `npm run test:e2e` (191/191 اختبار بنجاح 100%).
  - `scripts/verify-phase5.ts` و `scripts/verify-phase8.ts` (100% بنجاح).
**السبب:** تلبية طلب العميل بمطابقة السيستم لواقع تشغيل المطبخ السحابي وإلغاء الاستلام وتسهيل اختيار طياري المنصات.
**الملفات المتأثرة:** `src/lib/orderStateMachine.ts`, `src/services/delivery.ts`, `src/app/api/delivery/drivers/route.ts`, `src/components/delivery/driver-dialog.tsx`, `src/components/delivery/delivery-client.tsx`, `src/components/delivery/assign-driver-dialog.tsx`, `src/components/orders/order-form.tsx`, `src/components/orders/order-details-modal.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/fixtures/mock-data.ts`, `tests/helpers/receipt-oracle.ts`, `scripts/verify-phase5.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** منظومة الدليفري أصبحت أسرع بكثير في نقطة البيع والـ Kanban، وبلا أي تعقيد أو إدخال أسماء وهمية لطياري التطبيقات.

---

## [2026-08-28] المرحلة 9 — إدارة المستخدمين والصلاحيات وبوابة التحقق الآلي (Phase 9: User Management & Roles UI Completion)
**النوع:** Feature, Security & Quality Gate
**اللي اتعمل:**
- **طبقة خدمات المستخدمين (`src/services/users.ts`):**
  - بناء `listUsers` مع دعم الفلترة حسب الدور (`Role`)، وحالة التفعيل (`isActive`)، والبحث بالاسم أو البريد الإلكتروني.
  - بناء `createUser` مع التحقق من صحة البريد الإلكتروني ومنع تكراره، وتسجيل `AuditLog` ذري داخل نفس الـ `prisma.$transaction`.
  - بناء `updateUser` مع حماية ذاتية للمالك (`CANNOT_DEACTIVATE_SELF` و `CANNOT_DEMOTE_SELF`) وتسجيل تدقيق ذري بحالتي `oldValue` و `newValue`.
- **راوتات الـ API المحمية بـ OWNER فقط (`src/app/api/users/`):**
  - `GET /api/users`: استرجاع قائمة المستخدمين مع تطبيق الفلاتر.
  - `POST /api/users`: إنشاء مستخدم جديد بعد التحقق عبر Zod.
  - `PATCH /api/users/[id]`: تعديل الاسم أو الدور أو حالة التفعيل مع فحص Zod وحماية الصلاحيات.
- **واجهة المستخدم ثنائية اللغة (`/users`):**
  - صفحة السيرفر المحمية `src/app/[locale]/(dashboard)/users/page.tsx` مع تحويل غير المالك إلى `/`.
  - مكوّن العميل `src/components/users/users-client.tsx` بشبكة KPI (إجمالي المستخدمين، الحسابات النشطة، المالكين، المديرين، الكاشيرات)، شريط بحث وفلاتر تفاعلية، وجدول مستخدمين متجاوب مع تبديل حالة الحساب بلمسة واحدة.
  - مكوّن النافذة المنبثقة `src/components/users/user-dialog.tsx` لإضافة وتعديل المستخدمين واختيار الأدوار مع شروحات وظيفية ملونة.
  - إظهار رابط تبويب "المستخدمين" في شريط التنقل `dashboard-header.tsx` للمالك فقط (`OWNER`).
  - دعم كامل للترجمات في `src/messages/ar.json` و `src/messages/en.json`.
- **الاختبارات وبوابات الجودة:**
  - إضافة قسم F15 في `tests/e2e/tier1-feature-coverage.test.ts` واجتياز 191/191 اختبار.
  - إنشاء سكربت التحقق الآلي `scripts/verify-phase9.ts` واجتيازه بنسبة نجاح 100%.
  - `npm run typecheck` بنسبة نجاح 100% (0 أخطاء).
**السبب:** استيفاء متطلبات إدارة المستخدمين والصلاحيات بالكامل (`FR-USR-01` … `FR-USR-04`) وتأمين الوصول للنظام.
**الملفات المتأثرة:** `src/services/users.ts`, `src/app/api/users/*`, `src/components/users/*`, `src/app/[locale]/(dashboard)/users/page.tsx`, `src/components/layout/dashboard-header.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `tests/e2e/tier1-feature-coverage.test.ts`, `scripts/verify-phase9.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتملت المرحلة 9 بنجاح تام والنظام جاهز للمرحلة 10 (سجل تدقيق العمليات والمراقبة FR-AUD-03/04).

---

## [2026-08-28] دمج الشعار والصفحة الرئيسية وحل قص النصوص في شريط التنقل (Navbar Brand & Home Consolidation and Responsive Refinement)
**النوع:** UI/UX Polish & Refactoring
**اللي اتعمل:**
- **دمج الشعار والصفحة الرئيسية (Brand & Home Consolidation):**
  - دمج رابط الصفحة الرئيسية "الرئيسية" مع الشعار واسم النظام ("نظام إدارة الطلبات") في رابط تفاعلي موحد يقود إلى `/` مع تفعيل بصري مميز `isHomeActive` عند التواجد في الرئيسية.
  - إزالة زر "الرئيسية" المستقل من صف الأزرار في سطح المكتب لتوفير أكثر من 90px من العرض الأفقي ومنع تكرار الوظيفة.
  - الإبقاء على رابط "الرئيسية" في أعلى القائمة الجانبية للموبايل لضمان سهولة الوصول باللمس.
- **القضاء على مشكلة قص النصوص (Eliminating Text Truncation):**
  - ضبط المسافات الأفقية والهوامش للروابط (`gap-0.5 xl:gap-1.5` و `px-2 xl:px-3` و `text-xs xl:text-sm`).
  - إخفاء الوصف الفرعي للشعار ("4 براندات سوشي · مطبخ سحابي") في الشاشات المتوسطة والكبيرة (`hidden xl:inline`) وتفعيله في الشاشات العريضة جداً لضمان ظهور كامل أسماء التبويبات ("التقارير"، "إغلاق اليوم"، "المصاريف"، "التوصيل"، "المنيو"، "الأوردرات") بدون أي قص (Truncation) أو ظهور "التق...".
- **اجتياز بوابات الجودة:**
  - `npm run typecheck` (0 أخطاء).
  - `npm run test:e2e` (186/186 اختبار بنجاح 100%).
**السبب:** تحسين تجربة المستخدم وحل مشكلة قص نص "التقارير" وتوفير مساحة أفقية مريحة لاستيعاب التبويبات القادمة (المستخدمين والمراقبة).
**الملفات المتأثرة:** `src/components/layout/dashboard-header.tsx`, `docs/plans/2026-08-28-navbar-refinement-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** الواجهة أصبحت أنظف وأوسع وبأفضل ممارسات الـ UX المتوافقة مع كافة مقاسات الشاشات.

---

## [2026-08-28] تحسينات لوحة التقارير التحليلية والرسوم البيانية وحل تداخل شريط التنقل (Data Analyst Reports Redesign & Navigation Fix)
**النوع:** Feature & UI/UX Polish
**اللي اتعمل:**
- **إصلاح شريط التنقل (Navbar Overlap Fix):**
  - إضافة حماية الانكماش `shrink-0` لحاوية الشعار وأزرار التحكم اليمين (`+ طلب جديد`، محول اللغة والمظهر، ملف المستخدم).
  - تحويل قائمة الروابط في الشاشات المتوسطة والكبيرة إلى نمط متجاوب مرن مع `overflow-x-auto no-scrollbar` لمنع أي التفاف أو تداخل للأزرار على كافة مقاسات الشاشات.
- **إعادة تصميم لوحة التقارير والـ KPIs بمستوى Data Analyst محترف:**
  - بناء المكوّن `src/components/reports/reports-kpi-grid.tsx`:
    - 4 بطاقات KPI بألوان وتدرجات وهوية بصرية مميزة (صافي الإيرادات، صافي الأرباح التشغيلية، إجمالي المصروفات، حجم الطلبات و AOV).
    - حسابات تفصيلية لهامش الربح التشغيلي `% Margin` مع شارة تقييم الأداء المالي، ونسبة المصروفات من الإيرادات، ومعدل إلغاء الطلبات `% Cancellation`.
    - شريط بياني متدرج لتوزيع الدفع النقدي والإلكتروني (كاش مقابل فيزا + أونلاين) بنسب مئوية ومبالغ مالية دقيقة.
- **حزمة الرسوم البيانية التفاعلية الكاملة باستخدام Recharts (`src/components/reports/charts/`):**
  - `revenue-trend-chart.tsx`: رسم بياني مساحي وعمودي (Composed Area & Bar Chart) يوضح تطور صافي الإيرادات اليومية وعدد الطلبات عبر الزمن.
  - `platform-share-chart.tsx`: رسم بياني دائري مجوّف (Donut Chart) يوضح الحصة السوقية لكل منصة توصيل (طلبات، المنيوز، انستاشوب، هاري، فيسبوك، مباشر) بألوانها الرسمية.
  - `brand-performance-chart.tsx`: رسم بياني عمودي يقارن مبيعات وأوردرات براندات السوشي الأربعة (Flower, Mastery, Niwa, Tobiko) بهوية الكانجي والألوان الرسمية.
  - `top-products-chart.tsx`: ترتيب بياني أفقي لأعلى أصناف السوشي مبيعاً مع الكميات والإيرادات.
- **تكامل لوحة التحكم وجداول البيانات التفصيلية:**
  - دمج المكونات داخل `src/components/reports/reports-client.tsx` مع فلاتر التاريخ والبراند والمنصة والجداول التبويبية.
  - إضافة كافة مفاتيح الترجمة باللغتين العربية والإنجليزية في `src/messages/ar.json` و `src/messages/en.json`.
- **اجتياز جميع بوابات الجودة:**
  - `npm run typecheck` (0 أخطاء).
  - `npm run test:e2e` (186/186 اختبار بنجاح 100%).
  - `npx tsx scripts/verify-phase8.ts` بنجاح 100%.
**السبب:** تلبية طلب العميل لتوفير لوحة تحليلات ورسوم بيانية تفاعلية متقدمة على أعلى مستوى من الاحترافية وحل مشكلة تداخل الأزرار في الهيدر.
**الملفات المتأثرة:** `src/components/layout/dashboard-header.tsx`, `src/components/reports/reports-kpi-grid.tsx`, `src/components/reports/charts/*`, `src/components/reports/reports-client.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `docs/plans/2026-08-28-phase8-analytics-charts-redesign-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** تحسين كبير في تجربة المستخدم والأداء البصري لشريط التنقل ولوحة التقارير، والنظام جاهز تماماً للانتقال للمرحلة 9 (إدارة المستخدمين).

---

## [2026-08-28] المرحلة 8 — مهمة 8.4: بوابة التحقق الآلي واكتمال نظام التقارير والتحليلات (Phase 8 Completion & Automated Verification Gate)
**النوع:** Verification & Release Gate
**اللي اتعمل:**
- إنشاء سكربت التحقق الآلي الشامل للمرحلة `scripts/verify-phase8.ts`:
  - بذر وحماية بيانات الاختبار (مدير، كاشير، براند، تصنيف، 3 منتجات، منصة، مندوب، منطقة توصيل، فئة مصروفات).
  - فتح شيفت كاشير وإنشاء 4 أوردرات تغطي حالات دورة الحياة وطرق الدفع والخصم (كاش مسلم مع خصم معتمد، فيزا مؤكد مع مندوب، أونلاين جاهز استلام مباشر، كاش ملغي).
  - تسجيل مصروفين بالشيفت (40 + 60 = 100 ج.م).
  - استدعاء خدمة التقارير `getReportsData` والتحقق الدقيق من مطابقة الأرقام بالسنت:
    - الملخص: 4 أوردرات، 1 ملغي، 3 نشطة، 1 مسلم، إجمالي مبيعات 330، خصومات 20، رسوم توصيل 60، صافي إيراد 370، وتوزيع طرق الدفع (كاش 210، فيزا 80، أونلاين 80).
    - مصفوفة المنصات × البراندات ومطابقة عدد الأوردرات وصافي المبيعات.
    - تقرير تحصيل كاش المناديب (المندوب أحمد 210 ج.م وطلبات الاستلام المباشر 0 ج.م).
    - ترتيب أعلى المنتجات مبيعاً واستبعاد أصناف الأوردر الملغي.
    - التحليل اليومي للتواريخ وتجميع الأرقام المالية.
  - إغلاق الشيفت وتنظيف جميع السجلات والأوردرات وسجلات المراقبة في كتلة `finally`.
- اجتياز جميع بوابات الجودة بنجاح تام:
  - `npx tsx scripts/verify-phase8.ts` بنسبة نجاح 100%.
  - `npm run typecheck` (0 أخطاء).
  - `npm run test:e2e` (186/186 اختبار بنجاح 100%).
- تحديث وثيقة خطة المرحلة `docs/plans/2026-08-28-phase8-reports-plan.md` باكتمال جميع المهام.
**السبب:** استيفاء متطلبات المرحلة 8 بالكامل (FR-RPT-01 … FR-RPT-07) وبوابات الجودة الإجبارية.
**الملفات المتأثرة:** `scripts/verify-phase8.ts`, `docs/plans/2026-08-28-phase8-reports-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** المرحلة 8 مكتملة وجاهزة 100%. المرحلة القادمة هي المرحلة 9 (إدارة المستخدمين والصلاحيات User Management).

---

## [2026-08-28] المرحلة 8 — مهمة 8.3: واجهة لوحة التقارير والتحليلات والتبويب (Reports UI & Dashboard Navigation)
**النوع:** Feature & UI/UX
**اللي اتعمل:**
- إنشاء صفحة السيرفر المحمية `src/app/[locale]/(dashboard)/reports/page.tsx`:
  - حماية المسار `requirePageUser` وتحويل الكاشير تلقائياً إلى صفحة الطلبات.
  - جلب بيانات الشهر الحالي الأولية وقائمة البراندات والمنصات وتمريرها لمكوّن العميل.
- بناء مكوّن واجهة التقارير `src/components/reports/reports-client.tsx`:
  - شريط ترويسة ذكي مع نطاق التواريخ وزر التحديث الفوري.
  - بطاقة فلاتر التواريخ مع أزرار النطاق السريع (اليوم، أمس، آخر 7 أيام، هذا الشهر، الشهر السابق) وفلاتر البراندات والمنصات.
  - 4 بطاقات KPI لمؤشرات الأداء اللحظية (صافي الإيرادات، صافي الأرباح، إجمالي المصروفات، إجمالي الطلبات ومتوسط قيمة الطلب AOV).
  - شريط توزيع طرق الدفع (كاش، فيزا، أونلاين) بنسب مئوية وألوان مميزة.
  - 4 جداول تبويب تفصيلية: التحليل المالي اليومي، مصفوفة المنصات × البراندات، تحصيل كاش المناديب، وأعلى 10 منتجات مبيعاً.
- تحديث ترويسة النظام `dashboard-header.tsx` بإضافة تبويب "التقارير" مع أيقونة `BarChart3` للمالك والمدير فقط.
- إضافة ترجمات قسم `reports` كاملة في `src/messages/ar.json` و `src/messages/en.json`.
- اجتياز فحص الأنواع `npm run typecheck` بنجاح (0 أخطاء).
**السبب:** تنفيذ المهمة 8.3 من خطة التقارير والتحليلات (Directives §2, §3).
**الملفات المتأثرة:** `src/app/[locale]/(dashboard)/reports/page.tsx`, `src/components/reports/reports-client.tsx`, `src/components/layout/dashboard-header.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** الواجهة جاهزة بالكامل للتحقق النهائي في المهمة 8.4.

---

## [2026-08-28] المرحلة 8 — مهمة 8.2: طبقة خدمة ونقاط نهاية تقارير المبيعات والتحليلات (Reports Service & API)
**النوع:** Feature & Backend
**اللي اتعمل:**
- إنشاء طبقة خدمة التقارير `src/services/reports.ts` (قراءة فقط بدون كتابة تدقيق):
  - `getReportsData`: فحص النطاق الزمني والتأكد من صحة التواريخ وقصر النطاق على سنتين كحد أقصى للحماية من الاستعلامات المفتوحة.
  - استعلامان متوازيان لقاعدة البيانات (`prisma.order.findMany` و `prisma.expense.findMany`) مع فلترة البراندات والمنصات وتضمين بنود المنتجات والمناديب.
  - تغذية محرك الحسابات `src/lib/reports.ts` بالبيانات وإرجاع الكائن التجميعي الكامل للتقارير.
- بناء مسار الـ API `GET /api/reports` في `src/app/api/reports/route.ts`:
  - حماية صارمة `requireApiRole("OWNER", "MANAGER")` وإرجاع 403 للكاشير.
  - قراءة واستخراج معايير الفلترة (`startDate`, `endDate`, `brandId`, `platformId`).
- اجتياز فحص الأنواع `npm run typecheck` بنجاح (0 أخطاء).
**السبب:** تنفيذ المهمة 8.2 من خطة التقارير والتحليلات (Directives §2, §3).
**الملفات المتأثرة:** `src/services/reports.ts`, `src/app/api/reports/route.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** تجهيز الـ API لربطه بالواجهة في المهمة 8.3.

---

## [2026-08-28] المرحلة 8 — مهمة 8.1: محرك حسابات التقارير والتحليلات واختبارات F14
**النوع:** Feature & Tests (TDD)
**اللي اتعمل:**
- بناء محرك حسابات التقارير `src/lib/reports.ts` كدوال pure آمنة مع التحويلات المالية (`DecimalLike` و `roundCurrency`):
  - `calculateSalesSummary`: حساب مؤشرات المبيعات والطلبات، استبعاد الأوردرات الملغاة والخصومات المرفوضة، وتوزيع مبالغ الكاش والفيزا والأونلاين ومتوسط قيمة الطلب (AOV).
  - `groupSalesByPlatformBrand`: تجميع ومصفوفة مبيعات المنصات × البراندات مرتبة تنازلياً.
  - `buildDailyBreakdown`: تحليل مالي يومي لكل يوم في النطاق الزمني المحدد.
  - `calculateDriverCashCollection`: تجميع تحصيلات المناديب الكاش مع سطر مخصص للطلبات بدون مندوب.
  - `calculateTopProducts`: ترتيب المنتجات الأكثر مبيعاً حسب الكميات والإيرادات.
- إضافة قسم الاختبارات F14 في `tests/e2e/tier1-feature-coverage.test.ts` وتحديث اختبار هاري آب F6.4 وإضافة فيسبوك F6.6.
- اجتياز جميع اختبارات السويت بالكامل (186/186 اختباراً أخضر بنسبة 100%) و `npm run typecheck` بنجاح (0 أخطاء).
**السبب:** تنفيذ المهمة 8.1 من خطة التقارير والتحليلات بأسلوب TDD وفق معايير المشروع (Directives §2, §3).
**الملفات المتأثرة:** `src/lib/reports.ts`, `tests/e2e/tier1-feature-coverage.test.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** لا يوجد أي تغيير في الـ schema، وتغذية طبقة الخدمة والـ API في المهمة 8.2.

---

## [2026-08-28] بدء المرحلة 8 — لوحة التقارير والتحليلات (Reports & Analytics Dashboard) — تثبيت الترقيم
**النوع:** Decision
**اللي اتعمل:**
- تثبيت ترقيم المراحل المتبقية حسب توجيه المستخدم و`ENGINEERING_DIRECTIVES.md` §5: **المرحلة 8 = التقارير والتحليلات (FR-RPT)**، **المرحلة 9 = إدارة المستخدمين والصلاحيات (FR-USR)**، وبعدهما عارض الـ Audit (FR-AUD-03/04).
- جولة الـ UI/UX المسجلة تاريخيًا باسم "المرحلة 8 / 8.5 / 8.6" تبقى كما هي في السجل (تسمية وقتها)، والمرحلة الجديدة 8 هي التقارير حسب ترتيب الـ Directives.
- كتابة خطة المرحلة في `docs/plans/2026-08-28-phase8-reports-plan.md` — بدون أي تغيير على الـ schema، وبأسلوب مهمات صغيرة متسلسلة (كل مهمة ببوابة اختبار قبل الانتقال للي بعدها).
**السبب:** توجيه صريح من المستخدم بالترقيم وبأسلوب التنفيذ التدريجي لتقليل الأخطاء والهلوسة، وضمان اختبار كل مهمة قبل المرحلة التالية.
**الملفات المتأثرة:** `docs/plans/2026-08-28-phase8-reports-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** لا يوجد.

---

## [2026-08-28] تنظيف توثيقي — مزامنة AGENTS.md وPROJECT.md مع واقع الكود
**النوع:** Decision
**اللي اتعمل:**
- `PROJECT.md`: تحديث حالة Milestone 5 (سويت الاختبارات E2E والتحصين العدائي) من PLANNED إلى COMPLETED بعد اجتياز السويت 179/179، وتصحيح قائمة المنصات إلى 6 (بإضافة Facebook)، وتحديث وصف الثيمات بعد إزالة ثيم `.kitchen` الليلي في المرحلة 8.6.
- `AGENTS.md`: تصحيح عدد المنصات (6 بدل 5)، واستبدال وصف التحقق الوظيفي القديم (اختبارات Playwright/Python) بالواقع الفعلي: `npm run test:e2e` (سويت tsx منطقي في `tests/e2e/run-all.ts`) + سكربتات بوابة المراحل `scripts/verify-phase*.ts`، وتحديث فخ السيرفرات اليتيمة ليكون عام (مش مرتبط بـ Playwright).
**السبب:** الدوكيومنتيشن كان متأخر عن جولتي 8.5 و8.6 وبيضلل أي مطور أو وكيل AI جديد عن أدوات التحقق الحقيقية وعدد المنصات المعتمد.
**الملفات المتأثرة:** `AGENTS.md`, `PROJECT.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** لا يوجد.

---

## [2026-08-27] المرحلة 8.6 — التحكم في أنواع المصروفات، بحث المناديب والمناطق الذكي، السحب والإفلات بالمطبخ، وتبسيط الواجهات (Expense Types Management, Multi-Token Search, Kitchen Drag & Drop, Official Logos, & UI De-cluttering)
**النوع:** Feature & UI/UX / Operational Refinements & Core Usability
**اللي اتعمل:**
1. التحكم الكامل في أنواع المصروفات (إضافة، تعديل الاسم، الحذف الآمن) للمالك والمدير:
   - إضافة دالتي `updateExpenseType` و `deleteExpenseType` في `src/services/expenses.ts` مع توثيق سجل المراقبة الذري `AuditLog`.
   - مسار الـ API `PATCH` (تعديل الاسم) و `DELETE` في `src/app/api/expenses/types/[id]/route.ts` مع فحص الصلاحيات `requireApiRole("OWNER", "MANAGER")`، وحماية صارمة تمنع حذف أي نوع مرتبط بمصروفات مسجلة في النظام.
   - بناء نافذة `ManageExpenseTypesDialog` في `src/components/expenses/manage-expense-types-dialog.tsx` تتيح للمدير والمالك تعديل مسميات الأنواع أو حذفها مع تأكيد الحذف وتنبيهات الاستخدام.
   - دمج زر "إدارة أنواع المصاريف" داخل شاشة المصروفات `src/components/expenses/expenses-client.tsx`.
2. خوارزمية بحث سريع متعدد الكلمات والتطبيع اللغوي واختيار المناطق والمناديب:
   - إنشاء محرك التطبيع اللغوي والبحث `src/lib/search.ts` (`normalizeArabic` لإزالة التشكيل، توحيد الهمزات والتاء المربوطة والألف المقصورة، ومطابقة الأسماء المركبة، و `matchesMultiToken` لمطابقة جميع كلمات الاستعلام في أي موضع وترتيب).
   - بناء مكوّن `SearchableSelect` في `src/components/ui/searchable-select.tsx` كـ Combobox بحث فوري يدعم التركيز التلقائي، الإغلاق بـ Escape، مسح الاختيار، وشارات الأسعار والأسطول.
   - دمجه في شاشة إنشاء الطلب `/orders/new` لمناطق التوصيل والمناديب.
   - ترقية البحث في مودال تعيين المندوب `AssignDriverDialog` لدعم المطابقة متعددة الكلمات لنوع الأسطول واسم السائق بالعربية والإنجليزية.
3. ميزة السحب والإفلات (Drag & Drop) في لوحة المطبخ الحية (Live Kitchen Kanban):
   - تفعيل السحب على بطاقات الطلبات النشطة في `src/components/orders/kitchen-kanban.tsx` مع إضافة مقبض سحب `GripVertical`.
   - تفعيل استقبال الإفلات على أعمدة المراحل الخمسة مع مؤشر بصري تفاعلي لمنطقة الإفلات (`dropzone highlight`).
   - التحقق الصارم من صحة الانتقال عبر `ALLOWED_TRANSITIONS` لحظر الانتقالات غير الشرعية أو العكسية.
   - التوجيه الذكي: عند سحب طلب إلى مرحلة "في الطريق" (`OUT_FOR_DELIVERY`) دون وجود مندوب مسند، يفتح النظام تلقائيًا مودال تعيين المندوب لإتمام الإسناد فورًا.
   - إضافة معالج الانتقال المباشر `handleTransitionToStatus` في `src/components/orders/orders-table.tsx`.
4. تبسيط الواجهات وتقليل التزاحم البصري (De-cluttering):
   - تخفيف الخطوط الخارجية والظلال الكثيفة في بطاقات الكانبان لتوفير رؤية واضحة ومريحة لعمال المطبخ أثناء ضغط العمل.
   - تبسيط محددات الدفع والتوصيل في نموذج إنشاء الطلب.
5. اعتماد شعارات الشركات الرسمية من مجلد `/public`:
   - استخدام `/Talabat_logo.svg`, `/Elmenus_logo.svg`, `/instashop-logo.svg`, `/HurryApp_logo.jpeg` مع فيكتور فيسبوك والهاتف في `src/components/ui/platform-logo.tsx`.
6. إزالة ثيم المطبخ الليلي وحل خطأ الكونسول:
   - حذف كلاس `.kitchen` من `src/app/globals.css` وقصر الثيمات على الفاتح والداكن وتلقائي النظام في `theme-switcher.tsx`.
   - معالجة خطأ الكونسول الكاذب لـ React 19 المرتبط بوسم script في `theme-provider.tsx` عند التنقل بين اللغات.
7. تصحيح زر الطلب الجديد وإزالة الزائد المكرر:
   - تعديل نصوص الترجمة في `ar.json` و `en.json` لتفادي ظهور `++`.
8. الاختبارات والتحقق الشامل:
   - إنشاء واجتياز اختبارات السكربتات المخصصة: `test-logos-and-theme.ts`، `test-expense-types-crud.ts`، `test-search-algo.ts`، `test-kanban-dnd.ts` بنسبة 100%.
   - اجتياز اختبارات محاكاة المراحل: `verify-phase4.ts`, `verify-phase5.ts`, `verify-phase6.ts`, `verify-phase7.ts` بنسبة 100%.
   - اجتياز `npm run typecheck` و `npm run lint` بدون أي خطأ أو تحذير (0 errors, 0 warnings).
   - اجتياز بناء الإنتاج الكامل `npm run build` لـ 35 مساراً.
10. توحيد مقاسات وأشكال أيقونات المنصات وحذف بوكس رقم الطلب الخارجي (Platform Logo Standardization & External ID Box Removal):
    - توحيد مكوّن `PlatformLogo` ليعرض أيقونات تطبيقات مربعة قياسية موحدة الأبعاد (`size-5` / `size-6` مع `rounded-md` وظلال متناسقة) لكافة المنصات الست (طلبات، المنيوز، إنستاشوب، هاري آب، فيسبوك، هاتف)، مستخرجة من أصول المتجهات الرسمية بدون أي تشوه أو تكرار للنصوص.
    - ضبط ارتفاعات وشارات `PlatformBadge` لتكون متناسقة ومتطابقة رأسياً وأفقياً بجميع البطاقات.
    - إعادة تصميم قائمة اختيار المنصة في شاشة إنشاء الطلب `/orders/new` لتعرض صفوفاً أنيقة ونظيفة وموحدة بدلاً من الحبوب العائمة غير المتناسقة.
    - حذف بوكس رقم الطلب الخارجي المساعد (`externalIdPlaceholder`) نهائياً بجوار اختيار التطبيق استجابة لتوجيه المستخدم.
11. تحويل الصفحة الرئيسية إلى لوحة تحكم ومتابعة مركزية متكاملة (Operations Control Center Dashboard):
    - استبدال صفحة الترحيب البدائية القديمة من المرحلة 2 في `src/app/[locale]/(dashboard)/page.tsx` بلوحة تحكم تشغيلية عصرية وشاملة للمطعم.
    - إنشاء دالة `getDashboardOverview` في `src/services/orders.ts` لحساب وجمع كافة مؤشرات الأداء الحية (الشيفت النشط، الطلبات النشطة، مبيعات اليوم، صافي النقدية، المصروفات، والطلبات الأخيرة) في استعلامات موحدة متوازية دون أي منطق في الـ UI التزاماً بالقواعد المعمارية.
    - بناء مكوّن `DashboardOverviewClient` في `src/components/dashboard/dashboard-overview.tsx` بتصميم Dark Kitchen ياباني رفيع المستوى:
      - ترويسة ترحيبية ذكية مع شارة الرتبة (مالك/مدير/كاشير) ومؤشر الشيفت النابض.
      - 4 بطاقات KPI تفاعلية لمؤشرات الأداء اللحظية (الطلبات النشطة، الإيرادات، صافي كاش الخزنة، المصروفات).
      - بطاقة أحدث طلبات الشيفت مع شارات الحالات والمبالغ النقدية وتفاصيل العميل والمندوب.
      - شريط مراحل تحضير السوشي (جديد، قيد التحضير، جاهز، في الطريق، تم التسليم).
      - محور العمليات السريعة للوصول لإنشاء الطلبات، لوحة المطبخ، إغلاق الشيفت، المصروفات، المناديب، والمنيو.
      - بطاقات مراقبة براندات السوشي الأربعة (Flower, Mastery, Niwa, Tobiko) والمنصات الست.
12. توحيد مقاسات وأبعاد العناصر وتناسق حاويات الصفحات على مستوى التطبيق بالكامل (System-Wide UI Sizing, Alignment, & Container Standardization):
    - توحيد المكوّنات الأساسية (Primitives) في `src/components/ui/`:
      - زر `Button`: اعتماد مقياس متناسق (`default: h-10 px-4 text-sm rounded-lg`, `sm: h-8 px-3 text-xs rounded-md`, `lg: h-11 px-5 font-semibold rounded-xl`, `icon: size-10 rounded-lg`, `icon-sm: size-8 rounded-md`).
      - حقل الإدخال `Input`: توحيد الارتفاع الأساسي على `h-10 text-sm px-3 py-2 rounded-lg` ليتطابق مع الأزرار والقوائم في كل النماذج والمودالات.
      - القائمة المنسدلة `SelectTrigger`: ضبط القياس الافتراضي ليكون `h-10 text-sm px-3 rounded-lg` مع دعم `sm: h-8`.
      - البحث الفوري `SearchableSelect`: توحيد زر التفعيل ليكون `h-10 text-sm px-3 rounded-lg` متطابقاً هندسياً مع حقول الإدخال المجاورة.
    - ضبط ترويسة النظام `DashboardHeader`:
      - ضبط ارتفاع شريط النافبار على `h-16` (64px) ثابت بدون أي تذبذب.
      - إضافة رابط "الرئيسية" مع أيقونة `Home` وتفعيل مؤشر المسار النشط وتوجيه شعار البراند إليها مباشرة.
      - توحيد ارتفاع كافة العناصر التفاعلية في الترويسة (حبوب التبويب، زر "+ طلب جديد"، محول الثيم `size-10`، محول اللغة `h-10`، شارة البروفايل، وزر تسجيل الخروج `h-10`) لتحقيق التناغم البصري الكامل.
    - توحيد أبعاد حقول شاشة إنشاء الطلب `/orders/new`:
      - توحيد أزرار البراندات وقائمة المنصة وحقول الهاتف والاسم والعنوان وبحث المنتجات والخصم على مقاس `h-10` (40px) بدون أي حواف متعرجة.
    - توحيد حاويات الصفحات (Page Containers) بالكامل:
      - توحيد عرض وتجاوب وهوامش جميع الصفحات (`/`, `/orders`, `/menu`, `/delivery`, `/expenses`, `/closing`) على `max-w-[1440px] flex flex-col gap-6 p-4 sm:p-6 lg:p-8 mx-auto` للقضاء التام على أي قفزة أو اهتزاز عند التنقل بين الشاشات.
13. إصلاح وتنسيق شريط المنصات وعمود حالة الطلبات (Platform Hub Grid & Order Status Polish):
    - إعادة تصميم بطاقات المنصات الـ 6 في الداشبورد `DashboardOverviewClient` لتكون في شبكة متناسقة `grid grid-cols-2 sm:grid-cols-3 gap-2.5` بدلاً من الصناديق المتفرقة، مع خلفيات وحدود متدرجة من ألوان المنصات الرسمية وعداد رقمي مرتفع أنيق.
    - إخفاء مؤقت التحضير `PrepTimerBadge` نهائياً عن الطلبات المسلمة (`DELIVERED`) والملغاة (`CANCELLED`) لمنع ظهور أوقات مضللة (مثل `1370:22`) على طلبات منتهية بالفعل، وقصره على الطلبات النشطة فقط في المطبخ والتوصيل.
    - تنسيق عرض المندوب تحت حالة الطلب في جدول الطلبات ككبسولة مخصصة وأنيقة تحتوي على أيقونة الشاحنة `Truck` دون أي تشويه أو نقاط اقتطاع مزعجة.
**السبب:** تلبية الملاحظات والتعديلات التشغيلية والواجهية التي طلبها المستخدم مع الالتزام بأعلى معايير الأداء والتبسيط المعماري وسجل التدقيق (Directives §0, §2, §3).
**الملفات المتأثرة:** `src/components/dashboard/dashboard-overview.tsx`, `src/components/orders/orders-table.tsx`, `src/components/orders/prep-timer-badge.tsx`, `src/hooks/use-prep-timer.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** تحسين ملحوظ في سرعة وسلاسة الاستخدام، وجاهزية النظام بالكامل للتشغيل الفعلي.

---

## [2026-08-27] المرحلة 8.5 — المنصات الـ 6 الرسمية بلوجوهات SVG، ضبط المسافات، صلاحيات المصروفات وإعادة فتح الشيفتات (6 Standard Platforms with Vector SVG Logos, Spacing Polish, Expense Full CRUD, & Shift Reopening Workflows)
**النوع:** Feature & UI/UX / Platforms, Layout, Expenses, & Shift Lifecycle
**اللي اتعمل:**
1. حصر المنصات الـ 6 القياسية واعتماد لوجوهات فيكتور رسمية:
   - تحديث `src/services/lookups.ts` و `src/lib/visualTokens.ts` لضبط المنصات الرسمية الست: `Talabat`، `InstaShop`، `Harry App`، `Elmenus`، `Facebook`، `Phone`.
   - إنشاء مكوّن لوجوهات الفيكتور `src/components/ui/platform-logo.tsx` لتوليد SVG أصيل لكل منصة مع التباين اللوني الصحيح.
   - دمج `PlatformLogo` داخل `PlatformBadge` وشاشات إنشاء الطلبات وعرضها.
2. تحسين وضبط المسافات والتنفس البصري (Spacing Polish):
   - إعادة ضبط ترويسة النظام `src/components/layout/dashboard-header.tsx`: توسيع الهيدر لارتفاع مريح `h-17`، زيادة الحشو الأفقي `px-4 sm:px-6 lg:px-8` مع أقصى عرض `max-w-[1440px]`.
   - تباعد متزن بين شعار البراند وقوائم التنقل `gap-5 lg:gap-7` ومسافات أوسع لأزرار التنقل `px-4 py-2` وفواصل واضحة لمنطقة المستخدم.
   - تحسين أبعاد وتجاوب القائمة الجانبية للشاشات المحمولة.
3. تمكين الـ Owner والـ Manager من التحكم الكامل في المصروفات (Full CRUD):
   - دعم التعديل والحذف والإضافة مع أزرار بارزة ومودال تأكيد في `src/components/expenses/expenses-client.tsx`.
   - حماية المسارات برمجياً عبر `requireApiRole("OWNER", "MANAGER")` في `src/app/api/expenses/[id]/route.ts`.
4. تمكين الـ Owner والـ Manager من إعادة فتح الشيفت وتعديل ملاحظات الإغلاق:
   - إنشاء دالة `reopenShift` في `src/services/closing.ts` تقوم بإلغاء سجل `DailyClosing` وتصفير `closedAt` مع تسجيل `AuditLog` ذرياً.
   - إنشاء دالة `updateDailyClosing` لتعديل الملاحظات وتسويات العجز مع تسجيل `AuditLog`.
   - إضافة مسار `POST /api/shifts/[id]/reopen` ومسار `PATCH /api/closing/[id]`.
   - إنشاء نافذة `ReopenShiftDialog` ونافذة `EditClosingNotesDialog` وإدماجهما في شاشة الإغلاق اليومي.
5. الاختبارات والتحقق:
   - نجاح اختبار المنصات `scripts/test-platforms.ts`.
   - نجاح اختبار المصروفات `scripts/test-expenses-crud.ts`.
   - نجاح اختبار إعادة فتح الشيفت `scripts/test-shift-reopen.ts`.
   - اجتياز جميع فحوصات الـ E2E الـ 179/179 بنسبة 100%.
   - اجتياز `npm run typecheck` و `npm run lint` بنجاح تام 0 أخطاء و 0 تحذيرات.
   - اجتياز بناء الإنتاج الكامل `npm run build` لـ 35 مساراً.
**السبب:** تلبية الملاحظات الأربعة المباشرة للعميل لدعم تطبيقات التوصيل الستة الفعلية، وتناسق المسافات، ومنح صلاحيات التعديل والحذف وإعادة فتح الشيفتات (Directives §0, §1, §2).
**الملفات المتأثرة:** `src/lib/visualTokens.ts`, `src/services/lookups.ts`, `src/components/ui/platform-logo.tsx`, `src/components/ui/platform-badge.tsx`, `src/components/layout/dashboard-header.tsx`, `src/services/closing.ts`, `src/app/api/shifts/[id]/reopen/route.ts`, `src/app/api/closing/[id]/route.ts`, `src/components/closing/reopen-shift-dialog.tsx`, `src/components/closing/edit-closing-notes-dialog.tsx`, `src/components/closing/closing-details-modal.tsx`, `src/components/closing/closing-history-table.tsx`, `src/components/closing/closing-client.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** استقرار كامل لعمليات الورديات والمصروفات والمنصات وتحديث كامل للتوثيق الداخلي.

---

## [2026-08-27] المرحلة 8 (Milestone 4) — لوحة المطبخ الحية، نظام كانبان الطلبات، محول طرق العرض، ومؤقتات التحضير مع تنبيهات التأخير (Live Kitchen Kanban Board, Orders View Switcher, & Prep Timers with Delay Alerts)
**النوع:** Feature / Live Kitchen Kanban & Prep Timer
**اللي اتعمل:**
1. إنشاء خطاف ومكوّن مؤقت التحضير الحي `src/hooks/use-prep-timer.ts` و`src/components/orders/prep-timer-badge.tsx`:
   - حساب الوقت المنقضي الفعلي بالأمتار الثوانية والدقائق بتحديث حي كل ثانية وبشكل متوافق تمامًا مع بيئة العرض المزدوج وتجنب ومضات الهيدريشن.
   - تفعيل وضع الحرجية `isCritical = true` وشارة التأخير الحمراء النابضة (`animate-pulse` و`animate-ping`) مع أيقونة الشعلة عند تجاوز الطلب 15 دقيقة (>= 900 ثانية) في مراحل التحضير (`PREPARING` / `NEW` / `CONFIRMED`).
   - عرض الوقت بصيغة رقمية أحادية العرض `tabular-nums font-mono` (`MM:SS`) مع دعم أحجام مختلفة وأنماط هادئة وتحذيرية.
2. إنشاء لوحة المطبخ الحية الخماسية `src/components/orders/kitchen-kanban.tsx`:
   - 5 أعمدة تفاعلية لمراحل تدفق الطلبات في المطبخ:
     1. `جديد ومؤكد` (`NEW` / `CONFIRMED`)
     2. `قيد التحضير` (`PREPARING`) — مزود بـ `PrepTimerBadge` البارزة وتنبيهات التأخير المتوهجة.
     3. `جاهز للتسليم` (`READY`)
     4. `في الطريق` (`OUT_FOR_DELIVERY`) — يعرض المندوب المكلف ومنطقة التوصيل وزر تعيين الطيار السريع.
     5. `تم التسليم` (`DELIVERED`)
   - بطاقات الطلبات داخل الأعمدة:
     - الترويسة: رقم الطلب الأحادي العرض، شارة البراند بالكانجي، شارة المنصة، ومؤقت التحضير الحي.
     - جسم البطاقة: اسم وهاتف العميل، ملخص كميات وأسماء الأصناف، شريط تنبيهات الحساسية وملاحظات المطبخ، ومنطقة التوصيل.
     - التذييل: الإجمالي المالي مع طريقة الدفع وشارة المندوب والخصومات المعلقة.
     - إجراءات النقرة الواحدة للتقدم بالحالة (1-click State Advancement) وفقًا لـ `orderStateMachine.ts` مع استدعاء تلقائي لنافذة تعيين الطيار `AssignDriverDialog` عند الانتقال إلى `OUT_FOR_DELIVERY`.
     - أزرار سريعة لإلغاء الطلب `CancelDialog` وعرض التفاصيل `OrderDetailsModal`.
3. ترقية شاشة الطلبات وإضافة محول طرق العرض `src/components/orders/orders-table.tsx`:
   - إضافة محول العرض الثنائي في الشريط العلوي `[ Table View ⊞ ]` ⟷ `[ Kitchen Kanban ▤ ]`.
   - الاحتفاظ الكامل بكافة خيارات البحث والتصفية (البراند، المنصة، التاريخ، البحث النصي، والتبويبات) ومشاركتها بسلاسة عبر كلا العرضين.
   - إدماج `PrepTimerBadge` الحية في جدول الطلبات وبطاقات الموبايل.
4. تحديث ملفات الترجمة `src/messages/ar.json` و`src/messages/en.json` بإضافة فضاءات أسماء `viewSwitcher`، `prepTimer`، و`kanban`.
5. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) بدون أي أخطاء.
6. اجتياز الفحص النحوي (`npm run lint`) بنجاح تام 0 أخطاء و 0 تحذيرات.
**السبب:** تنفيذ متطلبات Milestone 4 (R4: Features 10, 11, 12) لتمكين طاقم المطبخ والإدارة من المتابعة الحية للطلبات والتحكم السريع في حالاتها ومراقبة أوقات وتأخيرات التحضير (ENGINEERING_DIRECTIVES.md §0, §2).
**الملفات المتأثرة:** `src/hooks/use-prep-timer.ts`, `src/components/orders/prep-timer-badge.tsx`, `src/components/orders/kitchen-kanban.tsx`, `src/components/orders/orders-table.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال Milestone 4 بنجاح وجاهزية النظام لتنفيذ Milestone 5 (حزمة الاختبارات الشاملة والتثبت النهائي).

---

## [2026-08-27] المرحلة 8 (Milestone 3) — شاشة نقطة البيع السريعة، محاكاة الإيصال الحراري POS، بطاقات الدفع المريحة باللمس، وشارات ولاء العملاء (Fast POS Order Creation Screen, Receipt Ticket Preview, Touch Payment Selectors, & Customer Loyalty Badges)
**النوع:** Feature / POS UI & Ergonomics
**اللي اتعمل:**
1. إنشاء مكوّن محاكاة الإيصال الحراري POS الأصيل `src/components/orders/receipt-ticket-preview.tsx`:
   - تصميم تذكرة إيصال حراري ياباني أصيل مع حواف مقطوعة ومشرشرة أعلى وأسفل (Jagged sawtooth tear borders).
   - ترويسة متكاملة بهوية البراند والكانجي وشعار المطبخ السحابي وشارة المنصة الموحدة ورقم الأوردر والتاريخ والوقت والكاشير.
   - قسم بيانات العميل مع شارة مستوى ولاء العميل `LoyaltyTierBadge` المحتسبة تلقائيًا بناءً على إجمالي طلباته السابقة، والعنوان ومنطقة وطيار التوصيل.
   - جدول بنود الطلب مع الكميات، الأسماء، سعر الوحدة، والإجمالي لكل صنف بخط رقمي أحادي العرض `font-mono tabular-nums`.
   - التفصيل المالي الدقيق: المجموع الفرعي، رسوم التوصيل، الخصم المطبق مع سببه، والإجمالي الكلي المميز ببرواز عريض وخط عريض `tabular-nums`.
   - مؤشر طريقة الدفع البصري (كاش، فيزا، أونلاين) وملاحظات المطبخ.
   - تذييل ياباني أصيل ("毎度ありがとうございます / شكراً لاختياركم سوشي دارك كيتشن 🍣") مع محاكاة باركود الفاتورة الإلكترونية.
   - شريط أدوات تحكم تفاعلي مع إجراء "طباعة الإيصال" المجهز لطابعات 80mm وإجراء "نسخ نص الإيصال" بصيغة ASCII إلى الحافظة مع إشعار Toast.
2. إنشاء مكوّن شارات مستويات ولاء العملاء `src/components/ui/loyalty-badge.tsx`:
   - مكوّن UI موحد يعتمد على `getLoyaltyTier(totalOrders)` من `src/lib/visualTokens.ts` لتمييز (ضيف جديد 🆕، عميل دائم 🍣، عميل ذهبي VIP 👑، أسطورة بلاتيني 💎) مع أيقونات ملونة ودعم الأحجام والأنماط وعداد الطلبات السابقة باللغتين العربية والإنجليزية.
3. ترقية وتطوير نموذج إنشاء الطلب السريع `src/components/orders/order-form.tsx`:
   - إدماج `ReceiptTicketPreview` داخل نظام التبويب التفاعلي بالعمود الأيمن للـ POS للتبديل بين سلة الطلبات ومعاينة الإيصال الحراري الحي في الوقت الفعلي.
   - بطاقات اختيار طريقة الدفع المريحة للمس (Touch-Optimized Payment Selector Cards) بارتفاع مريح وأهداف لمسية >= 44x44px مع حدود لونية نشطة وحلقات تركيز وإشعارات تحقق ونصوص توضيحية.
   - دمج شارة الولاء `LoyaltyTierBadge` في حقل البحث السريع بالهاتف، وفي قائمة الاقتراحات التلقائية لكل عميل، وللعملاء الجدد والمسجلين.
   - تعميم التنسيق الرقمي المحكم `font-mono` و`tabular-nums` على كافة الأسعار والإجماليات والكميات وحقول الخصم والعملة.
   - ترقية نافذة نجاح إنشاء الأوردر لعرض الإيصال الحراري للطلب المنشأ مباشرة مع خيارات الطباعة والنسخ والبدء في طلب جديد.
4. تحديث ملفات الترجمة `src/messages/ar.json` و`src/messages/en.json` بإضافة فضاءات أسماء `receipt`، `loyalty`، وتوصيفات طرق الدفع.
5. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) بدون أي أخطاء.
6. اجتياز الفحص النحوي (`npm run lint`) بنجاح تام 0 أخطاء و 0 تحذيرات.
7. اجتياز بناء الإنتاج الكامل بنجاح فائق (`npm run build`) وتوليد كافة المسارات والصفحات.
**السبب:** تنفيذ متطلبات Milestone 3 (R3: Features 7, 8, 9) لتمكين الكاشير من إنشاء الطلبات بسرعة فائقة ولمسات مريحة ومعاينة وطباعة إيصال الـ POS بدقة عالية (ENGINEERING_DIRECTIVES.md §0, §2).
**الملفات المتأثرة:** `src/components/orders/receipt-ticket-preview.tsx`, `src/components/ui/loyalty-badge.tsx`, `src/components/orders/order-form.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال Milestone 3 بنجاح وجاهزية النظام لتنفيذ Milestone 4 (لوحة الكانبان الحية للمطبخ، مؤقتات التحضير، وشارات التنبيه النابضة).

---

## [2026-08-27] المرحلة 8 (Milestone 2) — الهويات البصرية الموحدة للبراندات الأربعة والمنصات الخمسة ومستويات الولاء (Brand & Platform Visual Signatures & Badges)
**النوع:** Feature / Visual Design System & Badges
**اللي اتعمل:**
1. إنشاء المصدر الموحد للرموز البصرية `src/lib/visualTokens.ts`:
   - تعريف واجهات الأنواع `BrandVisualToken`, `PlatformVisualToken`, `LoyaltyTierInfo`, و`LoyaltyTier`.
   - تعريف الرموز البصرية للبراندات الأربعة (Flower Sakura Pink وكانجي 花، Mastery Artisan Gold وكانجي 匠، Niwa Matcha Emerald وكانجي 庭، Tobiko Coral Orange وكانجي 魚子) بالإضافة للرمز الافتراضي السحابي وكانجي 鮨.
   - تعريف الرموز البصرية لمنصات التوصيل الخمسة (Talabat Orange `#ff5a00`، elmenus Crimson `#e21b1b`، InstaShop Teal `#00a699`، HarryApp Indigo `#4f46e5`، Phone Sky Blue `#0284c7`) والرمز الافتراضي للطلبات المباشرة.
   - دوال التمييز والتحويل الذكية `getBrandToken` و`getPlatformToken` مع دعم المطابقة غير الحساسة لحالة الأحرف والمطابقة الجزئية باللغتين العربية والإنجليزية ومعالجة الفراغات والقيم الفارغة.
   - دالة احتساب مستويات ولاء العملاء `getLoyaltyTier` للتمييز الفوري (ضيف جديد، عميل دائم، عميل ذهبي VIP، وأسطورة بلاتيني) مع معالجة الحالات الحدية والسالبة.
2. إنشاء مكوّن الشارة الموحدة للبراند `src/components/ui/brand-badge.tsx`:
   - يعرض كبسولة ملونة بهوية البراند مع كانجي ياباني أصيل واسم البراند ودعم كامل للأحجام (`sm`, `md`, `lg`) والأنماط (`subtle`, `solid`, `outline`).
3. إنشاء مكوّن الشارة الموحدة للمنصة `src/components/ui/platform-badge.tsx`:
   - يعرض كبسولة المنصة مع نقطة مؤشر ملونة بألوان المنصة الرسمية ودعم الأحجام والأنماط.
4. دمج الشارات البصرية في واجهات النظام:
   - `src/components/orders/orders-table.tsx`: استبدال النصوص والشارات العادية بـ `BrandBadge` و`PlatformBadge` في كل من جدول سطح المكتب وبطاقات الموبايل.
   - `src/components/orders/order-details-modal.tsx`: ترقية ترويسة نافذة تفاصيل الطلب بشارات البراند والمنصة الموحدة.
   - `src/components/orders/order-form.tsx`: ترقية أزرار اختيار البراند بحروف الكانجي وتأثيرات الإحاطة اللونية النشطة، وترقية قائمة اختيار المنصات بـ `PlatformBadge`.
5. تحديث `tests/helpers/visual-token-oracle.ts` لإعادة التصدير من `src/lib/visualTokens.ts` كـ Single Source of Truth.
6. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) بدون أي أخطاء.
7. اجتياز الفحص النحوي (`npm run lint`) بنجاح تام 0 أخطاء و 0 تحذيرات.
**السبب:** تنفيذ متطلبات Milestone 2 (R2: Features 5 & 6) لتمكين الكاشير وطاقم المطبخ من التمييز البصري الفوري للطلبات بين البراندات والمنصات (ENGINEERING_DIRECTIVES.md §0, §2).
**الملفات المتأثرة:** `src/lib/visualTokens.ts`, `src/components/ui/brand-badge.tsx`, `src/components/ui/platform-badge.tsx`, `src/components/orders/orders-table.tsx`, `src/components/orders/order-details-modal.tsx`, `src/components/orders/order-form.tsx`, `tests/helpers/visual-token-oracle.ts`, `scripts/verify-challenger-m1.ts`, `tests/stress/m1-adversarial.test.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال Milestone 2 بنجاح وجاهزية النظام لتنفيذ Milestone 3 (معاينة إيصال POS، بطاقات الدفع، وشارات الولاء).

---

## [2026-08-26] المرحلة 8 (Milestone 1) — شريط التنقل الحديث، هوية مطبخ السوشي السحابي، سمة المطبخ الليلي عالي التباين، وبيئة اللمس المريحة
**النوع:** Feature / UI & Theme System
**اللي اتعمل:**
1. إنشاء مكوّن شريط التنقل الرئيسي للعميل `src/components/layout/dashboard-header.tsx`:
   - شعار وهوية المطبخ السحابي للسوشي (4 براندات) مع أيقونة الشعلة المتوهجة.
   - أزرار التنقل التفاعلية بالأقراص المميزة للراوت النشط (Active-route pills) باستخدام `usePathname()` من `@/i18n/navigation`.
   - زر إجراء سريع دائم عالي الوضوح "+ أوردر جديد" (`+ New Order`) يربط مباشرة بـ `/orders/new` عبر كافة شاشات لوحة التحكم.
   - فلترة روابط التنقل حسب دور المستخدم (الكاشير يرى الأوردرات، المصاريف، الإغلاق؛ والمدير والمالك يريان أيضًا المنيو والتوصيل).
   - قسم الملف الشخصي للمستخدم وشارة الدور الملونة (Owner: ذهبي، Manager: بنفسجي، Cashier: زمردي).
   - درج متجاوب للشاشات الصغيرة والمتوسطة (Mobile/Tablet Drawer) لسهولة الاستخدام والوصول لكافة الوظائف.
2. بناء نظام السمات متعدد الأنماط:
   - إنشاء `src/components/theme-provider.tsx` مغلفًا لـ `next-themes` وداعمًا للأنماط (`light`, `dark`, `kitchen`).
   - إنشاء `src/components/theme-switcher.tsx` مع قائمة تفاعلية وأيقونات (شمس للفاتح، قمر للداكن، شعلة لشيفت المطبخ، وشاشة للنظام) مع توافق كامل للغات RTL/LTR.
   - تحديث `src/app/globals.css` بتعريف متغيرات ومحددات سمة المطبخ الليلي عالي التباين `.kitchen` (خلفية سبجية عميقة `oklch(0.08 0.015 250)`، نص أبيض فائق التباين `oklch(0.99 0 0)`، ولون توهج عنبري سوشي عالي التشبع `oklch(0.72 0.22 45)`، وتحديث `@custom-variant dark (&:is(.dark *, .kitchen *))`).
   - إضافة `suppressHydrationWarning` و`<ThemeProvider>` في `src/app/[locale]/layout.tsx`.
3. ترقية مكوّن الأزرار `src/components/ui/button.tsx` بإضافة النمط المريح لنقاط البيع وشاشات اللمس `size="touch"` بأبعاد >= 44x44px (`min-h-11 min-w-11 px-5 text-base`).
4. ترقية ملفات الترجمة `src/messages/ar.json` و`src/messages/en.json` بإضافة فضاء أسماء `theme` ومفاتيح نصوص التنقل والوسم والنداء السريع.
5. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) بدون أي أخطاء.
6. اجتياز الفحص النحوي (`npm run lint`) بنجاح تام 0 أخطاء و 0 تحذيرات.
7. اجتياز بناء الإنتاج الكامل بنجاح فائق (`npm run build`) وتوليد 35 صفحة ومسار API.
**السبب:** تنفيذ متطلبات Milestone 1 (R1, R5, R6) وتوفير تجربة مستخدم عصرية ومحكمة لشاشات المطبخ الليلي والـ POS (ENGINEERING_DIRECTIVES.md §0, §2).
**الملفات المتأثرة:** `src/components/theme-provider.tsx`, `src/components/theme-switcher.tsx`, `src/components/layout/dashboard-header.tsx`, `src/app/globals.css`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/(dashboard)/layout.tsx`, `src/components/ui/button.tsx`, `src/components/language-switcher.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال Milestone 1 وجاهزية النظام لتطبيق Milestone 2 (الهويات البصرية للبراندات والمنصات).

## [2026-08-26] المرحلة 7 — اكتمال وبوابة التحقق المؤتمتة لنظام إدارة الشيفتات والإغلاق اليومي ومطابقة الخزينة (Phase 7 Shift Closing Subsystem Verification & Completion)
**النوع:** Verification / Milestone Completion
**اللي اتعمل:**
1. إنشاء سكريبت التحقق والمحاكاة الشامل لنظام الشيفتات والإغلاق اليومي `scripts/verify-phase7.ts`:
   - التحقق من بيانات التبعيات (Cashier, Brand, Products, Platform, Delivery Zones, Driver, Expense Types) وتجهيز بيئة الاختبار المعزولة.
   - التحقق من فتح الشيفت للكاشير وإنشاء سجل `Shift` وتوثيق سجل المراقبة `AuditLog` من نوع `CREATE`.
   - التحقق من حارس منع تكرار الشيفت المفتوح لنفس الكاشير برمي خطأ `SHIFT_ALREADY_OPEN`.
   - محاكاة تسجيل طلبات الشيفت:
     - طلب كاش: 2 منتج (200 ج) + رسوم توصيل منطقة 30 ج = 230 ج.
     - طلب فيزا: 1 منتج (100 ج) + رسوم توصيل منطقة 20 ج = 120 ج.
     - طلب كاش ملغي: 1 منتج (50 ج) وتم إلغاؤه بنجاح.
   - محاكاة تسجيل مصروفات الشيفت:
     - مصروف 1: "مشروبات" بقيمة 40 ج.
     - مصروف 2: "أدوات نظافة" بقيمة 30 ج.
   - التحقق من المعاينة المالية الحية للشيفت `getShiftPreview`:
     - إجمالي الطلبات = 3، الملغاة = 1، النشطة = 2.
     - إجمالي الكاش = 230 ج (الطلب 1 فقط).
     - إجمالي الفيزا = 120 ج (الطلب 2).
     - إجمالي رسوم التوصيل = 50 ج (30 + 20).
     - إجمالي المصروفات = 70 ج (40 + 30).
     - صافي الكاش في الدرج = 160 ج (230 - 70).
   - التحقق من إغلاق الشيفت مع الملاحظات ("تم مطابقة الخزنة ولا يوجد عجز")، تحديث `closedAt`، إنشاء سجل `DailyClosing` بمطابقة كاملة للقيم، وتوثيق سجل المراقبة `AuditLog` من نوع `CREATE`.
   - التحقق من الاستعلامات التاريخية `listDailyClosings` و`getDailyClosingById`.
   - تنظيف بيانات الاختبار المعزولة تلقائيًا.
2. تشغيل واجتياز اختبار التحقق الشامل `npm run verify:phase7` بنسبة 100% (8/8 خطوات).
3. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) بدون أي أخطاء.
4. اجتياز الفحص النحوي (`npm run lint`) بدون أي أخطاء أو تحذيرات.
5. اجتياز بناء الإنتاج الكامل بنجاح فائق (`npm run build`) وتوليد 35 صفحة ومسار API ثابتة وديناميكية.
**السبب:** التحقق الشامل والأوتوماتيكي من صحة تكامل محرك الحسابات المالية، وطبقة الخدمات الذرية، والـ AuditLog، وتخزين لقطات الإغلاق اليومي المجمدة (ENGINEERING_DIRECTIVES.md §0, §2, §3, SRS §FR-CLOSE, USE_CASES UC-10).
**الملفات المتأثرة:** `scripts/verify-phase7.ts`, `package.json`, `docs/plans/2026-08-26-phase7-closing-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال المرحلة 7 بالكامل بنجاح 100%، وجاهزية النظام للانتقال إلى المرحلة التالية.

## [2026-08-26] المرحلة 7 — واجهات إدارة الشيفتات والإغلاق اليومي ومطابقة الخزينة (Phase 7 Shift Management & Daily Closing UI)
**النوع:** Feature / UI & Dashboard
**اللي اتعمل:**
1. إنشاء شاشات ومكونات إدارة الشيفتات والإغلاق اليومي في `src/components/closing/` وصفحة `/closing`:
   - `OpenShiftCard`: بطاقة تفاعلية لحالة عدم وجود شيفت مفتوح للكاشير، تعرض اسم الكاشير وزر فتح شيفت جديد متصل بـ `POST /api/shifts/open` مع التغذية الراجعة التلقائية.
   - `ActiveShiftSummary`: شاشة مطابقة الخزينة الحية والتفصيل المالي متضمنة:
     - شريط حالة الشيفت النشط مع مؤقت حي لمدة الشيفت وزر التحديث والطباعة.
     - بطاقة المطابقة الكبرى: "صافي الكاش للتسليم (الخزينة)" و"إجمالي الكاش في الدرج".
     - بطاقات تفصيل الدفع: الفيزا، الأونلاين، رسوم التوصيل المحصلة، ومصروفات الشيفت.
     - ملخص أعداد الطلبات (الإجمالي، الناجحة، الملغاة).
     - تفصيل قوائم الطلبات والمصروفات المسجلة خلال الشيفت.
     - حوار تأكيد إغلاق الشيفت النهائي مع حقل إدخال ملاحظات وتبرير الفروقات المالية متصل بـ `POST /api/shifts/[id]/close`.
   - `ClosingHistoryTable`: جدول تاريخي للإغلاقات السابقة مع فلاتر سريعة للفترات، بحث باسم الكاشير، وبطاقات عرض مخصصة للهواتف مع دعم الترقيم والعد الإجمالي.
   - `ClosingDetailsModal`: نافذة منبثقة تفاعلية تعرض تقرير لقطة معتمدة ومجمدة للإغلاق اليومي والمطابقة المالية مع إمكانية الطباعة.
   - `ClosingClient`: مكوّن إدارة التبويبات المتجاوب للتبديل السلس بين الشيفت الحالي وسجل الإغلاقات.
   - صفحة `src/app/[locale]/(dashboard)/closing/page.tsx`: Server Component محمي بـ `requirePageUser()` مع التحميل المسبق للشيفت المفتوح والمعاينة وسجلات الإغلاق السابقة.
2. تحديث ملفات الترجمة `src/messages/ar.json` و`src/messages/en.json` بنطاق الترجمة الكامل `closing`.
3. تحديث شريط التنقل في `src/app/[locale]/(dashboard)/layout.tsx` لإضافة رابط `/closing`.
4. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) والـ Linting (`npm run lint`) بنجاح تام 100%.
**السبب:** تمكين الكاشير والمديرين من متابعة الخزينة النقدية اللحظية، فتح وإغلاق الشيفتات، وتسجيل الإغلاقات اليومية وأرشفتها بسهولة وموثوقية (ENGINEERING_DIRECTIVES.md §2, §3, SRS §FR-CLOSE, USE_CASES UC-10).
**الملفات المتأثرة:** `src/components/closing/open-shift-card.tsx`, `src/components/closing/active-shift-summary.tsx`, `src/components/closing/closing-details-modal.tsx`, `src/components/closing/closing-history-table.tsx`, `src/components/closing/closing-client.tsx`, `src/app/[locale]/(dashboard)/closing/page.tsx`, `src/app/[locale]/(dashboard)/layout.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `src/services/closing.ts`, `docs/plans/2026-08-26-phase7-closing-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال واجهات الشيفت والإغلاق اليومي، والانتقال لبوابة التحقق الآلية الشاملة للمرحلة 7 (Task 5: Automated Verification Gate).

## [2026-08-26] المرحلة 7 — مسارات الـ API المحمية لإدارة الشيفتات والإغلاق اليومي (Phase 7 Shift & Daily Closing API Routes)
**النوع:** Feature / API Routes
**اللي اتعمل:**
1. إنشاء وتأمين مسارات الـ API المحمية للشيفتات والإغلاق اليومي بالكامل تحت الحارس الصارم للأدوار `requireApiRole("OWNER", "MANAGER", "CASHIER")` والمعالجة الموحدة للأخطاء `wrapApi`:
   - `GET /api/shifts/current`: استرجاع بيانات الشيفت المفتوح حاليًا للكاشير (`cashierId` من query أو التلقائي `user.id`).
   - `POST /api/shifts/open`: فتح شيفت جديد للكاشير والتحقق من صحة المعرف عبر Zod والرد بـ 201 `{ shift }`.
   - `GET /api/shifts/[id]/preview`: استرجاع المعاينة المالية الحية للشيفت المفتوح أو المغلق متضمنة ملخص المبيعات، المصروفات، وأرصدة الدفع وصافي النقدية `{ shift, ordersCount, expensesCount, summary, orders, expenses }`.
   - `POST /api/shifts/[id]/close`: إغلاق الشيفت وتسجيل الإغلاق اليومي `DailyClosing` مع التحقق من الملاحظات الاختيارية عبر Zod `closeShiftSchema` والرد بـ 200 `{ shift, closing }`.
   - `GET /api/closing`: استرجاع وتصفية سجلات الإغلاق اليومي التاريخية عبر معايير الفلترة (`startDate`, `endDate`, `date`, `cashierId`, `limit`, `offset`) والرد بـ `{ closings, totalCount }`.
   - `GET /api/closing/[id]`: استرجاع تفاصيل سجل إغلاق محدد بالـ ID أو الرد بـ 404 في حال عدم وجوده.
2. تحديث `src/lib/api.ts` لمعالجة أخطاء الشيفتات المسبوقة بـ `SHIFT_` وتحويلها لردود HTTP 400 دلالية منسقة.
3. إنشاء سكريبت التحقق والاختبار للمخططات وقواعد التحقق `scripts/test-closing-api-schemas.ts`.
4. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) والـ Linting (`npm run lint`) بنجاح تام 100%.
**السبب:** توفير واجهات RESTful API مؤمنة وقوية وذات معايير تدقيق وتدقيق موحد للأخطاء لدعم شاشات كاشير الورديات والإغلاق اليومي وتقارير المالك (ENGINEERING_DIRECTIVES.md §2, §3, SRS §FR-CLOSE, USE_CASES UC-10).
**الملفات المتأثرة:** `src/app/api/shifts/current/route.ts`, `src/app/api/shifts/open/route.ts`, `src/app/api/shifts/[id]/preview/route.ts`, `src/app/api/shifts/[id]/close/route.ts`, `src/app/api/closing/route.ts`, `src/app/api/closing/[id]/route.ts`, `src/lib/api.ts`, `scripts/test-closing-api-schemas.ts`, `docs/plans/2026-08-26-phase7-closing-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** جاهزية مسارات الـ API لربط وبناء واجهات المستخدم للشاشات وإغلاق الخزينة (Task 4: Daily Closing UI).

## [2026-08-26] المرحلة 7 — طبقة خدمات إدارة الشيفتات والإغلاق اليومي الذرية (Phase 7 Shift & Daily Closing Service Layer)
**النوع:** Feature / Service Layer
**اللي اتعمل:**
1. إنشاء طبقة خدمات إدارة الشيفتات والإغلاق اليومي `src/services/closing.ts`:
   - `getCurrentOpenShift(cashierId)`: استرجاع الشيفت المفتوح حاليًا للكاشير المحدد إن وُجد.
   - `openShift(cashierId)`: فتح شيفت جديد مع التحقق من عدم وجود شيفت مفتوح مسبقًا لمنع التكرار (`SHIFT_ALREADY_OPEN`) وتوثيق الـ `AuditLog` لنوع `Shift` كـ `CREATE` داخل transaction ذرّية.
   - `getShiftPreview(shiftId)`: جلب المعاينة المالية الحية للشيفت (الطلبات والمصروفات المحصلة خلال فترة الشيفت) واستدعاء `calculateShiftSummary` لحساب الإحصائيات وصافي الكاش اللحظي.
   - `closeShift(userId, shiftId, notes)`: التحقق من وجود الشيفت وعدم إغلاقه مسبقًا، حصر كافة المعاملات المالية، تحديث توقيت إغلاق الشيفت `closedAt`، وإنشاء سجل الإغلاق اليومي `DailyClosing` مع توثيق سجل المراقبة `AuditLog` لنوع `DailyClosing` كـ `CREATE` بالكامل داخل `prisma.$transaction`.
   - `listDailyClosings(filters)`: استرجاع وسجل التصفية للإغلاقات السابقة بالتاريخ والكاشير مع العد الإجمالي والترتيب الزمني التنازلي.
   - `getDailyClosingById(closingId)`: استرجاع تفاصيل إغلاق محدد مع بيانات الكاشير والشيفت.
2. إنشاء سكريبت الاختبارات والتكامل الشامل `scripts/test-closing-service.ts`:
   - تغطية التحقق من صحة المدخلات والحراس ضد المعاملات غير الصالحة.
   - تغطية دورة حياة فتح الشيفت والتحقق من منع فتح أكثر من شيفت نشط لنفس الكاشير.
   - محاكاة تسجيل طلبات نقدية، إلكترونية، وملغية ومصروفات تشغيلية أثناء الشيفت ومطابقة المعاينة الحية.
   - محاكاة إغلاق الشيفت الذري وإنشاء سجل الإغلاق اليومي وتوثيق الـ `AuditLog`.
   - اختبار الاستعلام والفلترة على سجل الإغلاقات التاريخية.
**السبب:** توفير Single Source of Truth متكامل لإدارة الورديات والإغلاق اليومي ومطابقة الخزينة النقدية بما يضمن الحسابات الذرية والتوثيق الرقابي التام (ENGINEERING_DIRECTIVES.md §2, §3, SRS §FR-CLOSE, USE_CASES UC-10).
**الملفات المتأثرة:** `src/services/closing.ts`, `scripts/test-closing-service.ts`, `docs/plans/2026-08-26-phase7-closing-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** جاهزية طبقة الخدمات لبناء مسارات الـ API المحمية للشيفتات والإغلاق (Task 3: Shift & Closing API Routes).

## [2026-08-26] المرحلة 7 — محرك الحسابات المالية المجردة للشيفتات والإغلاق اليومي (Phase 7 Pure Shift & Daily Closing Engine)
**النوع:** Feature / Pure Logic Engine
**اللي اتعمل:**
1. إنشاء محرك الحسابات المالية المجرد `src/lib/closing.ts`:
   - تعريف واجهات البيانات: `OrderSummaryItem`, `ExpenseSummaryItem`, `ShiftFinancialSummary`, `DecimalLike`.
   - دالة `calculateShiftSummary(orders, expenses)` لحساب الإحصائيات والمجاميع المالية:
     - أعداد الطلبات: `totalOrders` (كافة الطلبات)، `cancelledOrders` (الطلبات الملغية)، `activeOrders` (الطلبات النشطة والمسلمة).
     - تفصيل المبيعات حسب طريقة الدفع للطلبات غير الملغية: `totalCash`, `totalVisa`, `totalOnline` بدقة واحتساب (المجموع الفرعي - الخصم + رسوم التوصيل).
     - إجمالي رسوم التوصيل المحصلة: `totalDeliveryFees` للطلبات النشطة.
     - إجمالي المصروفات التشغيلية: `totalExpenses` كحاصل ضرب (الكمية × القيمة).
     - صافي الكاش في الدرج: `netCash = totalCash - totalExpenses` مع دعم القيم السالبة إن زادت المصاريف عن الكاش.
   - دوال مساعدة لمعالجة دقة الفاصلة العائمة `roundCurrency` وتحويل كائنات `Prisma.Decimal` والمدخلات النصية `toNumber`.
2. إنشاء سكريبت الاختبارات الوحدوية الشامل `scripts/test-closing-logic.ts` وتغطية 7 سيناريوهات حاسمة (المدخلات الفارغة، توزيع طرق الدفع، استبعاد الطلبات الملغية، تجميع المصروفات، حالات صافي الكاش، الدقة الرقمية مع Prisma Decimal).
3. اجتياز كافة الاختبارات الوحدوية بنسبة 100% (7/7).
4. اجتياز الفحص المكتبي الصارم لـ TypeScript (`npm run typecheck`) والـ Linting (`npm run lint`).
**السبب:** بناء النواة الحسابية الخالصة والمجردة لإغلاق الشيفتات ومطابقة الخزينة وحظر أي منطق أعمال في واجهات المستخدم (ENGINEERING_DIRECTIVES.md §2, SRS §FR-CLOSE, USE_CASES UC-10).
**الملفات المتأثرة:** `src/lib/closing.ts`, `scripts/test-closing-logic.ts`, `docs/plans/2026-08-26-phase7-closing-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** جاهزية المحرك الحسابي لبناء طبقة خدمات الشيفتات والإغلاق اليومي الذرية مع الـ AuditLog (Task 2: Shift & Closing Service Layer).

## [2026-08-26] المرحلة 6 — اكتمال وبوابة التحقق المؤتمتة لنظام إدارة وتسجيل وتتبع المصروفات (Phase 6 Expense Subsystem Verification & Completion)
**النوع:** Verification / Milestone Completion
**اللي اتعمل:**
1. إنشاء سكريبت التحقق والمحاكاة الشامل لدورة حياة المصروفات `scripts/verify-phase6.ts`:
   - التحقق من بيانات المستخدمين (Owner, Cashier) وتجهيز بيئة الاختبار المعزولة.
   - التحقق من بذر والتحقق من الفئات العشرين القياسية المسبقة (`DEFAULT_EXPENSE_TYPES`) مع وسم `isDefault = true`.
   - قيام المالك بإنشاء نوع مصروف مخصص ("صيانة أجهزة كمبيوتر") والتحقق من `isDefault = false` وتوثيق سجل المراقبة `AuditLog` من نوع `CREATE`.
   - قيام الكاشير بتسجيل المصروف الأول (نوع "كهرباء"، وصف "فاتورة كهرباء شهر 8"، كمية 1، قيمة 1500 ج.م كـ `Decimal`) وتوثيق الـ `AuditLog` من نوع `CREATE`.
   - قيام الكاشير بتسجيل المصروف الثاني (نوع "مشروبات"، وصف "شاي وقهوة للمطبخ"، كمية 2، قيمة 120 ج.م) وتوثيق الـ `AuditLog` من نوع `CREATE`.
   - اختبار وتأكيد محرك التصفية `listExpenses` بالفلترة بالتاريخ، الفلترة بالفئة، والبحث النصي في البيان، وحساب التجميعات المالية `totalAmount` و`totalCount` بدقة 100%.
   - قيام المالك بتعديل المصروف الثاني (رفع القيمة من 120 إلى 150 ج.م) وتوثيق سجل المراقبة `AuditLog` من نوع `UPDATE` بالقيم السابقة والجديدة.
   - قيام المالك بحذف المصروف الثاني والتحقق من حذفه من قاعدة البيانات وتوثيق `AuditLog` من نوع `CANCEL`.
2. اجتياز اختبارات التحقق المؤتمتة بنسبة 100% (6/6).
3. اجتياز بوابات الجودة بالكامل:
   - `npm run typecheck` (`tsc --noEmit`): نجاح 0 أخطاء.
   - `npm run lint` (`eslint`): نجاح 0 أخطاء.
   - `npm run build` (`next build`): نجاح وبناء كافة الصفحات والراوتات الـ 30 والـ Proxy بنجاح تام.
**السبب:** إتمام المرحلة 6 وضمان كفاءة وصحة النظام الفرعي لإدارة المصروفات التشغيلية واليومية وتوثيق كل العمليات في سجل المراقبة قبل الانتقال للمرحلة التالية (SRS §FR-EXP, USE_CASES UC-12, Directives §0-5).
**الملفات المتأثرة:** `scripts/verify-phase6.ts`, `docs/plans/2026-08-26-phase6-expenses-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال المرحلة 6 بنجاح تام 100% وجاهزية قاعدة الكود للمرحلة 7 (تقارير الإغلاق اليومي والشيفتات).

## [2026-08-26] المرحلة 6 — واجهة إدارة وتسجيل وتتبع المصروفات وتصنيفاتها (Phase 6 Expense Management UI)
**النوع:** Feature / UI & Dashboard
**اللي اتعمل:**
1. إضافة ترجمات مساحة أسماء المصروفات `expenses` في ملفات اللغات `src/messages/ar.json` و`src/messages/en.json` (العناوين، كروت المؤشرات، خيارات الفلاتر والتواريخ، أعمدة الجدول، شاشات الحوار، رسائل التحقق والإشعارات).
2. بناء مكون نافذة إضافة وتعديل المصروف `src/components/expenses/expense-dialog.tsx`:
   - اختيار نوع المصروف من القائمة المتاحة مع زر سريع لإضافة فئة جديدة للمديرين/المالك.
   - حقول الإدخال: البيان (الوصف)، الكمية (افتراضي 1)، القيمة النقدية (> 0)، وتاريخ المصروف (افتراضي اليوم).
   - التحقق من المدخلات عبر Zod ومعالجة الإرسال عبر `POST /api/expenses` أو `PATCH /api/expenses/[id]` مع إشعارات toast الفورية.
3. بناء مكون نافذة إنشاء نوع مصروف مخصص `src/components/expenses/expense-type-dialog.tsx`:
   - متاح للمديرين والمالك لإنشاء تصنيفات مخصصة إضافية.
   - التحقق ومعالجة الإرسال عبر `POST /api/expenses/types` وتحديث القوائم ديناميكيًا.
4. بناء مكون العميل التفاعلي لإدارة المصروفات `src/components/expenses/expenses-client.tsx`:
   - شريط التحكم العلوي وأزرار تسجيل المصروف وإضافة الأنواع والتحديث.
   - كروت المؤشرات المالية الحية (KPI Cards): إجمالي قيمة المصروفات (مُنسقة بالعملة)، عدد القيود المسجلة، ومتوسط قيمة المصروف.
   - شريط الفلاتر السريعة للفترات الزمنية (اليوم، أمس، آخر 7 أيام، هذا الشهر، كل الأوقات)، وتصنيف المصروفات، والبحث النصي في الوصف، وزر مسح الفلاتر.
   - جدول متجاوب للشاشات الكبيرة وكروت مخصصة لشاشات الموبايل تعرض التاريخ، الشارة، البيان، الكمية، القيمة، المسجل، وأزرار التعديل والحذف مع نافذة تأكيد الحذف.
5. إنشاء صفحة السيرفر `/expenses` في `src/app/[locale]/(dashboard)/expenses/page.tsx` مع حماية الصلاحيات بـ `requirePageUser()` وتمرير البيانات المبدئية للشهر الحالي.
6. إضافة رابط المصروفات `/expenses` في شريط التنقل الرئيسي `src/app/[locale]/(dashboard)/layout.tsx`.
7. اجتياز الفحص الصارم لـ TypeScript (`npm run typecheck`) والـ Linting (`npm run lint`).
**السبب:** تمكين الكاشير والمديرين والمالك من تسجيل ومتابعة كافة المصروفات التشغيلية واليومية ومراقبة المؤشرات المالية مع الحفاظ على تجربة مستخدم سريعة ومتجاوبة وتوثيق كل العمليات في سجل المراقبة (SRS §FR-EXP, USE_CASES UC-12, Directives §2, §3, §8).
**الملفات المتأثرة:** `src/messages/ar.json`, `src/messages/en.json`, `src/components/expenses/expense-dialog.tsx`, `src/components/expenses/expense-type-dialog.tsx`, `src/components/expenses/expenses-client.tsx`, `src/app/[locale]/(dashboard)/expenses/page.tsx`, `src/app/[locale]/(dashboard)/layout.tsx`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال واجهات المصروفات وجاهزيتها للتحقق النهائي المؤتمت للمرحلة 6 (Task 4: Automated Verification Gate).

## [2026-08-26] المرحلة 6 — راوتات الـ API لإدارة وتتبع المصروفات وأنواعها وفرض الصلاحيات (Phase 6 Expenses API Endpoints)
**النوع:** Feature / API
**اللي اتعمل:**
1. إنشاء راوت أنواع المصروفات `src/app/api/expenses/types/route.ts`:
   - `GET`: متاح لـ (`OWNER`, `MANAGER`, `CASHIER`) لجلب كافة أنواع المصروفات (`listExpenseTypes`).
   - `POST`: متاح حصرًا لـ (`OWNER`, `MANAGER`) مع رفض الكاشير بـ 403، والتحقق عبر Zod (`name: min(1).max(100)`).
2. إنشاء راوت قائمة وتسجيل المصروفات `src/app/api/expenses/route.ts`:
   - `GET`: متاح لـ (`OWNER`, `MANAGER`, `CASHIER`) لاستخراج معاملات الفلترة (`startDate`, `endDate`, `date`, `expenseTypeId`, `createdBy`, `search`, `limit`, `offset`) وجلب النتائج مع الإجمالي المالي والعدد.
   - `POST`: متاح لـ (`OWNER`, `MANAGER`, `CASHIER`) لتسجيل مصروف جديد بعد التحقق الصارم عبر Zod من `expenseTypeId` كـ UUID و`value` موجبة و`quantity` كعدد صحيح موجب و`description`.
3. إنشاء راوت تفاصيل وتعديل وحذف المصروف `src/app/api/expenses/[id]/route.ts`:
   - `GET`: متاح لـ (`OWNER`, `MANAGER`, `CASHIER`) لجلب تفاصيل مصروف محدد (`getExpenseById`) والرد بـ 404 عند عدم الوجود.
   - `PATCH`: متاح لـ (`OWNER`, `MANAGER`) فقط لتعديل بيانات المصروف بعد التحقق عبر Zod.
   - `DELETE`: متاح لـ (`OWNER`, `MANAGER`) فقط لحذف المصروف مع توثيق الـ AuditLog.
4. تغليف كافة المعالجات بـ `wrapApi` وتوحيد استجابات الأخطاء `{ code, message }` وترقية `wrapApi` في `src/lib/api.ts` لدعم أخطاء تكرار الأسماء `DUPLICATE_`.
5. إنشاء سكريبت فحص واختبار مخططات التحقق `scripts/test-expenses-api-schemas.ts`.
**السبب:** توفير واجهات برمجية آمنة ومحمية بالصلاحيات تفصل منطق الأعمال وتسمح للواجهات الأمامية بتسجيل وحصر وتعديل المصروفات والأنواع بسلاسة (SRS §FR-EXP, USE_CASES UC-12, Directives §2, §3, §8).
**الملفات المتأثرة:** `src/app/api/expenses/types/route.ts`, `src/app/api/expenses/route.ts`, `src/app/api/expenses/[id]/route.ts`, `src/lib/api.ts`, `scripts/test-expenses-api-schemas.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** جاهزية الـ Endpoints لبناء واجهات إدارة المصروفات (Task 3: Expense Management UI).

## [2026-08-26] المرحلة 6 — بناء طبقة خدمات المصروفات والتسجيل الذري مع الـ Audit (Phase 6 Expenses Service Layer)
**النوع:** Feature / Service Layer
**اللي اتعمل:**
1. إنشاء طبقة خدمات المصروفات `src/services/expenses.ts`:
   - تعريف القائمة المسبقة للـ 20 نوع مصروف افتراضي `DEFAULT_EXPENSE_TYPES` المستخرجة من شيت الإكسيل التشغيلي.
   - دالة `seedDefaultExpenseTypes()` لبذر الأنواع العشرين الافتراضية مع وسم `isDefault = true` بشكل ذري وتجنب التكرار (`skipDuplicates`).
   - دالة `listExpenseTypes()` لجلب أنواع المصروفات مرتبة بالافتراضي أولاً ثم أبجديًا بعد ضمان بذرها.
   - دالة `createExpenseType(userId, name)` لإنشاء أنواع مصروفات مخصصة (`isDefault = false`) مع منع التكرار وتسجيل AuditLog بنوع `CREATE`.
   - دالة `createExpense(userId, input)` للتحقق من صحة القيمة والكمية والتاريخ ووجود الفئة، وإنشاء سجل المصروف وتسجيل AuditLog بنوع `CREATE` داخل transaction واحدة.
   - دالة `updateExpense(userId, expenseId, data)` للتحقق والتعديل الذري مع تسجيل القيم القديمة والجديدة في الـ AuditLog بنوع `UPDATE`.
   - دالة `deleteExpense(userId, expenseId)` لحذف سجل المصروف وتسجيل AuditLog بنوع `CANCEL`.
   - دالة `listExpenses(filters)` لدعم الفلترة المرنة بالتاريخ، النطاق الزمني، نوع المصروف، منشئ السجل، والبحث النصي في الوصف، مع حساب الإجمالي المالي `totalAmount` والعدد الكلي `totalCount`.
   - دالة `getExpenseById(id)` لجلب تفاصيل مصروف محدد.
2. إنشاء سكريبت اختبارات التحقق الشامل `scripts/test-expenses-service.ts` لاختبار كافة سيناريوهات التحقق والعمليات والـ Audit.
**السبب:** تأسيس طبقة الخدمات الحاكمة لإدارة وتتبع المصروفات التشغيلية للمطعم وفق قواعد العمل الصارمة (SRS §FR-EXP, USE_CASES UC-12, Directives §2, §3).
**الملفات المتأثرة:** `src/services/expenses.ts`, `scripts/test-expenses-service.ts`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** جاهزية طبقة الخدمات لبناء راوتات الـ API المحمية في Task 2.


## [2026-08-26] المرحلة 5 — اكتمال وبوابة التحقق المؤتمتة لنظام إدارة التوصيل والمناديب والمناطق (Phase 5 Delivery Subsystem Verification & Completion)
**النوع:** Verification / Milestone Completion
**اللي اتعمل:**
1. إنشاء سكريبت التحقق والمحاكاة الشامل لدورة حياة التوصيل `scripts/verify-phase5.ts`:
   - التحقق من بيانات البحث والمستخدمين (Owner, Cashier) والبراند والفئات والمنتجات والمنصات.
   - التحقق من عمليات CRUD لمناطق التوصيل (إنشاء، تعديل السعر، إيقاف التفعيل، وفلترة القوائم، وإعادة التفعيل) وتوثيق الـ AuditLog.
   - التحقق من عمليات CRUD لكافة أنواع أساطيل المناديب (`OWN`, `APP`, `PICKUP`, `EXTERNAL`) وفلترة النشط والموقوف حسب النوع وتوثيق الـ AuditLog.
   - التحقق من إسناد المناديب وإعادة الاحتساب الديناميكي لرسوم التوصيل:
     - إنشاء طلب وتعيين منطقة (60 ج.م) ومندوب `OWN` -> رسوم التوصيل 60 ج.م وتسجيل Audit CREATE.
     - تغيير المندوب إلى `APP` -> تصفير رسوم التوصيل إلى 0 ج.م وتسجيل Audit UPDATE.
     - إعادة المندوب إلى `OWN` -> استعادة رسوم التوصيل إلى 60 ج.م تلقائيًا وتسجيل Audit UPDATE.
     - تغيير المندوب إلى `PICKUP` -> تصفير رسوم التوصيل إلى 0 ج.م.
   - محاكاة دورة حياة الطلب الكاملة مع تعيين المندوب (`NEW` -> `CONFIRMED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) والتحقق من حفظ الطوابع الزمنية وهوية المندوب.
2. اجتياز اختبارات التحقق المؤتمتة بنسبة 100% (5/5).
3. اجتياز بوابات الجودة بالكامل:
   - `npm run typecheck` (`tsc --noEmit`): نجاح 0 أخطاء.
   - `npm run lint` (`eslint`): نجاح 0 أخطاء.
   - `npm run build` (`next build`): نجاح وبناء كل الصفحات والراوتات الديناميكية و الـ Proxy بنجاح تام.
**السبب:** إتمام المرحلة 5 وضمان كفاءة وصحة النظام الفرعي لإدارة التوصيل والمناطق والمناديب قبل الانتقال للمرحلة التالية (SRS §FR-DEL, Directives §0-5).
**الملفات المتأثرة:** `scripts/verify-phase5.ts`, `docs/plans/2026-08-26-phase5-delivery-plan.md`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال المرحلة 5 بنجاح تام 100% وجاهزية قاعدة الكود للمرحلة 6.

## [2026-08-26] المرحلة 5 — تكامل إسناد وتعيين المناديب مع دورة تسليم الطلبات (Order Dispatch Driver Assignment Integration)
**النوع:** Feature / UI & Workflow Integration
**اللي اتعمل:** دمج وتكامل عملية تعيين وتغيير المناديب مباشرة في تدفق العمليات وجداول تفاصيل الطلبات:
1. بناء مودال إسناد المندوب `src/components/delivery/assign-driver-dialog.tsx`:
   - جلب المناديب النشطين مع إمكانية البحث الفوري بالاسم.
   - عرض أنواع الأساطيل بشارات ملونة (`OWN`, `APP`, `EXTERNAL`, `PICKUP`) وعرض المندوب الحالي إن وجد.
   - دعم خيار التوصيل الفوري (Dispatch Switch) لتحديث حالة الطلب تلقائيًا إلى `OUT_FOR_DELIVERY` عند إسناد المندوب للطلبات الجاهزة (`READY`).
   - استدعاء `PATCH /api/orders/[id]/driver` وإشعار المستخدم عبر Sonner toast.
2. ترقية جدول وبطاقات الطلبات الحية `src/components/orders/orders-table.tsx`:
   - عند محاولة نقل الطلب من جاهز (`READY`) إلى في الطريق (`OUT_FOR_DELIVERY`):
     - إذا كان الطلب مسندًا لمندوب بالفعل: الانتقال مباشرة بشكل طبيعي.
     - إذا لم يكن مسندًا لمندوب: فتح مودال `AssignDriverDialog` تلقائيًا لإسناد المندوب والخروج للتوصيل بنقرة واحدة.
   - إضافة زر إجراء سريع / أيقونة شاحنة (`Truck`) على مستوى الصفوف والبطاقات لتعيين أو تغيير المندوب في أي حالة غير نهائية.
   - إظهار اسم المندوب أسفل شارة الحالة في الصفوف.
3. ترقية مودال تفاصيل الطلب `src/components/orders/order-details-modal.tsx`:
   - إضافة زر تعيين / تغيير المندوب في قسم التوصيل للطلبات غير المنتهية مع إعادة تحميل التفاصيل فور التحديث.
4. تحديث ملفات الترجمة `src/messages/ar.json` و `src/messages/en.json` بنصوص ومفاتيح `assignDialog` وإجراءات `assignDriver` / `reassignDriver`.
**السبب:** ضمان عدم خروج أي طلب للتوصيل بدون تحديد المندوب المسؤول عنه بدقة وتوفير تجربة تشغيلية سريعة وسلسة للكاشير والإدارة (SRS §FR-DEL, USE_CASES UC-09).
**الملفات المتأثرة:** `src/components/delivery/assign-driver-dialog.tsx`, `src/components/orders/orders-table.tsx`, `src/components/orders/order-details-modal.tsx`, `src/messages/ar.json`, `src/messages/en.json`, `PROJECT_LOG.md`
**تأثير على أجزاء تانية:** اكتمال واجهات وتدفق إسناد السائقين بنجاح وجاهزية النظام لمرحلة بوابات التحقق الشاملة (Task 5).

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
