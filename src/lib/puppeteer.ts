import fs from "fs";
import path from "path";

const WINDOWS_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROMIUM_PATH,
  process.env.EDGE_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe") : "",
  process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, "Microsoft", "Edge", "Application", "msedge.exe") : "",
  process.env[`PROGRAMFILES(X86)` as keyof NodeJS.ProcessEnv]
    ? path.join(process.env[`PROGRAMFILES(X86)` as keyof NodeJS.ProcessEnv] as string, "Google", "Chrome", "Application", "chrome.exe")
    : "",
  process.env[`PROGRAMFILES(X86)` as keyof NodeJS.ProcessEnv]
    ? path.join(process.env[`PROGRAMFILES(X86)` as keyof NodeJS.ProcessEnv] as string, "Microsoft", "Edge", "Application", "msedge.exe")
    : "",
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe") : "",
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe") : "",
].filter(Boolean) as string[];

const LINUX_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROMIUM_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/snap/bin/chromium",
].filter(Boolean) as string[];

function findLocalExecutablePath(): string | null {
  const candidates = WINDOWS_CANDIDATES;
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export async function launchPdfBrowser() {
  const { default: puppeteer } = await import("puppeteer");

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ];

  const launchWithPath = (executablePath: string) =>
    puppeteer.launch({ executablePath, headless: true, args: launchArgs });

  // On Windows (local dev), try to use a locally installed browser first
  if (process.platform === "win32") {
    const executablePath = findLocalExecutablePath();
    if (executablePath) {
      return launchWithPath(executablePath);
    }
  }

  // On Linux hosts (Render/containers), prefer an explicit executable path when available.
  if (process.platform === "linux") {
    for (const candidate of LINUX_CANDIDATES) {
      if (candidate && fs.existsSync(candidate)) {
        return launchWithPath(candidate);
      }
    }
  }

  // Fallback: use Puppeteer's managed browser from cache.
  try {
    return await puppeteer.launch({ headless: true, args: launchArgs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Could not find Chrome")) {
      throw new Error(
        "Chrome was not found for Puppeteer. Ensure your build runs: npx puppeteer browsers install chrome, or set CHROME_PATH / CHROMIUM_PATH / PUPPETEER_EXECUTABLE_PATH to a valid browser binary."
      );
    }
    throw error;
  }
}