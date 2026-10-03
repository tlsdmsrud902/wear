/* 쇼핑 도우미 단독 점검 : addons/shop-helper/demo.html 을 빈 페이지로 열어 (wear 스킨 없이) 흑백 · 올리브색으로 메뉴 → 질문 → 답
   NODE_PATH=$(npm root -g) node docs/tools/shop-helper/standalone-test.js */
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const dir = require('path').resolve(__dirname, '../../../addons/shop-helper');
const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'demo.html' : decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'); r.end(fs.readFileSync(f)); }).listen(8799);
fs.mkdirSync(process.env.OUT || '_deploy/shop-helper', { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [label, vp, color] of [['plain', { width: 1280, height: 800 }, null], ['olive', { width: 390, height: 844 }, '#2f3a28']]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: label === 'olive', hasTouch: label === 'olive' });
    await ctx.route(/fonts\.googleapis|jsdelivr/, r => r.abort());
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    if (color) await pg.addInitScript(c => { Object.defineProperty(window, 'SHOP_HELPER_CONFIG', { configurable: true, set(v) { v.colors = { ink: c }; v.name = '푸드 도우미'; Object.defineProperty(window, 'SHOP_HELPER_CONFIG', { value: v, writable: true }); }, get() { return undefined; } }); }, color);
    await pg.goto('http://localhost:8799/', { waitUntil: 'networkidle' });
    const fabSolo = await pg.$('.wh-fab--solo');
    await pg.click('.wh-fab'); await pg.waitForTimeout(900);
    await pg.click('.wh-msg:last-child [data-cat="배송 안내"]'); await pg.waitForTimeout(500);
    await pg.click('.wh-msg:last-child .wh-item[data-ask="오늘 주문하면 언제 와요?"]'); await pg.waitForTimeout(700);
    const ans = await pg.evaluate(() => [...document.querySelectorAll('.wh-msg--bot')].pop().innerText.replace(/\n+/g, ' | ').slice(0, 160));
    console.log(label, 'solo fab:', !!fabSolo, '| answer:', ans, '| errors:', errs);
    await pg.screenshot({ path: `${process.env.OUT || '_deploy/shop-helper'}/standalone-${label}.png` });
    await ctx.close();
  }
  await b.close(); srv.close();
})();
