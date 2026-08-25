# Order Control System — نظام إدارة الطلبات

نظام ويب لإدارة طلبات dark kitchen سوشي (4 براندات × 5 منصات) — بديل متكامل لـ Google Sheets: إدخال أوردرات، تتبع توصيل، مصاريف، إغلاق يومي، وتقارير — مع Audit Log كامل وسياسة No-Hard-Delete.

## التشغيل المحلي

```bash
npm install
cp .env.example .env      # وعبّي القيم من Supabase Dashboard
npm run dev               # http://localhost:3000
```

## الأوامر

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | سيرفر التطوير |
| `npm run build` / `npm start` | بناء وتشغيل الإنتاج |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript — **إجباري قبل أي commit** |
| `npx prisma migrate dev` | تطبيق تغييرات الـ schema (عبر `DIRECT_URL`) |

## المتغيرات البيئية (`.env`)

- `DATABASE_URL` — اتصال الـ Runtime (Transaction Pooler `:6543`)
- `DIRECT_URL` — اتصال الـ Migrations (`:5432`)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Auth
- `OWNER_EMAIL` — إيميل أول Owner (bootstrap)

## القواعد الملزمة

اقرأ [`ENGINEERING_DIRECTIVES.md`](./ENGINEERING_DIRECTIVES.md) قبل أول سطر كود — أهمها:

1. **`PROJECT_LOG.md`** يتحدث لحظيًا مع أي schema/قرار/ميزة (ADR مبسّط)
2. منطق الأعمال في `src/lib/` + `src/services/` فقط — لا شيء في الـ UI
3. كل كتابة على `Order` تمر بطبقة الخدمات وتسجل Audit تلقائيًا
4. **ممنوع الحذف النهائي** — إلغاء بسبب إجباري فقط
5. التحقق من الصلاحيات في الـ API (`requireRole`)، مش في الـ UI بس

## التوثيق

- المواصفة الوظيفية: [`docs/SRS.md`](./docs/SRS.md)
- حالات الاستخدام: [`docs/USE_CASES.md`](./docs/USE_CASES.md)
- مخطط البيانات المعتمد: [`docs/specs/2026-08-25-data-model-design.md`](./docs/specs/2026-08-25-data-model-design.md)
- خطط التنفيذ: [`docs/plans/`](./docs/plans/)
