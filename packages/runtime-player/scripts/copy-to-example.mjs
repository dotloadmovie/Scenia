import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(pkgRoot, "../..");
const destDir = path.join(repoRoot, "examples", "player");
const src = path.join(pkgRoot, "dist", "browser", "runtime-player.js");
const dest = path.join(destDir, "runtime-player.js");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("[runtime-player] Wrote " + dest);
