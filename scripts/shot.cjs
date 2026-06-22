/* Captura screenshots da app (desktop + mobile) para validar os ajustes de UI. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5173';

async function settle(page, ms = 900) {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
  // espera sumir skeletons/spinners se houver
  try { await page.waitForFunction(() => !document.querySelector('.skeleton, .spinner'), { timeout: 6000 }); } catch {}
  await page.waitForTimeout(ms);
}

async function shoot(ctx, route, file, full = false) {
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.screenshot({ path: path.join(OUT, file), fullPage: full });
  await page.close();
  console.log('  saved', file);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // ---------- DESKTOP ----------
  console.log('Desktop (1440x900):');
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const login = await desk.newPage();
  await login.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await login.fill('input[name="email"]', 'ana@skillex.com');
  await login.fill('input[name="password"]', 'senha123');
  await Promise.all([
    login.waitForFunction(() => location.pathname.startsWith('/feed'), { timeout: 15000 }),
    login.click('button[type="submit"]'),
  ]);
  await settle(login);
  const token = await login.evaluate(() => localStorage.getItem('skillex_token'));
  await login.close();
  console.log('  logged in, token len', (token || '').length);

  await shoot(desk, '/feed', 'desktop-feed.png');
  await shoot(desk, '/search', 'desktop-search.png');
  await shoot(desk, '/profile/me', 'desktop-profile.png');
  await shoot(desk, '/wallet', 'desktop-wallet.png');
  await shoot(desk, '/requests', 'desktop-requests.png');
  await shoot(desk, '/feed', 'desktop-feed-full.png', true);
  await desk.close();

  // ---------- MOBILE ----------
  console.log('Mobile (390x844):');
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mob.addInitScript((t) => { if (t) localStorage.setItem('skillex_token', t); }, token);
  await shoot(mob, '/feed', 'mobile-feed.png');
  await shoot(mob, '/wallet', 'mobile-wallet.png');
  await shoot(mob, '/profile/me', 'mobile-profile.png');
  await mob.close();

  await browser.close();
  console.log('DONE ->', OUT);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
