// 디자인센터 등록 이미지 3장 + 셀링 포인트 5개 (쇼핑몰과 같은 흑백 톤 · Pretendard · Jost)
//   node docs/tools/designcenter/listing-badges.js
// 입력 : _deploy/dc/desk.png (PC 1280×820) · mobile-list.png (휴대폰 @2x) — dcshot.js 로 찍는다
// 출력 : _deploy/dc/badge/main.jpg 372×372 (목록 카드) · display.jpg 330×489 · thumb.jpg 330×450
//        HTML 로 그려 2배로 캡처한 뒤 ffmpeg 로 줄인다 (글자가 또렷하게)
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const DC = path.resolve(__dirname, '../../../_deploy/dc');
const OUT = path.join(DC, 'badge'); fs.mkdirSync(OUT, { recursive: true });
const url = f => 'file:///' + path.join(DC, f).replace(/\\/g, '/');

const POINTS = ['쿠폰 뽑기', '타임세일', '마감 카운트다운', '룩북 체크 구매', '코딩 없이 쉬운 편집'];

// pc : [x, y, 폭] · phone : [오른쪽 여백, 아래 여백, 폭] · kit : [x, y] 셀링 포인트 블록 위치
const SIZES = {
  main:    { w: 372, h: 372, pc: [14, 14, 300], phone: [14, 14, 104], kit: [16, 214], fs: 11 },
  display: { w: 330, h: 489, pc: [12, 14, 306], phone: [14, 14, 124], kit: [14, 232], fs: 12.5 },
  thumb:   { w: 330, h: 450, pc: [12, 14, 306], phone: [14, 14, 116], kit: [14, 226], fs: 12 },
};

const html = s => `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&display=block">
<style>
*{margin:0;box-sizing:border-box}
body{width:${s.w}px;height:${s.h}px;background:#ededed;position:relative;overflow:hidden;font-family:'Pretendard Variable',Pretendard,sans-serif;color:#242424}
.pc{position:absolute;left:${s.pc[0]}px;top:${s.pc[1]}px;width:${s.pc[2]}px;border-radius:7px;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.14);background:#fff}
.pc img{display:block;width:100%}
.ph{position:absolute;right:${s.phone[0]}px;bottom:${s.phone[1]}px;width:${s.phone[2] + 8}px;height:${Math.round(s.phone[2] * 1.95) + 8}px;padding:4px;border-radius:17px;background:#111;box-shadow:0 14px 28px rgba(0,0,0,.22)}
.ph div{width:100%;height:100%;border-radius:13px;overflow:hidden;background:#fff}.ph img{display:block;width:100%}
.kit{position:absolute;left:${s.kit[0]}px;top:${s.kit[1]}px}
.kit small{display:block;font:500 ${s.fs - 3.5}px/1 Jost,sans-serif;letter-spacing:.24em;color:#8a8a8a;margin:0 0 7px 2px}
.kit ul{list-style:none;padding:0;display:flex;flex-direction:column;align-items:flex-start;gap:${Math.round(s.fs * .42)}px}
.kit li{display:flex;align-items:center;gap:7px;height:${Math.round(s.fs * 2.05)}px;padding:0 ${Math.round(s.fs * 1.05)}px 0 ${Math.round(s.fs * .85)}px;border-radius:999px;background:#242424;color:#fff;font-size:${s.fs}px;font-weight:600;letter-spacing:-.02em;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.12)}
.kit li b{font:500 ${s.fs - 2.5}px/1 Jost,sans-serif;letter-spacing:.04em;color:#9d9d9d}
</style>
<div class="pc"><img src="${url('desk.png')}"></div>
<div class="ph"><div><img src="${url('mobile-list.png')}"></div></div>
<div class="kit"><small>MARKETING KIT</small><ul>${POINTS.map((p, i) => `<li><b>0${i + 1}</b>${p}</li>`).join('')}</ul></div>`;

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage();
  for (const [name, s] of Object.entries(SIZES)) {
    await pg.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 2 });
    const tmp = path.join(OUT, name + '.html'); fs.writeFileSync(tmp, html(s));
    await pg.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready);
    const png = path.join(OUT, name + '@2x.png'); await pg.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', `scale=${s.w}:${s.h}:flags=lanczos`, '-q:v', '2', path.join(OUT, name + '.jpg')]);
    fs.unlinkSync(tmp); fs.unlinkSync(png);
    console.log(name, s.w + '×' + s.h, fs.statSync(path.join(OUT, name + '.jpg')).size);
  }
  await b.close();
})();
