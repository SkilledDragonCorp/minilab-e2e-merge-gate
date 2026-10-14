import { mkdir, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { defaultReportPath, writeGateReport } from "./report";
import { startFixtureServer } from "./server";
import type { GateReport, GateStepResult } from "./types";

export type RunGateOptions = {
  appDir: string;
  cwd?: string;
  reportPath?: string;
  e2eConfigPath?: string;
};

export type RunGateResult = {
  exitCode: 0 | 1 | 2;
  report: GateReport;
  reportPath: string;
};

type E2EReportJson = {
  summary?: {
    passed?: number;
    failed?: number;
    skipped?: number;
  };
  tests?: Array<{
    title?: string;
    status?: string;
    error?: { message?: string };
  }>;
};

function chromiumMissing(stderr: string, stdout: string): boolean {
  const blob = `${stderr}\n${stdout}`.toLowerCase();
  return (
    blob.includes("executable doesn't exist") ||
    blob.includes("browsertype.launch") ||
    (blob.includes("chromium") && blob.includes("not found")) ||
    (blob.includes("please run") && blob.includes("install")) ||
    blob.includes("browser is not installed") ||
    blob.includes("browsers are not installed") ||
    blob.includes("failed to launch browser") ||
    process.env.PLAYWRIGHT_BROWSERS_PATH === "" ||
    (Boolean(process.env.PLAYWRIGHT_BROWSERS_PATH) &&
      blob.includes("playwright") &&
      (blob.includes("missing") || blob.includes("does not exist") || codeLooksLikeBrowser(blob)))
  );
}

function codeLooksLikeBrowser(blob: string): boolean {
  return blob.includes("browser") && (blob.includes("error") || blob.includes("failed"));
}

export async function runGate(options: RunGateOptions): Promise<RunGateResult> {
  const cwd = options.cwd ?? process.cwd();
  const appDir = resolve(cwd, options.appDir);
  const reportPath = options.reportPath ?? defaultReportPath(cwd);
  const startedAt = new Date().toISOString();
  const steps: GateStepResult[] = [];

  let baseUrl = "";
  let stop: (() => void) | undefined;

  const finish = async (
    exitCode: 0 | 1 | 2,
    outcome: GateReport["outcome"],
    error?: string,
    e2eSummary?: GateReport["e2eSummary"],
  ): Promise<RunGateResult> => {
    stop?.();
    const report: GateReport = {
      schemaVersion: 1,
      tool: "e2e-merge-gate",
      startedAt,
      finishedAt: new Date().toISOString(),
      appDir,
      baseUrl,
      exitCode,
      outcome,
      steps,
      e2eSummary,
      error,
    };
    await writeGateReport(report, reportPath);
    return { exitCode, report, reportPath };
  };

  try {
    const server = await startFixtureServer(appDir);
    stop = server.stop;
    baseUrl = server.baseUrl;
    steps.push({ name: "fixture-server", status: "passed", detail: baseUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    steps.push({ name: "fixture-server", status: "failed", detail: message });
    return finish(2, "infra", message);
  }

  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (browsersPath !== undefined && browsersPath !== "") {
    try {
      const entries = await readdir(browsersPath);
      if (entries.length === 0) {
        steps.push({
          name: "chromium",
          status: "failed",
          detail: `PLAYWRIGHT_BROWSERS_PATH is empty: ${browsersPath}`,
        });
        return finish(2, "infra", "Chromium is not installed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      steps.push({ name: "chromium", status: "failed", detail: message });
      return finish(2, "infra", "Chromium is not installed");
    }
  }

  const e2eOut = join(cwd, ".e2e", "gate-run");
  await mkdir(e2eOut, { recursive: true });

  const configPath = options.e2eConfigPath ?? join(cwd, "e2e.config.ts");
  const e2eBin = join(cwd, "node_modules", ".bin", "e2e");
  const proc = Bun.spawn(
    [
      e2eBin,
      "run",
      "e2e/checkout.e2e.ts",
      "--config",
      configPath,
      "--reporter",
      "json",
      "--output",
      e2eOut,
    ],
    {
      cwd,
      env: {
        ...process.env,
        E2E_TELEMETRY_DISABLED: "1",
        DO_NOT_TRACK: "1",
        E2E_APP_URL: baseUrl,
        CI: process.env.CI ?? "1",
      },
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;

  if (code !== 0 && chromiumMissing(stderr, stdout)) {
    steps.push({
      name: "chromium",
      status: "failed",
      detail: "Chromium browser binary missing or unreachable",
    });
    return finish(2, "infra", "Chromium is not installed", undefined);
  }

  let e2eReport: E2EReportJson | undefined;
  try {
    const raw = await Bun.file(join(e2eOut, "report.json")).text();
    e2eReport = JSON.parse(raw) as E2EReportJson;
  } catch {
    // fall through — use process exit
  }

  const passed = e2eReport?.summary?.passed ?? 0;
  const failed = e2eReport?.summary?.failed ?? (code === 0 ? 0 : 1);
  const skipped = e2eReport?.summary?.skipped ?? 0;

  if (e2eReport?.tests) {
    for (const t of e2eReport.tests) {
      const status =
        t.status === "passed" || t.status === "failed" || t.status === "skipped"
          ? t.status
          : code === 0
            ? "passed"
            : "failed";
      steps.push({
        name: t.title ?? "e2e-test",
        status,
        detail: t.error?.message,
      });
    }
  } else {
    steps.push({
      name: "e2e/checkout.e2e.ts",
      status: code === 0 ? "passed" : "failed",
      detail: code === 0 ? undefined : stderr.slice(0, 500) || stdout.slice(0, 500),
    });
  }

  if (code === 0 && failed === 0) {
    return finish(0, "pass", undefined, { passed, failed, skipped });
  }

  // Non-zero that is not browser-missing: fail closed on test failures.
  // Exit 2 from e2e CLI often means usage/infra; treat unknown infra signals as 2.
  if (code === 2 && failed === 0) {
    steps.push({ name: "e2e-runner", status: "failed", detail: stderr.slice(0, 500) });
    return finish(2, "infra", stderr.slice(0, 500) || "e2e exited 2", { passed, failed, skipped });
  }

  return finish(1, "fail", `e2e failed with exit ${code}`, { passed, failed, skipped });
}
