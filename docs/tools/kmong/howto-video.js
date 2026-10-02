// 크몽 사용법 영상 (업종별) : 캡처한 화면(1568×705)에 커서 · 클릭 표시 · STEP 자막을 얹어 1600×900 MP4 로 만든다
//   node docs/tools/kmong/howto-video.js <장면 설정.json> <출력.mp4>
// 장면 설정 : { brand, accent, accentText, frames: "<캡처 폴더>", scenes: [ { img, badge, title, sub, sec, cursor:[x,y], click:true, ring:[x,y,w,h] } ] }
//   img 가 "intro" / "outro" 면 글자 카드. 좌표는 캡처 화면(1568×705) 기준.
//   ⚠ 관리자 주소(?edit=1)는 자막 · 화면 어디에도 넣지 않는다 (영업 비밀)
const puppeteer = require('../designcenter/node_modules/puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const [cfgPath, out] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const FR = path.resolve(path.dirname(cfgPath), cfg.frames);
const TMP = path.join(path.dirname(path.resolve(out)), 'tmp-howto'); fs.mkdirSync(TMP, { recursive: true });
const K = 1600 / 1568;   // 캡처 → 영상 배율
const W = 1600, H = 900, PH = 720;
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FONT = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">';
const CURSOR = '<svg width="34" height="40" viewBox="0 0 17 20"><path d="M1 1 L1 16 L5 12.4 L7.8 18.6 L10.3 17.5 L7.6 11.5 L12.6 11.5 Z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';

function card(s) {
  return `<div style="position:absolute;inset:0;background:radial-gradient(120% 120% at 85% 10%,#2b2b2b 0%,#111 55%,#0a0a0a 100%);display:flex;flex-direction:column;justify-content:center;padding:0 140px">
  <div style="font:700 22px Pretendard;letter-spacing:.22em;color:${cfg.accent}">${esc(s.kicker)}</div>
  <div style="margin-top:22px;font:800 76px/1.18 Pretendard;letter-spacing:-.03em;color:#fff">${s.title}</div>
  <div style="margin-top:26px;font:500 28px Pretendard;color:#bdbdbd">${esc(s.sub)}</div>
  <div style="position:absolute;right:140px;bottom:90px;font:italic 600 34px 'Playfair Display',serif;color:#fff;opacity:.9">${esc(cfg.brand)}</div></div>`;
}
function shot(s) {
  const img = 'file:///' + path.join(FR, s.img + '.jpg').split(path.sep).join('/');
  // zoom : [배율, 기준 x, 기준 y] — 편집 창처럼 글씨가 작은 화면을 키운다 (기준점은 제자리)
  const z = s.zoom || cfg.zoom && s.img !== 'intro' && cfg.zoomScenes && cfg.zoomScenes.includes(s.img) && cfg.zoom;
  let o = z ? `<div style="position:absolute;left:0;top:0;width:${W}px;height:${PH}px;overflow:hidden"><div style="position:absolute;inset:0;transform:scale(${z[0]});transform-origin:${z[1] * K}px ${z[2] * K}px">` : '';
  o += `<img src="${img}" style="position:absolute;left:0;top:0;width:${W}px;height:${PH}px;object-fit:cover">`;
  if (s.dim) o += `<div style="position:absolute;left:0;top:0;width:${W}px;height:${PH}px;background:rgba(0,0,0,.35)"></div>`;
  if (s.ring) { const [x, y, w, h] = s.ring.map(v => v * K); o += `<div style="position:absolute;left:${x - 6}px;top:${y - 6}px;width:${w + 12}px;height:${h + 12}px;border:4px solid ${cfg.ring || '#ff3b30'};border-radius:12px;box-shadow:0 0 0 6px rgba(255,59,48,.18)"></div>`; }
  if (s.cursor) {
    const [x, y] = s.cursor.map(v => v * K);
    if (s.click) o += `<div style="position:absolute;left:${x - 15}px;top:${y - 15}px;width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,59,48,.95)"></div>`;
    o += `<div style="position:absolute;left:${x - 3}px;top:${y - 2}px;transform:scale(${z ? 1 / z[0] : 1});transform-origin:3px 2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">${CURSOR}</div>`;
  }
  if (z) o += '</div></div>';
  o += `<div style="position:absolute;left:0;top:${PH}px;width:${W}px;height:${H - PH}px;background:#141414;display:flex;align-items:center;padding:0 48px;gap:26px">
    <div style="flex:none;padding:10px 20px;border-radius:10px;background:${s.badgeBg || cfg.accent};color:${cfg.accentText};font:800 26px Pretendard;letter-spacing:.06em">${esc(s.badge)}</div>
    <div><div style="font:800 40px/1.25 Pretendard;letter-spacing:-.03em;color:#fff">${esc(s.title)}</div>
    <div style="margin-top:8px;font:500 24px Pretendard;color:#a9a9a9">${esc(s.sub)}</div></div></div>`;
  return o;
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage(); await pg.setViewport({ width: W, height: H });
  const clips = [];
  for (let i = 0; i < cfg.scenes.length; i++) {
    const s = cfg.scenes[i];
    const body = s.img === 'intro' || s.img === 'outro' ? card(s) : shot(s);
    fs.writeFileSync(path.join(TMP, 's.html'), `<!doctype html><html><head><meta charset="utf-8">${FONT}<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet"><style>body{margin:0;width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#000}</style></head><body>${body}</body></html>`);
    await pg.goto('file:///' + path.join(TMP, 's.html').split(path.sep).join('/'), { waitUntil: 'networkidle0', timeout: 60000 });
    await pg.evaluate(() => document.fonts.ready);
    const png = path.join(TMP, String(i).padStart(2, '0') + '.png');
    await pg.screenshot({ path: png });
    clips.push({ png, sec: s.sec, fade: s.fade == null ? 0.35 : s.fade });
  }
  await b.close();
  // 장면마다 정지 화면 → xfade 로 잇기
  const args = ['-v', 'error', '-y'];
  clips.forEach(c => args.push('-loop', '1', '-t', String(c.sec), '-framerate', '30', '-i', c.png));
  let f = '', last = '[0:v]', t = clips[0].sec;
  for (let i = 1; i < clips.length; i++) {
    const d = clips[i].fade, lab = i === clips.length - 1 ? '[v]' : `[x${i}]`;
    t -= d;
    f += `${last}[${i}:v]xfade=transition=fade:duration=${d}:offset=${t.toFixed(3)}${lab};`;
    last = lab; t += clips[i].sec;
  }
  args.push('-filter_complex', f.replace(/;$/, ''), '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-r', '30', '-movflags', '+faststart', out);
  execFileSync('ffmpeg', args);
  console.log(out, t.toFixed(1) + 's');
})();
