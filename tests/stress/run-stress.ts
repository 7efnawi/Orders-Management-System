import { execSync } from "node:child_process";

const suites = [
  { name: "Financial Invariant Fuzzer", cmd: "npx tsx tests/stress/financial-fuzzer.test.ts" },
  { name: "Rush Hour Concurrency Simulation", cmd: "npx tsx tests/stress/concurrency.test.ts" },
  { name: "NFR Performance Benchmarks", cmd: "npx tsx tests/stress/performance.test.ts" },
];

console.log("================================================================================");
console.log("⚡ ORDER CONTROL SYSTEM — STRESS, FUZZING & PERFORMANCE TEST RUNNER");
console.log("================================================================================\n");

const startTime = performance.now();

try {
  for (const s of suites) {
    console.log(`▶ Running ${s.name}...`);
    execSync(s.cmd, { stdio: "inherit" });
    console.log();
  }
  const totalMs = Math.round(performance.now() - startTime);
  console.log("================================================================================");
  console.log(`🎉 ALL STRESS, FUZZING & PERFORMANCE SUITES PASSED 100% (${totalMs}ms)!`);
  console.log("================================================================================\n");
} catch (err) {
  console.error("\n❌ Stress test runner failed:", err);
  process.exit(1);
}
