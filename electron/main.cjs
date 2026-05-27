/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;
const port = process.env.PORT || "3000";
let nextServerProcess = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, retries = 60) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not ready yet.
    }
    await wait(500);
  }
  throw new Error(`Next.js server did not start in time: ${url}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "AI Resume Builder",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${port}`;
  win.loadURL(startUrl);
}

async function startDesktop() {
  if (!isDev) {
    const nextBin = path.join(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
    nextServerProcess = spawn(nextBin, ["start", "-p", port], {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      shell: false,
      env: process.env,
    });
  }

  await waitForServer(`http://localhost:${port}`);
  createWindow();
}

app.whenReady().then(() => {
  void startDesktop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
    nextServerProcess = null;
  }
});

