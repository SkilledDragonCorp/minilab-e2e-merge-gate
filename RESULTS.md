# RESULTS

Filled from green CI on `main` at SHA `08d73fd319411a1b614e75829221fbc5d3d4f03a`.

| Check | Result | Count / notes | Duration | CI |
| --- | --- | --- | --- | --- |
| `bun test tests` | pass | 6 tests / 15 expects (local + CI) | ~1m13s (CI test job) | [ci #38503888691](https://github.com/SkilledDragonCorp/minilab-e2e-merge-gate/actions/runs/38503888691) |
| `bun run lint` | pass | Biome check | 13s | same |
| `bun run check:skills` | pass | `e2e-merge-gate` frontmatter | 8s | same |
| gitleaks v8.30.1 | pass | `gitleaks git --redact --verbose .` | 6s | same |
| `bun audit --audit-level=high` | pass | 0 high/critical (1 moderate below level) | 9s | same |
| upstream pin | pass | `292cd0597c57b4929ad53919f0e4fe40ad87e095` | — | same |
| upstream-ci check | pass | lint, dead-code, typecheck, docs, peers, install-scripts, babysit, browsers, testbed | 2m2s | [upstream-ci #38503888662](https://github.com/SkilledDragonCorp/minilab-e2e-merge-gate/actions/runs/38503888662) |
| upstream-ci test | pass | Node matrix 22 / 24 / 26 / 22.22.3 / 24.8.0 | 5m–7m18s | same |
| upstream-ci install | pass | pnpm 11 + 12 smoke | 43–45s | same |
| upstream-ci spec gate | pass | needs check+test+install | 3s | same |

CI run URLs:

- Lab: https://github.com/SkilledDragonCorp/minilab-e2e-merge-gate/actions/runs/38503888691
- Upstream: https://github.com/SkilledDragonCorp/minilab-e2e-merge-gate/actions/runs/38503888662

Upstream SHA: `292cd0597c57b4929ad53919f0e4fe40ad87e095`

Upstream steps that could not run: none (all jobs green after A4 `package_json_file: upstream/package.json`).
