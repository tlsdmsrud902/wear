// 디자인센터 등록 이미지 v3 — 대표 372×372 · 진열 330×489 · 목록 330×450
//   node docs/tools/designcenter/listing-v3.js   → designcenter/wear902/v3/listing/main.jpg · display.jpg · thumb.jpg
// 디자인센터 베스트(2026-10) 참고 : 큰 제목 대신 실제 쇼핑몰 화면을 꽉 채우고, 아래에 형광 노랑 배지 2~3개 + 스티커 하나
// 화면은 상세 v3 캡처 (PC 2번 장면 블루 수트 · 휴대폰 쿠폰팩). 트렌치 모델 첫 화면은 쓰지 않는다
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../../..');
const OUT = path.join(ROOT, 'designcenter/wear902/v3/listing');
fs.mkdirSync(OUT, { recursive: true });
const img = n => 'file:///' + path.join(ROOT, 'designcenter/wear902/v3', n + '.jpg').replace(/\\/g, '/');

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;font-family:Pretendard,'Malgun Gothic',sans-serif;letter-spacing:-.03em;-webkit-font-smoothing:antialiased}
.c{position:relative;overflow:hidden;background:linear-gradient(160deg,#f6f7fa 0%,#e7ebf5 100%)}
.pc{position:absolute;border:1px solid #d9dce3;border-top:9px solid #fff;border-radius:9px;overflow:hidden;background:#fff;box-shadow:0 16px 30px -14px rgba(20,30,60,.35)}
.pc img{display:block;width:100%}
.ph{position:absolute;border:5px solid #111;border-radius:22px;overflow:hidden;background:#111;box-shadow:0 18px 34px -10px rgba(20,30,60,.5)}
.ph img{display:block;width:100%;border-radius:17px}
.h{position:absolute;font-weight:900;line-height:1.16;color:#111;letter-spacing:-.05em}.h b{color:#2F5BFF}
.bd{display:inline-flex;align-items:center;gap:5px;border-radius:10px;font-weight:900;white-space:nowrap;box-shadow:0 6px 14px -6px rgba(0,0,0,.35)}
.bd i{font-style:normal}
.y{background:#FFE500;color:#111}.b{background:#2F5BFF;color:#fff}
.st{position:absolute;display:grid;place-items:center;border-radius:50%;background:#2F5BFF;color:#fff;font-weight:900;text-align:center;line-height:1.08;box-shadow:0 0 0 3px #fff,0 10px 22px -8px rgba(0,0,0,.45);transform:rotate(-10deg)}
.st small{display:block;font-weight:800;opacity:.9}`;
const B = [['🎁', '쿠폰·타임세일', 'y'], ['💬', '24시 무료 챗봇', 'y'], ['👥', '고객관리 CRM', 'b']];
const sticker = (x, y, d, f) => `<div class="st" style="left:${x}px;top:${y}px;width:${d}px;height:${d}px;font-size:${f}px"><span><small style="font-size:${Math.round(f * .68)}px">카페24</small>올인원<br>스킨</span></div>`;
const pc = (x, y, w) => `<div class="pc" style="left:${x}px;top:${y}px;width:${w}px"><img src="${img('home-pc')}"></div>`;
const ph = (x, y, w) => `<div class="ph" style="left:${x}px;top:${y}px;width:${w}px"><img src="${img('home-mobile-2')}"></div>`;

const V = {
  // 대표 (정사각형) : 위 제목 · 가운데 PC + 휴대폰 · 아래 배지 한 줄
  main: { w: 372, h: 372, html: `<div class="c" style="width:372px;height:372px">
${sticker(12, 10, 78, 15)}
<p class="h" style="left:100px;top:20px;font-size:25px">마케팅·CRM<br><b>다 되는 스킨</b></p>
${pc(14, 98, 282)}${ph(252, 104, 104)}
<div style="position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:6px">${B.map(([i, t, c]) => `<span class="bd ${c}" style="font-size:13.5px;padding:7px 9px"><i>${i}</i>${t.replace('24시 ', '')}</span>`).join('')}</div></div>` },
  // 진열 (세로 330×489)
  display: { w: 330, h: 489, html: `<div class="c" style="width:330px;height:489px">
${sticker(12, 12, 84, 16)}
<p class="h" style="left:108px;top:26px;font-size:27px">마케팅·CRM<br><b>다 되는 스킨</b></p>
${pc(14, 118, 300)}${ph(206, 196, 112)}
<div style="position:absolute;left:14px;bottom:16px;display:flex;flex-direction:column;align-items:flex-start;gap:8px">${B.map(([i, t, c]) => `<span class="bd ${c}" style="font-size:17px;padding:8px 12px"><i>${i}</i>${t}</span>`).join('')}</div></div>` },
  // 목록 (세로 330×450)
  thumb: { w: 330, h: 450, html: `<div class="c" style="width:330px;height:450px">
${sticker(12, 12, 82, 16)}
<p class="h" style="left:106px;top:24px;font-size:27px">마케팅·CRM<br><b>다 되는 스킨</b></p>
${pc(14, 112, 300)}${ph(208, 176, 108)}
<div style="position:absolute;left:14px;bottom:14px;display:flex;flex-direction:column;align-items:flex-start;gap:7px">${B.map(([i, t, c]) => `<span class="bd ${c}" style="font-size:16.5px;padding:8px 12px"><i>${i}</i>${t}</span>`).join('')}</div></div>` },
};

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage();
  for (const [k, v] of Object.entries(V)) {
    await pg.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 3 });
    const file = path.join(OUT, k + '.html');
    fs.writeFileSync(file, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"><style>${CSS}</style></head><body>${v.html}</body></html>`);
    await pg.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 500));
    const png = path.join(OUT, k + '.png');
    await pg.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', `scale=${v.w}:${v.h}:flags=lanczos`, '-q:v', '2', path.join(OUT, k + '.jpg')]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', `scale=${v.w * 2}:${v.h * 2}:flags=lanczos`, '-q:v', '2', path.join(OUT, k + '@2x.jpg')]);
    fs.unlinkSync(png); fs.unlinkSync(file);
    console.log('ok', k, v.w + 'x' + v.h);
  }
  await b.close();
})();
