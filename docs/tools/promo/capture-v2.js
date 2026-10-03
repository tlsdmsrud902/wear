// WEARPICK v2 홍보 영상용 「실제 화면」 촬영 : 로컬 미리보기(docs/tools/serve.js)를 열어 장면마다 MP4 로 찍는다
//   node docs/tools/serve.js &                       (http://localhost:8765)
//   FONTS=<글꼴·라이브러리 폴더> NODE_PATH=$(npm root -g) node docs/tools/promo/capture-v2.js [장면 이름 …]
//   FONTS : npm pack 한 pretendard@1.3.9 · gsap@3.12.5 · lenis@1.1.18 · jquery@1.12.4 를 풀어 둔 곳 (CDN 대신 씀)
//   결과 : video/src/cap-<장면>.mp4 (+ .marks.json : 탭 · 도착 시각)
//   · 세로(m-*) : 360×640 CSS × 3배 = 1080×1920 그대로 (Reels 크기)
//   · 가로(p-*) : 1440×810 CSS × 4/3배 = 1920×1080
//   · Playwright recordVideo 는 CSS 픽셀로만 찍혀 흐리다 → CDP 스크린샷을 연속으로 찍어 시각대로 30fps 로 잇는다
//   · 카페24 서버가 없으므로 쿠폰 뽑기의 회원 확인 · 쿠폰 발급 응답만 흉내 낸다 (화면 · 애니메이션은 스킨 코드 그대로)
//   · 편집 창은 카페24 글쓰기(Froala) 대신 아주 작은 가짜 편집기를 붙여 스킨의 전용 편집 화면(wear-cms-editor.js)을 그대로 띄운다
//   ⚠ 관리자 주소(?edit=1)는 headless 라 주소창이 없어 화면에 나오지 않는다. 편집 모드 안내 막대(.cms-bar)도 숨긴다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '..', '..', '..');
const SRC = path.join(REPO, 'video', 'src');
const F = process.env.FONTS;
const TMP = fs.mkdtempSync('/tmp/cap-v2-');
const BASE = 'http://localhost:8765';
const SALE = '/product/list.html?cate_no=27';
const WIN_COUPON = '6086396893100006746';   // 뽑기 결과로 보여 줄 쿠폰 (store-content.js 의 50% 쿠폰)
const NEW_TITLE = '가을 신상<br>최대 50%';   // 편집 장면에서 새로 쓰는 제목
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CDN = [
  [/pretendardvariable-dynamic-subset\.min\.css/, F + '/pretendard-1.3.9/dist/web/variable/pretendardvariable.css', 'text/css'],
  [/pretendard\.min\.css/, F + '/pretendard-1.3.9/dist/web/static/pretendard.css', 'text/css'],
  [/gsap\.min\.js/, F + '/gsap-3.12.5/dist/gsap.min.js', 'application/javascript'],
  [/ScrollTrigger\.min\.js/, F + '/gsap-3.12.5/dist/ScrollTrigger.min.js', 'application/javascript'],
  [/lenis\.min\.js/, F + '/lenis-1.1.18/dist/lenis.min.js', 'application/javascript'],
];
// 화면을 깔끔하게 : 팝업 · 편집 모드 안내 막대 · 모바일 '뒤로가기' 글자 숨김 + 탭/커서 표시
const CLEAN_CSS = '#cz-pop,.cz-popup,#cz-popup,.cms-bar,.cms-toast,.RTMB{display:none!important}'
  + '.__tap{position:fixed;z-index:2147483647;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(255,255,255,.5);border:3px solid rgba(17,17,17,.9);box-shadow:0 0 0 8px rgba(255,255,255,.35);pointer-events:none;animation:__tap .7s ease-out forwards}'
  + '@keyframes __tap{0%{transform:scale(.35);opacity:1}100%{transform:scale(1.6);opacity:0}}'
  + '.__cur{position:fixed;z-index:2147483647;left:0;top:0;width:30px;height:36px;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));transition:transform .15s}';
const CURSOR = '<svg width="30" height="36" viewBox="0 0 17 20"><path d="M1 1 L1 16 L5 12.4 L7.8 18.6 L10.3 17.5 L7.6 11.5 L12.6 11.5 Z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
// 카페24 글쓰기 편집기(Froala)를 대신하는 최소한의 가짜 : 스킨 편집 화면이 본문을 읽고 쓰는 통로만 있다
const FAKE_FROALA = `(function(){
  if (!/write\\.html|modify\\.html/.test(location.pathname)) return;
  var inst = { html: { _h: '', get: function(){ return this._h; }, set: function(h){ this._h = h; } }, events: { trigger: function(){}, on: function(){} } };
  window.FroalaEditor = { INSTANCES: [] };
  document.addEventListener('DOMContentLoaded', function(){
    var t = document.querySelector('.typeWrite') || document.body;
    var s = document.createElement('input'); s.id = 'subject'; s.name = 'subject'; t.appendChild(s);
    var ta = document.createElement('textarea'); ta.id = 'content'; ta.name = 'content'; t.appendChild(ta);
    var el = document.createElement('div'); el.setAttribute('contenteditable', 'true'); t.appendChild(el);
    inst.el = el; inst.$oel = [ta]; window.FroalaEditor.INSTANCES.push(inst);
    var st = document.createElement('style'); st.textContent = '.typeWrite,.ec-base-button,.ec-base-help,.ec-base-box{display:none!important}'; document.head.appendChild(st);
  });
})();`;
// 저장 뒤 새로고침한 화면 : 세일 큰 화면 제목이 새 글로 바뀌어 있다 (실제로는 화면 관리 게시판 글을 읽어 바뀐다)
const AFTER_SAVE = `(function(){
  if (!sessionStorage.getItem('__saved')) return;
  function put(){ var h = document.querySelector('[data-cms="세일 큰 화면"] [data-cms-text="제목"]'); if (h && h.innerHTML !== ${JSON.stringify(NEW_TITLE)}) h.innerHTML = ${JSON.stringify(NEW_TITLE)}; }
  document.addEventListener('DOMContentLoaded', function(){ put(); var n = 0, t = setInterval(function(){ put(); if (++n > 40) clearInterval(t); }, 50); });
})();`;

async function open(w, h, dsf) {
  const b = await chromium.launch();
  const mob = w < 800;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, isMobile: mob, hasTouch: mob });
  await ctx.route(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|raw\.githubusercontent\.com/, r => {
    const u = r.request().url();
    for (const [re, file, ct] of CDN) if (re.test(u)) return r.fulfill({ path: file, contentType: ct });
    const g = u.match(/tlsdmsrud902\/wear(?:@[^/]+|\/main)\/(.+?)(\?|$)/);
    if (g && fs.existsSync(path.join(REPO, decodeURIComponent(g[1])))) return r.fulfill({ path: path.join(REPO, decodeURIComponent(g[1])) });
    const m = u.match(/pretendard@v1\.3\.9\/dist\/web\/(.+)$/);
    if (m && fs.existsSync(F + '/pretendard-1.3.9/dist/web/' + m[1])) return r.fulfill({ path: F + '/pretendard-1.3.9/dist/web/' + m[1] });
    if (/hero-wear902\.mp4/.test(u)) return r.fulfill({ path: path.join(REPO, 'video', 'hero-wear902.mp4'), contentType: 'video/mp4' });
    r.abort();
  });
  // 쿠폰 뽑기 : 로그인한 회원(받은 쿠폰 없음) + 발급 응답
  await ctx.route(/localhost:8765\/myshop\/coupon\/coupon\.html/, r => r.fulfill({ contentType: 'text/html', body: '<html><body>보유 쿠폰 없음</body></html>' }));
  await ctx.route(/\/exec\/front\/newcoupon\/IssueDownload/, async r => {
    const ok = r.request().url().includes('coupon_no=' + WIN_COUPON);
    if (ok) await sleep(750);
    r.fulfill({ contentType: 'text/html', body: ok ? "<script>alert('쿠폰이 발급 되었습니다.');</script>" : "<script>alert('쿠폰 발급이 불가합니다.');</script>" });
  });
  await ctx.addInitScript({ path: F + '/jquery-1.12.4/dist/jquery.min.js' });
  await ctx.addInitScript('window.EC$ = window.jQuery;');
  await ctx.addInitScript(FAKE_FROALA);
  await ctx.addInitScript(AFTER_SAVE);
  await ctx.addInitScript(`document.addEventListener('DOMContentLoaded', function(){ var s = document.createElement('style'); s.textContent = ${JSON.stringify(CLEAN_CSS)}; document.head.appendChild(s); });`);
  const pg = await ctx.newPage();
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  return { b, ctx, pg, mob, w, h };
}

async function go(P, u, wait = 1800) {
  await P.pg.goto(BASE + u, { waitUntil: 'networkidle' });
  await sleep(wait);
}

// ---------- 연속 촬영 ----------
async function startRec(P, name) {
  const dir = path.join(TMP, name); fs.mkdirSync(dir, { recursive: true });
  const cdp = await P.ctx.newCDPSession(P.pg);
  const st = { on: true, frames: [], marks: [] };
  st.loop = (async () => {
    let i = 0;
    while (st.on) {
      const t = Date.now();
      try {
        const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
        const f = path.join(dir, String(i++).padStart(5, '0') + '.jpg');
        fs.writeFileSync(f, Buffer.from(r.data, 'base64')); st.frames.push([f, t]);
      } catch (e) { await sleep(20); }
    }
  })();
  st.mark = l => st.marks.push([l, Date.now()]);
  st.stop = async () => {
    st.on = false; await st.loop; await cdp.detach().catch(() => {});
    const fr = st.frames, t0 = fr[0][1];
    let txt = '';
    fr.forEach(([f, t], i) => { txt += `file '${f}'\nduration ${(i < fr.length - 1 ? (fr[i + 1][1] - t) / 1000 : 0.04).toFixed(4)}\n`; });
    txt += `file '${fr[fr.length - 1][0]}'\n`;
    fs.writeFileSync(dir + '/list.txt', txt);
    const out = path.join(SRC, 'cap-' + name + '.mp4');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', dir + '/list.txt', '-vf', 'fps=30,format=yuv420p',
      '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-an', '-movflags', '+faststart', out]);
    const marks = st.marks.map(([l, t]) => [l, +((t - t0) / 1000).toFixed(2)]);
    fs.writeFileSync(out.replace(/\.mp4$/, '.marks.json'), JSON.stringify(marks));
    const dur = (fr[fr.length - 1][1] - t0) / 1000;
    console.log(path.basename(out), fr.length + '장', dur.toFixed(1) + '초', (fr.length / dur).toFixed(1) + 'fps', JSON.stringify(marks));
  };
  return st;
}

// ---------- 손가락 탭(세로) · 커서 클릭(가로) ----------
async function center(P, sel) {
  const el = typeof sel === 'string' ? await P.pg.waitForSelector(sel, { state: 'visible', timeout: 8000 }) : sel;
  const bb = await el.boundingBox();
  return [bb.x + bb.width / 2, bb.y + bb.height / 2];
}
async function cursorTo(P, x, y, ms = 600) {
  await P.pg.evaluate(([x, y, ms, svg]) => new Promise(res => {
    let c = document.querySelector('.__cur');
    if (!c) { c = document.createElement('div'); c.className = '__cur'; c.innerHTML = svg; document.body.appendChild(c); c.__x = innerWidth * .62; c.__y = innerHeight * .7; }
    const x0 = c.__x, y0 = c.__y, t0 = performance.now();
    (function f(t) {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      c.__x = x0 + (x - x0) * e; c.__y = y0 + (y - y0) * e;
      c.style.left = (c.__x - 3) + 'px'; c.style.top = (c.__y - 2) + 'px';
      if (k < 1) requestAnimationFrame(f); else res();
    })(t0);
  }), [x, y, ms, CURSOR]);
}
async function tap(P, sel, { move = 650, click = true } = {}) {
  const [x, y] = await center(P, sel);
  if (!P.mob) await cursorTo(P, x, y, move);
  await P.pg.evaluate(([x, y]) => {
    const d = document.createElement('div'); d.className = '__tap'; d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 900);
    const c = document.querySelector('.__cur'); if (c) { c.style.transform = 'scale(.85)'; setTimeout(() => c.style.transform = '', 160); }
  }, [x, y]);
  await sleep(110);
  if (click) await P.pg.mouse.click(x, y);
}
async function scrollBy(P, dy, ms) {
  await P.pg.evaluate(([dy, ms]) => new Promise(res => {
    const y0 = scrollY, t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, y0 + dy * e); if (k < 1) requestAnimationFrame(f); else res(); })(t0);
  }), [dy, ms]);
}
const topOf = (P, sel) => P.pg.$eval(sel, e => e.getBoundingClientRect().top + scrollY);

// ---------- 장면 ----------
const SCENES = {
  // 랜덤 쿠폰 뽑기 : 섹션으로 내려오면 카드가 펼쳐지고 → 한 장을 눌러 → 흔들림 → 50% 공개
  async coupon(P, name) {
    await go(P, SALE);
    const top = await topOf(P, '#stSaleCoupon');
    // 세로 : 섹션 맨 위부터 / 가로 : 카드 묶음이 화면 가운데 오게
    const box = await P.pg.$eval('#stSaleCoupon .sl-cp__cards', e => { const r = e.getBoundingClientRect(); return [r.top + scrollY, r.height]; });
    const stop = P.mob ? top - 20 : box[0] + box[1] / 2 - P.h * 0.5;
    await P.pg.evaluate(y => scrollTo(0, y), stop - P.h * 1.1); await sleep(1500);
    const rec = await startRec(P, name);
    await scrollBy(P, P.h * 1.1, 900); rec.mark('arrive');
    await sleep(3600); rec.mark('ready');
    const cards = await P.pg.$$('#stSaleCoupon .sl-cp__card');
    let best = cards[0], bd = 1e9;
    for (const c of cards) { const bb = await c.boundingBox(); const d = Math.abs(bb.x + bb.width / 2 - P.w / 2); if (d < bd) { bd = d; best = c; } }
    // 카드가 뒤집히는 순간을 슬로모션으로 쓰려고, 누른 뒤에는 CSS 애니메이션을 0.4배속으로 찍는다 (영상에서 다시 빠르게 돌린다)
    const an = await P.ctx.newCDPSession(P.pg); await an.send('Animation.enable');
    await tap(P, best, { move: 700 }); rec.mark('tap');
    await an.send('Animation.setPlaybackRate', { playbackRate: 0.4 });
    await sleep(3800); rec.mark('end');
    await rec.stop();
  },
  // 세일 페이지 : 마감 카운트다운이 넘어가는 첫 화면 → 아래로 (큰 화면 · 분류 · 쿠폰 · 상품)
  async sale(P, name) {
    await go(P, SALE, 2500);
    const rec = await startRec(P, name);
    await sleep(2400); rec.mark('scroll1');
    await scrollBy(P, P.h * 0.85, 1100); await sleep(500); rec.mark('scroll2');
    const items = await topOf(P, '#stSaleItems').catch(() => 0);
    const cur = await P.pg.evaluate(() => scrollY);
    await scrollBy(P, (items || cur + P.h * 3) - cur - (P.mob ? 0 : 20), 1600); await sleep(600); rec.mark('items');
    await scrollBy(P, P.h * 0.9, 1300); await sleep(700);
    await rec.stop();
  },
  // 메인 : 첫 화면 영상 → 섹션들을 빠르게 훑는다
  async home(P, name) {
    await go(P, '/', 1500);
    for (let y = 0; y < 26000; y += 600) { await P.pg.evaluate(y => scrollTo(0, y), y); await sleep(40); }   // 지연 로딩 사진 미리 받기
    await P.pg.evaluate(() => scrollTo(0, 0)); await sleep(2500);
    const rec = await startRec(P, name);
    await sleep(1800);
    for (let i = 0; i < 9; i++) { await scrollBy(P, P.h * 0.95, 650); await sleep(420); rec.mark('s' + (i + 1)); }
    await rec.stop();
  },
  // 편집 모드 : 섹션마다 [고치기] → 「세일 큰 화면」 고치기를 누른다
  async edit(P, name) {
    await go(P, SALE + '&edit=1', 2500);
    await P.pg.evaluate(() => { window.open = u => { window.__open = u; }; });
    const rec = await startRec(P, name);
    await sleep(1300); rec.mark('tap');
    await tap(P, 'text=세일 큰 화면 고치기', { move: 800 });
    await sleep(900); rec.mark('end');
    await rec.stop();
  },
  // 편집 창 : 지금 내용이 채워진 칸 → 제목을 지우고 새로 쓰고 → [저장하기]
  async editor(P, name) {
    // 메인 화면의 [고치기]가 넘겨주는 초안(localStorage)을 만들고 편집 창 주소를 받는다 (녹화 없이)
    await go(P, SALE + '&edit=1', 2000);
    await P.pg.evaluate(() => { window.open = u => { window.__open = u; }; });
    await P.pg.click('text=세일 큰 화면 고치기');
    await go(P, await P.pg.evaluate(() => window.__open), 2500);
    // 저장 막대가 따라다니면 세로 화면의 절반을 가려서, 촬영에서는 제자리에 둔다 (저장하기는 위로 올라가 누른다)
    await P.pg.addStyleTag({ content: '.pcms__bar{position:static!important}' });
    const t0 = await topOf(P, '.pcms');
    await P.pg.evaluate(y => scrollTo(0, y), t0 - (P.mob ? 100 : 130)); await sleep(800);
    const field = await P.pg.evaluateHandle(() => [...document.querySelectorAll('.pcms__field')].find(f => /^제목/.test((f.querySelector('.pcms__label') || {}).textContent || '')).querySelector('textarea,input'));
    const rec = await startRec(P, name);
    await sleep(900); rec.mark('scroll');
    const fy = await field.evaluate(e => e.getBoundingClientRect().top);
    await scrollBy(P, fy - P.h * (P.mob ? 0.45 : 0.5), 1000); await sleep(250); rec.mark('tapField');
    await tap(P, field.asElement(), { move: 600 });
    await sleep(250);
    await field.evaluate(e => e.select()); await sleep(350); rec.mark('type');
    const parts = NEW_TITLE.split('<br>');
    for (let i = 0; i < parts.length; i++) { if (i) await P.pg.keyboard.press('Enter'); await P.pg.keyboard.type(parts[i], { delay: 115 }); }
    await sleep(600); rec.mark('up');
    const sy = await P.pg.$eval('.pcms__save', e => e.getBoundingClientRect().top);
    if (sy < 60 || sy > P.h - 60) { await scrollBy(P, sy - P.h * 0.4, 700); await sleep(200); }
    rec.mark('save');
    await tap(P, '.pcms__save', { move: 700 });
    await sleep(700); rec.mark('end');
    await rec.stop();
  },
  // 저장 뒤 새로고침 : 세일 첫 화면 제목이 바뀌어 있다
  async after(P, name) {
    await go(P, SALE, 2500);
    const rec = await startRec(P, name);
    await sleep(700); rec.mark('reload');
    await P.pg.evaluate(() => sessionStorage.setItem('__saved', '1'));
    await P.pg.reload({ waitUntil: 'domcontentloaded' }); rec.mark('loaded');
    await sleep(3200);
    await rec.stop();
  },
};

(async () => {
  const want = process.argv.slice(2);
  const list = [];
  // 가로 영상의 편집 창은 실제처럼 「새 창」으로 겹쳐 보여 주므로 좁은 창(960×1080 → 1080×1215)으로 찍는다
  const VIEW = { 'p-editor': [960, 1080, 1.125] };
  for (const [pre, w, h, dsf] of [['m', 360, 640, 3], ['p', 1440, 810, 4 / 3]])
    for (const s of Object.keys(SCENES)) if (!want.length || want.includes(pre + '-' + s)) list.push([pre, ...(VIEW[pre + '-' + s] || [w, h, dsf]), s]);
  for (const [pre, w, h, dsf, s] of list) {
    const P = await open(w, h, dsf);
    try { await SCENES[s](P, pre + '-' + s); } catch (e) { console.log('실패', pre + '-' + s, e.message); }
    await P.b.close();
  }
  fs.rmSync(TMP, { recursive: true, force: true });
})();
