// eppum(K-뷰티) → food902(식품) 일괄 치환. 저장소 루트에서 node docs/tools/rebrand-food.js
const fs = require('fs');
const { execSync } = require('child_process');
const SKIP = /(^docs\/|swiper-bundle\.min\.js)/;
const files = execSync('git -c core.quotepath=off ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter(f => /\.(html|css|js|json|txt|xml|svg)$/i.test(f) && !SKIP.test(f) && fs.existsSync(f));

const img = { // 옛 이미지 → 새 이미지 (docs/tools/food-images.py 가 만든다)
  'scene-glow': 'scene-brunch', 'scene-botanical': 'scene-market', 'scene-palette': 'scene-toast',
  'scene-nail': 'scene-fruit', 'scene-sun': 'scene-noodle', 'scene-serum': 'scene-granola',
  'scene-model': 'scene-sandwich', 'scene-vanity': 'scene-pantry', 'scene-oil': 'scene-giftbox',
  'scene-lip': 'scene-tea', 'scene-cream': 'scene-salmon', 'scene-powder': 'scene-cake',
  'scene-mascara': 'scene-ramen', 'scene-hair': 'scene-bakery', 'scene-base': 'scene-bread',
  'scene-liner': 'scene-nuts', 'scene-mask': 'scene-salad',
  'portrait-vanity': 'portrait-brunch', 'portrait-glow': 'portrait-bakery',
  'card-skincare': 'card-fresh', 'card-makeup': 'card-meal',
  'sq-cream': 'sq-bowl', 'sq-lip': 'sq-fruit', 'sq-serum': 'sq-veg', 'sq-sun': 'sq-tea',
  'sq-mask': 'sq-cake', 'sq-powder': 'sq-gift', 'sq-hair': 'sq-bakery', 'sq-base': 'sq-pantry',
  'sq-red': 'sq-ramen', 'sq-nail': 'sq-brunch', 'sq-model': 'sq-salmon', 'sq-eye': 'sq-toast',
  'sq-oil': 'sq-oil', 'sq-glow': 'sq-juice', 'sq-mascara': 'sq-cheese', 'sq-brush': 'sq-nuts',
  'sq-liner': 'sq-granola', 'sq-botanical': 'sq-market',
  'logo-eppum': 'logo-food902', 'wordmark-eppum': 'wordmark-food902'
};
const names = Object.keys(img).sort((a, b) => b.length - a.length).join('|');

const rules = [
  [/https:\/\/cdn\.jsdelivr\.net\/gh\/tlsdmsrud902\/k_eppum@/g, 'https://cdn.jsdelivr.net/gh/tlsdmsrud902/food902@'],
  [/https:\/\/ecimg\.cafe24img\.com\/pg[0-9a-f]+\/eppum902\/beauty\//g, '/SkinImg/food/'],
  [new RegExp('(?<![a-z-])(' + names + ')\\.(png|webp|jpg)', 'g'), (m, n) => img[n] + '.webp'],
  [new RegExp("(['\"])(" + names + ")\\1", 'g'), (m, q, n) => q + img[n] + q],
  [/SkinImg\/beauty\//g, 'SkinImg/food/'],
  [/eppum902_s2_260925195134_d_skin1_E/g, 'food902_s2_260925195134_d_skin1_E'],
  [/eppum902/g, 'food902'],
  [/tlsdmsrud902\/k_eppum/g, 'tlsdmsrud902/food902'],
  [/EPPUM_/g, 'FOOD902_'], [/EPPUM/g, 'FOOD902'], [/Eppum/g, 'Food902'], [/eppum/g, 'food902'],
  [/beautyedit/g, 'foodedit'], [/BEAUTY EDIT/g, 'FOOD EDIT'],
  [/(?<![A-Za-z])routines(?![a-z])/g, 'meals'], [/(?<![A-Za-z])Routines(?![a-z])/g, 'Meals'], [/(?<![A-Za-z])ROUTINES(?![A-Za-z])/g, 'MEALS'],
  [/(?<![A-Za-z])beauty(?![a-z])/g, 'food'], [/(?<=[a-z])Beauty(?![a-z])/g, 'Food'],
  [/(?<![A-Za-z])Beauty(?![a-z])/g, 'Food'], [/(?<![A-Za-z])BEAUTY(?![A-Za-z])/g, 'FOOD'],
  [/pg3424b68273970037/g, 'PG_NUMBER']   // food902 파일업로더 번호를 받으면 교체
];

let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let out = src;
  for (const [re, to] of rules) out = out.replace(re, to);
  if (out !== src) { fs.writeFileSync(f, out); changed++; }
}
console.log(changed, 'files changed');
