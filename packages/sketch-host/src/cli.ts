#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import { buildSketchBundle } from "./bundle.js";
import { runScaffold } from "./scaffold.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");

interface SketchJson {
  assembly: {
    entry: string;
    config: string;
    target: string;
  };
  hooks?: {
    preCompile?: string;
  };
}

function findRepoRoot(from: string): string {
  let dir = from;
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    let parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error("Could not locate pnpm-workspace.yaml above " + from);
    }
    dir = parent;
  }
}

function readSketchManifest(sketchRoot: string): SketchJson {
  let manifestPath = path.join(sketchRoot, "sketch.json");
  if (!existsSync(manifestPath)) {
    throw new Error("Missing sketch.json at " + manifestPath);
  }
  return JSON.parse(readFileSync(manifestPath, "utf8")) as SketchJson;
}

function ensureSketchHostBuilt(): void {
  let marker = path.join(pkgRoot, "dist", "index.js");
  if (existsSync(marker)) {
    return;
  }
  let r = spawnSync("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], { cwd: pkgRoot, stdio: "inherit" });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function buildRuntimeJs(repoRoot: string): void {
  let r = spawnSync(
    "pnpm",
    ["--filter", "@as3-wasm-runtime/runtime-js", "build"],
    { cwd: repoRoot, stdio: "inherit" }
  );
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function runPreCompile(sketchRoot: string, cmd: string | undefined): void {
  if (cmd == null || cmd.length === 0) {
    return;
  }
  let r = spawnSync(cmd, { cwd: sketchRoot, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function compileAssembly(sketchRoot: string, manifest: SketchJson, extra: string[]): boolean {
  let { entry, config, target } = manifest.assembly;
  let args = ["exec", "asc", entry, "--config", config, "--target", target, ...extra];
  let r = spawnSync("pnpm", args, { cwd: sketchRoot, stdio: "inherit" });
  return r.status === 0;
}

function runAsc(sketchRoot: string, manifest: SketchJson, extra: string[]): void {
  if (!compileAssembly(sketchRoot, manifest, extra)) {
    process.exit(1);
  }
}

/**
 * AssemblyScript 0.28's `asc` does not support `--watch`. Re-run `asc` when sources change.
 * Wasm output updates are picked up by the Vite dev plugin in `vite.config.mts` (full reload).
 */
function startAssemblySourceWatcher(sketchRoot: string, manifest: SketchJson): () => void {
  let entryAbs = path.resolve(sketchRoot, manifest.assembly.entry);
  let entryDir = path.dirname(entryAbs);
  let asconfigAbs = path.resolve(sketchRoot, manifest.assembly.config);
  let watchPaths = [entryDir, asconfigAbs];
  let linkedRuntimeAs = path.join(
    sketchRoot,
    "node_modules",
    "@as3-wasm-runtime",
    "runtime-as",
    "assembly"
  );
  if (existsSync(linkedRuntimeAs)) {
    watchPaths.push(linkedRuntimeAs);
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let schedule = (): void => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      console.log("[as3-sketch] Recompiling AssemblyScript…");
      if (!compileAssembly(sketchRoot, manifest, [])) {
        console.error("[as3-sketch] asc failed; fix errors to update wasm.");
      }
    }, 150);
  };

  let watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
  });
  watcher.on("all", schedule);

  return () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
    }
    void watcher.close();
  };
}

/** `pnpm exec as3-sketch -- <args>` and `pnpm run sketch -- <args>` insert a leading `--`. */
function stripLeadingPassthroughDash(argv: string[]): string[] {
  if (argv[0] === "--") {
    return argv.slice(1);
  }
  return argv;
}

function printHelp(): void {
  console.log(`as3-sketch — shared Vite shell for AssemblyScript sketches

Usage:
  as3-sketch dev [sketch-directory] [-- ...vite-args]
  as3-sketch build [sketch-directory] [-- ...vite-args]
  as3-sketch bundle [sketch-directory]
  as3-sketch scaffold <slug> [--width <n>] [--height <n>] [--description <text>]

Examples:
  as3-sketch dev examples/bouncing-ball
  as3-sketch bundle examples/bouncing-ball
  as3-sketch scaffold particle-field --width 1280 --height 720
  pnpm --filter @as3-wasm-runtime/sketch-host exec -- as3-sketch dev .

Environment:
  SKETCH_ROOT   If set, absolute path to the sketch root (CLI sketch-directory is ignored).

Notes:
  sketch.json is the sketch manifest (wasm URL, canvas, assets, assembly paths).
  Optional host extension: sketch-directory/host/main.ts (see repository README).
  \`bundle\` compiles wasm and writes dist/sketch.bundle.json (portable JSON + base64).
  Run \`as3-sketch scaffold --help\` for scaffold details.
`);
}

function parseArgs(argv: string[]): { cmd: "dev" | "build"; sketchPath: string; viteArgs: string[] } {
  let dash = argv.indexOf("--");
  let ours = dash === -1 ? argv : argv.slice(0, dash);
  let viteArgs = dash === -1 ? [] : argv.slice(dash + 1);
  let cmd = ours[0];
  if (cmd !== "dev" && cmd !== "build") {
    printHelp();
    process.exit(cmd === undefined ? 0 : 1);
  }
  let sketchPath = ours.length >= 2 ? ours[1] : ".";
  return { cmd: cmd as "dev" | "build", sketchPath, viteArgs };
}

async function runBundle(sketchRoot: string): Promise<void> {
  ensureSketchHostBuilt();
  let manifest = readSketchManifest(sketchRoot);
  let repoRoot = findRepoRoot(sketchRoot);

  buildRuntimeJs(repoRoot);
  runPreCompile(sketchRoot, manifest.hooks?.preCompile);
  runAsc(sketchRoot, manifest, []);

  let outFile = buildSketchBundle(sketchRoot);
  console.log("[as3-sketch] Wrote " + outFile);
}

async function main(): Promise<void> {
  let argv = stripLeadingPassthroughDash(process.argv.slice(2));
  if (argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(0);
  }
  let head = argv[0];
  if (head === "bundle") {
    let sketchPath = argv.length >= 2 ? argv[1] : ".";
    let sketchRoot =
      process.env.SKETCH_ROOT != null && process.env.SKETCH_ROOT.length > 0
        ? path.resolve(process.env.SKETCH_ROOT)
        : path.resolve(process.cwd(), sketchPath);
    if (!existsSync(path.join(sketchRoot, "sketch.json"))) {
      console.error("No sketch.json in " + sketchRoot);
      process.exit(1);
    }
    try {
      await runBundle(sketchRoot);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }
  if (head === "scaffold") {
    try {
      runScaffold(process.cwd(), argv.slice(1));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  let { cmd, sketchPath, viteArgs } = parseArgs(argv);
  let sketchRoot =
    process.env.SKETCH_ROOT != null && process.env.SKETCH_ROOT.length > 0
      ? path.resolve(process.env.SKETCH_ROOT)
      : path.resolve(process.cwd(), sketchPath);
  if (!existsSync(path.join(sketchRoot, "sketch.json"))) {
    console.error("No sketch.json in " + sketchRoot);
    process.exit(1);
  }

  ensureSketchHostBuilt();

  let manifest = readSketchManifest(sketchRoot);
  let repoRoot = findRepoRoot(sketchRoot);

  buildRuntimeJs(repoRoot);
  runPreCompile(sketchRoot, manifest.hooks?.preCompile);

  let stopAssemblyWatcher: (() => void) | null = null;
  if (cmd === "dev") {
    runAsc(sketchRoot, manifest, []);
    stopAssemblyWatcher = startAssemblySourceWatcher(sketchRoot, manifest);
  } else {
    runAsc(sketchRoot, manifest, []);
  }

  let viteBinArgs = ["exec", "vite", "--config", path.join(pkgRoot, "vite.config.mts"), ...viteArgs];
  if (cmd === "build") {
    viteBinArgs.push("build");
  }

  let vite = spawn("pnpm", viteBinArgs, {
    cwd: pkgRoot,
    env: { ...process.env, SKETCH_ROOT: sketchRoot },
    stdio: "inherit"
  });

  await new Promise<void>((resolve, reject) => {
    vite.on("exit", (code, signal) => {
      if (stopAssemblyWatcher != null) {
        stopAssemblyWatcher();
      }
      if (signal === "SIGINT" || signal === "SIGTERM") {
        resolve();
      } else if (signal != null) {
        reject(new Error(String(signal)));
      } else if (code !== 0 && code != null) {
        reject(new Error("vite exited " + String(code)));
      } else {
        resolve();
      }
    });
    vite.on("error", reject);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
