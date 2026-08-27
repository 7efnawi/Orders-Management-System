import { runTier1Tests } from "./tier1-feature-coverage.test";
import { runTier2Tests } from "./tier2-boundary-corner.test";
import { runTier3Tests } from "./tier3-cross-feature.test";
import { runTier4Tests } from "./tier4-real-world-scenarios.test";

async function runAllE2ETests() {
  console.log("================================================================================");
  console.log("🍣 SUSHI DARK KITCHEN ORDER CONTROL SYSTEM — COMPREHENSIVE E2E TEST SUITE");
  console.log("   Requirements R1-R6 | Features F1-F13 | Tiers 1-4 | Adversarial Hardening");
  console.log("================================================================================\n");

  const startTime = performance.now();

  console.log("▶ Running Tier 1: Feature Coverage (F1 through F13)...");
  const t1 = await runTier1Tests();

  console.log("\n▶ Running Tier 2: Boundary & Corner Cases (F1 through F13)...");
  const t2 = await runTier2Tests();

  console.log("\n▶ Running Tier 3: Cross-Feature Combinations (Pairwise Matrix)...");
  const t3 = await runTier3Tests();

  console.log("\n▶ Running Tier 4: Real-World Dark Kitchen Application Scenarios...");
  const t4 = await runTier4Tests();

  const totalDuration = Math.round((performance.now() - startTime) * 100) / 100;

  const s1 = t1.getSummary();
  const s2 = t2.getSummary();
  const s3 = t3.getSummary();
  const s4 = t4.getSummary();

  const totalTests = s1.total + s2.total + s3.total + s4.total;
  const totalPassed = s1.passed + s2.passed + s3.passed + s4.passed;
  const totalFailed = s1.failed + s2.failed + s3.failed + s4.failed;

  console.log("\n" + "=".repeat(80));
  console.log("🏆 OVERALL E2E TEST EXECUTION SUMMARY");
  console.log("=".repeat(80));
  console.log(`  Tier 1 (Feature Coverage)        : ${s1.passed}/${s1.total} Passed (${s1.durationMs}ms)`);
  console.log(`  Tier 2 (Boundary & Corner Cases) : ${s2.passed}/${s2.total} Passed (${s2.durationMs}ms)`);
  console.log(`  Tier 3 (Cross-Feature Matrix)    : ${s3.passed}/${s3.total} Passed (${s3.durationMs}ms)`);
  console.log(`  Tier 4 (Real-World Scenarios)    : ${s4.passed}/${s4.total} Passed (${s4.durationMs}ms)`);
  console.log("-".repeat(80));
  console.log(`  TOTAL TESTS EXECUTED            : ${totalTests}`);
  console.log(`  TOTAL PASSED                     : ${totalPassed} ✅`);
  console.log(`  TOTAL FAILED                     : ${totalFailed} ${totalFailed > 0 ? "❌" : "✨"}`);
  console.log(`  TOTAL RUNTIME                    : ${totalDuration}ms`);
  console.log("=".repeat(80));

  if (totalFailed > 0) {
    console.error(`\n❌ TEST SUITE FAILED: ${totalFailed} tests failed.`);
    process.exit(1);
  } else {
    console.log("\n🎉 ALL E2E REQUIREMENTS & ADVERSARIAL VERIFICATION TESTS PASSED 100%!");
    process.exit(0);
  }
}

runAllE2ETests().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});
