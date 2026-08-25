# src/services/

طبقة الخدمات — **المدخل الوحيد لأي كتابة على قاعدة البيانات** (Directives §2 و§3).

- كل عملية Create/Update/Cancel على `Order` تمر من هنا
- كل دالة بتستدعي `audit()` من `src/lib/audit.ts` داخل نفس الـ transaction
- ممنوع أي استدعاء Prisma مباشر من صفحات أو API routes على الجداول الحساسة (Order, AuditLog)
- الحسابات المالية (netCash، شروط الخصم، تصفير deliveryFee) تعيش في `src/lib/` وتُستدعى من هنا

الملفات المخططة:
- `orders.ts` — createOrder / transitionStatus / cancelOrder / applyDiscount (Phase 4)
- `closing.ts` calculations live in `src/lib/closing.ts` (Phase 7)
