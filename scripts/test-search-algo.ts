import assert from "node:assert";

export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Remove tatweel
    .replace(/\u0640/g, "")
    // Normalize Alefs
    .replace(/[أإآٱ]/g, "ا")
    // Normalize Taa Marbuta
    .replace(/ة/g, "ه")
    // Normalize Yaa / Alif Maqsura
    .replace(/[ىي]/g, "ي")
    // Normalize Hamza
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}

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

  // Every token must match somewhere in the candidate string or collapsed string
  return tokens.every(
    (token) =>
      normalizedCandidate.includes(token) ||
      collapsedCandidate.includes(token.replace(/\s+/g, ""))
  );
}

async function testSearchAlgorithm() {
  console.log("▶ Testing Multi-Token Fast Search & Normalization Algorithm...");

  // Test 1: Arabic Normalization
  assert.strictEqual(normalizeArabic("أحمد"), "احمد");
  assert.strictEqual(normalizeArabic("إبراهيم"), "ابراهيم");
  assert.strictEqual(normalizeArabic("آية"), "ايه");
  assert.strictEqual(normalizeArabic("مدينة نصر"), "مدينه نصر");
  assert.strictEqual(normalizeArabic("شَاطِئ"), "شاطي");
  console.log("✔ Arabic character normalization works correctly.");

  // Test 2: Multi-token search for delivery zone (Name + Fee)
  const zone = { name: "مدينة نصر - المنطقة الأولى", fee: 50 };
  assert.ok(matchesMultiToken("مدينة 50", [zone.name, zone.fee]), "Should match 'مدينة 50'");
  assert.ok(matchesMultiToken("50 نصر", [zone.name, zone.fee]), "Should match in any token order");
  assert.ok(matchesMultiToken("مدينه", [zone.name, zone.fee]), "Should match with taa marbuta variation");
  assert.ok(!matchesMultiToken("المعادي", [zone.name, zone.fee]), "Should not match different area");
  console.log("✔ Multi-token zone search works accurately.");

  // Test 3: Multi-token search for driver (Name + Fleet Type)
  const driver = { name: "أحمد عبد الله", type: "APP", typeAr: "تطبيق (شركة)" };
  assert.ok(matchesMultiToken("احمد تطبيق", [driver.name, driver.type, driver.typeAr]));
  assert.ok(matchesMultiToken("عبدالله", [driver.name, driver.type]), "Should match collapsed compound name عبدالله vs عبد الله");
  assert.ok(!matchesMultiToken("محمود", [driver.name, driver.type]));
  console.log("✔ Driver multi-token search works accurately.");

  console.log("🎉 Search Algorithm tests PASSED 100%!");
}

testSearchAlgorithm().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
