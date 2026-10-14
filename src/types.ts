export type GateStepResult = {
  name: string;
  status: "passed" | "failed" | "skipped";
  detail?: string;
};

export type GateReport = {
  schemaVersion: 1;
  tool: "e2e-merge-gate";
  startedAt: string;
  finishedAt: string;
  appDir: string;
  baseUrl: string;
  exitCode: 0 | 1 | 2;
  outcome: "pass" | "fail" | "infra";
  steps: GateStepResult[];
  e2eSummary?: {
    passed: number;
    failed: number;
    skipped: number;
  };
  error?: string;
};

export const GATE_REPORT_SCHEMA_VERSION = 1 as const;
