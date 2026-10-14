import { join } from "node:path";

export type FixtureServer = {
  port: number;
  baseUrl: string;
  stop: () => void;
};

async function transpileClient(appDir: string): Promise<string> {
  const entry = join(appDir, "app.ts");
  const result = await Bun.build({
    entrypoints: [entry],
    target: "browser",
    minify: false,
  });
  if (!result.success) {
    const message = result.logs.map((l) => String(l)).join("\n");
    throw new Error(`Failed to transpile fixture client: ${message}`);
  }
  const output = result.outputs[0];
  if (!output) throw new Error("Fixture client build produced no output");
  return output.text();
}

export async function startFixtureServer(appDir: string, port = 0): Promise<FixtureServer> {
  const indexHtml = await Bun.file(join(appDir, "index.html")).text();
  const clientJs = await transpileClient(appDir);

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(indexHtml, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      if (url.pathname === "/app.ts" || url.pathname === "/app.js") {
        return new Response(clientJs, {
          headers: { "Content-Type": "application/javascript; charset=utf-8" },
        });
      }
      if (url.pathname === "/health") {
        return Response.json({ ok: true });
      }
      return new Response("Not found", { status: 404 });
    },
  });

  const portNumber = server.port;
  if (typeof portNumber !== "number") {
    server.stop(true);
    throw new Error("Fixture server did not bind a port");
  }
  const baseUrl = `http://127.0.0.1:${portNumber}`;
  const ready = await waitForUrl(`${baseUrl}/health`, 10_000);
  if (!ready) {
    server.stop(true);
    throw new Error(`Fixture server did not become ready at ${baseUrl}`);
  }

  return {
    port: portNumber,
    baseUrl,
    stop: () => server.stop(true),
  };
}

async function waitForUrl(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await Bun.sleep(50);
  }
  return false;
}
