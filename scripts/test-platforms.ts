import "dotenv/config";
import assert from "node:assert";
import { getPlatformToken, PLATFORM_TOKENS } from "../src/lib/visualTokens";
import { listPlatforms } from "../src/services/lookups";

async function testPlatforms() {
  console.log("▶ Testing Standard 6 Platforms & Visual Tokens...");

  // 1. Verify exact 6 platforms in tokens
  const keys = Object.keys(PLATFORM_TOKENS);
  console.log("Tokens keys:", keys);
  assert.strictEqual(keys.length, 6, "Must have exactly 6 platforms");
  assert.ok(keys.includes("talabat"), "Must include talabat");
  assert.ok(keys.includes("instashop"), "Must include instashop");
  assert.ok(keys.includes("harryapp"), "Must include harryapp");
  assert.ok(keys.includes("elmenus"), "Must include elmenus");
  assert.ok(keys.includes("facebook"), "Must include facebook");
  assert.ok(keys.includes("phone"), "Must include phone");

  // 2. Verify token resolution for English and Arabic names
  assert.strictEqual(getPlatformToken("Talabat").name, "Talabat");
  assert.strictEqual(getPlatformToken("طلبات").name, "Talabat");

  assert.strictEqual(getPlatformToken("InstaShop").name, "InstaShop");
  assert.strictEqual(getPlatformToken("إنستاشوب").name, "InstaShop");

  assert.strictEqual(getPlatformToken("Harry App").name, "HarryApp");
  assert.strictEqual(getPlatformToken("هاري آب").name, "HarryApp");

  assert.strictEqual(getPlatformToken("elmenus").name, "elmenus");
  assert.strictEqual(getPlatformToken("المنيوز").name, "elmenus");

  assert.strictEqual(getPlatformToken("Facebook").name, "Facebook");
  assert.strictEqual(getPlatformToken("فيسبوك").name, "Facebook");

  assert.strictEqual(getPlatformToken("Phone").name, "Phone");
  assert.strictEqual(getPlatformToken("تليفون مباشر").name, "Phone");

  console.log("✔ Token resolution passed for all 6 platforms.");

  // 3. Verify lookup service returns all 6 active platforms
  const dbPlatforms = await listPlatforms();
  console.log("DB Platforms:", dbPlatforms.map(p => p.name));
  const expectedNames = ["Talabat", "InstaShop", "Harry App", "Elmenus", "Facebook", "Phone"];
  for (const expected of expectedNames) {
    const found = dbPlatforms.find(p => p.name.toLowerCase() === expected.toLowerCase().replace(/\s+/g, "") || p.name.toLowerCase() === expected.toLowerCase());
    assert.ok(found, `Platform ${expected} must be returned by listPlatforms()`);
  }

  console.log("✔ listPlatforms() successfully seeded/retrieved all 6 standard platforms.");
  console.log("🎉 All 6 platform tests PASSED 100%!");
}

testPlatforms().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
