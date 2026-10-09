// 상세페이지 v3 : 「올인원 마케팅 · CRM 스킨」 — 디자인센터(HTML) · 크몽(이미지) 를 한 원고로 만든다
//   1) node docs/tools/designcenter/feature-shots.js         ← 실제 쇼핑몰 화면 캡처 (_deploy/dc/v3shots)
//   2) node docs/tools/designcenter/detail-v3.js img         ← 캡처를 잘라 jpg 로 (designcenter/wear902/v3/)
//   3) node docs/tools/designcenter/detail-v3.js dc <커밋>    ← 디자인센터 상세소개 HTML (jsDelivr @커밋) → designcenter/wear902/product-content-v3.html
//   4) node docs/tools/designcenter/detail-v3.js kmong        ← 크몽 상세 이미지 (가로 860) → _deploy/kmong/detail-v3/
// 디자인센터 상세 칸은 <script> · <style> 을 지우므로 모든 모양을 style="" 로 쓴다. 크몽 이미지에는 주소 · 연락처를 넣지 않는다
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../../..');
const SHOTS = path.join(ROOT, '_deploy/dc/v3shots');
const IMG = path.join(ROOT, 'designcenter/wear902/v3');
const KMONG = path.join(ROOT, '_deploy/kmong/detail-v3');
const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSf26MVAAFBO6btjz97kuKnjw6jvWKNdJ21ET3jIUsov0NTR_g/viewform?usp=header';
const SAMPLE = 'https://wear902.cafe24.com/';
const [MODE, COMMIT] = process.argv.slice(2);

/* ---------- 1. 캡처 → jpg (crop 은 화면 px, 캡처는 2배) ---------- */
const CROPS = {
  'home-pc': { w: 1600 }, 'home-mobile': { w: 600 },
  'welcome-pc': { w: 1600 }, 'welcome-page': { w: 600 },
  'coupon-pick': { w: 1600, crop: [0, 0, 1280, 1000] }, 'coupon-pick-mobile': { w: 600 },
  'countdown-sale': { w: 1600, crop: [0, 0, 1280, 560] }, 'countdown-pop': { w: 600, crop: [30, 30, 400, 632] },
  'timesale-card': { w: 1600, crop: [90, 0, 1150, 400] }, 'timesale-detail': { w: 1600, crop: [0, 0, 1280, 520] }, 'timesale-detail-mobile': { w: 600 },
  'revisit': { w: 600 },
  'looks': { w: 1600, crop: [0, 110, 1280, 650] }, 'looks-qv': { w: 1600, crop: [0, 110, 1280, 650] },
  'chat': { w: 600 }, 'chat-pc': { w: 1600 },
  'admin': { w: 1600, crop: [24, 76, 1312, 560] }, 'admin-detail': { w: 1600, crop: [322, 0, 1038, 860] },
};
function images() {
  fs.mkdirSync(IMG, { recursive: true });
  for (const [n, o] of Object.entries(CROPS)) {
    const vf = (o.crop ? `crop=${o.crop[2] * 2}:${o.crop[3] * 2}:${o.crop[0] * 2}:${o.crop[1] * 2},` : '') + `scale=${o.w}:-2:flags=lanczos`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(SHOTS, n + '.png'), '-vf', vf, '-q:v', '3', path.join(IMG, n + '.jpg')]);
  }
  console.log('img', Object.keys(CROPS).length);
}

/* ---------- 2. 원고 ---------- */
const F = "font-family:Pretendard,'Pretendard Variable','Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const EN = "font-family:Jost,Pretendard,'Malgun Gothic',sans-serif";
const C = { ink: '#111111', sub: '#5f5f5f', faint: '#9a9a9a', line: '#e6e6e2', soft: '#f5f5f2', pt: '#2F5BFF', ptSoft: '#eef2ff', taupe: '#7d6a59' };

function page(kmong, src) {
  const dc = !kmong;
  const S = (style, html, tag = 'div') => `<${tag} style="${style}">${html}</${tag}>`;
  const sec = (html, bg = '#ffffff', pad = '84px clamp(20px,5vw,44px)') => `<div data-slice style="margin:0;padding:${pad};background:${bg};box-sizing:border-box;">${html}</div>`;
  const kicker = (t, color = C.pt) => S(`margin:0 0 14px;${EN};font-size:13px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${color};`, t, 'p');
  const h2 = (t, color = C.ink) => S(`margin:0 0 18px;font-size:clamp(28px,4.6vw,40px);font-weight:800;line-height:1.3;letter-spacing:-.04em;color:${color};word-break:keep-all;`, t, 'h2');
  const lead = (t, color = C.sub) => S(`margin:0;font-size:clamp(15px,2.2vw,18px);line-height:1.75;color:${color};word-break:keep-all;`, t, 'p');
  const img = (n, alt, extra = '') => `<img src="${src(n)}" alt="${alt}" style="display:block;width:100%;height:auto;margin:0;border:0;${extra}">`;
  const browser = (n, alt) => S(`margin:0;border:1px solid ${C.line};border-radius:14px;overflow:hidden;background:#ffffff;box-shadow:0 24px 48px -28px rgba(0,0,0,.28);`,
    S(`height:30px;padding:0 14px;background:#f1f1ee;border-bottom:1px solid ${C.line};line-height:30px;font-size:0;`, ['#e3e3df', '#e3e3df', '#e3e3df'].map(c => `<span style="display:inline-block;width:9px;height:9px;margin:10px 6px 0 0;border-radius:50%;background:${c};vertical-align:top;"></span>`).join('')) + img(n, alt));
  const phone = (n, alt, w = '100%') => S(`width:${w};max-width:300px;margin:0 auto;border:7px solid #111111;border-radius:34px;overflow:hidden;background:#111111;box-shadow:0 24px 48px -26px rgba(0,0,0,.4);box-sizing:border-box;`, img(n, alt, 'border-radius:27px;'));
  const cap = t => S(`margin:12px 0 0;font-size:13.5px;line-height:1.6;color:${C.faint};text-align:center;word-break:keep-all;`, t, 'p');
  const chip = (t, on) => `<span style="display:inline-block;margin:0 6px 8px 0;padding:8px 14px;border-radius:999px;background:${on ? C.ink : C.soft};color:${on ? '#ffffff' : C.ink};font-size:14px;font-weight:600;line-height:1.2;">${t}</span>`;
  const row = (cells, gap = 22, basis = 300) => `<div style="display:flex;flex-wrap:wrap;gap:${gap}px;align-items:flex-start;">${cells.map(c => `<div style="flex:1 1 ${typeof c === 'object' ? c.basis : basis}px;min-width:0;">${typeof c === 'object' ? c.html : c}</div>`).join('')}</div>`;
  const box = (html, bg = C.soft, pad = '26px 26px') => S(`height:100%;padding:${pad};border-radius:18px;background:${bg};box-sizing:border-box;`, html);
  const listTitle = t => S(`margin:0 0 14px;font-size:16px;font-weight:800;letter-spacing:-.02em;color:${C.ink};`, t, 'p');
  const steps = xs => listTitle('이렇게 써요') + xs.map((x, i) => `<div style="display:flex;gap:12px;margin:0 0 12px;"><span style="flex:none;display:inline-block;width:24px;height:24px;border-radius:50%;background:${C.ink};color:#ffffff;${EN};font-size:13px;font-weight:600;line-height:24px;text-align:center;">${i + 1}</span><span style="flex:1;font-size:15px;line-height:1.65;color:#333333;word-break:keep-all;">${x}</span></div>`).join('');
  const effects = xs => listTitle('이런 효과가 있어요') + xs.map(x => `<div style="display:flex;gap:10px;margin:0 0 12px;"><span style="flex:none;display:inline-block;width:22px;height:22px;margin-top:1px;border-radius:50%;background:${C.pt};color:#ffffff;font-size:13px;font-weight:800;line-height:22px;text-align:center;">✓</span><span style="flex:1;font-size:15px;line-height:1.65;color:#333333;word-break:keep-all;">${x}</span></div>`).join('');
  const tip = t => S(`margin:22px 0 0;padding:18px 22px;border-left:3px solid ${C.pt};border-radius:0 14px 14px 0;background:${C.ptSoft};font-size:15px;line-height:1.7;color:#1d2a55;word-break:keep-all;`, `<b style="color:${C.pt};">처음이라면 TIP</b>&nbsp;&nbsp;${t}`, 'p');
  const code = t => `<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:#ffffff;border:1px solid ${C.line};${EN};font-size:13.5px;color:${C.ink};white-space:nowrap;">${t}</span>`;
  const head = (no, tag, title, desc) =>
    S('margin:0 0 30px;', `<p style="margin:0 0 6px;${EN};font-size:56px;font-weight:300;line-height:1;letter-spacing:-.02em;color:${C.ink};">${no}<span style="display:inline-block;margin-left:14px;padding:6px 12px;border-radius:999px;background:${C.ptSoft};color:${C.pt};${F};font-size:13px;font-weight:700;letter-spacing:0;vertical-align:middle;">${tag}</span></p>`
      + S(`margin:14px 0 12px;font-size:clamp(25px,3.8vw,32px);font-weight:800;line-height:1.35;letter-spacing:-.04em;color:${C.ink};word-break:keep-all;`, title, 'h3') + lead(desc));
  const feature = (o, bg = '#ffffff') => sec(head(o.no, o.tag, o.title, o.desc) + o.media + S('margin:38px 0 0;', row([box(steps(o.steps)), box(effects(o.effects), 'transparent', '26px 4px 0')], 18, 320)) + (o.tip ? tip(o.tip) : ''), bg);
  const part = (no, en, title, desc) => sec(S('text-align:center;', kicker('PART ' + no + ' · ' + en, '#9fb2ff') + h2(title, '#ffffff') + lead(desc, '#c9c9c9')), '#111111', '70px clamp(20px,5vw,44px)');

  const out = [];

  /* 0. 첫 화면 */
  out.push(sec(
    S('text-align:center;', kicker('Cafe24 All-in-one Skin · wear902')
      + S(`margin:0 0 22px;font-size:clamp(34px,6.4vw,58px);font-weight:800;line-height:1.22;letter-spacing:-.05em;color:${C.ink};word-break:keep-all;`, '오픈 첫날부터<br><span style="color:' + C.pt + ';">팔리는 쇼핑몰</span>', 'h1')
      + lead('따로 개발하면 <b style="color:' + C.ink + ';">수백~수천만 원</b>이 드는 마케팅 · 고객관리 기능 8가지를<br>스킨 하나에 담았어요. 상품만 올리면 손님을 모으고, 사게 하고, 다시 오게 하는 장치가 바로 돌아갑니다.'))
    + S('position:relative;margin:48px 0 0;padding:0 7% 34px 0;', browser('home-pc', 'wear902 PC 첫 화면')
      + S('position:absolute;right:0;bottom:0;width:23%;', phone('home-mobile', 'wear902 휴대폰 첫 화면')))
    + S('margin:46px 0 0;', row([
      ['8가지', '마케팅 · CRM 기능 기본 탑재'], ['0원', '챗봇 월 이용료'], ['0원', '기능 추가 개발비'],
    ].map(([a, b]) => S(`padding:24px 10px;border:1px solid ${C.line};border-radius:18px;text-align:center;`, `<p style="margin:0 0 6px;${EN};font-size:38px;font-weight:500;line-height:1.1;color:${C.ink};">${a.replace(/(\D+)$/, '<span style="' + F + ';font-size:22px;font-weight:700;">$1</span>')}</p><p style="margin:0;font-size:14.5px;color:${C.sub};word-break:keep-all;">${b}</p>`)), 12, 200)),
    '#ffffff', '90px clamp(20px,5vw,44px) 76px'));

  /* 1. 처음 여는 사장님의 고민 */
  const worry = (q, a, fx) => box(`<p style="margin:0 0 14px;font-size:19px;font-weight:800;line-height:1.45;letter-spacing:-.03em;color:${C.ink};word-break:keep-all;">“${q}”</p><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.sub};word-break:keep-all;">${a}</p><p style="margin:0;font-size:14px;font-weight:700;color:${C.pt};">→ ${fx}</p>`, '#ffffff');
  out.push(sec(
    S('text-align:center;margin:0 0 40px;', kicker('Why wear902') + h2('쇼핑몰을 처음 열면<br>꼭 이 벽에 부딪혀요') + lead('예쁜 디자인만으로는 주문이 들어오지 않아요. 손님이 <b style="color:' + C.ink + ';">가입하고, 지금 사고, 다시 오게</b> 만드는 장치가 필요합니다.'))
    + row([
      worry('구경만 하고 그냥 나가요', '후기도 적은 새 쇼핑몰, 손님은 “나중에 사야지” 하고 떠나요. 지금 사야 할 이유가 필요해요.', '마감 카운트다운 · 타임세일 · 쿠폰 뽑기'),
      worry('회원가입을 안 해요', '가입해야 쿠폰 · 문자 · 재구매로 이어지는데, 이유 없이 가입하는 손님은 없어요.', '무료회원 웰컴 쿠폰팩'),
      worry('한 번 오고 다시 안 와요', '장바구니에 담아 두고 떠난 손님이 돌아왔을 때, 아무 일도 일어나지 않아요.', '재방문 환영 쿠폰'),
      worry('문의 답할 사람이 없어요', '혼자 운영하면 새벽 문의 · 반복 질문에 지치고, 놓친 문의는 곧 놓친 주문이에요.', '24시 챗봇 · 상담 관리 페이지'),
    ], 16, 340), C.soft));

  /* 2. 한눈에 보기 */
  const group = (en, title, items) => box(`<p style="margin:0 0 4px;${EN};font-size:12px;font-weight:600;letter-spacing:.2em;color:${C.pt};">${en}</p><p style="margin:0 0 18px;font-size:19px;font-weight:800;letter-spacing:-.03em;color:${C.ink};">${title}</p>`
    + items.map(([n, t, d]) => `<div style="display:flex;gap:12px;padding:13px 0;border-top:1px solid ${C.line};"><span style="flex:none;width:26px;${EN};font-size:15px;font-weight:600;color:${C.faint};">${n}</span><span style="flex:1;"><b style="display:block;font-size:15.5px;color:${C.ink};">${t}</b><span style="font-size:13.5px;line-height:1.6;color:${C.sub};word-break:keep-all;">${d}</span></span></div>`).join(''), '#ffffff', '26px 24px 14px');
  const tr = (a, b, c, headRow) => `<tr><td style="padding:15px 14px;border-bottom:1px solid ${C.line};font-size:14.5px;font-weight:${headRow ? 700 : 600};color:${headRow ? C.faint : C.ink};word-break:keep-all;">${a}</td><td style="padding:15px 14px;border-bottom:1px solid ${C.line};font-size:14.5px;color:${headRow ? C.faint : C.sub};word-break:keep-all;">${b}</td><td style="padding:15px 14px;border-bottom:1px solid ${C.line};font-size:14.5px;font-weight:700;color:${headRow ? C.faint : C.pt};background:${headRow ? '#ffffff' : C.ptSoft};word-break:keep-all;">${c}</td></tr>`;
  out.push(sec(
    S('text-align:center;margin:0 0 40px;', kicker('8 Features') + h2('스킨 하나에 담은 8가지') + lead('맞춤 개발로 하나씩 붙이면 기능마다 개발비가 들고, 앱으로 붙이면 매달 이용료가 나가요.<br>wear902 는 처음부터 <b style="color:' + C.ink + ';">전부 들어 있어요.</b>'))
    + row([
      group('MARKETING', '구매율을 올리는 이벤트', [['01', '무료회원 웰컴 쿠폰팩', '가입하면 쿠폰 3장, 전용 페이지'], ['02', '쿠폰 이벤트 페이지', '최대 50% 쿠폰 뽑기'], ['03', '이벤트 마감 카운트다운', '초 단위로 줄어드는 타이머'], ['04', '타임세일', '상품별 한정 시간 할인'], ['05', '재방문 환영 쿠폰', '다시 온 손님에게만 시크릿 쿠폰']]),
      { basis: 300, html: group('COMMERCE UX', '쇼핑 경험', [['06', '착장 제품 즉시 구매', '사진 속 옷을 눌러 바로 구매']]) + '<div style="height:16px;"></div>' + group('CRM', '24시간 고객 관리', [['07', '24시 무료 챗봇 도우미', '월 이용료 없이 자동 응대'], ['08', '개인상담 · CRM 관리 페이지', '손님별 상담 · 주문 기록을 한 화면에']]) },
    ], 16, 300)
    + S('margin:44px 0 0;', S(`margin:0 0 14px;font-size:17px;font-weight:800;color:${C.ink};`, '따로 준비하면 vs wear902', 'p')
      + `<table style="width:100%;border-collapse:collapse;border-top:2px solid ${C.ink};background:#ffffff;">${tr('기능', '따로 준비하면', 'wear902', true)}${tr('쿠폰 · 이벤트 페이지', '기획전마다 디자인 · 개발 외주', '기본 포함 · 글자와 사진만 바꾸기')}${tr('카운트다운 · 타임세일', '앱 설치(월 이용료) 또는 맞춤 개발', '기본 포함 · 날짜만 적기')}${tr('챗봇', '챗봇 서비스 월 구독료', '월 이용료 0원')}${tr('상담 · CRM', 'CRM 솔루션 구독 · 연동 개발', '기본 포함 · 사장님 구글 시트에 저장')}</table>`),
    C.soft));

  /* PART 1 */
  out.push(part(1, 'Marketing & Event', '들어온 손님이<br>‘지금’ 사게 만드는 장치', '가입 → 첫 구매 → 재방문까지, 구매 흐름마다 맞는 혜택이 자동으로 나타나요.'));

  out.push(feature({ no: '01', tag: '가입 유도', title: '무료회원 웰컴 쿠폰팩', desc: '처음 온 손님에게 “지금 가입하면 3만 원 쿠폰”을 보여 주는 전용 페이지예요. 화면 오른쪽 쿠폰 버튼을 누르면 작은 창으로 열리고, 가입을 마치면 쿠폰이 쿠폰함에 바로 들어가요.',
    media: row([{ basis: 480, html: browser('welcome-pc', '쿠폰 버튼을 누르면 열리는 무료회원 감사 쿠폰팩 창') + cap('PC : 오른쪽 쿠폰 버튼 → 쿠폰팩 창') }, { basis: 200, html: phone('welcome-page', '휴대폰 무료회원 감사 쿠폰팩 화면') + cap('휴대폰 : 전체 화면으로') }], 24),
    steps: ['카페24 관리자 › 쿠폰에서 쿠폰 3장을 <b>‘회원가입 시 자동 발급’</b>으로 만들어요.', '쿠폰팩 페이지의 글자 · 사진 · 금액은 화면에서 바로 고쳐요. 코딩은 필요 없어요.', '쿠폰 버튼은 <b>아직 회원이 아닌 손님에게만</b> 자동으로 보여요.'],
    effects: ['구경만 하던 손님이 회원이 돼요.', '가입하자마자 쿠폰이 있으니 첫 구매가 빨라져요.', '회원이 늘면 문자 · 메일로 다시 부를 수 있어요(수신 동의 회원).'],
    tip: '5,000원(3만 원 이상) · 10,000원(7만 원 이상) · 15,000원(12만 원 이상)처럼 <b>주문 금액 조건을 단계로</b> 걸면, 객단가도 같이 올라가요.' }));

  out.push(feature({ no: '02', tag: '이벤트 페이지', title: '쿠폰 이벤트 페이지 · 최대 50% 쿠폰 뽑기', desc: '세일 페이지 안에 들어가는 쿠폰 뽑기 이벤트예요. 카드를 뽑으면 5%~50% 쿠폰 중 하나가 바로 발급돼요. 쿠폰마다 수량을 정하면 확률이 자동으로 계산돼 화면에 보여요.',
    media: row([{ basis: 480, html: browser('coupon-pick', '최대 50% 쿠폰 뽑기 이벤트 화면') + cap('세일 페이지 속 쿠폰 뽑기') }, { basis: 200, html: phone('coupon-pick-mobile', '휴대폰 쿠폰 뽑기 화면과 쿠폰별 수량 · 확률') + cap('쿠폰별 수량 · 확률 표시') }], 24),
    steps: ['카페24에서 할인율별 쿠폰 4장(50 · 20 · 10 · 5%)을 만들고 수량을 정해요.', '쿠폰 번호를 스킨 설정에 붙여 넣으면 끝이에요.', '뽑기는 <b>로그인한 회원만 1인 1회</b> — 참여하려고 가입하는 손님도 생겨요.'],
    effects: ['할인에 ‘재미’가 더해져 세일 페이지에 오래 머물러요.', '큰 할인은 수량을 적게 — 할인 비용은 사장님이 정한 만큼만 나가요.', '쿠폰을 받은 손님은 쓰려고 다시 장바구니로 돌아와요.'],
    tip: '50% 쿠폰은 10장만 걸어 보세요. “누군가는 50%를 받는다”는 기대감이 참여를 만들어요.' }, C.soft));

  out.push(feature({ no: '03', tag: '구매 긴박감', title: '이벤트 마감 카운트다운', desc: '세일 페이지 맨 위와 이벤트 팝업에 “이벤트 마감까지 ○일 ○○:○○:○○”가 초 단위로 줄어들어요. 남은 시간이 보이면 손님의 고민 시간이 짧아져요.',
    media: row([{ basis: 480, html: browser('countdown-sale', '세일 페이지 맨 위 이벤트 마감 카운트다운') + cap('세일 페이지 맨 위 타이머') }, { basis: 200, html: S('max-width:300px;margin:0 auto;border-radius:18px;overflow:hidden;box-shadow:0 24px 48px -26px rgba(0,0,0,.4);', img('countdown-pop', '이벤트 마감 타이머가 붙은 메인 팝업')) + cap('메인 팝업에도 타이머') }], 24),
    steps: ['마감 날짜와 시간을 한 줄 적어요. ' + code('2026-10-31 23:59'), '팝업은 사진 · 문구 · 버튼 링크를 바꿔 여러 장 띄울 수 있어요.', '마감이 지나면 “이벤트가 종료되었습니다”로 알아서 바뀌어요.'],
    effects: ['“나중에 사야지”가 “지금 사야지”로 바뀌어요.', '팝업에서 세일 페이지로 바로 이어져 이벤트 참여가 늘어요.'],
    tip: '오픈 기념 세일은 <b>3일</b>처럼 짧게 잡으세요. 기간이 짧을수록 타이머의 힘이 커져요.' }));

  out.push(feature({ no: '04', tag: '한정 할인', title: '타임세일', desc: '상품마다 끝나는 시각을 걸면, 상품 목록 사진 위에 “TIME SALE 남은 시간” 띠가, 상세 페이지 맨 위에는 카운트다운 배너가 붙어요.',
    media: browser('timesale-card', '상품 목록 카드 사진 아래쪽 TIME SALE 남은 시간 띠') + cap('상품 목록 : 사진 위 TIME SALE 띠 · 할인율') + S('height:22px;', '') + row([{ basis: 480, html: browser('timesale-detail', '상품 상세 페이지 맨 위 타임세일 종료까지 배너') + cap('상세 페이지 : 타임세일 종료까지') }, { basis: 200, html: phone('timesale-detail-mobile', '휴대폰 상품 상세 타임세일 배너') + cap('휴대폰에서도 그대로') }], 24),
    steps: ['상품 수정 › 상품 요약설명에 ' + code('#타임세일 2026-10-31 23:59') + ' 한 줄을 적어요.', '할인 금액은 카페24 상품 할인 설정을 그대로 써요.', '시간이 끝나면 띠와 배너가 저절로 사라져요.'],
    effects: ['목록에서 눈에 띄어 그 상품의 클릭이 늘어요.', '재고 정리 · 신상품 첫 주 판매에 딱 맞아요.', '배너 · 띠 색은 쇼핑몰 톤에 맞춰 바꿀 수 있어요.'],
    tip: '“매주 금요일 저녁 6시 ~ 일요일 자정”처럼 시간을 정해 두면 단골이 그 시간을 기다려요.' }, C.soft));

  out.push(feature({ no: '05', tag: '재구매 유도', title: '재방문 환영 쿠폰', desc: '한 번 왔던 손님이 다시 들어오면, 챗봇 첫 화면에 “3일 만에 다시 오셨어요” 인사와 함께 24시간 한정 시크릿 쿠폰이 나타나요. [받기] 한 번이면 바로 발급돼요.',
    media: row([{ basis: 260, html: phone('revisit', '다시 온 손님에게 보이는 재방문 시크릿 쿠폰') + cap('다시 온 손님에게만 보이는 화면') }, { basis: 340, html: S('padding:8px 0 0;', [['반겨 주는 인사', '지난 방문일 · 몇 번째 방문인지 기억해 먼저 인사해요.'], ['시크릿 쿠폰', '처음 보여 준 때부터 24시간 남은 시간이 줄어들어요. 시간은 사장님이 정해요.'], ['지난 대화 이어가기', '지난번에 물어본 질문, 담아 둔 상품을 기억해 이어서 안내해요.'], ['비용 · 서버 없음', '방문 기록은 손님 브라우저에만 남아요. 따로 쓰는 서비스가 없어요.']].map(([t, d]) => `<div style="padding:18px 0;border-bottom:1px solid ${C.line};"><b style="display:block;margin:0 0 4px;font-size:16.5px;color:${C.ink};">${t}</b><span style="font-size:15px;line-height:1.65;color:${C.sub};word-break:keep-all;">${d}</span></div>`).join('')) }], 34),
    steps: ['카페24에서 쿠폰 1장을 만들어요. (예: 10% · 1인 1회 · 받은 날부터 7일)', '쿠폰 번호 · 혜택 · 받을 수 있는 시간을 적어요.', '다시 온 손님에게만 자동으로 나타나요.'],
    effects: ['담아 두고 떠났던 손님의 결제를 한 번 더 밀어줘요.', '“나를 기억한다”는 느낌이 단골을 만들어요.'] }));

  /* PART 2 */
  out.push(part(2, 'Commerce UX', '“모델이 입은 그 옷!”<br>찾지 않고 바로 사게', '사진을 보고 마음에 든 옷을 찾느라 헤매는 순간, 손님은 떠나요.'));
  out.push(feature({ no: '06', tag: 'Lookbook Quick Buy', title: '착장 제품 즉시 구매', desc: '룩북 사진 속 <b>+</b> 를 누르면 그 옷의 이름 · 가격 · 리뷰와 [구매하러 가기]가 바로 떠요. 사진 옆에는 같이 입은 상품 목록이 나란히 보여요.',
    media: browser('looks', '장면 속 그 상품 - 룩북 사진 위 상품 표시 점') + cap('룩북 사진 위 + 표시 · 옆에 착장 상품 목록') + S('height:22px;', '') + browser('looks-qv', '사진 속 + 를 누르면 열리는 상품 구매 창') + cap('+ 를 누르면 바로 구매 창'),
    steps: ['룩북 사진을 올려요.', '편집 화면에서 사진의 옷 위치를 누르면 그 자리(가로% · 세로%)가 복사돼요.', '「상품번호 가로% 세로%」 한 줄이면 이름 · 가격 · 사진은 상품에서 자동으로 가져와요.'],
    effects: ['사진 → 구매까지 클릭 두 번이면 끝나요.', '코디 상품을 함께 보여 줘 한 번에 두 벌을 사게 돼요.', '룩북이 ‘보는 화면’에서 ‘파는 화면’이 돼요.'] }, C.soft));

  /* PART 3 */
  out.push(part(3, '24h CRM', '운영비 0원,<br>24시간 고객 관리', '혼자 운영해도 손님 응대와 관리가 끊기지 않게.'));
  out.push(feature({ no: '07', tag: '월 이용료 0원', title: '24시 무제한 무료 챗봇 도우미', desc: '화면 오른쪽 아래 말풍선을 누르면 쇼핑 도우미가 열려요. 배송 · 교환 · 사이즈처럼 자주 묻는 질문에 <b>사장님이 적어 둔 답</b>으로 바로 안내하고, 해당 페이지로 가는 버튼까지 보여 줘요.',
    media: row([{ basis: 480, html: browser('chat-pc', 'PC 화면 오른쪽에 열린 쇼핑 도우미 챗봇') + cap('PC : 화면을 가리지 않는 옆 창') }, { basis: 200, html: phone('chat', '휴대폰 쇼핑 도우미 챗봇 메뉴') + cap('휴대폰 : 메뉴를 눌러 바로 답') }], 24)
      + S('margin:26px 0 0;', ['스타일 추천 (질문 4개 → 어울리는 상품)', '배송 안내', '교환 · 반품 · 환불', '사이즈 상담', '카카오톡 상담 연결', '못 찾은 질문 기록'].map((t, i) => chip(t, i === 0)).join('')),
    steps: ['자주 묻는 질문 게시판에 글을 써요. <b>제목 = 질문, 본문 = 답</b>이에요.', '메뉴 · 인사말 · 운영 시간을 정해요.', '사람이 답해야 할 땐 카카오톡 채널 1:1 상담으로 바로 이어져요.'],
    effects: ['새벽 2시 문의에도 바로 답해요. 쉬는 날도 없어요.', '같은 질문에 반복해서 답하는 시간이 줄어요.', '챗봇이 못 찾은 질문이 쌓여, 자주 묻는 질문을 채워 나갈 수 있어요.'],
    tip: 'AI 구독 서비스가 아니라서 <b>월 이용료가 없고</b>, 사장님이 정한 답만 말하니 엉뚱한 답을 할 걱정도 없어요.' }));

  out.push(feature({ no: '08', tag: '고객 관리', title: '개인상담 & CRM 관리 페이지', desc: '챗봇 · 카카오톡 · 상품 문의 · 주문서 · 결제까지, <b>손님별로 한 줄에 묶어</b> 보는 사장님 전용 화면이에요. 누가 어떤 상품을 보고 무엇을 물어봤는지, 주문서만 쓰고 결제하지 않은 손님이 누구인지 한눈에 보여요.',
    media: browser('admin', '상담 관리 페이지 - 손님별 상담 상태 · 최근 활동 · 결제 여부 목록') + cap('손님 목록 : 오늘 확인 · 미결제 · 답변 대기를 숫자로 (화면 속 손님 정보는 예시)') + S('height:22px;', '') + browser('admin-detail', '손님을 누르면 열리는 회원 정보 · 상담 일지') + cap('손님을 누르면 : 회원 정보 · 상담 일지 · 챗봇에서 물어본 것'),
    steps: ['사장님 구글 계정에 상담 기록 시트를 연결해요. (설치를 도와드려요)', '관리자 페이지에 접속 키로 들어가요. 키가 없으면 아무도 볼 수 없어요.', '손님이 동의한 상담만 기록돼요.'],
    effects: ['주문서만 쓰고 떠난 손님에게 바로 연락할 수 있어요. (CSV 다운로드)', '상담 메모 · 확인 상태로 놓치는 문의가 없어요.', '기록은 사장님 구글 시트에 쌓여요. 데이터는 온전히 사장님 거예요.'] }, C.soft));

  /* 오픈 첫 2주 */
  const day = (d, t, xs) => `<div style="display:flex;gap:18px;padding:22px 0;border-top:1px solid ${C.line};"><span style="flex:none;width:96px;${EN};font-size:15px;font-weight:600;color:${C.pt};">${d}</span><span style="flex:1;"><b style="display:block;margin:0 0 6px;font-size:17px;color:${C.ink};">${t}</b><span style="font-size:15px;line-height:1.7;color:${C.sub};word-break:keep-all;">${xs}</span></span></div>`;
  out.push(sec(
    S('text-align:center;margin:0 0 36px;', kicker('Playbook') + h2('오픈 첫 2주,<br>이렇게 써 보세요') + lead('뭘 먼저 해야 할지 모르겠다면 이 순서 그대로 따라 하세요.'))
    + day('D-3', '오픈 준비', '웰컴 쿠폰 3장 · 쿠폰 뽑기 수량 정하기 · 챗봇 자주 묻는 질문 10개 등록 (배송 · 교환 · 사이즈부터)')
    + day('D-DAY ~ 3', '오픈 기념 세일', '세일 페이지 + <b>3일 마감 카운트다운</b> + 쿠폰 뽑기 팝업. 첫 손님에게 “지금 사야 할 이유”를 줘요.')
    + day('4 ~ 7일', '주말 타임세일', '반응 좋은 상품 2~3개에 금 · 토 · 일 타임세일. 목록에 TIME SALE 띠가 붙어 눈에 띄어요.')
    + day('2주차', '돌아온 손님 잡기', '재방문 쿠폰으로 다시 온 손님의 결제를 밀어주고, 상담 관리에서 <b>미결제 손님</b>에게 연락해요.')
    + S(`border-top:1px solid ${C.line};`, ''),
    '#ffffff'));

  /* 기본기 */
  out.push(sec(
    S('text-align:center;margin:0 0 30px;', kicker('Basics') + h2('기본기도 빠짐없이')) +
    S('text-align:center;', ['PC · 휴대폰 반응형', '코딩 없이 화면에서 바로 고치기', '실수해도 한 번에 되돌리기', '무료배송까지 남은 금액 표시', '재고 임박 표시', '포토 리뷰', '스타일 고르기', '사이즈 가이드'].map(t => chip(t)).join('')),
    C.soft, '64px clamp(20px,5vw,44px)'));

  /* 자주 묻는 질문 */
  const qa = (q, a) => `<div style="padding:22px 0;border-top:1px solid ${C.line};"><p style="margin:0 0 8px;font-size:17px;font-weight:800;color:${C.ink};word-break:keep-all;"><span style="${EN};color:${C.pt};margin-right:8px;">Q.</span>${q}</p><p style="margin:0;padding-left:26px;font-size:15px;line-height:1.75;color:${C.sub};word-break:keep-all;">${a}</p></div>`;
  out.push(sec(
    S('text-align:center;margin:0 0 30px;', kicker('FAQ') + h2('자주 묻는 질문'))
    + qa('코딩을 하나도 몰라도 되나요?', '네. 글자 · 사진 · 쿠폰 번호 · 날짜는 쇼핑몰 화면에서 [고치기]를 눌러 바로 바꿔요. 잘못 고쳐도 한 번에 되돌릴 수 있어요.')
    + qa('챗봇 이용료가 정말 없나요?', '네. 외부 AI 서비스를 쓰지 않고, 사장님이 게시판에 적어 둔 답으로 안내하는 방식이라 월 이용료가 없어요.')
    + qa('쿠폰은 어디서 만들고, 비용은 얼마나 드나요?', '카페24 관리자 › 프로모션 › 쿠폰에서 만들고 번호만 넣으면 돼요. 할인 금액 · 수량 · 기간은 사장님이 정한 만큼만 나가요.')
    + qa('상담 기록(손님 정보)은 어디에 저장되나요?', '사장님 구글 계정의 시트에 저장되고, 손님이 동의한 경우에만 남아요. 쓰기 전에 쇼핑몰 개인정보처리방침에 수집 항목을 적어 주세요.')
    + qa('휴대폰에서도 다 되나요?', '네. 8가지 기능 모두 휴대폰 화면에 맞춰 만들었어요. 손님 대부분은 휴대폰으로 들어와요.')
    + S(`border-top:1px solid ${C.line};`, ''),
    '#ffffff'));

  /* 마무리 */
  out.push(sec(
    S('text-align:center;', kicker('Start today', '#9fb2ff')
      + S(`margin:0 0 18px;font-size:clamp(28px,5vw,44px);font-weight:800;line-height:1.3;letter-spacing:-.04em;color:#ffffff;word-break:keep-all;`, '기능 개발비 0원,<br>쇼핑몰 세팅은 완벽하게', 'h2')
      + lead('오늘 설치하면, 내일은 팔면서 마케팅까지 하는 쇼핑몰이 돼요.', '#c9c9c9')
      + S('margin:30px 0 0;', ['웰컴 쿠폰팩', '쿠폰 이벤트', '마감 카운트다운', '타임세일', '재방문 쿠폰', '착장 즉시 구매', '24시 챗봇', '상담 · CRM'].map(t => `<span style="display:inline-block;margin:0 6px 8px 0;padding:8px 14px;border:1px solid #3a3a3a;border-radius:999px;color:#e6e6e6;font-size:14px;font-weight:600;">${t}</span>`).join(''))
      + (dc ? S('margin:34px 0 0;', `<a href="${SAMPLE}" target="_blank" rel="noopener" style="display:inline-block;margin:0 6px 10px;padding:16px 34px;border-radius:999px;background:#ffffff;color:#111111;font-size:16px;font-weight:800;text-decoration:none;">8가지 기능 직접 써 보기 →</a>`) : S('margin:34px 0 0;', `<span style="display:inline-block;padding:16px 34px;border-radius:999px;background:${C.pt};color:#ffffff;font-size:17px;font-weight:800;">지금 바로 시작하세요</span>`))),
    '#111111', '84px clamp(20px,5vw,44px)'));
  if (dc) out.push(`<div style="margin:0;padding:40px 20px;text-align:center;background:${C.ptSoft};"><p style="margin:0 0 8px;font-size:22px;font-weight:800;color:${C.ink};">구매하셨다면 주문서를 작성해 주세요</p><p style="margin:0 0 22px;font-size:15px;color:#4a5260;">쇼핑몰 정보를 받는 대로 1일 안에 적용해 드려요.</p><a href="${FORM}" target="_blank" rel="noopener" style="display:inline-block;padding:16px 40px;border-radius:999px;background:${C.pt};color:#ffffff;font-size:18px;font-weight:bold;text-decoration:none;">주문서 작성하기</a></div>`);

  const fonts = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap">';
  return fonts + '\n' + `<div style="max-width:922px;margin:0 auto;${F};color:${C.ink};text-align:left;-webkit-font-smoothing:antialiased;">\n` + out.join('\n') + '\n</div>';
}

/* ---------- 3. 크몽 : 가로 860 으로 그려 구역마다 자른다 ---------- */
async function kmong() {
  const puppeteer = require('puppeteer-core');
  fs.mkdirSync(path.join(KMONG, 'tmp'), { recursive: true });
  const body = page(true, n => 'file:///' + path.join(IMG, n + '.jpg').replace(/\\/g, '/'));
  const file = path.join(KMONG, 'tmp/page.html');
  fs.writeFileSync(file, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>body{margin:0;background:#fff}</style></head><body>${body}</body></html>`);
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 860, height: 1200, deviceScaleFactor: 2 });
  await pg.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await pg.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1500));
  const boxes = await pg.evaluate(() => [...document.querySelectorAll('[data-slice]')].map(e => { const r = e.getBoundingClientRect(); return [r.top + scrollY, r.height]; }));
  // 구역을 이어 붙여 한 장이 3000px 을 넘지 않게 묶는다
  const groups = []; let cur = null;
  for (const [y, h] of boxes) { if (cur && cur.h + h <= 3000) cur.h += h; else { cur = { y, h }; groups.push(cur); } }
  fs.readdirSync(KMONG).filter(f => /^상세_\d+\.jpg$/.test(f)).forEach(f => fs.unlinkSync(path.join(KMONG, f)));
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i], png = path.join(KMONG, 'tmp', `s${i}.png`), name = `상세_${String(i + 1).padStart(2, '0')}.jpg`;
    await pg.screenshot({ path: png, clip: { x: 0, y: g.y, width: 860, height: Math.round(g.h) }, captureBeyondViewport: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=860:-2:flags=lanczos', '-q:v', '2', path.join(KMONG, name)]);
    console.log(name, Math.round(g.h));
  }
  await b.close();
}

if (MODE === 'img') images();
else if (MODE === 'dc') {
  if (!COMMIT) { console.log('사용 : node detail-v3.js dc <이미지 커밋>'); process.exit(1); }
  const html = page(false, n => `https://cdn.jsdelivr.net/gh/tlsdmsrud902/wear@${COMMIT}/designcenter/wear902/v3/${n}.jpg`);
  fs.writeFileSync(path.join(ROOT, 'designcenter/wear902/product-content-v3.html'), html);
  console.log('dc length', html.length);
} else if (MODE === 'preview') {
  // 로컬 확인용 : 디자인센터 HTML 을 로컬 이미지로
  fs.mkdirSync(path.join(ROOT, '_deploy/dc'), { recursive: true });
  const html = page(false, n => 'file:///' + path.join(IMG, n + '.jpg').replace(/\\/g, '/'));
  fs.writeFileSync(path.join(ROOT, '_deploy/dc/v3-preview.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#fff}</style></head><body>${html}</body></html>`);
  console.log('preview ok');
} else if (MODE === 'kmong') kmong();
else console.log('사용 : node detail-v3.js img | dc <커밋> | preview | kmong');
