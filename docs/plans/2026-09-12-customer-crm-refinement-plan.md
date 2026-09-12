# خطة تنفيذ ترقية نظام العملاء وضبط تناظر وتوزيع العناصر (CRM 2.0 & Layout Precision)
# Customer Intelligence & CRM Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Follow TDD: Red -> Green -> Commit for every single task.

**Goal:** ترقية نظام إدارة العملاء والـ CRM لمطبخ السوشي وفق ملاحظات المستخدم الدقيقة: إلغاء نظام النقاط بالكامل، تطبيق التقسيم الذكي للعملاء (VIP, Regular, New, At Risk, Inactive)، إعادة هندسة وتنسيق أحجام العناصر وتناظرها وتوزيعها في شاشة العملاء (`/customers`) وجدول البيانات المتناظر، إضافة ميزة الكارت الذكي الفوري في شاشة إدخال الطلب (`/orders/new`) لإضافة الأصناف المفضلة بنقرة واحدة، وتوفير تصدير Excel لقوائم العملاء.

**Architecture:**
- **Domain Engine (`src/lib/customers.ts`):** خوارزمية تقسيم العملاء الذكية `determineCustomerSegment` بناءً على نموذج (Recency, Frequency, Monetary)، حساب الأصناف المفضلة (Top Favorite Products)، المنصة المفضلة (Preferred Platform مثل Talabat أو Phone)، ومنطقة التوصيل المعتادة (Usual Delivery Zone)، بدون أي نقاط أو مكافآت وبدون خيار Pickup (كل العمليات دليفري 100%).
- **Service Layer (`src/services/customers.ts`):** استعلامات قاعدة البيانات للترقيم والفلترة بحسب الشريحة (`segment`)، وتصدير البيانات، وإرجاع بيانات العميل الذكية والمفضلة للـ POS.
- **API Endpoints (`src/app/api/customers/`):** دعم الفلترة بالشريحة في `GET /api/customers`، مسار تصدير إكسل، ومسار البحث المحدث في `GET /api/customers/search` لإرجاع الشريحة والمفضلة والملاحظات لنقطة البيع.
- **UI Excellence (`ui-ux-pro-max` & `frontend-design`):**
  - حاوية موحدة `max-w-[1536px]` مع حشوات قياسية متطابقة مع شاشات الإدارة.
  - بطاقات KPI متناظرة ومتوازنة بالكامل مع خطوط وأرقام واضحة ومتباينة.
  - شريط فلاتر متناسق الارتفاعات (`h-10`) مع أزرار البحث والشرائح والمشاكل وتصدير Excel.
  - جدول `table-fixed w-full` محكم بنسب مئوية دقيقة (100% مجموع) تشمل: العميل (22%)، الهاتف (16%)، الشريحة (14%)، الطلبات (11%)، الإنفاق (14%)، آخر طلب (13%)، والإجراءات (10%).
  - كارت نقطة البيع الذكي الفوري (POS Quick Customer Card) في `/orders/new` مع زر `+ إضافة` للأصناف المفضلة بنقرة واحدة وتنبيه الملاحظات الخاصة.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Prisma 7, Supabase Postgres, next-intl (AR/EN RTL/LTR), Lucide Icons.

---

## User Review Required

> [!IMPORTANT]
> **قرارات وتعديلات ملزمة استجابة لتوجيهاتك الصريحة:**
> 1. **إلغاء نظام النقاط بالكامل (No Points & No Rewards):** لن يتم احتساب أو عرض أي نقاط أو مكافآت نهائياً.
> 2. **كل الطلبات دليفري 100% (No Pickup / No Takeaway):** المطبخ دليفري بالكامل؛ لذا تم إلغاء حقل طريقة الطلب (Delivery vs Pickup) واستبداله بـ **المنصة الأكثر استخداماً (Preferred Platform)** و**منطقة التوصيل المعتادة (Usual Delivery Zone)**.
> 3. **اعتماد شرائح العملاء التشغيلية الـ 5 (Segments):**
>    - ⭐ **VIP:** طلبات ≥ 15 أو إنفاق ≥ 3,000 ج.م.
>    - 🔄 **Regular:** طلبات ≥ 3 وآخر طلب خلال آخر 30 يوماً.
>    - 🆕 **New:** 1-2 طلب وآخر طلب خلال آخر 30 يوماً.
>    - ⚠️ **At Risk (معرّضون للفقد):** عميل كان منتظماً (≥ 3 طلبات) لكنه انقطع منذ 30 إلى 60 يوماً (أهم شريحة تسويقية).
>    - 💤 **Inactive (خاملون):** لم يطلب منذ أكثر من 60 يوماً.
> 4. **إعادة ضبط وتناظر أحجام وتوزيع العناصر في صفحة العملاء بالكامل:**
>    - معالجة الحاوية لتكون متناسقة مع شاشات الإدارة (`max-w-[1536px]`).
>    - توزيع الأعمدة بنسب متوازنة وعادلة 100% وإضافة عمود إجمالي الإنفاق (`Total Spent`).
>    - توحيد ارتفاع ومقاسات عناصر شريط الفلاتر والأزرار.
> 5. **تصدير قائمة العملاء إلى Excel:** لتسهيل حملات الواتساب والتسويق على المالك.
> 6. **الكارت الذكي في شاشة الطلب الجديد (`/orders/new`):** إضافة الأصناف المفضلة للطلب فوراً بنقرة واحدة وتنبيه ملاحظات الحساسية والتوصيل.

---

## Proposed Changes

### Component 1: Customer Domain & Service Layer (`src/lib/` & `src/services/`)

#### [MODIFY] [customers.ts](file:///d:/programming/Projects/Orders%20Management%20System/src/lib/customers.ts)
- إضافة نوع الشرائح:
  ```typescript
  export type CustomerSegment = "VIP" | "REGULAR" | "NEW" | "AT_RISK" | "INACTIVE";
  ```
- دالة `determineCustomerSegment(totalOrders: number, lifetimeSpent: number, lastOrderAt: Date | string | null): CustomerSegmentInfo`:
  - تحسب الشريحة بدقة وتحدد شارة ولون الشريحة (أمبر للـ VIP، زمردي للـ Regular، أزرق للـ New، برتقالي تحذيري للـ At Risk، رمادي خافت للـ Inactive).
- دالة `determinePreferredPlatform(orders: any[]): string`:
  - استنتاج المنصة الأكثر استخداماً للعميل (Talabat, Menus, InstaShop, Phone...).
- دالة `determineUsualDeliveryZone(orders: any[]): string | null`:
  - استنتاج منطقة التوصيل الأكثر تكراراً للعميل من عناوين الطلبات (الطلبات دليفري 100% ومفيش أي استلام).
- إزالة أي مراجع أو حسابات لنقاط الولاء أو المكافآت أو قنوات الاستلام (Pickup).

#### [MODIFY] [customers.ts](file:///d:/programming/Projects/Orders%20Management%20System/src/services/customers.ts)
- تحديث `listCustomers`:
  - دعم فلتر الشريحة `segment: CustomerSegment`.
  - جلب إجمالي الإنفاق لكل عميل وعرضه في عناصر القائمة.
  - حساب مؤشرات الـ KPIs المحدثة: إجمالي العملاء، الجدد هذا الشهر، النشطون و VIP، والعملاء المعرضون للفقد (`atRiskCount`).
- تحديث `searchCustomersByPhone`:
  - إرجاع الملاحظات `notes`، الشريحة `segment`، وأكثر المنتجات المفضلة `favoriteProducts` لاستخدامها في كارت الـ POS الفوري.
- تحديث `getCustomerProfile`:
  - إرجاع الأصناف المفضلة والقناة المفضلة والشريحة في بروفايل العميل.

---

### Component 2: API Layer (`src/app/api/customers/`)

#### [MODIFY] [route.ts](file:///d:/programming/Projects/Orders%20Management%20System/src/app/api/customers/route.ts)
- تحديث مخطط Zod لدعم معلمة `segment` وفلترة الاستعلام.
- مسار `GET /api/customers/export`: تصدير CSV مع UTF-8 BOM متوافق مع Excel بالأحرف العربية يحتوي على (الاسم، الهاتف، الشريحة، عدد الطلبات، إجمالي الإنفاق، آخر طلب، الملاحظات).

#### [MODIFY] [route.ts](file:///d:/programming/Projects/Orders%20Management%20System/src/app/api/customers/search/route.ts)
- إرجاع بيانات العميل الذكية الموسعة لنقطة البيع (الشريحة، الأصناف المفضلة مع معرفاتها وأسعارها، وملاحظات الحساسية والتوصيل).

---

### Component 3: Internationalization (`src/messages/`)

#### [MODIFY] [ar.json](file:///d:/programming/Projects/Orders%20Management%20System/src/messages/ar.json) & [en.json](file:///d:/programming/Projects/Orders%20Management%20System/src/messages/en.json)
- إضافة ترجمات الشرائح الخمس: `VIP` (عميل VIP)، `REGULAR` (عميل دائم)، `NEW` (عميل جديد)، `AT_RISK` (معرّض للفقد ⚠️)، `INACTIVE` (عميل خامل).
- إضافة ترجمات الأعمدة الجديدة: `spent` (إجمالي الإنفاق)، `segment` (الشريحة)، `exportExcel` (تصدير إكسل)، `preferredChannel` (طريقة الطلب المفضلة)، `favoritesTitle` (الأصناف المفضلة)، `quickAdd` (إضافة سريعة).
- إزالة أي نصوص متعلقة بالنقاط والمكافآت.

---

### Component 4: Layout & UI Symmetry in Customer Page (`src/components/customers/`)

#### [MODIFY] [customers-client.tsx](file:///d:/programming/Projects/Orders%20Management%20System/src/components/customers/customers-client.tsx)
- ضبط الحاوية لتكون متناسقة تماماً مع بقية لوحات التحكم:
  `className="mx-auto flex w-full max-w-[1536px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8"`
- إضافة زر تصدير Excel في الترويسة العليا بجانب زر التحديث.

#### [MODIFY] [customer-kpi-cards.tsx](file:///d:/programming/Projects/Orders%20Management%20System/src/components/customers/customer-kpi-cards.tsx)
- بطاقات متناظرة ذات ارتفاعات متطابقة وتصميم تنفيذي رحب:
  1. إجمالي العملاء (Total Customers)
  2. عملاء جدد هذا الشهر (New Customers)
  3. عملاء نشطون و VIP (Active & VIP)
  4. عملاء معرضون للفقد ⚠️ (At Risk Customers)
- أرقام كبيرة وواضحة مجدولة (`tabular-nums font-mono text-2xl sm:text-3xl font-bold`) مع وسام الأيقونة المتناسق في زاوية البطاقة.

#### [MODIFY] [customer-filter-bar.tsx](file:///d:/programming/Projects/Orders%20Management%20System/src/components/customers/customer-filter-bar.tsx)
- شريط فلاتر متناسق موحد الارتفاع (`h-10`) بدون أي تفاوت:
  - حقل البحث بالاسم أو الهاتف مع زر مسح سريع.
  - قائمة منسدلة لاختيار الشريحة (الكل / VIP / منتظم / جديد / معرض للفقد / خامل).
  - زر تفعيل فلتر الطلبات المشاكل بتصميم عالي التباين وأيقونة تحذيرية.
  - أزرار إعادة التعيين والتحديث.

#### [MODIFY] [customer-table.tsx](file:///d:/programming/Projects/Orders%20Management%20System/src/components/customers/customer-table.tsx)
- **إعادة هندسة شبكة الجدول الثابتة والتناظر التام (`table-fixed w-full`):**
  - تثبيت الأعمدة السبعة بنسب مئوية دقيقة مجموعها 100%:
    1. **العميل (اسم + أفاتار الحروف):** `w-[22%] min-w-[170px]`
    2. **رقم الهاتف (`dir="ltr"` + زر النسخ والاتصال):** `w-[16%] min-w-[140px]`
    3. **الشريحة (وسام الشريحة الملون):** `w-[14%] min-w-[120px]`
    4. **الطلبات (العدد + شارة المشاكل إن وجدت):** `w-[11%] min-w-[95px] text-center`
    5. **إجمالي الإنفاق (المبلغ بالجنيه المصري بالأرقام المجدولة):** `w-[14%] min-w-[120px]`
    6. **آخر طلب (التاريخ بالتنسيق المحلي):** `w-[13%] min-w-[110px]`
    7. **الإجراءات (زر فحص البروفايل):** `w-[10%] min-w-[95px] text-center`

---

### Component 5: Customer Profile Refinement (`src/components/customers/`)

#### [MODIFY] [customer-profile-client.tsx](file:///d:/programming/Projects/Orders%20Management%20System/src/components/customers/customer-profile-client.tsx)
- عرض شارة الشريحة (VIP, Regular, At Risk, New, Inactive).
- إضافة قسم **الأصناف الأكثر طلباً للعميل (Customer Favorites)** مع صورة أو أيقونة كل طبق وعدد مرات طلبه.
- إظهار القناة المفضلة (توصيل 🛵 أو استلام 🥡).
- حذف أي ذكر للنقاط أو المكافآت.

---

### Component 6: POS Quick Customer Card at Order Entry (`src/components/orders/`)

#### [MODIFY] [order-form.tsx](file:///d:/programming/Projects/Orders%20Management%20System/src/components/orders/order-form.tsx)
- إضافة كارت ذكي فوري (POS Quick Customer Insight):
  - عندما يكتب الكاشير رقم هاتف العميل أو يختاره من القائمة المنسدلة:
    - يظهر كارت مدمج أنيق أسفل أو بجانب حقول العميل يحتوي على:
      - شارة الشريحة (مثلاً: `⭐ VIP` أو `⚠️ At Risk`).
      - إجمالي طلبات العميل وإجمالي إنفاقه.
      - **قائمة الأصناف المفضلة (Top 3 Favorites):** مع زر سريع **`+ إضافة للطلب`** يضيف المنتج وسعره مباشرة إلى سلة الطلب الحالية بنقرة واحدة!
      - **تنبيه ملاحظات العميل (Allergies / Special Instructions):** يظهر كشريط تنبيه مميز إذا كان لدى العميل ملاحظات سابقة حتى لا يغفل عنها الكاشير.

---

## Verification Plan

### Automated Tests
1. **Feature Tests (`tests/e2e/tier1-feature-coverage.test.ts`):**
   - اختبار حساب الشرائح `determineCustomerSegment` للـ 5 حالات بدقة.
   - اختبار حساب الأصناف المفضلة `calculateCustomerFavorites`.
   - اختبار دقة حساب إجمالي الإنفاق ومؤشرات الـ KPIs.
   - اختبار مسار تصدير الـ CSV/Excel ومسار البحث المحدث لنقطة البيع.
2. **Cross-Feature Tests (`tests/e2e/tier3-cross-feature.test.ts`):**
   - اختبار توافق وتناظر الجدول واحتواء عمود الإنفاق `Spent` والشريحة `Segment`.
   - اختبار وجود كارت نقطة البيع الذكي وزر الإضافة السريعة في `order-form.tsx`.
   - اختبار تناظر قواميس الترجمة في `ar.json` و `en.json`.
3. **Quality Gates:**
   - `npm run typecheck` -> 0 errors.
   - `npm run test:e2e` -> 226+ tests pass 100%.
   - `npm run build` -> Turbopack production build succeeds.

### Manual Verification
1. فتح صفحة `/customers`: فحص تناظر بطاقات الـ KPI، استقرار الجدول، تناسب عرض الأعمدة، واختبار فلترة الشرائح (VIP, At Risk, إلخ)، وتجربة زر تصدير Excel.
2. فتح شاشة طلب جديد `/orders/new`: كتابة رقم هاتف عميل موجود، التأكد من ظهور الكارت الذكي ببياناته وشريحته وملاحظاته، والضغط على زر `+ إضافة` لصنف مفضل والتأكد من إدراجه فوراً في أصناف الطلب.
3. فتح بروفايل العميل `/customers/[id]`: فحص ظهور الأصناف المفضلة وقناة الطلب المفضلة والتأكد من عدم وجود أي مراجع للنقاط أو المكافآت.
