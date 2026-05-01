#!/usr/bin/env node
// Runs pa11y-ci against a freshly-spawned `vite preview` instance.
// pa11y-ci uses HTML CodeSniffer — a different rule engine from axe-core,
// which the Accessibility workflow's main job runs. Its purpose here is
// "second opinion" coverage at WCAG 2.2 AAA. The script always exits 0
// in CI (`PA11Y_ADVISORY=1`) so the workflow stays green even when
// pa11y reports findings; the findings are logged for triage.
//
// Locally (without PA11Y_ADVISORY) the script propagates pa11y-ci's
// exit code so `make test-pa11y` fails on findings — useful while
// hunting down real defects.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.env.PA11Y_PORT ?? 4175);
const HOST = "127.0.0.1";
const ORIGIN = `http://${HOST}:${PORT}`;
const ADVISORY = process.env.PA11Y_ADVISORY === "1";

function spawnWithLog(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: "inherit", ...opts });
  child.on("error", (err) => {
    console.error(`[run-pa11y] ${cmd} failed to start:`, err);
  });
  return child;
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status === 200 || res.status === 304) return;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

async function main() {
  const preview = spawnWithLog("npm", [
    "run",
    "preview",
    "--",
    "--host",
    HOST,
    "--port",
    String(PORT),
    "--strictPort",
  ]);

  let pa11yExitCode = 1;
  try {
    await waitForServer(ORIGIN);
    console.log(`[run-pa11y] Preview ready at ${ORIGIN} — running pa11y-ci`);

    const pa11y = spawn("npx", ["pa11y-ci", "--config", ".pa11yci.json"], {
      stdio: "inherit",
      env: { ...process.env, PA11Y_ORIGIN: ORIGIN },
    });

    pa11yExitCode = await new Promise((resolve, reject) => {
      pa11y.on("error", reject);
      pa11y.on("exit", (code) => resolve(code ?? 1));
    });
  } finally {
    preview.kill("SIGTERM");
    // Give it a moment to release the port for the next caller.
    await sleep(250);
  }

  if (pa11yExitCode !== 0) {
    console.log(
      `[run-pa11y] pa11y-ci reported findings (exit ${pa11yExitCode}).`,
    );
    if (ADVISORY) {
      console.log(
        `[run-pa11y] PA11Y_ADVISORY=1 — exiting 0 so CI stays green; review the findings above.`,
      );
      process.exit(0);
    }
  }
  process.exit(pa11yExitCode);
}

main().catch((err) => {
  console.error("[run-pa11y] failed:", err);
  process.exit(1);
});
