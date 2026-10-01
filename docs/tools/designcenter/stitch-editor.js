// 편집 창 조각 캡처(로그인한 브라우저에서 스크롤하며 찍은 780×863 PNG)를 한 장으로 잇는다
//   node stitch-editor.js <출력.jpg> <전체높이> <조각1.png>:<scrollY> <조각2.png>:<scrollY> …
// 조각 i 는 문서의 [scrollY, scrollY+863) 을 담고 있다. 겹치는 부분은 앞 조각을 쓴다.
const { execFileSync } = require('child_process');
const [out, H, ...parts] = process.argv.slice(2);
const total = +H, VH = 863;
const inputs = [], filters = []; let covered = 0, n = 0;
for (const p of parts) {
  const i = p.lastIndexOf(':'); const file = p.slice(0, i), y = +p.slice(i + 1);
  const from = Math.max(covered, y), to = Math.min(y + VH, total);
  if (to <= from) continue;
  inputs.push('-i', file);
  filters.push(`[${n}]crop=780:${to - from}:0:${from - y}[c${n}]`); n++; covered = to;
}
if (covered < total) console.warn('덜 덮임', covered, total);
const fc = filters.join(';') + ';' + Array.from({ length: n }, (_, k) => `[c${k}]`).join('') + `vstack=inputs=${n}[v]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', n > 1 ? fc : filters[0].replace('[c0]', '[v]'), '-map', '[v]', '-q:v', '3', out]);
console.log(out, covered);
