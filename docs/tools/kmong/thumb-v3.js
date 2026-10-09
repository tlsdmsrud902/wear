// 크몽 썸네일 v3 (652×488, 2배로 그림) : 쇼핑몰을 준비하는 사람이 목록(가로 214px)에서도 읽히게 — 큰 제목 2~3줄 · 한 문구 강조 · 아래 키워드 띠 · 오른쪽 휴대폰 화면
//   node docs/tools/kmong/thumb-v3.js   → _deploy/kmong/thumb-v3/thumb-A|B|C.jpg (652×488) · @2x (1304×976)
// 화면 캡처는 상세 v3 이미지(designcenter/wear902/v3)를 쓴다. 크몽 규정상 주소 · 연락처는 넣지 않는다
const puppeteer = require('../designcenter/node_modules/puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../../..');
const OUT = path.join(ROOT, '_deploy/kmong/thumb-v3');
fs.mkdirSync(OUT, { recursive: true });
const img = n => 'file:///' + path.join(ROOT, 'designcenter/wear902/v3', n + '.jpg').replace(/\\/g, '/');

const BASE = `*{margin:0;padding:0;box-sizing:border-box}
body{width:652px;height:488px;overflow:hidden;font-family:Pretendard,'Malgun Gothic',sans-serif;letter-spacing:-.04em;-webkit-font-smoothing:antialiased}
.c{position:relative;width:652px;height:488px;overflow:hidden}
.ph{position:absolute;border:6px solid #111;border-radius:30px;overflow:hidden;background:#111;box-shadow:0 22px 40px -14px rgba(0,0,0,.45)}
.ph img{display:block;width:100%;border-radius:24px}
.pill{display:inline-block;padding:7px 15px 8px;border-radius:999px;font-size:19px;font-weight:800;letter-spacing:-.02em}
.bar{position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;align-items:center;justify-content:center;gap:0;font-size:22px;font-weight:800}
.bar span{padding:0 18px}.bar span+span{border-left:2px solid currentColor}`;

const V = {
  /* A : 흰 바탕 · 파랑 강조 · 휴대폰 2대 (쿠폰팩 · 재방문 쿠폰) */
  A: `<style>${BASE}
.c{background:linear-gradient(135deg,#ffffff 0%,#eef2ff 100%)}
.t{position:absolute;left:34px;top:34px}
.pill{background:#111;color:#fff}
.h{margin:18px 0 0;font-size:66px;font-weight:900;line-height:1.12;color:#111}
.h b{color:#2F5BFF}
.s{margin:16px 0 0;font-size:24px;font-weight:800;color:#333}.s i{font-style:normal;background:linear-gradient(transparent 58%,#ffe14d 58%)}
.bar{background:#2F5BFF;color:#fff}.bar span+span{border-color:rgba(255,255,255,.45)}
</style><div class="c">
<div class="t"><span class="pill">카페24 쇼핑몰 스킨</span>
<p class="h">마케팅까지<br><b>다 되는</b><br>쇼핑몰</p>
<p class="s"><i>개발비 0원</i> · 오늘 바로 오픈</p></div>
<div class="ph" style="right:118px;top:62px;width:150px;transform:rotate(-6deg)"><img src="${img('welcome-page')}"></div>
<div class="ph" style="right:-14px;top:30px;width:162px;transform:rotate(5deg)"><img src="${img('revisit')}"></div>
<div class="bar"><span>쿠폰 · 타임세일</span><span>24시 무료 챗봇</span><span>고객관리 CRM</span></div>
</div>`,

  /* B : 검정 · 노랑 — 목록에서 가장 눈에 띄는 대비 */
  B: `<style>${BASE}
.c{background:#111}
.t{position:absolute;left:34px;top:36px}
.k{font-size:27px;font-weight:800;color:#fff}
.h{margin:12px 0 0;font-size:72px;font-weight:900;line-height:1.1;color:#fff}
.h b{color:#FFD43B}
.chips{margin:20px 0 0;display:flex;flex-wrap:wrap;gap:8px;width:330px}
.chips span{padding:7px 13px 8px;border-radius:10px;background:#2a2a2a;color:#fff;font-size:18px;font-weight:800}
.bar{background:#FFD43B;color:#111}
</style><div class="c">
<div class="t"><p class="k">쇼핑몰 처음이라면</p>
<p class="h">팔리는 스킨<br><b>바로 오픈!</b></p>
<div class="chips"><span>쿠폰 뽑기</span><span>마감 타이머</span><span>타임세일</span><span>무료 챗봇</span></div></div>
<div class="ph" style="right:30px;top:26px;width:190px;border-color:#2a2a2a;transform:rotate(4deg)"><img src="${img('countdown-pop')}"></div>
<div class="bar"><span>마케팅 · CRM 기능 8가지 기본 탑재</span></div>
</div>`,

  /* C : 파랑 그라데이션 · ALL IN ONE — 휴대폰 3대를 부채꼴로 */
  C: `<style>${BASE}
.c{background:linear-gradient(140deg,#1d3fd6 0%,#2F5BFF 55%,#5b7cff 100%)}
.big{position:absolute;left:-6px;top:-14px;font-family:Jost,Pretendard,sans-serif;font-size:118px;font-weight:700;letter-spacing:-.03em;color:rgba(255,255,255,.12);white-space:nowrap}
.t{position:absolute;left:34px;top:44px}
.pill{background:#fff;color:#2F5BFF;padding:8px 18px 9px;font-size:21px}
.pill b{font-size:34px;font-weight:900;letter-spacing:-.03em;vertical-align:-3px;margin-right:4px}
.h{margin:16px 0 0;font-size:56px;font-weight:900;line-height:1.16;color:#fff}
.h b{color:#FFE14D}
.s{margin:14px 0 0;font-size:23px;font-weight:700;color:#dfe6ff}
.bar{background:#fff;color:#1d3fd6}.bar span+span{border-color:#c9d4ff}
</style><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@700&display=swap"><div class="c">
<p class="big">ALL IN ONE</p>
<div class="t"><span class="pill"><b>카페24</b> 올인원 스킨</span>
<p class="h">스킨 하나로<br><b>마케팅 · CRM</b><br>끝!</p>
<p class="s">따로 개발할 기능, 전부 기본 탑재</p></div>
<div class="ph" style="right:150px;top:96px;width:128px;transform:rotate(-9deg)"><img src="${img('welcome-page')}"></div>
<div class="ph" style="right:16px;top:96px;width:128px;transform:rotate(9deg)"><img src="${img('revisit')}"></div>
<div class="ph" style="right:78px;top:60px;width:142px;z-index:2"><img src="${img('chat')}"></div>
<div class="bar"><span>웰컴 쿠폰</span><span>타임세일</span><span>24시 챗봇</span><span>CRM</span></div>
</div>`,
};

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 652, height: 488, deviceScaleFactor: 2 });
  for (const [k, html] of Object.entries(V)) {
    const file = path.join(OUT, `thumb-${k}.html`);
    fs.writeFileSync(file, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"></head><body>${html}</body></html>`);
    await pg.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 600));
    const png = path.join(OUT, `thumb-${k}@2x.png`);
    await pg.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', path.join(OUT, `thumb-${k}@2x.jpg`)]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=652:488:flags=lanczos', '-q:v', '2', path.join(OUT, `thumb-${k}.jpg`)]);
    fs.unlinkSync(png);
    console.log('ok', k);
  }
  await b.close();
})();
