import { execSync } from "node:child_process";

const shouldSkip =
  process.env.PUPPETEER_SKIP_DOWNLOAD === "true" ||
  process.env.PUPPETEER_SKIP_DOWNLOAD === "1";

if (shouldSkip) {
  console.log("[postinstall] Skipping Puppeteer browser install (PUPPETEER_SKIP_DOWNLOAD is set).");
  process.exit(0);
}

const shouldInstall =
  process.env.RENDER === "true" ||
  process.env.CI === "true" ||
  process.env.NODE_ENV === "production";

if (!shouldInstall) {
  console.log("[postinstall] Skipping Puppeteer browser install outside production/CI environment.");
  process.exit(0);
}

try {
  console.log("[postinstall] Installing Puppeteer managed Chrome...");
  execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
  console.log("[postinstall] Puppeteer Chrome install complete.");
} catch (error) {
  console.error("[postinstall] Failed to install Puppeteer Chrome.");
  throw error;
}
