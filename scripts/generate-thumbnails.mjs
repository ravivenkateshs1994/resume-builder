#!/usr/bin/env node
/**
 * generate-thumbnails.mjs
 *
 * Renders each template with mock resume data and saves a PNG screenshot
 * into public/template-previews/.
 *
 * Requires the Next.js dev (or production) server to be running.
 *
 * Usage:
 *   DEV_URL=http://localhost:3000 node scripts/generate-thumbnails.mjs
 *
 * The script:
 *  1. Opens /thumbnail-capture/{id} in a headless browser (Puppeteer).
 *  2. Waits until the page signals it is fully hydrated and painted
 *     (html[data-ready="true"]).
 *  3. Screenshots the exact 794×1123 px template area.
 *  4. Saves the PNG to public/template-previews/{id}.png.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import puppeteer from "puppeteer";

// ── Config ──────────────────────────────────────────────────────────────────

const DEV_URL = (process.env.DEV_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** A4 at 96 dpi */
const A4_W = 794;
const A4_H = 1123;

const TEMPLATE_IDS = [
  "modern", "classic", "creative", "minimal", "executive",
  "slate", "chronos", "terra", "tech", "nova", "prism", "apex",
];

const OUT_DIR = path.join(process.cwd(), "public", "template-previews");

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log("Created", OUT_DIR);
  }
}

async function pingServer(url, retries = 20, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${url}/`);
      if (res.ok || res.status < 500) return; // server is up
    } catch {
      // not yet ready
    }
    if (i < retries - 1) {
      process.stdout.write(`\r  Waiting for server (attempt ${i + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.error(`\n\nCould not reach ${url} after ${retries} attempts.`);
  console.error("Start the dev server first:  npm run dev");
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  ensureOutDir();

  console.log(`\nTarget server: ${DEV_URL}`);
  console.log("Waiting for server to be ready...");
  await pingServer(DEV_URL);
  console.log("\nServer is up.\n");

  // Unique user-data dir avoids conflicts with any running Chrome instance
  const { tmpdir } = await import("os");
  const userDataDir = path.join(tmpdir(), `puppeteer_thumb_${Date.now()}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none", // sharper text in screenshots
    ],
    userDataDir,
  });

  let failed = 0;

  for (const id of TEMPLATE_IDS) {
    const outPath = path.join(OUT_DIR, `${id}.png`);
    const url = `${DEV_URL}/thumbnail-capture/${id}`;

    process.stdout.write(`  Capturing ${id}...`);

    const page = await browser.newPage();
    try {
      // Set viewport to exactly A4 dimensions — no scaling needed
      await page.setViewport({ width: A4_W, height: A4_H, deviceScaleFactor: 2 });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });

      // Wait for the ReadySignal component to set data-ready="true"
      await page.waitForFunction(
        () => document.documentElement.getAttribute("data-ready") === "true",
        { timeout: 15_000 }
      );

      // One extra frame to ensure paint is complete
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

      // Screenshot the exact A4 clip — deviceScaleFactor:2 means the PNG is
      // 1588×2246 px (2× physical pixels) for crisp rendering at normal display size.
      await page.screenshot({
        path: outPath,
        clip: { x: 0, y: 0, width: A4_W, height: A4_H },
      });

      console.log(`  ✓  Saved ${path.relative(process.cwd(), outPath)}`);
    } catch (err) {
      console.error(`\n  ✗  Failed to capture ${id}: ${err.message}`);
      failed += 1;
    } finally {
      await page.close().catch(() => null);
    }
  }

  await browser.close();

  if (failed > 0) {
    console.error(`\n${failed} template(s) failed. See errors above.`);
    process.exit(1);
  }

  console.log(`\nAll ${TEMPLATE_IDS.length} thumbnails saved to public/template-previews/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
