# تصميم مخطط البيانات وقواعد الفرض — Order Control System

**التاريخ:** 2026-08-25
**الحالة:** معتمد من Stakeholder — جاهز لخطة التنفيذ
**النطاق:** المخطط النهائي للبيانات (Entities) + طبقات فرض قواعد العمل + سياسة البيانات
**المرجعيات:** `ENGINEERING_DIRECTIVES.md`, `docs/SRS.md`, `docs/USE_CASES.md`, `docs/NON_FUNCTIONAL_REQUIREMENTS.md`

---

## 1. القرارات المحسومة

### قرارات جلسة 2026-08-25

| النقطة | القرار | الأثر على التصميم |
|---|---|---|
| عمودا السعر في شيت Zone بالإكسل | كانا **قديم/جديد** — مش عميل/مندوب | `DeliveryZone.fee` حقل واحد فقط |
| قائمة المنصات (Facebook vs HarryApp) | مهمش الموضوع | seed مرن + إدارة كاملة من UI (`Platform.isActive`) |
| آلية موافقة الخصم | **الوضعان معًا**: المدير يطبق مباشرة + الكاشير يقدّم طلب PENDING | `discountStatus` enum على الـ Order نفسها بدون جدول إضافي |
| رصيد الخزنة التراكمي (Total Safe Balance) | **خارج النظام** — صافي اليوم فقط | لا يوجد حقل safeBalance في DailyClosing |
| كاش المندوب (OWN) | يرجع **كل حاجة** (أوردر + رسوم توصيل) للخزنة؛ مستحقاته تُدفع منفصل | لا يوجد riderFee على الـ Order؛ مستحقات المندوب = مصروف أو دفع خارجي |
| استيراد بيانات الإكسل القديمة | **مرفوض حاليًا** — بنبني على نضيف | النظام يبدأ بجداول فارغة؛ الإدخال اليدوي من UI؛ الاستيراد القديم مشروع مستقبلي منفصل إن لزم |

### مفتوح (تصميم دفاعي)

| النقطة | الحالة | التعامل |
|---|---|---|
| هيكل المنيو / Variants | منتظرون عينات الرسيتات من العميل | Product بسيط الآن (اسم/سعر/وصف/كاتيجوري)؛ الـ Variants تُضاف كجداول جديدة بدون تغيير موجودات |
| القائمة الدقيقة للمنصات | غير محسومة | جدول قابل للتعديل بالكامل من UI |

---

## 2. المقاربة المختارة

**المقاربة 1: الحد الأدنى الصارم** — أقل عدد جداول يغطي الـ SRS، كل قاعدة عمل في مكان واحد، وقرارات الانتظار (Variants، الاستيراد) لا تقفل أي باب مستقبلًا.

المقاربات المرفوضة:
- *مخطط مستقبلي-جاهز بالكامل* (جدول DiscountRequest منفصل + OptionGroup/Option الآن): تعقيد لمتطلبات غير مؤكدة، يخالف YAGNI
- *قيود على مستوى الداتابيز* (RLS + triggers): منطق مقسوم بين مكانين، أصعب اختبارًا، وتخالف توجيه الـ Directives بأن المنطق يسكن في `src/lib/`

---

## 3. الـ Enums

```prisma
enum Role            { OWNER MANAGER CASHIER }
enum OrderStatus     { NEW CONFIRMED PREPARING READY OUT_FOR_DELIVERY DELIVERED CANCELLED }
enum PaymentMethod   { CASH VISA ONLINE }
enum DriverType      { OWN APP EXTERNAL PICKUP }
enum DiscountStatus  { NONE PENDING APPROVED REJECTED }
enum CancelReason    { CUSTOMER_CHANGED_MIND DELIVERY_ISSUE QUALITY_ISSUE NO_ANSWER ITEM_UNAVAILABLE OTHER }
enum AuditAction     { CREATE UPDATE CANCEL STATUS_CHANGE DISCOUNT_REQUEST DISCOUNT_APPROVE DISCOUNT_REJECT }
```

---

## 4. الجداول المرجعية (Lookup)

| الجدول | الحقول | ملاحظات |
|---|---|---|
| `User` | id, email (unique), name, role, isActive, createdAt | `User.role` هو المرجع داخل التطبيق؛ يُزامَن مع Supabase Auth metadata عند إنشاء المستخدم وتغيير دوره |
| `Brand` | id, name, isActive | تُدخل يدويًا من UI (4 براندات متوقعة) |
| `Platform` | id, name, isActive | مرنة بالكامل — قرار الجلسة |
| `DeliveryZone` | id, name, fee (Decimal), isActive | سعر واحد لكل منطقة |
| `DeliveryDriver` | id, name, type (DriverType), isActive | PICKUP وAPP ليسا مناديب حقيقيين — نوعان للتوصيل |
| `Category` | id, name, brandId → Brand, sortOrder, isActive | كل كاتيجوري لبراند واحد |
| `Product` | id, name, description, price (Decimal), categoryId, isActive | Deactivate فقط — لا حذف |
| `ExpenseType` | id, name, isDefault, createdBy | تُدخل يدويًا من UI |

كل جداول الـ Lookup: soft-delete فقط (`isActive=false`)، والأسعار Decimal(10,2).

---

## 5. جداول العمليات

### Customer
```
id, name, phone (unique), address, notes,
totalOrders, lastOrderAt, createdAt
```
- أول طلب بتليفون جديد ⇒ إنشاء record تلقائي (FR-CUST-02)
- كتابة التليفون ⇒ auto-fill للاسم والعنوان (FR-ORD-06)
- البروفايل يعرض: totalOrders، آخر طلب، first-time/returning، سجل الطلبات، الأوردرات المشاكل (ملغية/جودة/توصيل)، notes ظاهرة لكل الأدوار
- لا حذف أبدًا — deactivate فقط حفاظًا على سلامة FK من الأوردرات القديمة

### Order ⭐
```
id, orderNumber (unique, auto), externalId?,
platformId → Platform, brandId → Brand,
customerId → Customer (required),
deliveryZoneId → DeliveryZone?, driverId → DeliveryDriver?, cashierId → User,
status (OrderStatus),
createdAt, confirmedAt?, preparingAt?, readyAt?,
outForDeliveryAt?, deliveredAt?, cancelledAt?,
subtotal, discount, deliveryFee,
discountStatus (DiscountStatus, default NONE),
discountReason?, discountRequestedBy? → User, discountApprovedBy? → User,
paymentMethod (PaymentMethod), cancelReason?, notes?
```
- **لا riderFee** — قرار الجلسة
- خصم بقيمة > 0 صالح فقط إذا: status = APPROVED **و** reason موجودة — مفروض في الـ API عند الحفظ
- الوضعان: Manager/Owner يطبق مباشرة = APPROVED فورًا؛ Cashier يقدّم = PENDING وتظهر في قائمة موافقات المدير

### OrderItem
```
id, orderId → Order, productId → Product,
quantity, unitPrice (snapshot من سعر المنيو لحظة الطلب), totalPrice
```

### Expense
```
id, expenseTypeId → ExpenseType, description, quantity, value, date, createdBy → User
```

### Shift + DailyClosing (جدولان)
```
Shift         id, cashierId → User, openedAt, closedAt?
DailyClosing  id, shiftId → Shift (unique), date,
              totalOrders, cancelledOrders,
              totalCash, totalVisa, totalOnline,
              totalDeliveryFees, totalExpenses, netCash,
              notes?
```
- أوردر جديد يتطلب شيفت مفتوحًا للكاشير (UC-10)
- `netCash` = Σ كاش الأوردرات (شاملًا رسوم التوصيل المحصلة كاش) − Σ المصاريف
- لا safeBalance تراكمي — قرار الجلسة

### AuditLog (immutable)
```
id, userId → User, action (AuditAction),
entityType, entityId, oldValue (Json?), newValue (Json?), timestamp
```
- لا UPDATE ولا DELETE من أي مسار — الكتابة عبر الدالة المركزية فقط
- العرض: Owner فقط (FR-AUD-03)

---

## 6. طبقات الفرض (Enforcement Layers)

| القاعدة | الملف الوحيد | الآلية |
|---|---|---|
| انتقالات الأوردر | `src/lib/orderStateMachine.ts` | خريطة `Record<OrderStatus, OrderStatus[]>` + `assertTransition(from, to)` ترمي عند الانتقال غير المسموح. الـ UI يستورد نفس الملف لعرض الخطوات الصالحة فقط |
| الـ Audit | `src/lib/audit.ts` + `src/services/orders.ts` | لا صفحة تتكلم مع Prisma مباشرة على Order؛ كل كتابة تمر بدوال الخدمة التي تستدعي `audit()` داخل نفس الـ transaction. فشل الـ audit = فشل العملية (rollback) |
| الصلاحيات | `src/lib/auth.ts` | `requireRole(...)` في أول سطر من كل API route — الراوت هو خط الدفاع، والـ middleware مجرد راحل |

### قواعد محسومة وكيفية فرضها

- **الخصم**: راوت واحد `PATCH /api/orders/:id/discount` — caller مدير/مالك ⇒ APPROVED فوري باسمه؛ كاشير ⇒ PENDING. وراوت `POST /api/discounts/pending/approve` للمدير/المالك. أي خصم > 0 بدون APPROVED + reason يُرفض عند الحفظ
- **No Hard Delete**: لا endpoint حذف أوردر في الكود أصلًا + الـ State Machine لا يقود إلى CANCELLED إلا مع cancelReason
- **الشيفت**: `createOrder` يرفض بـ `NO_OPEN_SHIFT` إن لم يوجد شيفت مفتوح
- **توصيل = 0**: اختيار driver من نوع APP/PICKUP يصفّر `deliveryFee` في طبقة الخدمة وليس في الفورم

### تدفق مثال — تغيير حالة

```
UI (زر "تجهيز")
  → PATCH /api/orders/:id/status { to: 'PREPARING' }
    → auth.requireRole(any)
      → orderStateMachine.assertTransition(current, 'PREPARING')
        → prisma.$transaction([ update order + preparingAt, audit.log(...) ])
```

---

## 7. البداية على نضيف (Clean Start)

- لا seed ولا migration من ملف الإكسل نهائيًا في هذه المرحلة
- أول تشغيل: جداول فارغة. الـ Owner الأول يُنشأ يدويًا (سكريبت one-time أو تسجيل أول مرة)، ثم يدخل من UI: البراندات، المنصات، الزونات بالأسعار، أنواع المصاريف
- استيراد البيانات القديمة (إن قرر العميل لاحقًا): مشروع منفصل صغير — سكريبت تحويل — لا يغير هذا التصميم

---

## 8. معالجة الأخطاء

- كل API route يعيد أخطاء structured: `{ code, message }` — مثل `TRANSITION_INVALID`, `DISCOUNT_UNAPPROVED`, `NO_OPEN_SHIFT`, `FORBIDDEN`, `VALIDATION_ERROR`
- Zod validation على كل request body قبل لمس قاعدة البيانات
- فشل الـ Audit = فشل العملية (transaction واحد) — لا تغيير بلا سجل
- الـ UI: رسائل واضحة بالعربية/الإنجليزية، لا شاشات فارغة (NFR §4)

---

## 9. الاختبارات

TDD على المنطق الحرج فقط:

| الملف تحت الاختبار | التغطية |
|---|---|
| `orderStateMachine.ts` | كل انتقال مسموح ينجح + كل انتقال ممنوع يُرفض (جدول حالات كامل) |
| `closing.ts` | الأرقام الثمانية لـ DailyClosing بحالات: كاش/فيزا/أونلاين، ملغي، خصم معتمد، مصاريف |
| منطق الخصم | كاشير ⇒ PENDING؛ حفظ خصم غير معتمد ⇒ رفض؛ مدير ⇒ APPROVED |
| `auth.ts` | كل role ضد كل راوت ⇒ 200 أو 403 كما هو متوقع |

بقية CRUD الـ UI: verification checklist يدوي (كما في `implementation_plan.md` §Verification Plan).

---

## 10. خارج النطاق عمدًا (YAGNI)

عمولات التطبيقات • رصيد الخزنة التراكمي • استيراد الإكسل • Variants للمنيو (حتى وصول الرسيتات) • إشعارات/فيدباك العملاء
