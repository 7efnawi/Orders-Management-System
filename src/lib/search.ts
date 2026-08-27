/**
 * خوارزمية تطبيع وبحث متقدمة للغة العربية واللاتينية (Directives §2)
 * تعالج التشكيل، همزات الألف، التاء المربوطة، الياء/الألف المقصورة، والأسماء المركبة
 */

export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    // إزالة التشكيل والتنوين
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // إزالة التطويل (الكشيدة)
    .replace(/\u0640/g, "")
    // توحيد الألف بكافة أشكالها (أ، إ، آ، ٱ) إلى (ا)
    .replace(/[أإآٱ]/g, "ا")
    // توحيد التاء المربوطة والهاء
    .replace(/ة/g, "ه")
    // توحيد الياء والألف المقصورة
    .replace(/[ىي]/g, "ي")
    // توحيد الهمزات المركبة
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}

/**
 * فحص مطابقة متعدد الكلمات (Multi-token match):
 * يتحقق من وجود كل كلمة في الاستعلام داخل أي جزء من الحقول المرشحة
 * بغض النظر عن الترتيب أو المسافات البينية
 */
export function matchesMultiToken(
  query: string,
  candidateStrings: (string | number | null | undefined)[]
): boolean {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return true;

  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const normalizedCandidate = candidateStrings
    .filter((s): s is string | number => s != null)
    .map((s) => normalizeArabic(String(s)))
    .join(" ");

  const collapsedCandidate = normalizedCandidate.replace(/\s+/g, "");

  // كل كلمة في الاستعلام يجب أن تطابق جزءاً من النص العادي أو النص المضغوط
  return tokens.every(
    (token) =>
      normalizedCandidate.includes(token) ||
      collapsedCandidate.includes(token.replace(/\s+/g, ""))
  );
}
