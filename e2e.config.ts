import { web } from "@e2e-dev/web";
import type { E2EConfig } from "e2e";

const appUrl = process.env.E2E_APP_URL ?? "http://127.0.0.1:4173";

export default {
  tests: ["e2e/**/*.e2e.ts"],
  targets: [
    {
      name: "web",
      engine: web({ browser: "chromium" }),
      app: { url: appUrl },
    },
  ],
  workers: 1,
  retries: 0,
  output: ".e2e",
} satisfies E2EConfig;
