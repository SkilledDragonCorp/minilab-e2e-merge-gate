import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const PIN = "292cd0597c57b4929ad53919f0e4fe40ad87e095";
const root = join(import.meta.dir, "..");

describe("upstream pin", () => {
  test("upstream HEAD matches the Tester Army e2e pin", async () => {
    const proc = Bun.spawn(["git", "-C", join(root, "upstream"), "rev-parse", "HEAD"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const out = (await new Response(proc.stdout).text()).trim();
    const code = await proc.exited;
    expect(code).toBe(0);
    expect(out).toBe(PIN);
  });
});
