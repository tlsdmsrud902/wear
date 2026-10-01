// 베이지 · 올리브(식품 시절 톤) → 화려한 패션 톤 (화이트 바탕 · 잉크 · 마젠타 · 코발트 · 라일락)
// 사용 : node docs/tools/wear-colors.js   (스킨 안의 wear-*.css · 메인 · 목록 · 가이드 · 설정 JS 의 색을 바꾼다)
const fs = require('fs'), path = require('path');
const K = path.resolve(__dirname, '../../wear902_s2_260925195134_d_skin1_E/skin1');
const files = [
  ...fs.readdirSync(K + '/layout/basic/css').filter(f => /^wear-.*\.css$/.test(f)).map(f => 'layout/basic/css/' + f),
  ...fs.readdirSync(K + '/layout/basic/js').filter(f => /^wear-.*\.js$|^store-content\.js$/.test(f)).map(f => 'layout/basic/js/' + f),
  'index.html', 'product/list.html', 'wear/guide.html', 'wear/submenu-hero.html', 'layout/basic/header.html', 'layout/basic/footer.html'
].filter(f => fs.existsSync(K + '/' + f));
const FIX = { // 핵심 변수는 직접 지정
  'f8f5f1': 'fbfafc', 'f6ede2': 'f4effa', 'efe3d6': 'ebe3f2', '2c2926': '17131a', '766a60': '6d6475',
  'a5553a': 'd81b60', 'a5584f': 'd81b60', 'e8866a': 'ff4f8b', 'fbe5d3': 'ffe1ec', 'fff1c9': 'ece4ff',
  'dff0e2': 'dfe7ff', 'dfeef8': 'dcf3ff', 'ece3f6': 'efe1ff', '2f2620': '2a1f33', 'e3d5c8': 'e2d6ec', 'fee500': 'fee500'
};
const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return [h, s, l]; };
const rgb = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255)); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function map(r, g, b) {
  let [h, s, l] = hsl(r, g, b);
  if (l > 0.985 || (r === g && g === b)) return [r, g, b];           // 흰색 · 순회색 그대로
  if (s < 0.12 || (l < 0.36 && s < 0.4)) return rgb(290, Math.min(s, 0.1), l);   // 무채색 · 갈색 계열 어둠 → 보랏빛 잉크/회색
  if (l > 0.8) {                                                       // 옅은 바탕색 → 선명한 파스텔
    const nh = (h >= 15 && h < 40) ? 340 : (h >= 40 && h < 70) ? 265 : (h >= 70 && h < 170) ? 225 : (h >= 170 && h < 250) ? 195 : h;
    return rgb(nh, Math.max(s, 0.85), clamp(l, 0.88, 0.97));
  }
  if (h >= 65 && h < 250) return rgb(228, 0.78, clamp(l, 0.28, 0.52)); // 초록 · 청록 → 코발트
  return rgb(335, 0.8, clamp(l, 0.38, 0.6));                           // 테라코타 · 로즈 · 주황 → 마젠타
}
const hex = a => a.map(v => v.toString(16).padStart(2, '0')).join('');
let total = 0;
for (const f of files) {
  const p = K + '/' + f, src = fs.readFileSync(p, 'utf8'); const css = f.endsWith('.css');
  let out = src.replace(new RegExp('(?<![&\w])#([0-9a-fA-F]{6}' + (css ? '|[0-9a-fA-F]{3}' : '') + ')(?![\w-])', 'g'), (m, h) => {
    let x = h.toLowerCase(); if (x.length === 3) x = x.split('').map(c => c + c).join('');
    if (FIX[x]) return '#' + FIX[x];
    return '#' + hex(map(...[0, 2, 4].map(i => parseInt(x.substr(i, 2), 16))));
  }).replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g, (m, r, g, b, a) => {
    const [R, G, B] = map(+r, +g, +b); return (a ? 'rgba(' : 'rgb(') + R + ',' + G + ',' + B + (a ? ',' + a.replace(/^,\s*/, '') : '') + ')';
  });
  if (out !== src) { fs.writeFileSync(p, out); total++; console.log('changed', f); }
}
console.log(total, 'files');
