# Security Policy

## Supported versions

This minilab is educational and is not regularly maintained. The `main` branch is the only supported line.

## Reporting a concern

Email **hello@skilleddragon.com**. This repository is not a vulnerability bounty program.

## Secret handling

- Secrets come from environment variables only (`process.env` / local `.env`, GitHub Actions secrets in CI).
- Never commit `.env`, keys, tokens, or credentials.
- `.env.example` lists variable names with empty values.
- CI and local gate runs set `E2E_TELEMETRY_DISABLED=1` (and `DO_NOT_TRACK=1`) so the e2e CLI sends no usage telemetry.

## Tools

| Tool | Version / command |
| --- | --- |
| gitleaks | **v8.30.1** (pre-commit hook + CI binary with SHA256 verify) |
| Dependency audit | `bun audit --audit-level=high` |

## Upstream

| Item | Value |
| --- | --- |
| Repository | https://github.com/tester-army/e2e |
| Pin | `292cd0597c57b4929ad53919f0e4fe40ad87e095` |
| License | Apache-2.0 |
| Lab package | `@e2e-dev/web@0.14.0` + `e2e@0.20.0` |
