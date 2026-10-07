// 파트너센터 「상세소개 내용」 v2 : 기존 이벤트 박스(product-content-event.html 앞부분) + 소개 영상(iframe) + 밝은 톤 상세 이미지 8장 + 주문서 버튼 + 샘플 사이트
//   node docs/tools/designcenter/content-html-v2.js <이미지 커밋> <영상 페이지 커밋(전체 해시)>
// 출력 : designcenter/wear902/product-content-v2.html
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../../..');
const [IMG, VID] = process.argv.slice(2);
if (!IMG || !VID) { console.log('사용 : node content-html-v2.js <이미지 커밋> <영상 페이지 커밋 전체>'); process.exit(1); }

const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSf26MVAAFBO6btjz97kuKnjw6jvWKNdJ21ET3jIUsov0NTR_g/viewform?usp=header';
const SAMPLE = 'https://ecudemo409091.cafe24.com/';
const B = 'https://cdn.jsdelivr.net/gh/tlsdmsrud902/wear@' + IMG + '/designcenter/wear902/v2/';
const VIDEO = 'https://rawcdn.githack.com/tlsdmsrud902/wear/' + VID + '/designcenter/wear902/v2/video.html';
const ALTS = [
  '10월 특별 혜택 - 10월 31일까지 구매하면 쇼핑 도우미(챗봇) 무료 설치, 월 이용료 0원',
  '처음 여는 의류몰, 하루면 팔 준비 끝 - 이 테마를 골라야 하는 이유 5가지',
  '이유 1 - 오픈 첫날부터 지금 살 이유: 마감 카운트다운, 쿠폰 뽑기, 타임세일',
  '이유 2 - 손님이 들어오는 휴대폰 화면부터 맞춘 반응형',
  '이유 3 - 코딩 몰라도 사장님이 직접 고쳐요: 고치기, 글자·사진 바꾸기, 저장',
  '이유 3 - 실수해도 한 번에 되돌리기, 화면에서 직접 바꿀 수 있는 것',
  '이유 4 - 의류몰에 필요한 화면: 장면 속 상품, 스타일 고르기, 스타일 찾기',
  '이유 5 - 하루면 오픈, 다른 방법과 비교, 가격 220,000원, 진행 순서',
];

const old = fs.readFileSync(path.join(ROOT, 'designcenter/wear902/product-content-event.html'), 'utf8');
const head = old.slice(0, old.indexOf('<div style="max-width:922px;margin:0 auto;">')).trimEnd();
const img = (n, alt) => `<img src="${B}detail-v2-0${n}.jpg" alt="wear902 상세 ${n} - ${alt}" style="display:block;width:100%;max-width:922px;height:auto;margin:0;border:0;">`;
const out = [
  head,
  '',
  '<div style="max-width:922px;margin:0 auto;">',
  '<p style="margin:0;padding:26px 0 14px;text-align:center;font-family:\'Noto Sans KR\',\'Malgun Gothic\',sans-serif;font-size:20px;font-weight:800;color:#111111;">1분 영상으로 먼저 보세요</p>',
  `<div style="position:relative;width:100%;max-width:922px;padding-top:56.25%;margin:0 0 30px;background:#000000;"><iframe src="${VIDEO}" title="wear902 소개 영상" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div>`,
  ...ALTS.map((a, i) => img(i + 1, a)),
  `<div style="margin:0;padding:40px 20px;text-align:center;background:#eaf0ff;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;"><p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111111;">구매하셨다면 주문서를 작성해 주세요</p><p style="margin:0 0 22px;font-size:15px;color:#4a5260;">쇼핑몰 정보를 받는 대로 1일 안에 적용해 드려요.</p><a href="${FORM}" target="_blank" rel="noopener" style="display:inline-block;padding:16px 40px;border-radius:999px;background:#2F5BFF;color:#ffffff;font-size:18px;font-weight:bold;text-decoration:none;">주문서 작성하기</a></div>`,
  `<p style="margin:0;padding:22px 0;text-align:center;background:#111111;"><a href="${SAMPLE}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 26px;border-radius:999px;background:#ffffff;color:#111111;font-size:14px;font-weight:bold;text-decoration:none;">샘플 사이트 둘러보기</a></p>`,
  '</div>',
];
fs.writeFileSync(path.join(ROOT, 'designcenter/wear902/product-content-v2.html'), out.join('\n'));
console.log('ok length', out.join('\n').length);
