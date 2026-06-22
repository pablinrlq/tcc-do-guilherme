/**
 * Gera os ícones PNG do PWA (192/512) a partir do SVG da marca,
 * usando o Chromium do Playwright (sem dependências nativas extras).
 * Uso: node scripts/generate-pwa-icons.cjs
 */
const { chromium } = require('@playwright/test');
const path = require('node:path');

(async () => {
  const svg = path.resolve(__dirname, '../frontend/public/icons/icon.svg');
  const browser = await chromium.launch();
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.goto('file:///' + svg.replace(/\\/g, '/'));
    const out = path.resolve(__dirname, `../frontend/public/icons/pwa-${size}.png`);
    await page.screenshot({ path: out, omitBackground: true });
    await page.close();
    console.log(`gerado: ${out}`);
  }
  await browser.close();
})();
