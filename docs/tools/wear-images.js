// wear902 스킨 이미지 · 상품 이미지 · 글자 로고 만들기
//   node docs/tools/wear-images.js [skin|products|logo]      (저장소 루트에서, ffmpeg · playwright 필요)
//
// 실제 사진이 있으면 그 사진을 쓴다 : 저장소 루트 photos/ 폴더에 "만들 이름" 그대로 넣는다.
//   예) photos/scene-coat.jpg → SkinImg/wear/scene-coat.webp (가운데 기준으로 크기에 맞춰 자름)
//       photos/p01.jpg        → cafe24-assets/products/p01.jpg
// 사진이 없으면 패션 일러스트(옷걸이 · 행거 · 옷)를 그려서 자리를 채운다. → 사진을 받으면 photos/ 에 넣고 다시 실행
// photos/ 는 .gitignore 에 들어 있다 (원본 사진은 저장소에 올리지 않는다 — jsDelivr 50MB 제한)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'wear902_s2_260925195134_d_skin1_E/skin1/SkinImg/wear');
const PRD = path.join(ROOT, 'cafe24-assets/products');
const PHOTOS = path.join(ROOT, 'photos');
const TMP = path.join(require('os').tmpdir(), 'wear-images');
fs.mkdirSync(TMP, { recursive: true });

/* ---------- 색 ---------- */
const C = {
  ivory: '#f4efe8', ecru: '#e9e1d4', sand: '#dccbb4', camel: '#b98b5e', cocoa: '#6e5242', charcoal: '#2c2926',
  black: '#1f1d1c', blush: '#e8cfc6', rose: '#c98b80', wine: '#7a3b3f', sage: '#b9c0a6', olive: '#7d7f5c',
  sky: '#c7d3dc', denim: '#5d7590', navy: '#2f3b52', cream: '#f6f0e2', butter: '#efe0b4', grey: '#bdb8b1', white: '#fbfaf7'
};
const shade = (hex, k) => { // k < 0 어둡게, k > 0 밝게
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return '#' + [f(r), f(g), f(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
};

/* ---------- 옷 (400 × 520 상자, 위 가운데(200, 0) 이 옷걸이 고리) ---------- */
const hanger = `<g fill="none" stroke="#3a3530" stroke-width="5" stroke-linecap="round"><path d="M200 2 q14 0 14 12 q0 10 -14 16 v10"/><path d="M200 40 L96 74 h208 Z" stroke-width="4"/></g>`;
const knitTex = (id, c) => `<pattern id="${id}" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M0 0 l7 6 l7 -6 M0 6 l7 6 l7 -6" fill="none" stroke="${shade(c, -.12)}" stroke-width="1.6" opacity=".7"/></pattern>`;
const G = {
  coat: (c, o = {}) => `
    <path d="M120 60 L72 82 L42 334 L84 342 L108 160 Z" fill="${shade(c, -.06)}"/><path d="M280 60 L328 82 L358 334 L316 342 L292 160 Z" fill="${shade(c, -.06)}"/>
    <path d="M120 56 L170 44 L200 72 L230 44 L280 56 L298 162 L316 512 L84 512 L102 162 Z" fill="${c}"/>
    <path d="M170 44 L200 72 L176 210 L146 96 Z M230 44 L200 72 L224 210 L254 96 Z" fill="${shade(c, -.14)}"/>
    <path d="M200 72 V512" stroke="${shade(c, -.25)}" stroke-width="2"/>
    ${o.belt ? `<rect x="96" y="262" width="208" height="20" fill="${shade(c, -.12)}"/><rect x="186" y="258" width="28" height="28" rx="3" fill="none" stroke="${shade(c, -.35)}" stroke-width="3"/>` : ''}
    ${[232, 300, 368].map(y => `<circle cx="212" cy="${y}" r="6" fill="${shade(c, -.4)}"/>` + (o.belt ? `<circle cx="240" cy="${y}" r="6" fill="${shade(c, -.4)}"/>` : '')).join('')}
    <path d="M122 330 h46 M232 330 h46" stroke="${shade(c, -.22)}" stroke-width="3"/>`,
  dress: (c, o = {}) => `
    <path d="M152 58 L132 92 L118 128 L148 136 L160 104 Z M248 58 L268 92 L282 128 L252 136 L240 104 Z" fill="${shade(c, -.06)}"/>
    <path d="M152 58 Q200 92 248 58 L262 200 L244 236 L336 506 Q200 530 64 506 L156 236 L138 200 Z" fill="${c}"/>
    <path d="M150 230 Q200 246 250 230" stroke="${shade(c, -.25)}" stroke-width="5" fill="none"/>
    <path d="M190 240 l-26 70 M210 240 l24 72" stroke="${shade(c, -.25)}" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${o.dots ? `<clipPath id="dc"><path d="M152 58 Q200 92 248 58 L262 200 L244 236 L336 506 Q200 530 64 506 L156 236 L138 200 Z"/></clipPath><g clip-path="url(#dc)">` + Array.from({ length: 40 }, (_, i) => `<circle cx="${80 + (i * 53) % 240}" cy="${90 + Math.floor(i * 53 / 240) * 46}" r="4" fill="${shade(c, .55)}" opacity=".85"/>`).join('') + '</g>' : ''}
    <path d="M150 300 Q140 420 104 500 M250 300 Q262 420 296 500 M200 300 V516" stroke="${shade(c, -.12)}" stroke-width="2" fill="none"/>`,
  knit: (c, o = {}) => `<defs>${knitTex('k' + c.slice(1), c)}</defs>
    <path d="M132 52 L62 92 L22 332 L64 348 L102 184 Z M268 52 L338 92 L378 332 L336 348 L298 184 Z" fill="${shade(c, -.05)}"/>
    <path d="M132 52 Q200 86 268 52 L300 186 L302 408 L98 408 L100 186 Z" fill="${c}"/>
    <rect x="98" y="384" width="204" height="30" fill="${shade(c, -.1)}"/><path d="M22 332 L64 348 L68 330 L28 316 Z M378 332 L336 348 L332 330 L372 316 Z" fill="${shade(c, -.12)}"/>
    <path d="M132 52 Q200 86 268 52 Q200 102 132 52 Z" fill="${shade(c, -.18)}"/>
    <path d="M132 52 L62 92 L22 332 L64 348 L102 184 Z M268 52 L338 92 L378 332 L336 348 L298 184 Z M132 52 Q200 86 268 52 L300 186 L302 384 L98 384 L100 186 Z" fill="url(#k${c.slice(1)})"/>
    ${o.open ? `<path d="M200 80 V414" stroke="${shade(c, -.3)}" stroke-width="3"/>${[150, 210, 270, 330].map(y => `<circle cx="210" cy="${y}" r="6" fill="${C.cream}"/>`).join('')}` : ''}
    ${o.stripe ? [140, 200, 260, 320].map(y => `<rect x="100" y="${y}" width="200" height="16" fill="${o.stripe}" opacity=".9"/>`).join('') : ''}`,
  blouse: (c, o = {}) => `
    <path d="M136 56 Q96 60 70 110 Q50 170 64 214 L106 204 L112 150 Z M264 56 Q304 60 330 110 Q350 170 336 214 L294 204 L288 150 Z" fill="${shade(c, -.05)}"/>
    <path d="M60 210 l50 -10 l6 30 l-50 12 Z M340 210 l-50 -10 l-6 30 l50 12 Z" fill="${shade(c, -.1)}"/>
    <path d="M136 56 L200 80 L264 56 L292 160 L300 380 Q200 396 100 380 L108 160 Z" fill="${c}"/>
    <path d="M150 52 L200 80 L172 112 Z M250 52 L200 80 L228 112 Z" fill="${shade(c, -.1)}"/>
    <path d="M200 80 V386" stroke="${shade(c, -.2)}" stroke-width="2"/>${[130, 190, 250, 310].map(y => `<circle cx="200" cy="${y}" r="4.5" fill="${shade(c, -.3)}"/>`).join('')}
    ${o.stripe ? Array.from({ length: 13 }, (_, i) => `<path d="M${112 + i * 15} 70 V386" stroke="${o.stripe}" stroke-width="3" opacity=".55"/>`).join('') : ''}`,
  skirt: (c, o = {}) => `
    <rect x="132" y="40" width="136" height="26" rx="3" fill="${shade(c, -.12)}"/>
    <path d="M132 64 L268 64 L332 476 Q200 494 68 476 Z" fill="${c}"/>
    ${Array.from({ length: 9 }, (_, i) => { const t = (i + 1) / 10; return `<path d="M${132 + 136 * t} 66 L${68 + 264 * t} ${478 + (t - .5) * (t - .5) * -40}" stroke="${shade(c, -.14)}" stroke-width="2"/>`; }).join('')}
    ${o.check ? `<clipPath id="sc"><path d="M132 64 L268 64 L332 476 Q200 494 68 476 Z"/></clipPath><g clip-path="url(#sc)" opacity=".35" stroke="${o.check}" stroke-width="5">${[120, 200, 280, 360, 440].map(y => `<path d="M60 ${y} H340"/>`).join('')}</g>` : ''}`,
  pants: (c, o = {}) => `
    <rect x="118" y="36" width="164" height="26" rx="3" fill="${shade(c, -.12)}"/>
    <path d="M118 60 L282 60 L314 506 L218 506 L200 190 L182 506 L86 506 Z" fill="${c}"/>
    <path d="M200 62 V190" stroke="${shade(c, -.28)}" stroke-width="2"/><path d="M134 66 q20 46 52 54 M266 66 q-20 46 -52 54" stroke="${shade(c, -.25)}" stroke-width="2" fill="none"/>
    ${o.denim ? `<g stroke="${C.butter}" stroke-width="2" stroke-dasharray="6 5" fill="none"><path d="M122 66 H278"/><path d="M134 72 q20 46 52 54 M266 72 q-20 46 -52 54"/><path d="M94 494 H208 M192 494 H306"/></g>` : `<path d="M150 190 L132 506 M250 190 L268 506" stroke="${shade(c, -.12)}" stroke-width="2"/>`}`,
  bag: (c) => `
    <path d="M140 210 Q140 70 200 70 Q260 70 260 210" fill="none" stroke="${shade(c, -.3)}" stroke-width="14"/>
    <path d="M84 196 H316 L334 470 Q200 488 66 470 Z" fill="${c}"/>
    <path d="M84 196 H316 L312 248 Q200 270 88 248 Z" fill="${shade(c, -.12)}"/>
    <rect x="186" y="246" width="28" height="22" rx="4" fill="${C.butter}"/><path d="M80 300 Q200 316 320 300" stroke="${shade(c, -.18)}" stroke-width="2" fill="none" stroke-dasharray="6 6"/>`,
  shoes: (c) => { const one = (dx, dy, k) => `<g transform="translate(${dx} ${dy})"><path d="M40 362 V330 Q42 296 92 290 L150 286 Q206 288 240 318 Q262 338 266 362 Z" fill="${shade(c, k)}"/>
    <path d="M36 362 H270 V378 H36 Z" fill="${shade(c, -.45)}"/><path d="M128 300 Q170 318 214 306" stroke="${C.butter}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M60 300 Q90 286 128 288" stroke="${shade(c, .25)}" stroke-width="3" fill="none"/></g>`; return one(20, 0, 0) + one(110, 70, .1); },
  scarf: (c, o = {}) => `
    <path d="M150 40 H250 L262 470 H138 Z" fill="${c}"/><path d="M250 40 Q330 120 300 260 L282 250 Q300 140 238 60 Z" fill="${shade(c, -.12)}"/>
    ${[160, 230, 300, 370].map(y => `<path d="M144 ${y} H256" stroke="${o.stripe || shade(c, .4)}" stroke-width="10"/>`).join('')}
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${142 + i * 11.6} 470 v34" stroke="${shade(c, -.1)}" stroke-width="4" stroke-linecap="round"/>`).join('')}`
};
const hangs = new Set(['coat', 'dress', 'knit', 'blouse']);
// 옷 하나 : 위치(x, y), 크기(s)
function piece(type, color, x, y, s, o = {}) {
  const body = G[type](color, o);
  const hook = (hangs.has(type) && !o.flat) ? hanger : '';
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">${hook}${body}</g>`;
}

/* ---------- 배경 · 소품 ---------- */
const DEFS = `<defs>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2b2420" flood-opacity=".18"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>
  <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`;
function room(w, h, wall, floor, extra = '') {
  const fy = Math.round(h * .8);
  return `<rect width="${w}" height="${h}" fill="${wall}"/>${extra}<rect y="${fy}" width="${w}" height="${h - fy}" fill="${floor}"/>
    <rect y="${fy}" width="${w}" height="3" fill="${shade(floor, -.08)}"/>`;
}
const arch = (x, y, w, h, c) => `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z" fill="${c}"/>`;
const plant = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0 h80 l-10 90 h-60 Z" fill="#cdb9a0"/>
  ${[[-60, -150, -20], [10, -190, 8], [60, -140, 30], [-20, -110, -40], [40, -90, 50]].map(([lx, ly, r]) => `<ellipse cx="${lx}" cy="${ly}" rx="26" ry="70" transform="rotate(${r} ${lx} ${ly})" fill="#7d8a62"/><path d="M0 0 L${lx} ${ly + 40}" stroke="#6b7752" stroke-width="4"/>`).join('')}</g>`;
const rail = (x1, x2, y, h) => `<g stroke="#3a3530" stroke-width="7" stroke-linecap="round" fill="none"><path d="M${x1} ${y} H${x2}"/><path d="M${x1 + 10} ${y} V${y + h} M${x2 - 10} ${y} V${y + h}"/><path d="M${x1 - 30} ${y + h} H${x1 + 50} M${x2 - 50} ${y + h} H${x2 + 30}"/></g>`;
const mirror = (x, y, w, h) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#ece6dc" stroke="#b9a48a" stroke-width="10"/><rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" rx="${(w - 28) / 2}" fill="url(#light)"/></g>`;
const stool = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="110" ry="26" fill="${c}"/><path d="M-90 10 L-100 150 M90 10 L100 150 M0 24 V160" stroke="${shade(c, -.3)}" stroke-width="10"/></g>`;
const boxGift = (x, y, s, c, r) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-120" y="-100" width="240" height="190" fill="${c}"/><rect x="-130" y="-130" width="260" height="44" fill="${shade(c, -.08)}"/><rect x="-14" y="-130" width="28" height="220" fill="${r}"/><path d="M0 -130 q-70 -70 -90 -10 q40 20 90 10 q70 -70 90 -10 q-40 20 -90 10" fill="${r}"/></g>`;

/* 장면 그리기 : w × h 화면에 room + 옷들 */
function scene(w, h, opt) {
  const k = h / 941; // 1672×941 기준 비율
  const sx = v => Math.round(v * w / 1672), sy = v => Math.round(v * k);
  let s = room(w, h, opt.wall, opt.floor, opt.back ? opt.back(sx, sy, k) : '');
  if (opt.rail) s += rail(sx(opt.rail[0]), sx(opt.rail[1]), sy(110), sy(640));
  (opt.items || []).forEach(([t, c, x, y, sc, o]) => { s += piece(t, c, sx(x), sy(y), sc * k, o || {}); });
  if (opt.front) s += opt.front(sx, sy, k);
  return svg(w, h, s);
}
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}${body}<rect width="${w}" height="${h}" filter="url(#grain)"/></svg>`;

/* 한 벌 : 정사각 · 세로 사진 (가운데 큰 옷 하나 + 배경) */
function single(w, h, wall, floor, type, color, o = {}) {
  const sc = Math.min(w / 520, h / 640) * (o.scale || 1);
  const x = (w - 400 * sc) / 2, y = (h - 540 * sc) / 2 + (o.dy || 0) * h;
  let back = '';
  if (o.arch) back += arch(w * .2, h * .08, w * .6, h * .8, o.arch);
  if (o.circle) back += `<circle cx="${w / 2}" cy="${h * .46}" r="${Math.min(w, h) * .36}" fill="${o.circle}"/>`;
  return svg(w, h, room(w, h, wall, floor, back) + piece(type, color, x, y, sc, o) + (o.front || ''));
}

/* ---------- 만들 목록 ---------- */
const SCENES = { // 1672×941 가로 장면
  'scene-atelier': { wall: C.ecru, floor: C.sand, rail: [430, 1240], back: (x, y) => arch(x(80), y(90), x(330), y(680), C.blush) + mirror(x(1320), y(120), x(240), y(560)),
    items: [['coat', C.camel, 470, 120, 1.05], ['dress', C.rose, 660, 120, 1.05], ['knit', C.cream, 850, 120, 1.05], ['blouse', C.sky, 1040, 120, 1.0]], front: (x, y) => plant(x(180), y(660), 1.0 * y(1) ) },
  'scene-rack': { wall: C.ivory, floor: C.ecru, rail: [260, 1420], items: [['coat', C.charcoal, 300, 120, 1.05], ['knit', C.butter, 500, 120, 1.0], ['dress', C.sage, 700, 120, 1.05], ['blouse', C.white, 900, 120, 1.0], ['coat', C.camel, 1100, 120, 1.05, { belt: true }]], front: (x, y) => plant(x(1560), y(660), y(1)) },
  'scene-coat': { wall: C.blush, floor: C.rose, back: (x, y) => arch(x(560), y(60), x(560), y(700), shade(C.blush, .35)), items: [['coat', C.camel, 640, 60, 1.45, { belt: true }]], front: (x, y) => plant(x(1380), y(650), y(1.1)) },
  'scene-dress': { wall: C.sage, floor: C.olive, back: (x, y) => `<circle cx="${x(836)}" cy="${y(380)}" r="${y(330)}" fill="${shade(C.sage, .35)}"/>`, items: [['dress', C.cream, 660, 60, 1.4, { dots: false }]], front: (x, y) => stool(x(1320), y(640), y(1), C.sand) },
  'scene-knit': { wall: C.butter, floor: C.camel, rail: [480, 1200], items: [['knit', C.cream, 520, 120, 1.1], ['knit', C.wine, 720, 120, 1.1], ['knit', C.sage, 920, 120, 1.1, { stripe: C.cream }]], front: (x, y) => plant(x(200), y(660), y(1)) },
  'scene-denim': { wall: C.sky, floor: shade(C.sky, -.15), items: [['pants', C.denim, 520, 100, 1.2, { denim: true }], ['blouse', C.white, 860, 90, 1.2, { stripe: C.denim }]], front: (x, y) => mirror(x(1340), y(110), x(220), y(560)) },
  'scene-blouse': { wall: C.ivory, floor: C.sand, back: (x, y) => arch(x(560), y(60), x(560), y(700), C.sky), items: [['blouse', C.white, 640, 70, 1.4]], front: (x, y) => plant(x(260), y(660), y(1.05)) },
  'scene-closet': { wall: C.ecru, floor: C.cocoa, back: (x, y) => `<rect x="${x(200)}" y="${y(60)}" width="${x(1270)}" height="${y(700)}" fill="${shade(C.ecru, .3)}" stroke="#b9a48a" stroke-width="8"/>`, rail: [240, 1430],
    items: [['knit', C.grey, 290, 120, .95], ['coat', C.navy, 470, 120, 1.0], ['dress', C.wine, 650, 120, 1.0], ['blouse', C.blush, 830, 120, .95], ['coat', C.sand, 1010, 120, 1.0, { belt: true }], ['knit', C.olive, 1190, 120, .95, { open: true }]] },
  'scene-linen': { wall: C.cream, floor: C.sand, items: [['blouse', C.ecru, 400, 80, 1.25], ['pants', C.sand, 820, 90, 1.25]], front: (x, y) => plant(x(1420), y(660), y(1.1)) },
  'scene-trench': { wall: C.grey, floor: shade(C.grey, -.2), back: (x, y) => arch(x(560), y(60), x(560), y(700), shade(C.grey, .3)), items: [['coat', C.sand, 640, 60, 1.45, { belt: true }]], front: (x, y) => stool(x(1300), y(640), y(1), C.cocoa) },
  'scene-skirt': { wall: C.blush, floor: shade(C.blush, -.15), items: [['blouse', C.cream, 480, 70, 1.15], ['skirt', C.navy, 880, 120, 1.2]], front: (x, y) => mirror(x(150), y(110), x(220), y(560)) },
  'scene-bag': { wall: C.sand, floor: C.camel, back: (x, y) => `<rect x="${x(420)}" y="${y(470)}" width="${x(830)}" height="${y(40)}" fill="${C.cocoa}"/>`, items: [['bag', C.cocoa, 470, 150, .95], ['bag', C.cream, 830, 190, .82], ['shoes', C.black, 1060, 230, .9]] },
  'scene-cardigan': { wall: C.sage, floor: shade(C.sage, -.25), items: [['knit', C.cream, 640, 60, 1.4, { open: true }]], front: (x, y) => plant(x(1400), y(660), y(1.1)) + stool(x(300), y(640), y(1), C.sand) },
  'scene-gift': { wall: C.blush, floor: C.rose, items: [['scarf', C.wine, 340, 130, 1.05, { stripe: C.cream }]], front: (x, y) => boxGift(x(900), y(560), y(1.4), C.cream, C.wine) + boxGift(x(1260), y(620), y(1), C.sand, C.charcoal) }
};
const SQUARES = { // 1254 정사각
  'sq-coat': ['coat', C.camel, C.ecru, C.sand, { arch: C.blush }], 'sq-dress': ['dress', C.rose, C.blush, shade(C.blush, -.1), { circle: shade(C.blush, .4) }],
  'sq-knit': ['knit', C.cream, C.butter, C.camel, {}], 'sq-blouse': ['blouse', C.white, C.sky, shade(C.sky, -.15), { arch: shade(C.sky, .4) }],
  'sq-skirt': ['skirt', C.navy, C.ivory, C.sand, { scale: .9 }], 'sq-bag': ['bag', C.cocoa, C.sand, C.camel, { scale: .95 }],
  'sq-cardigan': ['knit', C.olive, C.sage, shade(C.sage, -.2), { open: true }], 'sq-denim': ['pants', C.denim, C.sky, shade(C.sky, -.15), { denim: true }],
  'sq-shoes': ['shoes', C.black, C.ecru, C.sand, { scale: 1.1 }], 'sq-trench': ['coat', C.sand, C.grey, shade(C.grey, -.2), { belt: true, arch: shade(C.grey, .3) }],
  'sq-scarf': ['scarf', C.wine, C.blush, C.rose, { stripe: C.cream, scale: .95 }], 'sq-atelier': ['dress', C.charcoal, C.ecru, C.sand, { arch: C.blush }]
};
const TALL = { // 세로 : 카드 1086×1448, 세로 사진 1122×1402
  'card-outer': [1086, 1448, 'coat', C.camel, C.blush, C.rose, { belt: true, arch: shade(C.blush, .35) }],
  'card-top': [1086, 1448, 'knit', C.cream, C.sage, shade(C.sage, -.2), { arch: shade(C.sage, .35) }],
  'portrait-atelier': [1122, 1402, 'dress', C.wine, C.ecru, C.sand, { arch: C.blush }],
  'portrait-knit': [1122, 1402, 'knit', C.butter, C.ivory, C.sand, { stripe: C.cream, arch: C.sky }]
};

/* ---------- 출력 ---------- */
function photo(name) {
  if (!fs.existsSync(PHOTOS)) return null;
  const f = fs.readdirSync(PHOTOS).find(n => n.replace(/\.(jpe?g|png|webp)$/i, '') === name);
  return f ? path.join(PHOTOS, f) : null;
}
function encode(src, dst, w, h, alpha) {
  const vf = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
  const args = ['-v', 'error', '-y', '-i', src, '-vf', vf];
  if (dst.endsWith('.jpg')) args.push('-q:v', '3');
  else if (alpha) args.push('-c:v', 'libwebp', '-lossless', '1', '-pix_fmt', 'yuva420p');
  else args.push('-c:v', 'libwebp', '-quality', '80');
  execFileSync('ffmpeg', [...args, dst]);
}
let page;
async function draw(name, w, h, markup, dst, alpha = false) {
  const real = photo(name);
  if (real) { encode(real, dst, w, h, alpha); return 'photo'; }
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  const png = path.join(TMP, name + '.png');
  await page.screenshot({ path: png, omitBackground: alpha, clip: { x: 0, y: 0, width: w, height: h } });
  encode(png, dst, w, h, alpha);
  return 'drawn';
}

const PRODUCTS = [].concat(require(path.join(PRD, 'products.json')));
const BG = [[C.ecru, C.sand], [C.blush, shade(C.blush, -.1)], [C.sage, shade(C.sage, -.2)], [C.sky, shade(C.sky, -.15)], [C.ivory, C.ecru], [C.butter, C.camel]];

(async () => {
  const what = process.argv[2] || 'all';
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? {} : {});
  page = await browser.newPage();
  const log = {};
  const put = async (name, w, h, markup, dst, alpha) => { log[name] = await draw(name, w, h, markup, dst, alpha); };
  if (what === 'all' || what === 'skin') {
    for (const [n, o] of Object.entries(SCENES)) await put(n, 1672, 941, scene(1672, 941, o), path.join(OUT, n + '.webp'));
    await put('hero-wear902-poster', 1920, 1080, scene(1920, 1080, SCENES['scene-atelier']), path.join(OUT, 'hero-wear902-poster.webp'));
    for (const [n, [t, c, wall, floor, o]] of Object.entries(SQUARES)) await put(n, 1254, 1254, single(1254, 1254, wall, floor, t, c, o), path.join(OUT, n + '.webp'));
    for (const [n, [w, h, t, c, wall, floor, o]] of Object.entries(TALL)) await put(n, w, h, single(w, h, wall, floor, t, c, o), path.join(OUT, n + '.webp'));
  }
  if (what === 'all' || what === 'logo') {
    const word = (w, h, size, color, ls) => `<div style="width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;font:italic 600 ${size}px/1 'Liberation Serif','DejaVu Serif',serif;letter-spacing:${ls}em;color:${color}">wear<span style="font-style:normal;font-weight:400">902</span></div>`;
    await put('logo-wear902', 560, 200, word(560, 200, 128, '#2c2926', -.02), path.join(OUT, 'logo-wear902.webp'), true);
    await put('wordmark-wear902', 2146, 724, word(2146, 724, 520, '#c98b80', -.03), path.join(OUT, 'wordmark-wear902.webp'), true);
  }
  if (what === 'all' || what === 'products') {
    for (const [i, p] of PRODUCTS.entries()) {
      const [wall, floor] = BG[i % BG.length];
      await put(p.code, 800, 800, single(800, 800, wall, floor, p.draw.type, C[p.draw.color] || p.draw.color, p.draw.opt || {}), path.join(PRD, p.img));
    }
  }
  await browser.close();
  const n = Object.values(log);
  console.log(`${n.length} images (${n.filter(v => v === 'photo').length} from photos/, ${n.filter(v => v === 'drawn').length} drawn)`);
})();
