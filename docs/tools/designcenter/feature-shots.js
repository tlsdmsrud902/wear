// 상세페이지 v3 (크몽 · 디자인센터 공통) : 기능 8가지를 실제 쇼핑몰(wear902.cafe24.com)에서 찍는다
//   node docs/tools/designcenter/feature-shots.js [이름,이름…]
// 출력 : _deploy/dc/v3shots/<이름>.png  (2배 해상도. 상세 HTML 이 쓸 jpg 는 detail-v3.js 가 만든다)
// 상담 관리 화면은 접속 키가 필요해서, 구글 시트 요청을 가로채 [예시] 손님 기록을 돌려준다 (실제 기록은 읽지 않음)
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'https://wear902.cafe24.com';
const OUT = path.join(__dirname, '../../../_deploy/dc/v3shots');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2] ? process.argv[2].split(',') : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PC = { width: 1280, height: 800, deviceScaleFactor: 2 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const CALM = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;caret-color:transparent!important}';

async function open(pg, url, vp, opt = {}) {
  await pg.setViewport(vp);
  await pg.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 90000 });
  if (/challenge/.test(pg.url())) throw new Error('CHALLENGE ' + url);
  await sleep(opt.wait || 4000);
  await pg.evaluate(keepPop => {
    const v = document.querySelector('.pe-world-video'); if (v) { v.pause(); v.currentTime = 1.2; }
    if (!keepPop) document.querySelectorAll('.cz-pop').forEach(e => e.remove());
    const bar = document.querySelector('.cms-bar'); if (bar) bar.remove();
  }, !!opt.keepPop);
  if (!opt.moving) await pg.addStyleTag({ content: CALM });
  await sleep(600);
}
async function scrollTo(pg, sel, off = 0) {
  await pg.evaluate((sel, off) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel);
    window.scrollTo(0, e.getBoundingClientRect().top + scrollY - off);
  }, sel, off);
  await sleep(1800);
}
async function rect(pg, sel) {
  return pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; }, sel);   // 문서 좌표 (screenshot clip 기준)
}
async function click(pg, sel) {
  await pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel); e.click(); }, sel);
}
const noFloat = pg => pg.addStyleTag({ content: '#s9Float{display:none!important}' });
// 고정 머리글은 첫 화면이 아닌 캡처에서 가린다 (섹션을 덮지 않게)
const noHeader = pg => pg.addStyleTag({ content: '#header,.xans-layout-statelogon,.st-header,header.cz-header,[class*="topbar"],.s9-head,#cz-head{visibility:hidden!important}' });

/* ---------- 상담 관리 [예시] 기록 ---------- */
function demoSheet() {
  const now = Date.now(), H = 3600e3, D = 24 * H;
  const rec = (id, at, name, uid, ch, t, lines, phone, email) => ({ id, at, subject: `[상담 기록] ${name}${uid ? ` (${uid})` : ''} · ${ch} · ${t}`, text: lines.join('\n'), name, uid, phone, email });
  const who = (name, uid, phone, email, group) => [`회원 ${name} (아이디 ${uid})`, `휴대폰: ${phone}`, `이메일: ${email}`, `회원 등급: ${group}`, '수신 동의 : 문자 동의 · 메일 동의', ''];
  const P = {
    a: ['김하늘', 'sky_haneul', '010-1234-5678', 'haneul@example.com', '일반회원'],
    b: ['이서연', 'seoyeon92', '010-2345-6789', 'seoyeon@example.com', 'VIP'],
    c: ['최유나', 'yuna22', '010-3456-7890', 'yuna@example.com', '일반회원'],
    d: ['정다은', 'daeun_j', '010-4567-8901', 'daeun@example.com', '일반회원'],
    e: ['박지민', 'jimin.p', '010-5678-9012', 'jimin@example.com', '일반회원'],
    f: ['한소희', 'sohee_h', '010-6789-0123', 'sohee@example.com', '일반회원'],
  };
  const seen = (...xs) => ['최근 본 상품', ...xs.map(x => `· ${x[0]} ${x[1]} (상품번호 ${x[2]}) ${x[3] || ''}`.trim()), ''];
  const pathL = s => ['둘러본 순서', s, ''];
  const hist = (n, k, ...xs) => [`상담 이력 (이 브라우저) : 챗봇 ${n} 번 · 상담 연결 ${k} 번`, ...xs.map(x => `· ${x}`), ''];
  const coat = ['울 블렌드 벨티드 롱코트', '189,000원', 12, '3번 봄'], trench = ['싱글 브레스티드 트렌치코트', '159,000원', 13], knit = ['메리노 울 라운드 니트', '79,000원', 24, '2번 봄'], dress = ['플로럴 미디 원피스', '89,000원', 32], muffler = ['캐시미어 머플러 & 기프트 박스', '79,000원', 41], slacks = ['세미 와이드 슬랙스', '59,000원', 39];
  const records = [
    rec('r1', now - 0.6 * H, ...P.a.slice(0, 2), '주문서', '결제 예정 268,000원', ['[상담 참고]', ...who(...P.a), '주문서 상품 (결제 예정 268,000원)', `· ${coat[0]} (상품번호 12)`, `· ${muffler[0]} (상품번호 41)`, '', ...seen(coat, muffler, trench), ...pathL('메인 → 아우터 → 울 블렌드 벨티드 롱코트 → 사이즈 가이드 → 장바구니 → 주문서'), ...hist(3, 0, '10/09 21:14 — 사이즈 상담 / 배송 안내')], P.a[2], P.a[3]),
    rec('r2', now - 2.5 * H, ...P.c.slice(0, 2), '카카오톡', '사이즈 상담', ['[상담 참고]', ...who(...P.c), ...seen(knit, dress), ...pathL('메인 → 장면 속 그 상품 → 메리노 울 라운드 니트 → 쇼핑 도우미'), ...hist(2, 1, '10/09 19:02 — 사이즈 상담 / 상담원 연결')], P.c[2], P.c[3]),
    rec('r3', now - 5 * H, ...P.b.slice(0, 2), '결제 완료', '주문번호 20261009-0000123', ['[상담 참고]', ...who(...P.b), '결제 완료 : 주문번호 20261009-0000123 · 248,000원', '구매 요약 : 누적 주문 6번 · 누적 구매 1,204,000원 · 적립금 12,400원 · 관심상품 4개', '', ...seen(trench, slacks), ...pathL('메인 → SALE → 쿠폰 뽑기 → 싱글 브레스티드 트렌치코트 → 주문서')], P.b[2], P.b[3]),
    rec('r3b', now - 6 * H, ...P.b.slice(0, 2), '주문서', '결제 예정 248,000원', ['[상담 참고]', ...who(...P.b), '주문서 상품 (결제 예정 248,000원)', `· ${trench[0]} (상품번호 13)`, `· ${slacks[0]} (상품번호 39)`, ''], P.b[2], P.b[3]),
    rec('r4', now - 9 * H, ...P.d.slice(0, 2), '상품 문의', '재입고 문의', ['[상담 참고]', ...who(...P.d), '상품 문의 : 재입고 문의', `· 상품 : ${dress[0]} (상품번호 32)`, '· 내용 : M 사이즈 재입고 예정이 있을까요?', '', ...seen(dress)], P.d[2], P.d[3]),
    rec('r5', now - 1.1 * D, ...P.e.slice(0, 2), '챗봇', '배송 안내', ['[상담 참고]', ...who(...P.e), ...seen(knit), ...pathL('메인 → 상의 → 메리노 울 라운드 니트'), ...hist(1, 0, '10/08 22:40 — 배송 안내')], P.e[2], P.e[3]),
    rec('r6', now - 1.6 * D, ...P.f.slice(0, 2), '주문서', '결제 예정 89,000원', ['[상담 참고]', ...who(...P.f), '주문서 상품 (결제 예정 89,000원)', `· ${dress[0]} (상품번호 32)`, '', ...seen(dress, knit), ...hist(2, 0, '10/08 13:05 — 교환·반품·환불 / 스타일 추천')], P.f[2], P.f[3]),
  ];
  const notes = [
    { id: 'r1', nid: 'n1', at: now - 0.4 * H, by: '관리자', text: '롱코트 M/L 고민 중 — 어깨 넓은 편이라 L 추천드림. 결제 안 하면 내일 오전 문자 한 번', due: new Date(now).toISOString().slice(0, 10), done: '' },
    { id: 'r2', nid: 'n2', at: now - 2 * H, by: '관리자', text: '카톡으로 실측 보내드림 (가슴단면 54cm)', due: '', done: '' },
    { id: 'r3', nid: 'n3', at: now - 4 * H, by: '관리자', text: 'VIP · 포장 신경 써서 발송', due: '', done: '' },
  ];
  return { ok: true, records, notes };
}

const shots = {
  /* 첫 화면 (PC · 휴대폰) */
  'home-pc': async pg => { await open(pg, '/', PC); },
  'home-mobile': async pg => { await open(pg, '/', MOBILE); },

  /* 1. 무료회원 웰컴 쿠폰팩 : 플로팅 쿠폰 버튼 → 작은 창 */
  'welcome-pc': async pg => {
    await open(pg, '/', PC);
    await click(pg, '.s9-float__btn--wp'); await sleep(3500);
  },
  'welcome-page': async pg => { await open(pg, '/wear/welcome.html?pop=1', MOBILE); return { full: true }; },

  /* 2. 쿠폰 이벤트 (세일 페이지 쿠폰 뽑기) */
  'coupon-pick': async pg => {
    await open(pg, '/product/list.html?cate_no=27', PC); await noHeader(pg); await noFloat(pg);
    await scrollTo(pg, '.sl-coupon', 0);
    const r = await rect(pg, '.sl-coupon');
    return { clip: { x: 0, y: r.y, width: 1280, height: Math.min(r.height, 1000) } };
  },
  'coupon-pick-mobile': async pg => {
    await open(pg, '/product/list.html?cate_no=27', MOBILE); await noHeader(pg); await noFloat(pg);
    await scrollTo(pg, '.sl-coupon', 0);
  },

  /* 3. 마감 카운트다운 : 세일 페이지 위쪽 타이머 + 타이머 팝업 */
  'countdown-sale': async pg => { await open(pg, '/product/list.html?cate_no=27', PC); await noFloat(pg); },
  'countdown-pop': async pg => {
    await open(pg, '/', PC, { keepPop: true }); await sleep(1500);
    await click(pg, '.cz-pop__dots button'); await sleep(1200);   // 타이머가 붙은 첫 장
    const r = await rect(pg, '.cz-pop__box');
    return { clip: { x: r.x - 30, y: r.y - 30, width: r.width + 60, height: r.height + 60 } };
  },

  /* 4. 타임세일 : 상품 카드 배지 + 상세 배너 */
  'timesale-card': async pg => {
    await open(pg, '/', PC); await noHeader(pg); await noFloat(pg);
    await scrollTo(pg, '.st-ts', 380);
    const r = await pg.evaluate(() => {
      const ts = document.querySelector('.st-ts'), li = ts.closest('li') || ts.parentElement.parentElement;
      const b = li.getBoundingClientRect();
      return { y: b.top + scrollY, h: b.height, href: (li.querySelector('a[href*="product"]') || {}).href || '' };
    });
    fs.writeFileSync(path.join(OUT, 'timesale-href.txt'), r.href);
    return { clip: { x: 0, y: Math.max(0, r.y - 40), width: 1280, height: r.h + 80 } };
  },
  'timesale-detail': async pg => {
    const href = fs.readFileSync(path.join(OUT, 'timesale-href.txt'), 'utf8').trim();
    await open(pg, href.replace(/^https?:\/\/[^/]+/, ''), PC, { moving: true });
  },
  'timesale-detail-mobile': async pg => {
    const href = fs.readFileSync(path.join(OUT, 'timesale-href.txt'), 'utf8').trim();
    await open(pg, href.replace(/^https?:\/\/[^/]+/, ''), MOBILE, { moving: true });
  },

  /* 5. 재방문 환영 쿠폰 : 사흘 전에 왔던 손님으로 챗봇을 연다 */
  'revisit': async pg => {
    await pg.evaluateOnNewDocument(() => {
      if (sessionStorage.getItem('__seed')) return; sessionStorage.setItem('__seed', 1);
      const t = Date.now() - 3 * 864e5;
      localStorage.setItem('shop-helper-visit', JSON.stringify({ n: 2, last: t, start: t - 600000 }));
    });
    await open(pg, '/', MOBILE);
    await click(pg, '.wh-fab'); await sleep(3500);
  },

  /* 6. 착장 제품 즉시 구매 (장면 속 그 상품) */
  'looks': async pg => {
    await open(pg, '/', PC); await noHeader(pg); await noFloat(pg);
    await scrollTo(pg, '.cz-looks', 0); await sleep(1500);
  },
  'looks-qv': async pg => {
    await open(pg, '/', PC); await noHeader(pg); await noFloat(pg);
    await scrollTo(pg, '.cz-looks', 0); await sleep(1500);
    await click(pg, '.cz-look__spot'); await sleep(2500);
  },

  /* 7. 24시 챗봇 */
  'chat': async pg => { await open(pg, '/', MOBILE); await click(pg, '.wh-fab'); await sleep(3500); },
  'chat-pc': async pg => { await open(pg, '/', PC); await click(pg, '.wh-fab'); await sleep(3500); },

  /* 8. 상담 · CRM 관리 페이지 ([예시] 기록) */
  'admin': async pg => {
    await adminSetup(pg); await open(pg, '/addons/shop-helper/admin.html', { width: 1360, height: 860, deviceScaleFactor: 2 }, { wait: 5000 });
  },
  'admin-detail': async pg => {
    await adminSetup(pg); await open(pg, '/addons/shop-helper/admin.html', { width: 1360, height: 860, deviceScaleFactor: 2 }, { wait: 5000 });
    await click(pg, '.sha-table tbody tr[data-p]'); await sleep(2500);
  },
};
async function adminSetup(pg) {
  await pg.evaluateOnNewDocument(() => { localStorage.setItem('shop-helper-admin-key', 'DEMO-KEY'); });
  await pg.setRequestInterception(true);
  pg.on('request', req => {
    if (/script\.google(usercontent)?\.com/.test(req.url())) {
      let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch (e) {}
      const data = body.type === 'list' ? demoSheet() : { ok: true };
      return req.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
    }
    // 상품 문의 게시판은 실제 글 대신 빈 목록 (예시 기록만 보이게)
    if (/\/board\/product\/list\.html/.test(req.url())) return req.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<html><body><table class="boardList"><tbody></tbody></table></body></html>' });
    req.continue();
  });
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000 });
  for (const [name, fn] of Object.entries(shots)) {
    if (only && !only.includes(name)) continue;
    const ctx = await b.createBrowserContext();   // 기능마다 새 손님 (방문 기록 · 팝업 기록이 섞이지 않게)
    const pg = await ctx.newPage();
    try {
      const o = (await fn(pg)) || {};
      const file = path.join(OUT, name + '.png');
      if (o.clip) await pg.screenshot({ path: file, clip: o.clip });
      else await pg.screenshot({ path: file, fullPage: !!o.full });
      console.log('ok', name);
    } catch (e) { console.log('FAIL', name, e.message); }
    await ctx.close();
  }
  await b.close();
})();
