// Renders docs/printable-hire-confirmation.html to a single-page A4 PDF at
// public/hire-confirmation-form.pdf (served as /hire-confirmation-form.pdf).
// Usage: node scripts/build-printable-hire-confirmation.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'docs', 'printable-hire-confirmation.html');
const out = path.join(root, 'public', 'hire-confirmation-form.pdf');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(src).href);
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Wrote ${path.relative(root, out)}`);
