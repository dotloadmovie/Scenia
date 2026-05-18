import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sketch = process.env.SKETCH_PATH ?? "examples/bouncing-ball";
const bundleSrc = path.join(repoRoot, sketch, "dist", "sketch.bundle.json");
const playerDir = path.join(repoRoot, "examples", "player");
const bundleDest = path.join(playerDir, "sketch.bundle.json");

if (!existsSync(bundleSrc)) {
  console.error("Missing bundle at " + bundleSrc + " — run build:bundle first.");
  process.exit(1);
}

mkdirSync(playerDir, { recursive: true });
copyFileSync(bundleSrc, bundleDest);
console.log("[stage-player] Copied " + bundleSrc + " -> " + bundleDest);
