/* 쇼핑 도우미 화면 테스트 (wear902 스킨 안) : PC · 모바일 · 편집 모드에서 메뉴 → 질문 → 답을 눌러 보고 화면을 찍는다.
   게시판은 가짜 응답(자주묻는질문 2개 · 설정 글 1개)을 붙인다. 카페24 서버 없이 로컬 미리보기로.
   1) node docs/tools/serve.js &   2) NODE_PATH=$(npm root -g) node docs/tools/shop-helper/helper-test.js
   DEMO=1 이면 모바일 시연 영상(webm)을 OUT/rec 에 녹화. FONTS=<글꼴 폴더> 가 있으면 Pretendard · gsap 를 로컬 파일로 */
const { chromium } = require('playwright');
const fs = require('fs'), F = process.env.FONTS || '/nonexistent';
const out = process.env.OUT || '_deploy/shop-helper';
fs.mkdirSync(out, { recursive: true });
const listHtml = rows => `<html><body><div class="ec-base-table typeList"><table><tbody module="board_list_1002">${rows.map(r => `<tr><td>${r.no}</td><td class="subject"><a href="/article/x/${r.b}/${r.no}/">${r.t}</a></td><td></td><td>${r.w || '운영자'}</td></tr>`).join('')}</tbody></table></div></body></html>`;
const posts = {
  '3/101': '<p>세탁은 찬물 손세탁을 권해요. 니트는 눕혀서 말려 주세요.</p><p>키워드: 세탁, 빨래, 드라이, 니트 관리</p><p>버튼: 관리 가이드 /wear/guide.html</p>',
  '3/102': '<p>네, 선물 포장이 가능해요. 주문서 배송 메모에 「선물 포장」이라고 적어 주세요. (2,000원)</p><p>키워드: 포장, 선물 포장, 쇼핑백</p>',
  '2/201': '<p>보이기: 예</p><p>이름: wear902 도우미</p><p>인사말: 반가워요! wear902 도우미예요.<br>무엇이든 물어보세요.</p><p>운영 시간: 평일 10:00 – 17:00</p><p>── 1번 · 질문과 답 ──</p><p>분류: 배송 안내</p><p>질문: 오늘 주문하면 언제 와요?</p><p>키워드: 오늘 주문, 당일 출고, 언제 와</p><p>답변: 평일 오후 2시 전 주문은 오늘 출고돼요!<br>보통 내일 받아 보실 수 있어요.</p><p>버튼: 주문 조회 /myshop/order/list.html</p><p>이어서: 교환 · 반품</p>'
};
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, mobile, path] of (process.env.DEMO ? [['demo', { width: 390, height: 844 }, true, '/']] : [['desk', { width: 1440, height: 900 }, false, '/'], ['mob', { width: 390, height: 844 }, true, '/product/list.html?cate_no=24'], ['edit', { width: 1440, height: 900 }, false, '/?edit=1']])) {
    const ctx = await b.newContext(Object.assign({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile }, name === 'demo' ? { recordVideo: { dir: out + '/rec', size: { width: 780, height: 1688 } } } : {}));
    await ctx.route(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/, async r => {
      const u = r.request().url();
      if (/pretendard/.test(u)) { const m = u.match(/dist\/web\/(.+)$/); const p = F + '/pretendard-1.3.9/dist/web/' + (m ? m[1].replace('-dynamic-subset.min', '').replace('.min', '') : ''); if (m && fs.existsSync(p)) return r.fulfill({ path: p }); }
      if (/gsap\.min/.test(u)) return r.fulfill({ path: F + '/gsap-3.12.5/dist/gsap.min.js' });
      if (/ScrollTrigger/.test(u)) return r.fulfill({ path: F + '/gsap-3.12.5/dist/ScrollTrigger.min.js' });
      if (/lenis/.test(u)) return r.fulfill({ path: F + '/lenis-1.1.18/dist/lenis.min.js' });
      r.abort();
    });
    await ctx.route(/\/board\/free\/list\.html/, r => {
      const u = r.request().url(), bn = (u.match(/board_no=(\d+)/) || [])[1], pg = +(u.match(/page=(\d+)/) || [0, 1])[1];
      if (pg > 1) return r.fulfill({ contentType: 'text/html', body: listHtml([]) });
      if (bn === '3') return r.fulfill({ contentType: 'text/html', body: listHtml([{ no: 102, b: 3, t: '선물 포장 되나요?' }, { no: 101, b: 3, t: '옷 세탁은 어떻게 해요?' }]) });
      if (bn === '2') return r.fulfill({ contentType: 'text/html', body: listHtml([{ no: 201, b: 2, t: '[모든 페이지] 쇼핑 도우미' }]) });
      r.fulfill({ contentType: 'text/html', body: listHtml([]) });
    });
    await ctx.route(/\/article\//, r => {
      const m = r.request().url().match(/\/article\/x\/(\d+)\/(\d+)/);
      r.fulfill({ contentType: 'text/html', body: `<div data-wear902-content>${posts[m[1] + '/' + m[2]] || ''}</div>` });
    });
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => { if (!/\$|jQuery|EC\$/.test(e.message)) errs.push(e.message); });
    await pg.goto('http://localhost:8765' + path, { waitUntil: 'networkidle' });
    await pg.addStyleTag({ content: '#cz-pop,.st-intro{display:none!important}' });
    await pg.waitForTimeout(1500);
    const hasFab = await pg.$('[data-s9="helper"]');
    console.log(name, 'fab', !!hasFab, 'cms attr', await pg.evaluate(() => { const f = document.querySelector('[data-s9="helper"]'); return f && f.getAttribute('data-cms'); }));
    if (name === 'edit') {
      console.log('bar has helper btn', await pg.evaluate(() => !!document.querySelector('[data-cms="쇼핑 도우미"]').__cmsBtn));
      const d = await pg.evaluate(() => { localStorage.removeItem('x'); return 1; });
    }
    if (name === 'demo') await pg.waitForTimeout(1200);
    await pg.click('[data-s9="helper"]');
    await pg.waitForTimeout(name === 'demo' ? 2200 : 900);
    await pg.screenshot({ path: `${out}/${name}-1.png` });
    const last = () => pg.evaluate(() => { const m = [...document.querySelectorAll('.wh-msg--bot')].pop(); return m.innerText.replace(/\n+/g, ' | ').slice(0, 260); });
    console.log(`[${name}] menu: ` + await pg.evaluate(() => [...document.querySelectorAll('.wh-menu:not(.wh-menu--q) .wh-item b')].map(b => b.textContent).join(' / ')));
    const steps = name === 'demo' ? [['cat', '배송 안내'], ['q', '오늘 주문하면 언제 와요?'], ['chip', '처음 메뉴'], ['cat', '교환 · 반품 · 환불'], ['q', '환불은 언제 돼요?'], ['chip', '처음 메뉴'], ['cat', '상담원 연결'], ['ask', '니트 세탁 어떻게 해요']] : name === 'edit' ? [['ask', '반려견 동반 매장 있어요?']] : [['cat', '배송 안내'], ['q', '오늘 주문하면 언제 와요?'], ['chip', '처음 메뉴'], ['cat', '상담원 연결'], ['chip', '처음 메뉴'], ['cat', '자주 묻는 질문']];
    for (const [k, v] of steps) {
      if (k === 'cat') await pg.click(`.wh-msg:last-child [data-cat="${v}"]`);
      else if (k === 'q') await pg.click(`.wh-msg:last-child .wh-item[data-ask="${v}"]`);
      else if (k === 'chip') await pg.click(`.wh-msg:last-child .wh-chip[data-ask="${v}"]`);
      else { await pg.click('.wh-form input'); await pg.keyboard.type(v, { delay: name === 'demo' ? 90 : 0 }); await pg.press('.wh-form input', 'Enter'); }
      await pg.waitForTimeout(name === 'demo' ? 2200 : 700);
      console.log(`  ${k} ${v} -> ${await last()}`);
      if (k === 'q' || (name === 'mob' && k === 'cat' && v === '배송 안내')) await pg.screenshot({ path: `${out}/${name}-${k}.png` });
    }
    await pg.screenshot({ path: `${out}/${name}-2.png` });
    if (errs.length) console.log('errors', errs);
    await ctx.close();
  }
  await b.close();
})();
