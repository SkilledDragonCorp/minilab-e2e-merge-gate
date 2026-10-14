import { describe, expect, test } from "bun:test";
import { isGateReport } from "../src/report";
import type { GateReport } from "../src/types";

describe("gate report schema", () => {
  test("accepts a valid report", () => {
    const report: GateReport = {
      schemaVersion: 1,
      tool: "e2e-merge-gate",
      startedAt: "2026-10-13T00:00:00.000Z",
      finishedAt: "2026-10-13T00:00:01.000Z",
      appDir: "/tmp/app",
      baseUrl: "http://127.0.0.1:1",
      exitCode: 0,
      outcome: "pass",
      steps: [{ name: "fixture-server", status: "passed" }],
    };
    expect(isGateReport(report)).toBe(true);
  });

  test("rejects invalid reports", () => {
    expect(isGateReport(null)).toBe(false);
    expect(isGateReport({ schemaVersion: 2 })).toBe(false);
    expect(
      isGateReport({
        schemaVersion: 1,
        tool: "other",
        startedAt: "",
        finishedAt: "",
        appDir: "",
        baseUrl: "",
        exitCode: 0,
        outcome: "pass",
        steps: [],
      }),
    ).toBe(false);
  });
});
