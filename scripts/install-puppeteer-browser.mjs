import { execSync } from "node:child_process";
import path from "node:path";

const cacheDir = path.join(process.cwd(), ".cache", "puppeteer");
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || cacheDir;

const shouldSkip =
  process.env.PUPPETEER_SKIP_DOWNLOAD === "true" ||
  process.env.PUPPETEER_SKIP_DOWNLOAD === "1";

if (shouldSkip) {
  console.log("[postinstall] Skipping Puppeteer browser install (PUPPETEER_SKIP_DOWNLOAD is set).");
  process.exit(0);
}

// Only install the browser when explicitly requested (opt-in).
// This avoids downloading large browser binaries on hosting providers (e.g., Render)
// unless you set `INSTALL_PUPPETEER=1` or `ELECTRON_BUILD=1` in the environment.
const shouldInstall =
  process.env.INSTALL_PUPPETEER === "true" ||
  process.env.INSTALL_PUPPETEER === "1" ||
  process.env.ELECTRON_BUILD === "true" ||
  process.env.ELECTRON_BUILD === "1";

if (!shouldInstall) {
  console.log(
    "[postinstall] Skipping Puppeteer browser install (not explicitly enabled).",
    "Set INSTALL_PUPPETEER=1 to enable."
  );
  process.exit(0);
}

try {
  console.log(`[postinstall] Installing Puppeteer managed Chrome into ${process.env.PUPPETEER_CACHE_DIR} ...`);
  execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
  console.log("[postinstall] Puppeteer Chrome install complete.");
} catch (error) {
  console.error("[postinstall] Failed to install Puppeteer Chrome.");
  throw error;
}
