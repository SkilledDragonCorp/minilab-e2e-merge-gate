import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runGate } from "../src/gate";
import { isGateReport } from "../src/report";

const root = join(import.meta.dir, "..");
const tempDirs: string[] = [];

afterAll(async () => {
  await Promise.all(tempDirs.map((d) => rm(d, { recursive: true, force: true })));
});

async function scratchReportPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "gate-report-"));
  tempDirs.push(dir);
  return join(dir, "gate-report.json");
}

describe("e2e merge gate", () => {
  test("passes on fixtures/app", async () => {
    const reportPath = await scratchReportPath();
    const result = await runGate({
      cwd: root,
      appDir: "fixtures/app",
      reportPath,
    });
    expect(result.exitCode).toBe(0);
    expect(result.report.outcome).toBe("pass");
    expect(isGateReport(result.report)).toBe(true);
    const disk = JSON.parse(await Bun.file(reportPath).text());
    expect(isGateReport(disk)).toBe(true);
  }, 180_000);

  test("exits 1 on fixtures/app-broken", async () => {
    const reportPath = await scratchReportPath();
    const result = await runGate({
      cwd: root,
      appDir: "fixtures/app-broken",
      reportPath,
    });
    expect(result.exitCode).toBe(1);
    expect(result.report.outcome).toBe("fail");
    expect(isGateReport(result.report)).toBe(true);
  }, 180_000);

  test("exits 2 when chromium is not installed", async () => {
    const emptyBrowsers = await mkdtemp(join(tmpdir(), "empty-browsers-"));
    tempDirs.push(emptyBrowsers);
    const reportPath = await scratchReportPath();
    const prev = process.env.PLAYWRIGHT_BROWSERS_PATH;
    process.env.PLAYWRIGHT_BROWSERS_PATH = emptyBrowsers;
    try {
      const result = await runGate({
        cwd: root,
        appDir: "fixtures/app",
        reportPath,
      });
      expect(result.exitCode).toBe(2);
      expect(result.report.outcome).toBe("infra");
    } finally {
      if (prev === undefined) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
      else process.env.PLAYWRIGHT_BROWSERS_PATH = prev;
    }
  }, 180_000);
});
