import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { STANDARD_PLATFORM_NAMES, STANDARD_BRAND_NAMES } from "../src/lib/reports";

async function cleanupTestPlatformsAndBrands() {
  console.log("🧹 Starting test platforms and brands cleanup...");

  // 1. Ensure all standard platforms exist and are active
  const standardPlatformsMap = new Map<string, string>();
  for (const name of STANDARD_PLATFORM_NAMES) {
    const p = await prisma.platform.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    standardPlatformsMap.set(name, p.id);
    console.log(`  ✓ Canonical platform ensured: ${name} (${p.id})`);
  }

  // 2. Ensure all standard brands exist and are active
  const standardBrandsMap = new Map<string, string>();
  for (const name of STANDARD_BRAND_NAMES) {
    const b = await prisma.brand.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    standardBrandsMap.set(name, b.id);
    console.log(`  ✓ Canonical brand ensured: ${name} (${b.id})`);
  }

  const elmenusId = standardPlatformsMap.get("Elmenus")!;
  const talabatId = standardPlatformsMap.get("Talabat")!;
  const phoneId = standardPlatformsMap.get("Phone")!;
  const flowerId = standardBrandsMap.get("Flower")!;

  // 3. Process all platforms
  const allPlatforms = await prisma.platform.findMany();
  for (const plat of allPlatforms) {
    if ((STANDARD_PLATFORM_NAMES as readonly string[]).includes(plat.name)) {
      continue; // Canonical platform
    }

    let targetPlatformId: string;
    let targetName: string;

    const lower = plat.name.toLowerCase();
    if (lower === "elmenus") {
      targetPlatformId = elmenusId;
      targetName = "Elmenus";
    } else if (lower.includes("talabat")) {
      targetPlatformId = talabatId;
      targetName = "Talabat";
    } else {
      targetPlatformId = phoneId;
      targetName = "Phone";
    }

    const orderCount = await prisma.order.count({ where: { platformId: plat.id } });
    if (orderCount > 0) {
      await prisma.order.updateMany({
        where: { platformId: plat.id },
        data: { platformId: targetPlatformId },
      });
      console.log(`  → Migrated ${orderCount} orders from "${plat.name}" to canonical "${targetName}".`);
    }

    try {
      await prisma.platform.delete({ where: { id: plat.id } });
      console.log(`  🗑️ Deleted non-canonical platform: "${plat.name}"`);
    } catch {
      await prisma.platform.update({
        where: { id: plat.id },
        data: { isActive: false },
      });
      console.log(`  🔒 Deactivated non-canonical platform: "${plat.name}"`);
    }
  }

  // 4. Process all brands
  const allBrands = await prisma.brand.findMany();
  for (const br of allBrands) {
    if ((STANDARD_BRAND_NAMES as readonly string[]).includes(br.name)) {
      continue; // Canonical brand
    }

    let targetBrandId: string;
    let targetName: string;

    const matchedStandard = STANDARD_BRAND_NAMES.find(
      (s) => s.toLowerCase() === br.name.toLowerCase()
    );

    if (matchedStandard) {
      targetBrandId = standardBrandsMap.get(matchedStandard)!;
      targetName = matchedStandard;
    } else {
      targetBrandId = flowerId;
      targetName = "Flower";
    }

    const orderCount = await prisma.order.count({ where: { brandId: br.id } });
    if (orderCount > 0) {
      await prisma.order.updateMany({
        where: { brandId: br.id },
        data: { brandId: targetBrandId },
      });
      console.log(`  → Migrated ${orderCount} orders from brand "${br.name}" to canonical "${targetName}".`);
    }

    // Migrate categories if any
    const catCount = await prisma.category.count({ where: { brandId: br.id } });
    if (catCount > 0) {
      await prisma.category.updateMany({
        where: { brandId: br.id },
        data: { brandId: targetBrandId },
      });
      console.log(`  → Migrated ${catCount} categories from brand "${br.name}" to canonical "${targetName}".`);
    }

    try {
      await prisma.brand.delete({ where: { id: br.id } });
      console.log(`  🗑️ Deleted non-canonical brand: "${br.name}"`);
    } catch {
      await prisma.brand.update({
        where: { id: br.id },
        data: { isActive: false },
      });
      console.log(`  🔒 Deactivated non-canonical brand: "${br.name}"`);
    }
  }

  console.log("✨ Cleanup completed successfully!");
}

cleanupTestPlatformsAndBrands()
  .catch((err) => {
    console.error("❌ Error during cleanup:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
