# خطة تنفيذ المرحلة 1 — الأساس والمخطط (Foundation)

**التاريخ:** 2026-08-25
**المواصفة المرجعية:** `docs/specs/2026-08-25-data-model-design.md`
**الهدف:** مشروع Next.js شغال + Prisma schema كامل مطابق للمواصفة + `PROJECT_LOG.md` + هيكل i18n/RTL — بدون شاشات وظيفية بعد
**خارج نطاق المرحلة:** Auth (مرحلة 2)، أي CRUD، أي seed بيانات

---

## الخطوات

### 0. PROJECT_LOG.md — أول سطر في المشروع ⚠️ إجباري حسب الـ Directives §0
- إنشاء `PROJECT_LOG.md` في الجذر بأول entry:
  - `[2026-08-25] اعتماد مواصفة مخطط البيانات` — النوع: Decision — السبب: قرارات جلسة الحسم + مراجعة Stakeholder — الملفات: `docs/specs/2026-08-25-data-model-design.md`
- **قاعدة مستمرة:** أي خطوة من خطوات هذه الخطة بتلمس schema أو قرار = تحديث PROJECT_LOG.md في نفس الـ commit

### 1. Scaffold مشروع Next.js داخل مجلد غير فارغ
المجلد فيه docs وxlsx، و`create-next-app` يرفض المجلد غير الفاضي:
1. scaffold مؤقت في `%TEMP%/oms-scaffold`: `npm create next-app@latest -- --typescript --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack`
2. نقل المحتويات إلى جذر المشروع مع دمج `.gitignore` الموجود
3. تشغيل `npm install` والتحقق أن `npm run dev` يشتغل

### 2. Dependencies
```
prisma @prisma/client @supabase/supabase-js
zod react-hook-form @hookform/resolvers
next-intl recharts
npx shadcn@latest init
```
- shadcn: نمط default، لون neutral، CSS variables مفعّلة

### 3. Prisma Schema — ترجمة حرفية للمواصفة
- `prisma/schema.prisma`: كل الـ enums السبعة + الجداول الأربعة عشر كما هي في المواصفة §3–§5
  - Decimal(10,2) لكل المبالغ • `phone` unique على Customer • `orderNumber` unique • `shiftId` unique على DailyClosing • onDelete behaviors: OrderItem cascade مع Order؛ الباقي restrict
- `DATABASE_URL` في `.env` (مش مترفع) يشير على مشروع Supabase تطوير
- `npx prisma migrate dev --name init` ثم `npx prisma generate`
- **بدون seed file** — clean start (قرار المواصفة §7)

### 4. i18n + RTL
- next-intl: `src/i18n/ar.json`, `en.json` بمفاتيح فارغة هيكلية فقط (nav, common)
- `dir="rtl"` افتراضي مع تبديل لغة يقلب الاتجاه
- Tailwind: خط عربي مناسب للقراءة الطويلة (Cairo أو IBM Plex Sans Arabic)

### 5. هيكل المجلدات
```
src/lib/orderStateMachine.ts   (هيكل فارغ + types — المنطق في مرحلة 4)
src/lib/audit.ts               (signature فقط)
src/lib/auth.ts                (signature فقط)
src/services/                  (فاضية — توثيق الغرض في README قصير)
```

### 6. Verification Plan — بوابة الانتقال للمرحلة 2
```bash
npx tsc --noEmit        # نظيف — إجباري في هذا المشروع (عكس قوالب Vite)
npm run lint            # نظيف
npm run build           # ينجح
npx prisma migrate status  # applied
```
يدوي:
- [ ] `npm run dev` يفتح صفحة البداية بالعربي RTL
- [ ] تبديل اللغة يقلب dir ويغير الخط
- [ ] `PROJECT_LOG.md` موجود ومحدث بكل قرارات المرحلة
- [ ] الـ schema في Prisma يطابق المواصفة حرفيًا (مراجعة بصرية جدول جدول)

### Commit Strategy
commit منفصل لكل خطوة رئيسية (0→5) برسائل توضح القرار، والـ PROJECT_LOG يتحدث داخل نفس الـ commit.
