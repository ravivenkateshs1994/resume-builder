/**
 * Multi-page axe-core accessibility scan.
 * Usage: node scripts/run-axe-multipage.mjs [baseUrl]
 * Writes per-page reports to axe-reports/ and prints a combined summary.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

const PAGES = [
  { name: 'home',         path: '/' },
  { name: 'login',        path: '/login' },
  { name: 'create',       path: '/create' },
  { name: 'gap-analysis', path: '/gap-analysis' },
  { name: 'privacy',      path: '/privacy' },
  { name: 'terms',        path: '/terms' },
];

const outDir = './axe-reports';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

let axePath;
try {
  axePath = require.resolve('axe-core/axe.min.js');
} catch {
  axePath = null;
}

(async () => {
  const prefix = path.join(os.tmpdir(), 'puppeteer_multipage-');
  const userDataDir = fs.mkdtempSync(prefix);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${userDataDir}`],
  });

  const allViolations = [];

  try {
    for (const { name, path: pagePath } of PAGES) {
      const url = `${baseUrl}${pagePath}`;
      console.log(`\nScanning ${url} ...`);
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(60000);

      try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        if (axePath) {
          await page.addScriptTag({ path: axePath });
        } else {
          await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.4/axe.min.js' });
        }

        const results = await page.evaluate(async () => {
          return await globalThis.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
          });
        });

        const outFile = path.join(outDir, `${name}.json`);
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

        const violations = results.violations;
        if (violations.length === 0) {
          console.log(`  ✓ 0 violations`);
        } else {
          console.log(`  ✗ ${violations.length} violation(s):`);
          for (const v of violations) {
            console.log(`    [${v.impact}] ${v.id} — ${v.nodes.length} node(s)`);
            console.log(`      ${v.description}`);
            if (v.nodes.length > 0) {
              console.log(`      Example: ${v.nodes[0].html.slice(0, 120)}`);
            }
          }
          allViolations.push({ page: name, url, violations });
        }
      } catch (err) {
        console.log(`  ERROR: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  console.log('\n══════════════════════════════════════════════');
  if (allViolations.length === 0) {
    console.log('✓ All pages passed — zero WCAG 2A/AA violations.');
  } else {
    console.log(`SUMMARY — ${allViolations.reduce((t, p) => t + p.violations.length, 0)} total violation(s) across ${allViolations.length} page(s):`);
    for (const { page, violations } of allViolations) {
      console.log(`\n  ${page}:`);
      for (const v of violations) {
        console.log(`    [${v.impact}] ${v.id} (${v.nodes.length} node(s)) — ${v.help}`);
      }
    }
    console.log('\nFull reports saved to ./axe-reports/');
  }
  console.log('══════════════════════════════════════════════\n');

  process.exit(allViolations.length > 0 ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
