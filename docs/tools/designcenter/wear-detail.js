// wear902 디자인센터 상세페이지 : 식품(food902)에서 남은 문구 고치기 + 쇼핑몰과 같은 흑백 톤으로
//   node docs/tools/designcenter/wear-detail.js
//   → designcenter/wear902/detail-source.html 을 고쳐 쓰고, _deploy/dc/detail.html 로 복사 (img/ · shots/ 는 _deploy/dc 에)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'designcenter/wear902/detail-source.html');
const OUT = path.join(ROOT, '_deploy/dc/detail.html');
const SAMPLE = 'https://ecudemo409091.cafe24.com/';

let h = fs.readFileSync(SRC, 'utf8');
const n0 = h.length;

// 1) 문구
const TEXT = [
  ['FOR EVERY<br><b>TABLE</b>', 'FOR EVERY<br><b>CLOSET</b>'],
  ['바꾸고 싶은 곳의 주황 버튼', '바꾸고 싶은 곳의 [고치기] 버튼'],
  ['모든 섹션에 주황색 <em>[고치기]</em> 버튼', '모든 섹션에 검은색 <em>[고치기]</em> 버튼'],
  ['>Good wear, every day<', '>New season, every day<'],
  ['오늘은 무엇이 필요하세요?', '오늘은 무엇을 찾으세요?'],
  ['A gift of taste', 'A gift to wear'],
  ['Your weekly list', 'Your season list'],
  ['[푸드 노트 고치기]', '[스타일 노트 고치기]'],
  ['푸드 노트', '스타일 노트'],
  ['Your everyday, in one place', 'Your wear, in one place'],
  ['brandmark">F<', 'brandmark">W<'],
  ['02 / EASY MEAL', '02 / DAILY TOPS'],
  ['11,000원', '159,000원'],
  ['8,900원', '129,000원'],
  ['싱그러운 색과<br>정돈된 구성', '깨끗한 흑백과<br>정돈된 구성'],
  ['차콜과 로즈우드 톤, 옷이 돋보이는 스타일 사진', '화이트 바탕에 블랙 · 그레이 모노톤, 옷이 돋보이는 스타일 사진'],
  ['음식 영상 · 사진 메인 비주얼', '패션 영상 · 사진 메인 비주얼'],
  ['https://ecudemo408987.cafe24.com/', SAMPLE],
];
const miss = [];
for (const [a, b] of TEXT) { if (!h.includes(a)) { if (!h.includes(b)) miss.push(a); continue; } h = h.split(a).join(b); }

// 2) 색 : 번호 배지 빨강(#e5383b)만 남기고 모두 무채색으로 (밝기 유지)
const KEEP = new Set(['e5383b']);
const gray = (r, g, b) => { const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b); return y.toString(16).padStart(2, '0').repeat(3); };
h = h.replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m, x) => {
  const lx = x.toLowerCase();
  if (KEEP.has(lx.slice(0, 6))) return m;
  const full = lx.length === 3 ? lx.split('').map(c => c + c).join('') : lx;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  return '#' + gray(r, g, b) + (full.length === 8 ? full.slice(6) : '');
});
h = h.replace(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g, (m, r, g, b) => { const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b); return m.replace(/\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/, `(${y},${y},${y}`); });

fs.writeFileSync(SRC, h);
fs.writeFileSync(OUT, h);
const left = (h.match(/food|식품|식탁|푸드|음식|밀키트|TABLE|408987|MEAL/gi) || []);
console.log('written', n0, '→', h.length, '| 못 찾은 문구', miss, '| 남은 옛 단어', left);
