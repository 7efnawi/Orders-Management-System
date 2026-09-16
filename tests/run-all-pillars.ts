import { execSync } from "node:child_process";

const pillars = [
  {
    name: "Pillar 1: Logic & State Transitions (Tier 1-4)",
    cmd: "npm run test:e2e",
  },
  {
    name: "Pillar 2: API Security & RBAC Penetration",
    cmd: "npm run test:security",
  },
  {
    name: "Pillar 3 & 4: Financial Invariant Fuzzing, Concurrency & Performance",
    cmd: "npm run test:stress",
  },
  {
    name: "Pillar 5: Real Browser E2E & Tablet Responsiveness",
    cmd: "npm run test:pw:tablet",
  },
];

console.log("================================================================================");
console.log("🏆 ORDER CONTROL SYSTEM — FULL 5-PILLAR QUALITY GATE RUNNER");
console.log("   Zero Business Logic in UI | Native Excel | 100% Delivery | Strict RBAC");
console.log("================================================================================\n");

const overallStart = performance.now();
const results: { name: string; durationMs: number; success: boolean }[] = [];

for (const p of pillars) {
  console.log(`\n▶ Executing ${p.name}...`);
  const start = performance.now();
  try {
    execSync(p.cmd, { stdio: "inherit" });
    const durationMs = Math.round(performance.now() - start);
    results.push({ name: p.name, durationMs, success: true });
    console.log(`✅ ${p.name} completed successfully (${durationMs}ms)\n`);
  } catch {
    const durationMs = Math.round(performance.now() - start);
    results.push({ name: p.name, durationMs, success: false });
    console.error(`\n❌ ${p.name} failed (${durationMs}ms)`);
    process.exit(1);
  }
}

const totalDurationMs = Math.round(performance.now() - overallStart);

console.log("\n" + "=".repeat(80));
console.log("🌟 SUPREME 5-PILLAR VERIFICATION SUMMARY");
console.log("=".repeat(80));
for (const r of results) {
  console.log(`  ${r.success ? "✅" : "❌"} ${r.name.padEnd(65)} (${r.durationMs}ms)`);
}
console.log("-".repeat(80));
console.log(`  TOTAL TEST DURATION: ${totalDurationMs}ms`);
console.log("=".repeat(80));
console.log("\n🎉 ALL 5 PILLARS PASSED 100%! SYSTEM PRODUCTION-READY.\n");
