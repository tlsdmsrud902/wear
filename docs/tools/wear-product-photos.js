// 루트의 모델 사진 → 상품 이미지 cafe24-assets/products/p01~p30.jpg (800x800)
// [상품, 사진 이름 일부, cx, cy, s] : 중심 비율 cx · cy, 크기 s = 짧은 변 대비
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'); process.chdir(ROOT);
const pick = k => fs.readdirSync('.').find(f => f.endsWith('.jpg') && f.includes(k));
const L = [
  ['p01', 'cobblestone', .44, .5, 1], ['p02', 'crosswalk', .5, .5, 1], ['p03', 'urban_wear', .5, .5, 1],
  ['p04', 'sunglasses', .5, .42, .8], ['p05', 'monochromatic', .5, .5, 1], ['p06', 'oversized_blazer', .49, .5, 1],
  ['p07', 'posing_in_studio', .45, .5, 1], ['p08', 'retro_70s', .5, .3, 1], ['p09', 'linen_on_deck', .34, .5, .95],
  ['p10', '20261001231657', .45, .5, 1], ['p11', 'linen_on_deck', .67, .5, .95], ['p12', 'sculptural_white', .5, .25, 1],
  ['p13', 'subtle_makeup', .58, .5, 1], ['p14', 'sitting_in_cafe', .55, .42, .62], ['p15', 'silver_futurist', .5, .35, 1],
  ['p16', '20261001225741', .62, .5, 1], ['p17', 'linen_on_deck', .5, .5, 1], ['p18', 'sitting_in_cafe', .5, .5, 1],
  ['p19', 'white_architectura', .5, .5, 1], ['p20', 'parisian_bw', .5, .3, 1], ['p21', 'botanical_soft', .5, .35, 1],
  ['p22', 'silk_dress', .5, .5, 1], ['p23', 'aquatic_blue', .5, .35, 1], ['p24', 'oak_tree', .56, .5, 1],
  ['p25', 'yellow_dress', .42, .5, 1], ['p26', 'desert_surreal', .5, .45, 1], ['p27', 'modern_street', .49, .5, 1],
  ['p28', 'oversized_blazer', .49, .68, .62], ['p29', '20261001225741', .6, .68, .62], ['p30', 'red_lips', .5, .5, 1]
];
const dims = f => execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim().split(',').map(Number);
for (const [code, key, cx, cy, s] of L) {
  const f = pick(key); if (!f) { console.log('missing', key); continue; }
  const [w, h] = dims(f), side = Math.round(Math.min(w, h) * s);
  const x = Math.max(0, Math.min(w - side, Math.round(w * cx - side / 2)));
  const y = Math.max(0, Math.min(h - side, Math.round(h * cy - side / 2)));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-vf', `crop=${side}:${side}:${x}:${y},scale=800:800`, '-q:v', '3', `cafe24-assets/products/${code}.jpg`]);
}
console.log('done');
