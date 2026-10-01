// 사진으로 바꾼 이미지의 alt / aria-label 을 사진 내용으로 (같은 줄에 그 이미지가 있을 때만)
const fs = require('fs');
const A = {
  'hero-wear902-poster': '아침 돌길을 걷는 카멜 트렌치코트 차림의 모델',
  'scene-rack': '코발트블루 수트를 입고 건물 앞에 선 모델',
  'scene-coat': '밤거리 불빛 아래 롱코트를 입은 모델',
  'scene-atelier': '스튜디오에서 차콜 니트 원피스로 포즈를 잡은 모델',
  'scene-skirt': '스튜디오 의자에 기대 누운 노란 원피스 차림의 모델',
  'portrait-knit': '푸른 시폰 드레스를 입은 모델',
  'scene-gift': '진주 귀걸이와 레드 립의 모델',
  'scene-dress': '창가 빛 속에 선 아이보리 실크 슬립 원피스 차림의 모델',
  'portrait-atelier': '사막 언덕에서 오렌지 드레스 자락을 날리는 모델',
  'scene-knit': '아이보리 니트를 입은 모델의 얼굴',
  'scene-trench': '횡단보도를 건너는 카멜 트렌치코트 차림의 모델',
  'scene-blouse': '선글라스를 고쳐 쓰는 아이보리 재킷 차림의 모델',
  'scene-closet': '유리 건물에 기댄 체크 블레이저 차림의 모델',
  'card-outer': '창가에 선 블랙 수트 차림의 모델 (흑백)',
  'card-top': '벨벳 수트를 입고 소파에 앉은 모델'
};
const files = ['index.html', 'product/list.html', 'wear/submenu-hero.html'];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const out = src.split('\n').map(l => {
    const m = l.match(/\/SkinImg\/wear\/([a-z0-9-]+)\.webp/);
    if (!m || !A[m[1]]) return l;
    return l.replace(/(alt|aria-label)="[^"]+"/, `$1="${A[m[1]]}"`);
  }).join('\n');
  if (out !== src) { fs.writeFileSync(f, out); console.log('changed', f); }
}
