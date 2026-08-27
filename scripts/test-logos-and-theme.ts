import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

async function testLogosAndTheme() {
  console.log("▶ Testing Uploaded Logos & Streamlined Theme Settings...");

  // 1. Check public directory contains all uploaded brand logos
  const publicDir = path.join(process.cwd(), "public");
  assert.ok(fs.existsSync(path.join(publicDir, "Talabat_logo.svg")), "Talabat_logo.svg must exist in public");
  assert.ok(fs.existsSync(path.join(publicDir, "Elmenus_logo.svg")), "Elmenus_logo.svg must exist in public");
  assert.ok(fs.existsSync(path.join(publicDir, "instashop-logo.svg")), "instashop-logo.svg must exist in public");
  assert.ok(fs.existsSync(path.join(publicDir, "HurryApp_logo.jpeg")), "HurryApp_logo.jpeg must exist in public");
  console.log("✔ All uploaded logo files confirmed in /public directory.");

  // 2. Check globals.css does NOT contain .kitchen theme styles
  const cssPath = path.join(process.cwd(), "src", "app", "globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf8");
  assert.ok(!cssContent.includes(".kitchen {"), "globals.css must not have .kitchen theme definition");
  assert.ok(!cssContent.includes(".kitchen *"), "globals.css custom-variant dark must not include .kitchen *");
  console.log("✔ globals.css successfully cleaned of kitchen theme.");

  // 3. Check theme-switcher.tsx only includes light, dark, system
  const themeSwitcherPath = path.join(process.cwd(), "src", "components", "theme-switcher.tsx");
  const switcherContent = fs.readFileSync(themeSwitcherPath, "utf8");
  assert.ok(!switcherContent.includes('id: "kitchen"'), "theme-switcher must not have kitchen option");
  assert.ok(switcherContent.includes('id: "light"'), "theme-switcher must have light option");
  assert.ok(switcherContent.includes('id: "dark"'), "theme-switcher must have dark option");
  assert.ok(switcherContent.includes('id: "system"'), "theme-switcher must have system option");
  console.log("✔ theme-switcher.tsx streamlined to light/dark/system.");

  // 4. Check platform-logo.tsx references the uploaded files
  const platformLogoPath = path.join(process.cwd(), "src", "components", "ui", "platform-logo.tsx");
  const logoContent = fs.readFileSync(platformLogoPath, "utf8");
  assert.ok(logoContent.includes("Talabat_logo.svg"), "platform-logo must use Talabat_logo.svg");
  assert.ok(logoContent.includes("Elmenus_logo.svg"), "platform-logo must use Elmenus_logo.svg");
  assert.ok(logoContent.includes("instashop-logo.svg"), "platform-logo must use instashop-logo.svg");
  assert.ok(logoContent.includes("HurryApp_logo.jpeg"), "platform-logo must use HurryApp_logo.jpeg");
  console.log("✔ platform-logo.tsx uses uploaded assets.");

  console.log("🎉 Test Logos & Theme PASSED 100%!");
}

testLogosAndTheme().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
