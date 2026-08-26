# خطة المرحلة 3 — إدارة المنيو (Menu Management)

**التاريخ:** 2026-08-25
**المواصفة:** `docs/SRS.md` §FR-MENU + `docs/USE_CASES.md` UC-08 + Role Matrix
**المدة المخططة:** 4 أيام
**خارج النطاق:** Variants (معلق على عينات الرسيتات — Product بسيط حسب المواصفة §5)

---

## الشاشات (تحت `/menu` — Owner/Manager فقط)

### 1. صفحة المنيو الرئيسية
- اختيار البراند (4 تبويبات/قائمة) — الفلترة إجبارية (FR-MENU-06)
- عرض الكاتيجوريز مرتبة بـ `sortOrder`، وتحتها منتجات كل كاتيجوري
- حالة فارغة واضحة ("ابدأ بإضافة تصنيف")

### 2. CRUD الكاتيجوري
- إضافة / تعديل الاسم / إيقاف-تفعيل (`isActive`) / ترتيب (`sortOrder` بأزرار ↑↓ — بدون drag-drop في هذه المرحلة)
- الكاتيجوري المعطلة تختفي من فورم الأوردرات لكن بتفضل في الداتابيز (FR-MENU-03)

### 3. CRUD المنتج
- الحقول: الاسم (إجباري)، السعر (إجباري، Decimal > 0)، الوصف (اختياري)، الكاتيجوري (إجباري)
- إيقاف/تفعيل — **لا حذف نهائي** (FR-MENU-03)
- السعر القديم بيفضل محفوظ في `OrderItem.unitPrice` تلقائيًا (snapshot) — تعديل السعر مش بيغير الأوردرات القديمة

## الطبقات

| الطبقة | الملفات | ملاحظات |
|---|---|---|
| الخدمات | `src/services/menu.ts` | كل الكتابة على Category/Product من هنا + `audit()` لكل تغيير |
| الـ API | `src/app/api/menu/...` | `requireRole('OWNER','MANAGER')` في أول سطر — الكاشير 403 (FR-MENU-05) |
| الـ UI | `src/app/[locale]/(dashboard)/menu/page.tsx` + مكونات | Server Components للعرض + Client Components للفورمات، Zod validation |
| الترجمة | `src/messages/{ar,en}.json` — namespace `menu` | |

## قواعد الـ API

- `GET /api/menu/brands` — قائمة البراندات النشطة
- `GET /api/menu/categories?brandId=` — كاتيجوريات البراند بالمنتجات
- `POST/PATCH /api/menu/categories` (+ `/reorder`)
- `POST/PATCH /api/menu/products`
- كل PATCH يقبل تغييرات جزئية + `isActive` للإيقاف/التفعيل

## خطوات التنفيذ

1. `PROJECT_LOG` entry + مكونات shadcn المطلوبة (table, dialog, select, textarea, sonner/toast)
2. `src/services/menu.ts` — الدوال + audit
3. API routes بالصلاحيات
4. واجهة المنيو (براند → كاتيجوري → منتجات) بالفورمات
5. الترجمة ar/en
6. **بوابة التحقق:** typecheck + lint + build + اختبار متصفح كامل (دخول Owner → إضافة كاتيجوري → منتج → إيقاف → محاولة وهمية بكاشير مرفوضة)

## معايير القبول (من SRS)

- [ ] الكاشير API calls على /api/menu ترجع 403
- [ ] مفيش endpoint حذف نهائي
- [ ] كل create/update مسجل في AuditLog باسم المستخدم
- [ ] المنتجات المعطلة مش بتظهر في فورم الأوردر (يتحقق منه في مرحلة 4)
- [ ] الأسعار Decimal وتظهر صح بالعربي والإنجليزي
