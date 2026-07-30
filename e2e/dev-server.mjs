// Boots `next dev` with the safe test environment from test-env.mjs.
//
// Used by playwright.config.ts as its `webServer`, and runnable on its own
// (`npm run e2e:server`) when you want to click through the flow by hand.
import { spawn } from "node:child_process";
import { PORT, REPO_ROOT, serverEnv } from "./test-env.mjs";

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev", "-p", String(PORT)],
  { cwd: REPO_ROOT, env: serverEnv(), stdio: "inherit", shell: process.platform === "win32" },
);

const stop = () => { child.kill(); process.exit(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", (code) => process.exit(code ?? 0));
