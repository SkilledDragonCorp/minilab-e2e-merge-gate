import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { GateReport } from "./types";
import { GATE_REPORT_SCHEMA_VERSION } from "./types";

export function reportsDir(cwd = process.cwd()): string {
  return join(cwd, "reports");
}

export function defaultReportPath(cwd = process.cwd()): string {
  return join(reportsDir(cwd), "gate-report.json");
}

export function isGateReport(value: unknown): value is GateReport {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    r.schemaVersion === GATE_REPORT_SCHEMA_VERSION &&
    r.tool === "e2e-merge-gate" &&
    typeof r.startedAt === "string" &&
    typeof r.finishedAt === "string" &&
    typeof r.appDir === "string" &&
    typeof r.baseUrl === "string" &&
    (r.exitCode === 0 || r.exitCode === 1 || r.exitCode === 2) &&
    (r.outcome === "pass" || r.outcome === "fail" || r.outcome === "infra") &&
    Array.isArray(r.steps)
  );
}

export async function writeGateReport(
  report: GateReport,
  path = defaultReportPath(),
): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}
