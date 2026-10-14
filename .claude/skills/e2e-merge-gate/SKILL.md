---
name: e2e-merge-gate
description: Fail-closed e2e merge gate — run checkout flow against a UI change before merge.
---

# e2e-merge-gate

After any UI change that can break a user flow, run the merge gate before merging.

## When to use

- An agent edited HTML, CSS, client TypeScript, or a checkout / auth / cart screen
- A PR claims a UI flow still works
- You need a machine-readable report attached to the PR

## Command

```bash
export E2E_TELEMETRY_DISABLED=1
bun run gate --app <path>
```

Examples:

```bash
bun run gate --app fixtures/app
bun run gate --app fixtures/app-broken
bun run gate --app path/to/ui-under-test
```

## Exit codes (fail closed)

| Code | Meaning | Merge? |
| --- | --- | --- |
| 0 | All e2e steps passed | Allowed |
| 1 | One or more e2e steps failed | Never merge |
| 2 | Infrastructure failure (browser missing, server down) | Never merge |

## Report

The gate always writes `reports/gate-report.json` under the repo root. Attach that file to the PR. Do not merge on exit 1 or 2.

## Notes

- Locator-only `e2e/checkout.e2e.ts` needs no model API keys (replay / deterministic mode).
- Install Chromium once: `bun run browsers`
- Upstream Tester Army e2e is pinned under `./upstream` at `292cd0597c57b4929ad53919f0e4fe40ad87e095`.
