#!/usr/bin/env bun
import { resolve } from "node:path";
import { runGate } from "./gate";

function printHelp(): void {
  console.log(`e2e-merge-gate — fail-closed merge gate for agent UI changes

Usage:
  bun run gate --app <dir>

Options:
  --app <dir>     Fixture or app directory to serve (required)
  --help          Show this help

Exit codes:
  0  all e2e steps passed
  1  one or more e2e steps failed (do not merge)
  2  infrastructure failure (browser missing, server down)

Always writes reports/gate-report.json (under the current working directory).
Telemetry is disabled via E2E_TELEMETRY_DISABLED=1.
`);
}

function parseArgs(argv: string[]): { app?: string; help: boolean } {
  let app: string | undefined;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") help = true;
    else if (a === "--app") {
      app = argv[++i];
    } else if (a?.startsWith("--app=")) {
      app = a.slice("--app=".length);
    }
  }
  return { app, help };
}

async function main(): Promise<void> {
  if (argv0IsHelp(process.argv.slice(2))) {
    printHelp();
    process.exit(0);
  }
  const { app, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    process.exit(0);
  }
  if (!app) {
    console.error("error: --app <dir> is required");
    printHelp();
    process.exit(2);
  }

  const result = await runGate({ appDir: resolve(app) });
  console.log(`gate report: ${result.reportPath}`);
  console.log(`outcome: ${result.report.outcome} (exit ${result.exitCode})`);
  process.exit(result.exitCode);
}

function argv0IsHelp(argv: string[]): boolean {
  return argv.length === 0 || argv.includes("--help") || argv.includes("-h");
}

await main();
