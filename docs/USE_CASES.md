# Use Cases — Order Control System

## Actors

| Actor | الوصف |
|-------|-------|
| **Cashier (الكاشير)** | الموظف اللي بيستلم الأوردرات من التطبيقات وبيدخلها في النظام |
| **Manager (المدير)** | بيشرف على العمليات، بيوافق على الخصومات، بيدير المنيو |
| **Owner (صاحب المطعم)** | بيشوف كل حاجة، التقارير الشهرية، إدارة المستخدمين |
| **Driver (المندوب)** | بيستلم الطلبات ويوصلها — مش بيستخدم النظام مباشرة |
| **Customer (العميل)** | بيطلب من التطبيقات — مش بيستخدم النظام مباشرة |

---

## UC-01: تسجيل الدخول

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier / Manager / Owner |
| **Precondition** | المستخدم عنده حساب مسجل في النظام |
| **Main Flow** | 1. المستخدم يدخل Email + Password<br>2. النظام يتحقق من البيانات عبر Supabase Auth<br>3. النظام يحدد الـ Role<br>4. النظام يوجه المستخدم للـ Dashboard المناسب |
| **Alt Flow** | 2a. بيانات غلط → رسالة خطأ + إعادة محاولة |
| **Postcondition** | المستخدم logged in ويشوف الواجهة حسب دوره |

---

## UC-02: إدخال أوردر جديد

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier |
| **Precondition** | الكاشير logged in + عنده رسيت من التطبيق |
| **Main Flow** | 1. الكاشير يضغط "أوردر جديد"<br>2. يختار المنصة (Talabat/Menus/InstaShop/HarryApp/Phone)<br>3. يختار البراند (Flower/Mastery/Niwa/Tobiko)<br>4. يدخل رقم الأوردر الخارجي (External ID)<br>5. يدخل بيانات العميل (اسم + تليفون + عنوان)<br>6. النظام يبحث بالتليفون → لو العميل موجود يعبي البيانات أوتوماتيك<br>7. يختار المنتجات من المنيو (حسب البراند) + الكمية<br>8. النظام يحسب الـ subtotal أوتوماتيك<br>9. يختار طريقة الدفع (Cash/Visa/Online)<br>10. يختار الـ Zone ← النظام يحسب رسوم التوصيل أوتوماتيك<br>11. يضيف ملاحظات (اختياري)<br>12. يضغط "حفظ"<br>13. النظام يسجل الأوردر بحالة "New" + timestamp أوتوماتيك<br>14. النظام يسجل في Audit Log |
| **Alt Flow** | 6a. عميل جديد → النظام يعمل record جديد في Customer DB<br>10a. لو التوصيل بمناديب التطبيق → رسوم التوصيل = 0 |
| **Postcondition** | أوردر جديد مسجل + العميل متسجل/متحدث في Customer DB |
| **Business Rules** | - الوقت يتسجل أوتوماتيك (createdAt)<br>- رقم الأوردر يتولد أوتوماتيك<br>- السعر يتحسب من المنيو مش بيدخله الكاشير يدوي |

---

## UC-03: تأكيد الأوردر

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier |
| **Precondition** | أوردر بحالة "New" |
| **Main Flow** | 1. الكاشير يتصل بالعميل يراجع تفاصيل الطلب<br>2. يضغط "تأكيد" على الأوردر<br>3. النظام يغير الحالة من New → Confirmed<br>4. يتسجل confirmedAt أوتوماتيك<br>5. Audit Log |
| **Alt Flow** | 2a. العميل عايز يعدل → الكاشير يعدل ويحفظ قبل التأكيد<br>2b. العميل مش عايز → UC-07 (إلغاء) |
| **Postcondition** | الأوردر بحالة Confirmed |

---

## UC-04: تحريك الأوردر عبر المراحل

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier |
| **Precondition** | أوردر بحالة سابقة صالحة |
| **Transitions** | Confirmed → Preparing (preparingAt)<br>Preparing → Ready (readyAt)<br>Ready → Out for Delivery (outForDeliveryAt + driverId)<br>Out for Delivery → Delivered (deliveredAt) |
| **Business Rules** | - كل transition بتتسجل بـ timestamp<br>- لازم يمشي بالترتيب (State Machine) — مش ممكن يروح من New لـ Delivered مباشرة<br>- عند Ready → Out for Delivery لازم يختار المندوب<br>- كل تغيير يتسجل في Audit Log |

---

## UC-05: تعيين مندوب

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier |
| **Precondition** | أوردر بحالة "Ready" |
| **Main Flow** | 1. الكاشير يختار المندوب من القائمة<br>2. يختار نوع التوصيل (مندوب خاص / تطبيق / خارجي / العميل)<br>3. لو مندوب التطبيق → رسوم التوصيل = 0<br>4. النظام يسجل driverId + driverAssignedAt<br>5. الحالة تتغير لـ "Out for Delivery" |
| **Postcondition** | الأوردر متعين لمندوب + حالته Out for Delivery |
| **Business Rules** | - اسم المندوب يتسجل عشان يتحاسب على الكاش |

---

## UC-06: إضافة خصم على أوردر

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier (يطلب) → Manager/Owner (يوافق) |
| **Precondition** | أوردر مش ملغي |
| **Main Flow** | 1. الكاشير يضغط "إضافة خصم"<br>2. يدخل مبلغ الخصم + السبب (إجباري)<br>3. الطلب يتبعت للمدير/الأونر للموافقة<br>4. المدير يوافق أو يرفض<br>5. لو موافق → الخصم يتطبق + discountApprovedBy يتسجل<br>6. Audit Log |
| **Alt Flow** | 4a. المدير يرفض → الخصم مايتطبقش + الكاشير يتبلغ |
| **Business Rules** | - **Backend Validation**: الـ API يرفض أي خصم من غير discountReason<br>- **Backend Validation**: الـ API يرفض أي خصم من غير discountApprovedBy (Manager/Owner)<br>- مش بس UI — الحماية في الـ API نفسه |

---

## UC-07: إلغاء أوردر

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier (مع تواصل للمدير) |
| **Precondition** | أوردر مش بحالة Delivered أو Cancelled |
| **Main Flow** | 1. الكاشير يضغط "إلغاء"<br>2. يختار سبب الإلغاء (من قائمة محددة)<br>3. لو "أخرى" → يكتب ملاحظة<br>4. النظام يغير الحالة لـ Cancelled + cancelledAt<br>5. Audit Log |
| **Cancel Reasons** | تغيير رأي العميل / مشكلة توصيل / مشكلة جودة / العميل ما ردش / منتج غير متاح / أخرى |
| **Business Rules** | - **لا يوجد Hard Delete أبدًا** — الأوردر يفضل موجود بحالة Cancelled<br>- cancelReason إجباري |

---

## UC-08: إدارة المنيو

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Manager / Owner |
| **Precondition** | Logged in بصلاحية Manager أو Owner |
| **Main Flow** | 1. اختيار البراند<br>2. عرض الكاتيجوريز والمنتجات<br>3. إضافة / تعديل / تفعيل-إيقاف كاتيجوري أو منتج<br>4. تعديل الأسعار |
| **Business Rules** | - الكاشير مايقدرش يعدل المنيو<br>- المنتج بيتقفل (isActive=false) مش بيتمسح<br>- كل تغيير يتسجل في Audit Log |

---

## UC-09: تسجيل مصروف

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier / Manager / Owner |
| **Main Flow** | 1. يختار نوع المصروف من القائمة<br>2. يدخل الوصف + الكمية + القيمة<br>3. التاريخ يتسجل أوتوماتيك<br>4. يحفظ |
| **Business Rules** | - أنواع المصاريف 20 نوع افتراضي + إمكانية إضافة أنواع جديدة (Manager/Owner بس) |

---

## UC-10: إغلاق اليوم (Daily Closing)

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier |
| **Precondition** | وردية مفتوحة |
| **Main Flow** | 1. الكاشير يفتح الشيفت (openedAt)<br>2. خلال اليوم: يدخل أوردرات + مصاريف<br>3. في نهاية الشيفت يضغط "إغلاق"<br>4. النظام يحسب أوتوماتيك:<br>   - إجمالي الأوردرات (ناجح / ملغي)<br>   - إجمالي الكاش المحصل<br>   - إجمالي الفيزا/أونلاين<br>   - كاش كل مندوب (اللي لازم يرجعه)<br>   - رسوم التوصيل المحصلة<br>   - المصاريف المسجلة<br>   - صافي الكاش اليومي<br>5. الكاشير يراجع ويأكد<br>6. closedAt يتسجل |
| **Business Rules** | - الحسابات تتعمل في `src/lib/closing.ts` (Separation of Concerns)<br>- لازم يكون في وردية مفتوحة عشان يقدر يسجل أوردرات |

---

## UC-11: عرض التقارير

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Manager / Owner فقط |
| **Main Flow** | 1. يختار نوع التقرير (يومي / شهري / custom)<br>2. يحدد الفترة<br>3. النظام يعرض:<br>   - إجمالي الأوردرات (ناجح / ملغي)<br>   - إجمالي المبيعات (كاش / فيزا)<br>   - المبيعات حسب التطبيق + البراند<br>   - رسوم التوصيل<br>   - إجمالي المصاريف حسب النوع<br>   - صافي الإيرادات<br>   - متوسط قيمة الطلب (AOV)<br>   - كاش المناديب<br>   - أفضل منتجات مبيعاً<br>4. إمكانية تصدير PDF / Excel |
| **Business Rules** | - **Backend validation**: الـ API يتحقق من الـ Role — الكاشير مايشوفش التقارير |

---

## UC-12: عرض داشبورد العميل

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Cashier / Manager / Owner |
| **Main Flow** | 1. البحث عن عميل بالتليفون أو الاسم<br>2. النظام يعرض:<br>   - بيانات العميل الأساسية<br>   - عدد الطلبات الكلي<br>   - آخر طلب<br>   - الطلبات المشاكل (ملغية / مشاكل جودة / مشاكل توصيل)<br>   - تاريخ كل الطلبات<br>   - هل عميل أول مرة ولا returning |
| **Postcondition** | صورة كاملة عن العميل |

---

## UC-13: عرض Audit Log

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Owner فقط |
| **Main Flow** | 1. يفتح صفحة سجل المراقبة<br>2. يفلتر حسب: الموظف / نوع العملية / التاريخ<br>3. يشوف: مين عمل إيه + إمتى + القيمة القديمة + القيمة الجديدة |
| **Business Rules** | - **Backend**: فقط Owner يقدر يشوف الـ Audit Log |

---

## UC-14: إدارة المستخدمين

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Owner فقط |
| **Main Flow** | 1. عرض قائمة المستخدمين<br>2. إضافة مستخدم جديد (اسم + email + password + role)<br>3. تعديل بيانات مستخدم أو تغيير دوره<br>4. إيقاف مستخدم (مش حذف) |

---

## UC-15: إدارة مناطق التوصيل

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Manager / Owner |
| **Main Flow** | 1. عرض قائمة المناطق + الأسعار<br>2. إضافة منطقة جديدة + السعر<br>3. تعديل سعر منطقة موجودة<br>4. إيقاف / تفعيل منطقة |
| **Business Rules** | - السعر لازم يكون قابل للتعديل في أي وقت (طلب العميل) |

---

## UC-16: إدارة المناديب

| العنصر | التفاصيل |
|--------|----------|
| **Actor** | Manager / Owner |
| **Main Flow** | 1. عرض قائمة المناديب<br>2. إضافة مندوب (اسم + نوع: خاص/تطبيق/خارجي)<br>3. تعديل بيانات مندوب<br>4. إيقاف / تفعيل مندوب |

---

## System Context Diagram

```mermaid
graph TB
    subgraph "External Systems"
        T["📱 Talabat"]
        M["📱 Menus"]
        I["📱 InstaShop"]
        H["📱 HarryApp"]
        PH["📞 Phone"]
    end

    subgraph "Actors"
        C["👤 Cashier"]
        MG["👤 Manager"]
        OW["👤 Owner"]
        DR["🏍️ Driver"]
        CU["👤 Customer"]
    end

    subgraph "Order Control System"
        OCS["🖥️ Web Application"]
    end

    T -->|"Receipt / Order Info"| C
    M -->|"Receipt / Order Info"| C
    I -->|"Receipt / Order Info"| C
    H -->|"Receipt / Order Info"| C
    PH -->|"Phone Order"| C

    C -->|"Enter Orders, Change Status"| OCS
    MG -->|"Manage Menu, Approve Discounts, View Reports"| OCS
    OW -->|"Everything + Users + Audit Log"| OCS

    OCS -->|"Assign Order"| DR
    CU -->|"Orders via Apps"| T
    CU -->|"Orders via Apps"| M
    CU -->|"Orders via Apps"| I
    CU -->|"Orders via Apps"| H
    CU -->|"Direct Order"| PH
```

---

## Data Flow — Order Lifecycle

```mermaid
flowchart LR
    A["📱 App Receipt"] --> B["👤 Cashier"]
    B -->|"UC-02"| C["📝 New Order"]
    C -->|"UC-03"| D["✅ Confirmed"]
    D -->|"UC-04"| E["🍳 Preparing"]
    E -->|"UC-04"| F["📦 Ready"]
    F -->|"UC-05"| G["🏍️ Out for Delivery"]
    G -->|"UC-04"| H["✅ Delivered"]

    C -->|"UC-07"| X["❌ Cancelled"]
    D -->|"UC-07"| X
    E -->|"UC-07"| X
    F -->|"UC-07"| X

    subgraph "Auto-tracked"
        T1["⏰ Timestamps"]
        T2["📋 Audit Log"]
        T3["👤 Customer DB"]
    end

    C --> T1
    D --> T1
    E --> T1
    F --> T1
    G --> T1
    H --> T1
    X --> T1

    C --> T2
    D --> T2
    G --> T2
    H --> T2
    X --> T2

    C --> T3
```

---

## Role-Permission Matrix

| الصلاحية | Cashier | Manager | Owner |
|-----------|---------|---------|-------|
| إدخال أوردر | ✅ | ✅ | ✅ |
| تغيير حالة الأوردر | ✅ | ✅ | ✅ |
| إلغاء أوردر | ✅ (مع سبب) | ✅ | ✅ |
| حذف أوردر | ❌ | ❌ | ❌ |
| إضافة خصم | طلب فقط | ✅ موافقة | ✅ موافقة |
| تعيين مندوب | ✅ | ✅ | ✅ |
| إدارة المنيو | ❌ | ✅ | ✅ |
| تسجيل مصروف | ✅ | ✅ | ✅ |
| إضافة نوع مصروف | ❌ | ✅ | ✅ |
| إغلاق اليوم | ✅ | ✅ | ✅ |
| التقارير اليومية | ❌ | ✅ | ✅ |
| التقارير الشهرية | ❌ | ❌ | ✅ |
| Audit Log | ❌ | ❌ | ✅ |
| إدارة المستخدمين | ❌ | ❌ | ✅ |
| إدارة المناطق | ❌ | ✅ | ✅ |
| إدارة المناديب | ❌ | ✅ | ✅ |
| داشبورد العملاء | ✅ (أساسي) | ✅ (كامل) | ✅ (كامل) |
