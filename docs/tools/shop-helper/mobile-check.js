/* 쇼핑 도우미 모바일 점검 : 320×568 · 390×844 · 412×915 · 가로 844×390 에서 넘침 · 입력칸 글자(16px) · 누르기 작은 버튼을 확인
   1) node docs/tools/serve.js &   2) NODE_PATH=$(npm root -g) node docs/tools/shop-helper/mobile-check.js */
const { chromium } = require('playwright');
const fs = require('fs'), F = process.env.FONTS || '/nonexistent';
fs.mkdirSync(process.env.OUT || '_deploy/shop-helper', { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [w, h, label] of [[320, 568, 'se'], [390, 844, 'iphone'], [412, 915, 'galaxy'], [844, 390, 'landscape']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.route(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/, r => r.abort());
    await ctx.route(/\/board\/free\/list\.html/, r => r.fulfill({ contentType: 'text/html', body: '<table></table>' }));
    const pg = await ctx.newPage();
    await pg.goto('http://localhost:8765/product/list.html?cate_no=24', { waitUntil: 'networkidle' });
    await pg.tap('[data-s9="helper"]'); await pg.waitForTimeout(900);
    await pg.tap('.wh-msg:last-child [data-cat="교환 · 반품 · 환불"]'); await pg.waitForTimeout(500);
    await pg.tap('.wh-msg:last-child .wh-item[data-ask]'); await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => {
      const wh = document.querySelector('.wh'), rect = wh.getBoundingClientRect(), inp = document.getElementById('wh-in');
      const over = [...wh.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > rect.right + 1 || b.left < rect.left - 1); }).map(e => e.className).slice(0, 5);
      const ir = inp.getBoundingClientRect();
      return { panel: [Math.round(rect.width), Math.round(rect.height)], vw: innerWidth, vh: innerHeight, inputFont: getComputedStyle(inp).fontSize, inputVisible: ir.bottom <= innerHeight && ir.top > 0, overflowing: over, tapTargetsSmall: [...wh.querySelectorAll('button,a')].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.height < 32; }).map(e => e.className || e.tagName).slice(0, 5) };
    });
    console.log(label, w + 'x' + h, JSON.stringify(r));
    await pg.screenshot({ path: `${process.env.OUT || '_deploy/shop-helper'}/m-${label}.png` });
    await ctx.close();
  }
  await b.close();
})();
