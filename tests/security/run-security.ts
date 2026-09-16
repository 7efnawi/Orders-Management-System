import { execSync } from "node:child_process";

const suites = [
  { name: "RBAC Penetration Testing", cmd: "npx tsx tests/security/rbac-penetration.test.ts" },
  { name: "Immutability & No-Hard-Delete", cmd: "npx tsx tests/security/immutability.test.ts" },
];

console.log("================================================================================");
console.log("🛡️  ORDER CONTROL SYSTEM — API SECURITY & IMMUTABILITY TEST RUNNER");
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
  console.log(`🎉 ALL API SECURITY & IMMUTABILITY SUITES PASSED 100% (${totalMs}ms)!`);
  console.log("================================================================================\n");
} catch (err) {
  console.error("\n❌ Security test runner failed:", err);
  process.exit(1);
}
