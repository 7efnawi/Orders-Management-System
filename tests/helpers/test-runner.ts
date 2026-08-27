/**
 * E2E Test Suite Runner & Reporter
 * Provides test structuring, assertion helpers, and formatted test reports.
 */

export interface TestResult {
  name: string;
  feature: string;
  tier: number;
  passed: boolean;
  durationMs: number;
  error?: Error | string;
}

export interface TestSuiteSummary {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export class TestRunner {
  private suiteName: string;
  private results: TestResult[] = [];
  private currentFeature: string = "General";
  private currentTier: number = 1;

  constructor(suiteName: string) {
    this.suiteName = suiteName;
  }

  setContext(feature: string, tier: number) {
    this.currentFeature = feature;
    this.currentTier = tier;
  }

  async test(name: string, fn: () => void | Promise<void>): Promise<boolean> {
    const start = performance.now();
    try {
      await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      this.results.push({
        name,
        feature: this.currentFeature,
        tier: this.currentTier,
        passed: true,
        durationMs,
      });
      console.log(`  ✓ [T${this.currentTier}][${this.currentFeature}] ${name} (${durationMs}ms)`);
      return true;
    } catch (err: unknown) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.results.push({
        name,
        feature: this.currentFeature,
        tier: this.currentTier,
        passed: false,
        durationMs,
        error: errorObj.message,
      });
      console.error(`  ✗ [T${this.currentTier}][${this.currentFeature}] ${name} (${durationMs}ms)`);
      console.error(`    Error: ${errorObj.message}`);
      if (errorObj.stack) {
        console.error(`    ${errorObj.stack.split("\n").slice(1, 3).join("\n    ")}`);
      }
      return false;
    }
  }

  getSummary(): TestSuiteSummary {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      suiteName: this.suiteName,
      total: this.results.length,
      passed,
      failed,
      durationMs: Math.round(durationMs * 100) / 100,
      results: this.results,
    };
  }

  printSummaryReport(): void {
    const summary = this.getSummary();
    console.log("\n" + "=".repeat(80));
    console.log(`📊 TEST SUITE SUMMARY: ${summary.suiteName}`);
    console.log("=".repeat(80));
    console.log(`  Total Tests : ${summary.total}`);
    console.log(`  Passed      : ${summary.passed} ✅`);
    console.log(`  Failed      : ${summary.failed} ${summary.failed > 0 ? "❌" : "✨"}`);
    console.log(`  Duration    : ${summary.durationMs}ms`);
    console.log("=".repeat(80) + "\n");
  }
}
