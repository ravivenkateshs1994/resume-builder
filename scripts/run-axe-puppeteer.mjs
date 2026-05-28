import puppeteer from 'puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const url = process.argv[2] || 'http://localhost:3000';
const outFile = process.argv[3] || './axe-report.json';

(async () => {
  console.log('Creating temporary user profile for Puppeteer...');
  const prefix = path.join(os.tmpdir(), 'puppeteer_profile-');
  const userDataDir = fs.mkdtempSync(prefix);

  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${userDataDir}`],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Injecting axe-core...');
    // Try loading local axe-core from node_modules to avoid CDN/CSP issues
    try {
      const axePath = require.resolve('axe-core/axe.min.js');
      await page.addScriptTag({ path: axePath });
    } catch (err) {
      // Fallback to CDN if local package isn't available
      await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.4/axe.min.js' });
    }

    console.log('Running axe...');
    const results = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    });

    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log('Saved axe results to', outFile);
  } finally {
    await browser.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (err) {
      // ignore cleanup errors
    }
  }

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
