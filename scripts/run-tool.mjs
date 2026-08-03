import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { join } from "node:path";

const task = process.argv[2];
const projectRoot = realpathSync.native(process.cwd());
const tools = {
  dev: [["next", "dist", "bin", "next"], ["dev"]],
  build: [["next", "dist", "bin", "next"], ["build"]],
  start: [["next", "dist", "bin", "next"], ["start"]],
  lint: [["eslint", "bin", "eslint.js"], [".", "--max-warnings=0"]],
  typecheck: [["typescript", "bin", "tsc"], ["--noEmit"]],
};
const selected = tools[task];

if (!selected) {
  console.error("Usage: node scripts/run-tool.mjs <dev|build|start|lint|typecheck>");
  process.exit(1);
}

// Windows preserves the caller's path casing. Some build tools treat differently
// cased paths as separate modules, which can load React more than once.
const [binParts, defaultArgs] = selected;
const bin = join(projectRoot, "node_modules", ...binParts);
const result = spawnSync(
  process.execPath,
  [bin, ...defaultArgs, ...process.argv.slice(3)],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_DIST_DIR: task === "dev" ? ".next-dev" : ".next",
    },
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
