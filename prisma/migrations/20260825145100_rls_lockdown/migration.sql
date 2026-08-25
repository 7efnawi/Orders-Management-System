-- RLS Lockdown: قفل الوصول عبر Supabase Data API (anon key)
-- التطبيق يتصل بـ postgres owner مباشرة فلا يتأثر بـ RLS.
-- سياسات القراءة/الكتابة تُضاف في Phase 2 فقط لو احتجنا الوصول عبر Supabase APIs.

ALTER TABLE IF EXISTS "public"."User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Brand"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Platform"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DeliveryZone"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DeliveryDriver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Category"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Product"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."ExpenseType"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Customer"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Order"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."OrderItem"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Expense"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."Shift"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."DailyClosing"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."AuditLog"      ENABLE ROW LEVEL SECURITY;

-- Deny-all افتراضي: لا سياسات = لا صفوف تعود لغير الـ owner
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
