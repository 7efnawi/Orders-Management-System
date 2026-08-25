# PROJECT_LOG.md — Order Control System

> Architecture Decision Record مبسّط — يتحدث **في نفس اللحظة** مع أي تغيير (Directives §0).
> الإدخال الجديد فوق، والأقدم تحت.

---

## Open Questions
| السؤال | الحالة | مؤثر على |
|---|---|---|
| هيكل المنيو / Variants (عينات الرسيتات) | ⏳ منتظرين العميل | Product / OrderItem |
| القائمة النهائية للمنصات | ⏳ العيل يظبطها من UI | Platform seed |

---

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
