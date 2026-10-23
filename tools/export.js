async (page) => {
  const ROOT = '/projects/sandbox/token-intelligence-layer-deck';
  await page.unroute('**/*').catch(() => {});
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.route('http://deck.local/**', async (route) => {
    let p = route.request().url().replace('http://deck.local', '').split('?')[0].split('#')[0];
    await route.fulfill({ path: ROOT + decodeURIComponent(p) });
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://deck.local/dist/token-intelligence-layer-deck.html?export');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const fontsUsed = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  const total = await page.evaluate(() => window.deck.total);
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => window.deck.go(n), i);
    await page.waitForTimeout(60);
    await page.screenshot({ path: ROOT + '/dist/png/slide-' + String(i + 1).padStart(2, '0') + '.png' });
  }
  await page.evaluate(() => window.deck.go(0));
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: ROOT + '/dist/token-intelligence-layer-deck.pdf', width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  // Render page 1 & 9 of the print layout as a sanity check of print CSS
  await page.setViewportSize({ width: 1920, height: 1080 * total });
  await page.screenshot({ path: ROOT + '/.preview/print-layout.png', fullPage: true });
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  return JSON.stringify({ total, fontsUsed });
}
