import fs from "fs";
import path from "path";

const WINDOWS_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROMIUM_PATH,
  process.env.EDGE_PATH,
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

  // On Windows (local dev), try to use a locally installed browser first
  if (process.platform === "win32") {
    const executablePath = findLocalExecutablePath();
    if (executablePath) {
      return puppeteer.launch({ executablePath, headless: true, args: launchArgs });
    }
  }

  // On Linux (Render) or fallback — use puppeteer's bundled Chromium
  return puppeteer.launch({ headless: true, args: launchArgs });
}