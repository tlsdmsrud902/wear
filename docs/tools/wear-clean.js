// 화이트 바탕 · 모노톤(블랙 · 그레이) + 포인트 1색(크림슨)으로 정리 — 사용 : node docs/tools/wear-clean.js
const fs = require('fs'), path = require('path');
const K = path.resolve(__dirname, '../../wear902_s2_260925195134_d_skin1_E/skin1');
const files = [
  ...fs.readdirSync(K + '/layout/basic/css').filter(f => /^wear-.*\.css$/.test(f)).map(f => 'layout/basic/css/' + f),
  ...fs.readdirSync(K + '/layout/basic/js').filter(f => /^wear-.*\.js$|^store-content\.js$/.test(f)).map(f => 'layout/basic/js/' + f),
  'index.html', 'product/list.html', 'wear/guide.html', 'wear/submenu-hero.html', 'layout/basic/header.html', 'layout/basic/footer.html'
].filter(f => fs.existsSync(K + '/' + f));
const FIX = { 'fbfafc': 'ffffff', 'f4effa': 'f5f5f5', 'ebe3f2': 'e8e8e8', '17131a': '111111', '6d6475': '6b6b6b', 'd81b60': '111111',
  'ff4f8b': '111111', 'e2d6ec': 'dddddd', '2a1f33': '000000', 'fee500': 'fee500' };
const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return [h, s, l]; };
const grey = l => { const v = Math.round(l * 255); return [v, v, v]; };
function map(r, g, b) {
  const [h, s, l] = hsl(r, g, b);
  if (r === g && g === b) return [r, g, b];
  if (r > 240 && g > 220 && b < 40) return [r, g, b];                     // 카카오 노랑
  if (l > 0.96) return [255, 255, 255];
  if (l > 0.8) return grey(Math.min(0.97, Math.max(0.93, l)));           // 파스텔 바탕 → 옅은 회색
  if ((h >= 320 || h < 15) && s > 0.45) return l < 0.45 ? [0, 0, 0] : [17, 17, 17];   // 핑크 · 마젠타 → 블랙 (포인트 색 없이 모노톤)
  return grey(l < 0.45 ? Math.min(l, 0.2) * 0.6 + 0.02 : l);            // 그 밖(코발트 · 보랏빛 회색) → 블랙/그레이
}
const hex = a => a.map(v => v.toString(16).padStart(2, '0')).join('');
for (const f of files) {
  const p = K + '/' + f, src = fs.readFileSync(p, 'utf8'), css = f.endsWith('.css');
  const out = src.replace(new RegExp('(?<![&\w])#([0-9a-fA-F]{6}' + (css ? '|[0-9a-fA-F]{3}' : '') + ')(?![\w-])', 'g'), (m, h) => {
    let x = h.toLowerCase(); if (x.length === 3) x = x.split('').map(c => c + c).join('');
    return '#' + (FIX[x] || hex(map(...[0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)))));
  }).replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g, (m, r, g, b, a) => {
    const [R, G, B] = map(+r, +g, +b); return (a ? 'rgba(' : 'rgb(') + R + ',' + G + ',' + B + (a ? ',' + a.replace(/^,\s*/, '') : '') + ')';
  });
  if (out !== src) { fs.writeFileSync(p, out); console.log('changed', f); }
}
