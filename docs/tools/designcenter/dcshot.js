// 디자인센터 등록 이미지용 샘플몰 캡처 → _deploy/dc/*.png (listing-images.py 가 쓴다)
//   desk : PC 메인 첫 화면 · mobile-list : 휴대폰 아우터 목록 · mobile-sale : 휴대폰 SALE 페이지 · mobile-style : 휴대폰 메인 「스타일 고르기」
//   등록 이미지 3장이 서로 다른 화면이 되도록 나눠 찍는다 (같은 첫 화면이 반복되지 않게)
const puppeteer = require('puppeteer-core');
const OUT = require('path').resolve(__dirname, '../../../_deploy/dc') + '/';
const SITE = 'https://ecudemo409091.cafe24.com/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const pg = await b.newPage();
  await pg.setUserAgent((await b.userAgent()).replace('HeadlessChrome', 'Chrome'));
  const shots = [
    ['desk', { width: 1280, height: 820 }, ''],
    ['desk-sale', { width: 1280, height: 820 }, 'product/list.html?cate_no=27'],
    ['mobile-list', MOBILE, 'product/list.html?cate_no=24'],
    ['mobile-sale', MOBILE, 'product/list.html?cate_no=27'],
    ['mobile-style', MOBILE, '', '스타일 고르기'],
  ];
  for (const [name, vp, url, sec] of shots) {
    await pg.setViewport(vp);
    await pg.goto(SITE + url, { waitUntil: 'networkidle2', timeout: 90000 });
    if (/challenge/.test(pg.url())) { console.log('CHALLENGE'); break; }
    await sleep(4000);
    await pg.addStyleTag({ content: '*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important} #cz-pop,.cz-pop{display:none!important}' });
    await pg.evaluate(() => { const v = document.querySelector('.pe-world-video'); if (v) { v.pause(); v.currentTime = 1.2; } });
    if (sec) {
      // 끝까지 한 번 내려 지연 로딩 사진을 불러온 뒤 섹션 위로
      for (let y = 0; y < 12000; y += 600) { await pg.evaluate(y => window.scrollTo(0, y), y); await sleep(80); }
      await pg.evaluate(sec => { const s = [...document.querySelectorAll('[data-cms]')].find(e => e.getAttribute('data-cms') === sec); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 110); }, sec);
      await sleep(2500);
    }
    await sleep(1500);
    await pg.screenshot({ path: OUT + name + '.png' });
    console.log('ok', name);
  }
  await b.close();
})();
