#!/usr/bin/env bun
/**
 * Diffs lab-authored upstream-ci run: lines against ci/upstream/spec.yml.
 * Allowed deviations: runs-on ubuntu-24.04, submodules: true on checkout,
 * working-directory: upstream on run steps, cache-dependency-path on setup-node.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(import.meta.dir, "..");
const PIN = "292cd0597c57b4929ad53919f0e4fe40ad87e095";

type Step = { name?: string; run?: string; uses?: string; with?: Record<string, unknown> };
type Job = { steps?: Step[]; "runs-on"?: string; needs?: string[]; name?: string };
type Workflow = { jobs?: Record<string, Job>; env?: Record<string, string> };

function normalizeRun(run: string): string {
  return run
    .replaceAll("${{ matrix.node }}", "MATRIX_NODE")
    .replaceAll("${{ matrix.pnpm }}", "MATRIX_PNPM")
    .trimEnd();
}

async function main(): Promise<void> {
  const upstreamText = await readFile(join(root, "ci", "upstream", "spec.yml"), "utf8");
  const labText = await readFile(join(root, ".github", "workflows", "upstream-ci.yml"), "utf8");
  const upstream = parseYaml(upstreamText) as Workflow;
  const lab = parseYaml(labText) as Workflow;

  if (lab.env?.E2E_TELEMETRY_DISABLED !== "1" && lab.env?.E2E_TELEMETRY_DISABLED !== "'1'") {
    // YAML may parse '1' as string 1
    if (String(lab.env?.E2E_TELEMETRY_DISABLED) !== "1") {
      throw new Error("upstream-ci.yml must set E2E_TELEMETRY_DISABLED: '1'");
    }
  }

  const errors: string[] = [];
  for (const jobName of ["check", "test", "install", "gate"] as const) {
    const uJob = upstream.jobs?.[jobName];
    const lJob = lab.jobs?.[jobName];
    if (!uJob || !lJob) {
      errors.push(`missing job ${jobName}`);
      continue;
    }
    if (lJob["runs-on"] !== "ubuntu-24.04") {
      errors.push(`${jobName}: runs-on must be ubuntu-24.04 (A1)`);
    }
    const uRuns = (uJob.steps ?? []).filter((s) => s.run).map((s) => normalizeRun(s.run ?? ""));
    const lRuns = (lJob.steps ?? []).filter((s) => s.run).map((s) => normalizeRun(s.run ?? ""));
    if (uRuns.length !== lRuns.length) {
      errors.push(`${jobName}: run step count ${lRuns.length} != upstream ${uRuns.length}`);
    } else {
      for (let i = 0; i < uRuns.length; i++) {
        if (uRuns[i] !== lRuns[i]) {
          errors.push(`${jobName}: run step ${i} differs from upstream`);
          errors.push(`  upstream: ${uRuns[i]?.slice(0, 120)}`);
          errors.push(`  lab:      ${lRuns[i]?.slice(0, 120)}`);
        }
      }
    }
  }

  if (lab.jobs?.gate?.needs?.join(",") !== "check,test,install") {
    errors.push("gate.needs must stay [check, test, install] (A3)");
  }

  // Pin reminder in workflow comments / env is optional; verify submodule script exists in ci.yml separately.
  const pinMention =
    labText.includes(PIN) ||
    (await readFile(join(root, ".github", "workflows", "ci.yml"), "utf8")).includes(PIN);
  if (!pinMention) {
    errors.push(`CI must mention upstream pin ${PIN}`);
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log("upstream-parity ok");
}

await main();
