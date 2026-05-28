#!/usr/bin/env node
/**
 * generate-thumbnails.mjs
 *
 * Renders each template (default color + all accent-color presets) with mock
 * resume data and saves PNG screenshots into public/template-previews/.
 *
 * File naming:
 *   public/template-previews/{id}.png           ← default color
 *   public/template-previews/{id}-{hex}.png     ← preset color (no leading #)
 *
 * Requires the Next.js dev (or production) server to be running.
 *
 * Usage:
 *   DEV_URL=http://localhost:3000 node scripts/generate-thumbnails.mjs
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

// ── Config ──────────────────────────────────────────────────────────────────

const DEV_URL = (process.env.DEV_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** A4 at 96 dpi */
const A4_W = 794;
const A4_H = 1123;

// Must match PER_TEMPLATE_PRESETS in src/lib/templateTheme.ts
const TEMPLATE_PRESETS = {
  modern:    ["#2563eb", "#475569", "#7c3aed", "#0f766e", "#0e7490"],
  classic:   ["#475569", "#1e3a5f", "#374151", "#0f766e", "#be123c"],
  creative:  ["#7c3aed", "#2563eb", "#be123c", "#0f766e", "#0e7490"],
  minimal:   ["#4b5563", "#2563eb", "#7c3aed", "#0f766e", "#be123c"],
  executive: ["#111827", "#1e3a5f", "#374151", "#2563eb", "#0f766e"],
  slate:     [], // fixed palette — default only
  chronos:   ["#0f766e", "#2563eb", "#7c3aed", "#0e7490", "#475569"],
  terra:     ["#c2410c", "#0f766e", "#7c3aed", "#475569", "#be123c"],
  tech:      [], // fixed palette — default only
  nova:      ["#2563eb", "#7c3aed", "#be123c", "#0f766e", "#475569"],
  prism:     ["#0f766e", "#2563eb", "#7c3aed", "#475569", "#c2410c"],
  apex:      ["#475569", "#2563eb", "#0f766e", "#7c3aed", "#be123c"],
  pinnacle:  ["#1e40af", "#1e3a5f", "#374151", "#0f766e", "#be123c"],
  vector:    ["#0f766e", "#2563eb", "#7c3aed", "#0e7490", "#475569"],
};

// Default accent per template (first preset, or fixed for slate/tech)
const DEFAULT_ACCENTS = {
  modern:    "#2563eb",
  classic:   "#475569",
  creative:  "#7c3aed",
  minimal:   "#4b5563",
  executive: "#111827",
  slate:     "#0284c7",
  chronos:   "#0f766e",
  terra:     "#c2410c",
  tech:      "#0891b2",
  nova:      "#2563eb",
  prism:     "#0f766e",
  apex:      "#475569",
  pinnacle:  "#1e40af",
  vector:    "#0f766e",
};

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
      if (res.ok || res.status < 500) return;
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

async function capture(page, id, color, outPath) {
  const hex = color.replace(/^#/, "");
  const url = `${DEV_URL}/thumbnail-capture/${id}?color=${hex}`;

  await page.setViewport({ width: A4_W, height: A4_H, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForFunction(
    () => document.documentElement.getAttribute("data-ready") === "true",
    { timeout: 15_000 }
  );
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: A4_W, height: A4_H } });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  ensureOutDir();

  console.log(`\nTarget server: ${DEV_URL}`);
  console.log("Waiting for server to be ready...");
  await pingServer(DEV_URL);
  console.log("\nServer is up.\n");

  const { tmpdir } = await import("os");
  const userDataDir = path.join(tmpdir(), `puppeteer_thumb_${Date.now()}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
    userDataDir,
  });

  let total = 0;
  let failed = 0;

  for (const [id, presets] of Object.entries(TEMPLATE_PRESETS)) {
    const defaultColor = DEFAULT_ACCENTS[id];

    // Build capture jobs: default + all presets (deduped)
    const jobs = [
      { color: defaultColor, outName: `${id}.png` },
      ...presets
        .filter((c) => c.toLowerCase() !== defaultColor.toLowerCase())
        .map((color) => ({
          color,
          outName: `${id}-${color.replace(/^#/, "")}.png`,
        })),
    ];

    console.log(`  ${id} (${jobs.length} variant${jobs.length > 1 ? "s" : ""})`);

    for (const { color, outName } of jobs) {
      const outPath = path.join(OUT_DIR, outName);
      process.stdout.write(`    ${outName}...`);

      const page = await browser.newPage();
      try {
        await capture(page, id, color, outPath);
        console.log("  ✓");
        total++;
      } catch (err) {
        console.error(`  ✗  ${err.message}`);
        failed++;
      } finally {
        await page.close().catch(() => null);
      }
    }
  }

  await browser.close();

  if (failed > 0) {
    console.error(`\n${failed} capture(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${total} thumbnails saved to public/template-previews/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
