// food902(식품) → wear902(여성 의류) 일괄 치환. 저장소 루트에서 node docs/tools/rebrand-wear.js
const fs = require('fs');
const { execSync } = require('child_process');
const SKIP = /(^docs\/|swiper-bundle\.min\.js)/;
const files = execSync('git -c core.quotepath=off ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter(f => /\.(html|css|js|json|txt|xml|svg)$/i.test(f) && !SKIP.test(f) && fs.existsSync(f));

const img = { // 옛 이미지 → 새 이미지 (docs/tools/wear-images.js 가 만든다)
  'scene-brunch': 'scene-atelier', 'scene-market': 'scene-rack', 'scene-toast': 'scene-coat',
  'scene-fruit': 'scene-dress', 'scene-noodle': 'scene-knit', 'scene-granola': 'scene-denim',
  'scene-sandwich': 'scene-blouse', 'scene-pantry': 'scene-closet', 'scene-tea': 'scene-linen',
  'scene-salmon': 'scene-trench', 'scene-cake': 'scene-skirt', 'scene-ramen': 'scene-bag',
  'scene-bakery': 'scene-cardigan', 'scene-giftbox': 'scene-gift',
  'portrait-brunch': 'portrait-atelier', 'portrait-bakery': 'portrait-knit',
  'card-fresh': 'card-outer', 'card-meal': 'card-top',
  'sq-bowl': 'sq-coat', 'sq-fruit': 'sq-dress', 'sq-veg': 'sq-knit', 'sq-tea': 'sq-blouse',
  'sq-cake': 'sq-skirt', 'sq-gift': 'sq-bag', 'sq-bakery': 'sq-cardigan', 'sq-pantry': 'sq-denim',
  'sq-ramen': 'sq-shoes', 'sq-salmon': 'sq-trench', 'sq-toast': 'sq-scarf', 'sq-brunch': 'sq-atelier',
  'hero-food902-poster': 'hero-wear902-poster',
  'logo-food902': 'logo-wear902', 'wordmark-food902': 'wordmark-wear902'
};
const names = Object.keys(img).sort((a, b) => b.length - a.length).join('|');

const rules = [
  [/https:\/\/cdn\.jsdelivr\.net\/gh\/tlsdmsrud902\/food902@/g, 'https://cdn.jsdelivr.net/gh/tlsdmsrud902/wear@'],
  [/https:\/\/ecimg\.cafe24img\.com\/pg[0-9a-f]+\/food902\/food\//g, '/SkinImg/wear/'],
  [new RegExp('(?<![a-z-])(' + names + ')\\.(png|webp|jpg)', 'g'), (m, n) => img[n] + '.webp'],
  [new RegExp("(['\"])(" + names + ")\\1", 'g'), (m, q, n) => q + img[n] + q],
  [/SkinImg\/food\//g, 'SkinImg/wear/'],
  [/food902_s2_260925195134_d_skin1_E/g, 'wear902_s2_260925195134_d_skin1_E'],
  [/tlsdmsrud902\/food902/g, 'tlsdmsrud902/wear'],
  [/food902/g, 'wear902'],
  [/FOOD902_/g, 'WEAR902_'], [/FOOD902/g, 'WEAR902'], [/Food902/g, 'Wear902'],
  [/FOOD 902/g, 'WEAR 902'],
  [/foodedit/g, 'wearedit'], [/FOOD EDIT/g, 'WEAR EDIT'],
  [/(?<![A-Za-z])meals(?![a-z])/g, 'styles'], [/(?<![A-Za-z])Meals(?![a-z])/g, 'Looks'], [/(?<![A-Za-z])MEALS(?![A-Za-z])/g, 'LOOKS'],
  [/(?<![A-Za-z])food(?![a-z])/g, 'wear'], [/(?<=[a-z])Food(?![a-z])/g, 'Wear'],
  [/(?<![A-Za-z])Food(?![a-z])/g, 'Wear'], [/(?<![A-Za-z])FOOD(?![A-Za-z])/g, 'WEAR'],
  // 분류 키 : 신선식품 · 간편식 · 베이커리 → 아우터 · 상의 · 원피스/스커트
  [/(?<![A-Za-z$])fresh(?![A-Za-z])/g, 'outer'], [/(?<![A-Za-z$])meal(?![A-Za-z])/g, 'tops'],
  [/(?<![A-Za-z$])bakery(?![A-Za-z])/g, 'dress'],
  [/hero-wear902\.mp4/g, 'hero-wear902.mp4']
];

let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let out = src;
  for (const [re, to] of rules) out = out.replace(re, to);
  if (out !== src) { fs.writeFileSync(f, out); changed++; }
}
console.log(changed, 'files changed');
