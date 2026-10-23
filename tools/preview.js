async (page) => {
  const ROOT = '/projects/sandbox/token-intelligence-layer-deck';
  await page.unroute('**/*').catch(() => {});
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.route('http://deck.local/**', async (route) => {
    let p = route.request().url().replace('http://deck.local', '').split('?')[0].split('#')[0];
    await route.fulfill({ path: ROOT + decodeURIComponent(p) });
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://deck.local/src/index.html?export');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const total = await page.evaluate(() => window.deck.total);
  const out = [];
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => window.deck.go(n), i);
    await page.waitForTimeout(80);
    const f = ROOT + '/.preview/slide-' + String(i + 1).padStart(2, '0') + '.png';
    await page.screenshot({ path: f });
    out.push(f);
  }
  // Overflow audit: elements whose content spills outside their box, or outside the slide safe area.
  const issues = await page.evaluate(() => {
    const res = [];
    document.querySelectorAll('.slide').forEach((s, si) => {
      s.classList.add('active');
      const sr = s.getBoundingClientRect();
      s.querySelectorAll('.content *').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'inline') return;
        if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible' ) res.push(`s${si+1} clip-x ${el.className}`);
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.right > sr.right - 100 || r.bottom > sr.bottom - 100 || r.left < sr.left + 100) {
          if (!el.closest('svg') && !el.classList.contains('fx-glow')) res.push(`s${si+1} out-of-safe ${el.tagName}.${el.className} r=${Math.round(r.right-sr.left)} b=${Math.round(r.bottom-sr.top)}`);
        }
      });
      // text overflow inside fixed containers
      s.querySelectorAll('.content *').forEach(el => {
        if (el.children.length) return;
        const p = el.parentElement; if (!p) return;
        const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
        if (r.right > pr.right + 1 && getComputedStyle(p).display !== 'inline') res.push(`s${si+1} child-overflow ${p.className} > ${el.tagName}.${el.className} "${(el.textContent||'').slice(0,30)}" by ${Math.round(r.right-pr.right)}px`);
      });
      s.classList.remove('active');
    });
    window.deck.go(0);
    return res;
  });
  return JSON.stringify({ total, issues: issues.slice(0, 80) }, null, 1);
}
