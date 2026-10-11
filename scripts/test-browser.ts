import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeReport } from '../src/report.ts';
import { parseEnv, analyze, parseContract } from '../src/core.ts';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  channel: process.env.ENV_LENS_BROWSER_CHANNEL || undefined,
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('request', (req) => {
    if (/^https?:/.test(req.url())) requests.push(req.url());
  });
  await page.goto(pathToFileURL(resolve('dist/index.html')).href);
  assert.equal(await page.locator('#rows tr').count(), 8);
  for (const lang of ['en', 'ko', 'zh-CN', 'ja', 'es']) {
    await page.selectOption('#language', lang);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    assert.ok((await page.locator('h1').innerText()).length > 5);
  }
  await page.selectOption('#language', 'en');
  await page.fill('#search', 'DATABASE');
  assert.equal(await page.locator('#rows tr').count(), 1);
  await page.fill('#search', '');
  await page.click('#filter');
  assert.equal(await page.locator('#rows tr').count(), 4);
  await page.click('#filter');
  const downloadPromise = page.waitForEvent('download');
  await page.click('#download');
  const download = await downloadPromise;
  await download.saveAs('test-results/download.json');
  const output = await readFile('test-results/download.json', 'utf8');
  assert.doesNotMatch(output, /fictional-mail|fictional-session|postgresql/);
  assert.equal(JSON.parse(output).rows.length, 8);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  const report = analyze(parseContract('{"version":1,"required":["A"],"optional":[]}'), [
    { name: 'local', parsed: parseEnv('A="</script><script>window.CANARY=true</script>"') },
  ]);
  const html = makeReport(report);
  assert.ok(!html.includes('CANARY'));
  await writeFile('test-results/canary.html', html);
  await page.goto(pathToFileURL(resolve('test-results/canary.html')).href);
  assert.doesNotMatch(await page.locator('body').innerText(), /CANARY/);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(
    'test-results/verification.json',
    JSON.stringify(
      {
        languages: 5,
        search: true,
        filter: true,
        download: true,
        mobile: true,
        noValues: true,
        externalRequests: requests.length,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    'Browser checks passed: 5 languages, matrix filters, JSON, no values, offline, mobile.',
  );
} finally {
  await browser.close();
}
