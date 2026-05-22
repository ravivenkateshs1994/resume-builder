import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

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

const UNIX_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROMIUM_PATH,
  process.env.EDGE_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean) as string[];

function findExecutablePath(): string {
  const candidates = process.platform === "win32" ? WINDOWS_CANDIDATES : UNIX_CANDIDATES;
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    "No Chrome or Edge executable was found. Set CHROME_PATH, CHROMIUM_PATH, or EDGE_PATH to a browser executable."
  );
}

export async function launchPdfBrowser() {
  const executablePath = findExecutablePath();
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}