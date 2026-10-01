// food902 「10분이면 내 쇼핑몰로」 설명서 — 게시판 화면 관리(?edit=1)로 바꾸는 법
// (PETPIA 10분 설명서 D:\pet\manual-cms 를 food902 용으로 옮긴 것)
// node build.js          → index.html
// node build.js --pdf    → index.html + food902-10분-설명서.pdf   (PPTR=puppeteer-core 경로)
// node build.js --png    → preview/*.png (쪽마다 미리보기)
// 캡처 : shots/*.jpg — 쇼핑몰 화면은 scratchpad 의 shoot.js(로그인 없이), 편집 창 · 관리자 화면은 로그인한 브라우저에서 찍었다
const fs = require('fs');
const path = require('path');
const SHOTS = path.join(__dirname, 'shots');
const IMG = process.env.IMG_BASE || 'shots/';
const NAME = 'food902';

function jpgSize(file) {
  const b = fs.readFileSync(file); let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error('size ' + file);
}

/* fig('파일', {crop:[x,y,w,h], m:[[번호,x,y,방향]], box:[[x,y,w,h]], cap, h:'높이 제한'}) — 좌표는 원본 사진 픽셀 */
const missing = [];
function fig(name, o = {}) {
  const file = path.join(SHOTS, name + '.jpg');
  if (!fs.existsSync(file)) { missing.push(name); return `<figure class="fig"><div class="shotwrap" style="aspect-ratio:16/9"><div class="shot" style="display:flex;align-items:center;justify-content:center;color:#9aa3ad">캡처 준비 중 : ${name}</div></div>${o.cap ? `<figcaption>${o.cap}</figcaption>` : ''}</figure>`; }
  const { w: iw, h: ih } = jpgSize(file);
  const [cx, cy, cw, ch] = o.crop || [0, 0, iw, ih];
  const pct = (v, t) => (v / t * 100).toFixed(3) + '%';
  const marks = (o.m || []).map(([n, x, y, dir = 'c']) => `<b class="mk d-${dir}" style="left:${pct(x - cx, cw)};top:${pct(y - cy, ch)}">${n}</b>`).join('');
  const boxes = (o.box || []).map(([x, y, w, h]) => `<i class="bx" style="left:${pct(x - cx, cw)};top:${pct(y - cy, ch)};width:${pct(w, cw)};height:${pct(h, ch)}"></i>`).join('');
  const maxW = o.h ? `max-width:calc(${o.h} * ${(cw / ch).toFixed(4)});` : '';
  return `<figure class="fig fig-center" style="${maxW}"><div class="shotwrap" style="aspect-ratio:${cw}/${ch}"><div class="shot"><img src="${IMG}${name}.jpg" alt="" style="width:${pct(iw, cw)};left:${pct(-cx, cw)};top:${pct(-cy, ch)}">${boxes}</div>${marks}</div>${o.cap ? `<figcaption>${o.cap}</figcaption>` : ''}</figure>`;
}
const steps = arr => `<ol class="steps">${arr.map(([n, t]) => `<li><b class="num">${n}</b><div>${t}</div></li>`).join('')}</ol>`;
const big = (n, t) => `<div class="bigstep"><b class="num">${n}</b><div>${t}</div></div>`;
const tip = t => `<div class="tip"><b>💡 꿀팁</b><div>${t}</div></div>`;
const warn = t => `<div class="warn"><b>⚠️ 조심</b><div>${t}</div></div>`;
const note = t => `<div class="note">${t}</div>`;
const tbl = (head, rows, cls) => `<table class="tbl ${cls || ''}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const two = (a, b, ratio) => `<div class="two" style="grid-template-columns:${ratio || '1fr 1fr'}"><div>${a}</div><div>${b}</div></div>`;
const road = arr => `<div class="path"><b class="path-lab">📍 가는 길</b>${arr.map((s, i) => `<span class="path-step${i === arr.length - 1 ? ' last' : ''}">${s}</span>`).join('<i class="path-arr">›</i>')}</div>`;
const btn = t => `<span class="ui">${t}</span>`;

const CH = {
  0: { name: '시작 전 준비', color: '#3f6b3a' },
  1: { name: '4단계로 바꾸기', color: '#c0602f' },
  2: { name: '메인 화면', color: '#2f8a6a' },
  3: { name: '세일 페이지', color: '#c2413a' },
  4: { name: '목록 · 게시판 · 가이드', color: '#7a55b9' },
  5: { name: '도움말', color: '#5b6573' },
};
const P = [];
const page = (ch, id, title, body) => P.push({ ch, id, title, body });

/* ============================== 0. 시작 전 준비 ============================== */
page(0, 'how', '이 설명서 보는 법', `
<p class="lead">이 설명서는 <b>food902 쇼핑몰을 내 가게로 바꾸는 방법</b>을 그림으로 알려 줘요.
코드는 몰라도 돼요. <b>주소 뒤에 ?edit=1 → [고치기] → 칸에 적기 → [저장하기]</b>, 이 네 가지면 끝이에요.</p>
${big(1, '<b>편집 모드 열기</b> — 내 쇼핑몰 주소 뒤에 <code>?edit=1</code> 을 붙여요.')}
${big(2, '<b>[고치기] 누르기</b> — 바꾸고 싶은 곳의 주황색 버튼을 눌러요.')}
${big(3, '<b>칸에 적기</b> — 글자는 칸에 쓰고, 사진은 [사진 바꾸기]로 올려요.')}
${big(4, '<b>[저장하기]</b> — 저장하고 쇼핑몰을 새로고침하면 바뀌어 있어요.')}
<h3>그림 속 표시</h3>
${tbl(['표시', '뜻'], [
  ['<b class="mk mk-static">1</b>', '그림의 번호 = 아래 설명의 번호예요.'],
  ['<i class="bx bx-static"></i>', '빨간 네모 = 눌러야 할 곳이에요.'],
  [btn('저장하기'), '화면에 있는 버튼 이름이에요.'],
])}
${tip('처음이라면 <a href="#s1">1장</a>을 순서대로 한 번 따라 해 보세요. 나머지 쪽은 필요할 때 목차에서 골라 보면 돼요.')}
`);

page(0, 'ready', '처음 한 번만: 게시판 확인하기', `
<p class="lead">바꾼 내용은 카페24 게시판 <b>「뉴스/이벤트」(2번)</b>에 글로 저장돼요. 이 게시판이 켜져 있는지 딱 한 번만 확인해요.</p>
${road(['카페24 관리자', '게시판', '게시판 관리'])}
${fig('adm-boards', { h: '78mm' })}
${steps([
  [1, '<b>뉴스/이벤트</b> 게시판(게시판 ID <b>2</b>)을 찾아 제목을 눌러요.'],
  [2, '<b>사용여부 "사용"</b>, <b>표시여부 "표시"</b>, <b>쓰기 권한 "관리자"</b>로 되어 있는지 봐요. 아니면 바꾸고 저장해요.'],
  [3, '이 게시판은 <b>관리자만 글을 쓸 수 있어서</b> 손님이 화면을 바꿀 수 없어요.'],
])}
${warn('편집할 때는 <b>카페24 관리자에 로그인한 같은 브라우저</b>로 쇼핑몰을 열어야 저장할 수 있어요.')}
${tip('자주 묻는 질문 메뉴는 <b>「이용안내 FAQ」(3번)</b> 게시판을 써요. 같은 방법으로 사용 · 표시로 켜 두세요.')}
`);

/* ============================== 1. 4단계 ============================== */
page(1, 's1', '1단계 · 편집 모드 열기', `
<p class="lead">인터넷 주소창에 <b>내 쇼핑몰 주소</b>를 쓰고 뒤에 <code>?edit=1</code> 을 붙여요.</p>
<div class="addr"><span>🔒</span> 내쇼핑몰.cafe24.com/<b>?edit=1</b></div>
${fig('cms-home', { box: [[10, 194, 167, 37], [260, 548, 760, 257]], m: [[1, 10, 212, 'l'], [2, 260, 580, 'l']], h: '92mm' })}
${steps([
  [1, '영역마다 <b>주황색 [고치기] 버튼</b>이 생겨요. 점선 네모가 그 버튼으로 바꿀 수 있는 곳이에요.'],
  [2, '아래 검은 막대가 <b>편집 모드 안내</b>예요. 화면에 바로 안 보이는 팝업 · 카카오톡 버튼도 여기서 고쳐요. [접기]로 작게 줄일 수 있어요.'],
])}
${tip('<b>세일 · 상품 목록 · 게시판 · 가이드</b>는 막대의 [다른 페이지 고치기] 버튼을 누르거나, 편집 모드에서 <b>메뉴를 누르면</b> 그 페이지도 편집 모드로 열려요. 주소를 칠 필요 없어요.')}
`);

page(1, 's2', '2단계 · [고치기] 누르기', `
${fig('step-edit', { box: [[72, 80, 352, 74], [954, 80, 256, 88]], m: [[1, 72, 117, 'l'], [2, 1210, 124, 'r']], h: '100mm' })}
${steps([
  [1, '바꾸고 싶은 곳의 <b>[○○ 고치기]</b>를 누르면 <b>새 창</b>에 편집 화면이 열려요.'],
  [2, '<b>[순서 ↑ ↓]</b>는 메인 화면 섹션의 순서를 바꾸는 버튼이에요. (<a href="#order">섹션 순서</a>)'],
])}
${tbl(['버튼 옆 글자', '뜻'], [
  ['· 새 글', '아직 한 번도 안 바꾼 곳이에요. 지금 화면 내용이 칸에 미리 채워져서 열려요.'],
  ['· 게시판 글 수정', '전에 바꾼 적이 있어요. 저장했던 내용이 열려요.'],
])}
${note('편집 화면은 <b>게시판 글쓰기 창</b> 위에 뜨는 쉬운 입력 화면이에요. 글 제목(예: <b>[메인 화면] 카테고리</b>)은 바꾸지 마세요. 제목으로 어느 영역인지 찾아요.')}
`);

page(1, 's3', '3단계 · 글자 바꾸기', `
${fig('cms-editor', { h: '96mm' })}
${steps([
  [1, '<b>[저장하기]</b> — 다 고친 뒤 마지막에 눌러요. (4단계)'],
  [2, '<b>칸</b> — 칸 이름(작은 제목, 제목…)이 화면의 그 자리예요. 지우고 새로 쓰면 돼요.'],
  [3, '칸 아래 회색 글씨가 <b>무엇을 쓰는 칸인지</b> 알려 줘요.'],
])}
${tbl(['이렇게 쓰면', '화면에서는'], [
  ['칸 안에서 <b>줄 바꾸기</b>(Enter)', '화면에서도 줄이 바뀌어요.'],
  ['<code>*강조*</code> 처럼 별표로 감싸기', '<i>기울어진 강조 글씨</i>가 돼요.'],
  ['칸을 <b>비우기</b>', '그 글자가 화면에서 사라져요.'],
  ['링크 칸에 <code>/product/list.html?cate_no=24</code>', '누르면 그 주소로 가요. (24 = 신선식품 분류)'],
])}
`);

page(1, 's3b', '3단계 · 사진 바꾸기', `
${fig('step-type', { h: '118mm' })}
${steps([
  [1, '<b>[사진 바꾸기]</b>를 누르고 내 컴퓨터의 사진을 골라요. 카페24에 올라가고 바로 바뀌어요.'],
  [2, '<b>권장 크기</b>와 올린 사진을 비교해 줘요. 초록 ✓ 이면 잘 맞아요.'],
  [3, '바꾼 칸에는 주황 줄과 <b>[되돌리기]</b>가 생겨요. 누르면 원래대로 돌아가요.'],
])}
${warn('빨간 글씨로 <b>"비율이 달라요"</b>가 뜨면 사진 가장자리가 잘려 보여요. 권장 크기와 같은 모양(가로·세로 비율)으로 잘라서 올려 주세요.')}
${tip('사진은 <b>10MB 이하, jpg · png · webp</b>로 올려요. 음식 사진은 <b>밝은 자연광</b>에서 찍은 사진이 가장 맛있어 보여요.')}
`);

page(1, 's4', '4단계 · 저장하고 확인하기', `
${fig('step-save', { h: '96mm' })}
${steps([
  [1, '<b>[저장하기]</b>를 눌러요. 게시판 글로 저장돼요.'],
  [2, '<b>바뀐 곳 ○군데</b> — 몇 군데를 고쳤는지 보여 줘요.'],
  [3, '처음 쇼핑몰 창으로 돌아가 <b>새로고침</b>(F5)하면 바뀐 모습이 보여요.'],
])}
<div class="ba">${fig('cms-before', { crop: [0, 150, 1280, 400], box: [[60, 420, 330, 80]], cap: '바꾸기 전' })}<b>→</b>${fig('cms-after', { crop: [0, 150, 1280, 400], box: [[60, 420, 330, 80]], cap: '바꾼 뒤 — 제목 칸 하나만 고쳤어요' })}</div>
${tip('손님 화면에는 <b>10분 안에</b> 바뀐 내용이 보여요(이미 있던 글을 고친 경우는 늦어도 30분). 편집 모드(?edit=1)에서는 언제나 바로 보여요.')}
`);

page(1, 'undo', '실수했을 때 되돌리기', `
<p class="lead">편집 화면 위쪽 막대에 되돌리는 버튼이 모여 있어요. 마음 놓고 바꿔 보세요.</p>
${fig('cms-editor-bar', {})}
${tbl(['버튼', '하는 일'], [
  [btn('↶ 실행 취소'), '방금 바꾼 것을 하나씩 되돌려요. (Ctrl+Z)'],
  [btn('↷ 다시 실행'), '되돌린 것을 다시 해요. (Ctrl+Y)'],
  [btn('↺ 되돌리기'), '칸마다 있어요. <b>그 칸만</b> 원래대로 돌아가요.'],
  [btn('⟲ 처음 상태로'), '이 창을 처음 열었을 때로 모두 돌아가요.'],
  [btn('🕘 이전 저장본 불러오기'), '이 컴퓨터에서 저장했던 <b>최근 5개</b> 중 하나를 불러와요.'],
  [btn('고급: 원래 편집기'), '카페24 원래 글쓰기 화면을 보여 줘요. 보통은 쓸 일이 없어요.'],
])}
${tip('저장한 뒤에도 괜찮아요. 다시 [고치기] → [이전 저장본 불러오기] → [저장하기] 하면 예전 모습으로 돌아가요.')}
`);

/* ============================== 2. 메인 화면 ============================== */
page(2, 'map', '메인 화면에서 바꿀 수 있는 곳', `
<p class="lead">메인 화면에는 [고치기] 버튼이 있는 영역이 18곳 있어요. 위에서부터 이 순서예요.</p>
${tbl(['영역 이름', '바꿀 수 있는 것'], [
  ['첫 화면', '큰 영상·사진 3장면, 제목, 설명, 버튼 (<a href="#first">자세히</a>)'],
  ['이용 안내', '배송·교환·후기·문의 안내 칸 (칸 늘리기 가능)'],
  ['식탁 고르기', '신선식품·간편식 큰 사진 2장, 제목, 바로가기 목록'],
  ['카테고리', '동그라미 사진과 이름·링크 (칸 늘리기 가능)'],
  ['추천 상품 제목 · 신상품 제목 · 인기 상품 제목', '제목과 링크 글자 (상품은 관리자 › 메인 진열)'],
  ['메뉴 찾기', '사진과 안내 글자'],
  ['장보기 가이드', '제목, 설명, 보관법 1~3'],
  ['장면 속 상품', '장면 사진 4장, 사진 속 상품 점 (<a href="#spots">자세히</a>)'],
  ['기획전', '큰 사진 2장과 글자 (선물세트 · 세일)'],
  ['체크리스트', '사진, 장보기 준비물 목록'],
  ['포토리뷰 제목', '제목과 버튼 글자 (리뷰 사진은 자동)'],
  ['푸드 노트', '가이드 카드 사진·글자 (칸 늘리기 가능)'],
  ['회원 안내 · 자주 묻는 질문', '회원 안내 글자·사진, 질문과 답 (칸 늘리기 가능)'],
  ['맨 아래 브랜드', '큰 글자 사진과 문장'],
  ['이벤트 팝업', '팝업 사진·글자·링크, 마감 타이머 (<a href="#popup">자세히</a>)'],
], 'tbl-map')}
${tip('모든 영역은 편집 화면 맨 위 <b>보이기 / 숨기기</b>로 끌 수 있어요. (<a href="#hide">숨기기</a>)')}
`);

page(2, 'items', '칸 늘리기 · 줄이기 · 옮기기', `
<p class="lead">카테고리·이용 안내·질문처럼 <b>같은 모양 칸이 여러 개</b>인 영역은 칸 수를 바꿀 수 있어요.</p>
${fig('cms-editor-card', { h: '84mm' })}
${steps([
  [1, '<b>↑ ↓</b> — 이 칸을 앞·뒤로 옮겨요.'],
  [2, '<b>[복사해서 추가]</b> — 이 칸을 하나 더 만들어 바로 뒤에 붙여요. 새 칸의 사진·글자를 바꿔요.'],
  [3, '<b>[삭제]</b> — 이 칸을 지워요. 실수했으면 [실행 취소]로 살려요.'],
])}
${note('장보기 가이드(1·2·3번)나 첫 화면(3장면)처럼 <b>칸 수가 정해진 영역</b>에는 이 버튼이 없어요. 사진과 글자만 바꿔요.')}
`);

page(2, 'spots', '사진 속 상품 점 찍기 (장면 속 상품)', `
<p class="lead">장면 사진 위 <b>+ 점</b>을 누르면 그 상품이 열려요. 점 자리와 상품을 그림으로 정해요.</p>
${fig('cms-editor-spots', { h: '112mm' })}
${steps([
  [1, '사진에서 <b>상품이 있는 자리를 누르면</b> 번호 점이 생겨요.'],
  [2, '점은 <b>끌어서</b> 옮겨요. (휴대폰은 손가락으로)'],
  [3, '아래 같은 번호 칸에 <b>상품번호</b>를 적으면 <b>✓ 상품 이름</b>이 떠요. 없는 번호면 빨갛게 알려 줘요.'],
  [4, '<b>[삭제]</b>로 점을 지워요.'],
])}
${tip('상품번호는 관리자 › 상품 목록의 <b>상품번호</b>나, 상품 주소의 <code>product_no=11</code> 숫자예요. 이름·가격·사진은 쇼핑몰 상품에서 자동으로 가져와요.')}
`);

page(2, 'hide', '영역 숨기기 · 다시 보이기', `
${fig('feat-hidden', { box: [[854, 176, 406, 66]], m: [[3, 854, 209, 'l']], h: '92mm' })}
${steps([
  [1, '편집 화면 맨 위 <b>보이기</b> 칸에서 <b>[숨기기]</b>를 누르고 저장해요.'],
  [2, '손님 화면에서는 그 영역이 <b>사라져요.</b>'],
  [3, '편집 모드에서는 <b>흐린 줄무늬</b>와 <b>"숨김 · 방문자에게 안 보여요"</b> 표시로 보여요.'],
  [4, '다시 보이려면 [고치기] → <b>[보이기]</b> → [저장하기].'],
])}
${tip('계절이 지난 기획전이나 잠깐 쉬는 이벤트는 지우지 말고 <b>숨겨 두세요.</b> 나중에 [보이기]만 누르면 돼요.')}
`);

page(2, 'order', '섹션 순서 바꾸기', `
<p class="lead">메인 화면 섹션을 위·아래로 옮기고, <b>[순서 저장하기] 한 번</b>이면 끝이에요.</p>
${fig('feat-order-save', { box: [[862, 210, 184, 44], [322, 108, 332, 56]], m: [[1, 1046, 232, 'r'], [2, 654, 136, 'r']], h: '104mm' })}
${steps([
  [1, '옮기고 싶은 섹션 오른쪽 위 <b>[순서 ↑ ↓]</b>를 눌러요. 화면에서 바로 위·아래로 움직여요. 여러 번 눌러도 돼요.'],
  [2, '옮기면 화면 위에 <b>[순서 저장하기]</b>가 떠요. 다 옮긴 뒤 한 번 누르면 <b>저절로 저장</b>돼요.'],
  [3, '저장이 끝나면 메인 화면을 <b>새로고침</b>해서 확인해요.'],
])}
${tip('섹션 옆 [순서] 막대의 <b>[저장]</b> 버튼이나, 아래 검은 막대의 [↕ 섹션 순서 저장]을 눌러도 똑같아요.')}
${note('첫 화면(맨 위 영상)과 이벤트 팝업은 자리가 정해져 있어 옮기지 않아요.')}
`);

page(2, 'first', '첫 화면(맨 위 큰 화면) 바꾸기', `
<p class="lead">스크롤하면 <b>1번 → 2번 → 3번 장면</b>이 차례로 나오는 큰 화면이에요. food902 는 <b>1번 장면이 10초 음식 영상</b>, 2 · 3번은 사진이에요.</p>
${fig('cms-editor-first', { h: '66mm' })}
${tbl(['칸', '뜻'], [
  ['사진 위 작은 글 · 오른쪽 아래 작은 글 · 제목 · 링크', '영역 전체에 한 번씩 나오는 글자예요.'],
  ['1번 · 2번 · 3번', '장면마다 사진, 큰 영문 글, 제목, 설명, 버튼, 아래 메뉴 이름'],
  ['1번 <b>영상 주소</b>', '다른 영상을 쓰려면 mp4 주소를 적어요. 영상 대신 사진을 쓰려면 [사진 바꾸기]로 사진을 올려요(영상 주소는 알아서 비워져요).'],
])}
${tip('영상은 <b>가로 16:9 · 10초 안팎 · 20MB 이하 mp4</b>가 좋아요. 카페24 파일업로더에는 영상을 못 올리니 GitHub 같은 곳에 올린 주소를 써요. 사진은 <b>가로로 긴 사진</b>이 잘 어울려요.')}
`);

page(2, 'popup', '메인 이벤트 팝업 바꾸기', `
<p class="lead">메인에 들어오면 뜨는 팝업이에요. 팝업 안의 <b>[이 팝업 고치기]</b>(또는 아래 검은 막대의 [이벤트 팝업 고치기])를 누르면 오른쪽 창이 열려요. <b>같은 번호끼리 짝</b>이에요.</p>
${two(`${fig('walk-popup-page', { box: [[24, 24, 252, 74]], m: [[1, 380, 420, 'c'], [2, 44, 890, 'l'], [3, 44, 1046, 'l']], cap: '메인 화면의 팝업' })}
${steps([
  [1, '<b>사진</b> → [사진 바꾸기]로 내 사진 고르기'],
  [2, '<b>제목</b> 칸 → 지우고 새로 쓰기'],
  [3, '<b>버튼</b> 칸 → 버튼에 보이는 글자'],
  [4, '<b>링크</b> 칸 → 버튼을 누르면 갈 주소'],
  [5, '<b>마감 시각</b> → <code>2026-10-31 23:59</code> 처럼 쓰면 남은 시간 타이머가 붙어요'],
])}`, fig('walk-popup-edit', { h: '196mm', cap: '[이 팝업 고치기]를 누르면 열리는 창' }), '68mm 1fr')}
${tip('팝업은 <b>최대 5장</b>까지 저절로 넘어가요. 장을 늘리려면 마지막 장의 <b>[복사해서 추가]</b>, 끄려면 맨 위 <b>[숨기기]</b>. 손님이 [오늘 하루 닫기]를 누르면 그날은 다시 안 떠요.')}
`);

page(2, 'kakao', '오른쪽 카카오톡 상담 버튼 연결', `
<p class="lead">화면 오른쪽 아래 <b>노란 말풍선 버튼</b>을 우리 가게 카카오톡 채널로 연결해요. 코드 없이 <b>편집 모드에서 바로</b> 해요.</p>
${fig('cms-home', { crop: [240, 520, 1040, 300], box: [[276, 664, 212, 32], [1201, 628, 48, 48]], m: [[1, 276, 680, 'l'], [2, 1225, 676, 'b']], h: '52mm' })}
${steps([
  [1, '편집 모드 아래 검은 막대의 <b>[💬 카카오톡 상담 연결]</b>을 눌러요. (또는 <b>2</b> 노란 버튼을 눌러도 돼요)'],
])}
${fig('kakao-win', { crop: [370, 0, 540, 900], h: '100mm' })}
${steps([
  [2, '창의 1단계 안내대로 <b>카카오톡 채널 관리자센터</b>에서 채널 주소(<code>pf.kakao.com/_xxxx</code>)를 복사해 칸에 붙여 넣어요.'],
  [3, '<b>[미리 열어 보기]</b>로 우리 채널이 열리는지 확인하고 <b>[저장]</b>을 눌러요.'],
])}
${tip('<b>"버튼을 누르면 바로 1:1 채팅이 열리게"</b>에 체크하면 손님이 누르자마자 채팅방이 열려요. 막대에 <b>연결 안 됨</b> 대신 <b>연결됨</b>이 보이면 끝!')}
`);

/* ============================== 3. 세일 ============================== */
page(3, 'sale', '세일 페이지 고치기', `
<p class="lead">메인 편집 모드에서 <b>메뉴의 SALE</b>을 누르거나 아래 막대의 <b>[세일 페이지]</b>를 누르면, 세일 페이지가 편집 모드로 열려요.</p>
${fig('cms-sale', { box: [[10, 108, 200, 33], [10, 194, 202, 33]], m: [[1, 210, 125, 'r'], [2, 212, 211, 'r']], h: '96mm' })}
${steps([
  [1, '<b>세일 타이머</b> — 마감 시각과 문구, 색'],
  [2, '<b>세일 큰 화면</b> — 큰 사진, 제목, 할인 문구'],
  [3, '세일 <b>상품</b>과 <b>쿠폰 번호·수량</b>은 관리자에서 바꿔요. (<a href="#timer">다음 쪽</a>)'],
])}
${tbl(['아래로 내리면 나오는 영역', '바꿀 수 있는 것'], [
  ['세일 정보 띠', '흘러가는 띠 글자'],
  ['세일 카테고리 3칸', '3칸 사진, 이름, 링크'],
  ['세일 쿠폰 뽑기', '제목, 리본·말풍선 문구, 유의사항'],
  ['세일 상품 제목', '상품 목록 위 제목'],
  ['세일 구매 안내', '안내 카드 제목과 글'],
], 'tbl-small')}
`);

page(3, 'timer', '세일 타이머 · 쿠폰 뽑기 쓰는 법', `
${tbl(['세일 타이머 칸', '이렇게 써요'], [
  ['마감 시각', '<code>2026-10-31 23:59</code> (한국 시간)'],
  ['문구 · 끝났을 때 문구', '예) 이벤트 마감까지 / 이벤트가 끝났어요'],
  ['배경색 · 글자색', '<code>#a9542e</code> 같은 색 번호. 비우면 기본 색'],
])}
${tbl(['세일 쿠폰 뽑기 칸', '이렇게 써요'], [
  ['제목 · 제목 강조 단어', '제목 안에서 강조할 단어를 따로 적어요.'],
  ['말풍선 · 말풍선 강조 단어', '쿠폰 상자 위 말풍선 글자'],
  ['유의사항', '한 줄에 하나씩. <code>{period}</code> <code>{usecon}</code> 은 쿠폰의 사용기간·조건으로 자동으로 바뀌어요.'],
])}
${road(['카페24 관리자', '프로모션', '쿠폰 발급/조회'])}
${tbl(['food902 에 만들어 둔 쿠폰', '할인', '선착순', '사용기간'], [
  ['50% 쿠폰', '50%', '10장', '발급일로부터 7일'],
  ['20% 쿠폰', '20%', '30장', '발급일로부터 7일'],
  ['10% 쿠폰', '10%', '100장', '발급일로부터 7일'],
  ['5% 쿠폰', '5%', '300장', '발급일로부터 7일'],
], 'tbl-small')}
${note('쿠폰 <b>할인율 · 수량 · 사용기간</b>은 관리자에서 바꾸고, 새 쿠폰을 만들면 그 <b>쿠폰 번호</b>를 store-content.js 의 <code>sale.coupon</code> 에 적어요. 쿠폰은 <b>상품상세 노출안함</b>으로 두어야 뽑기로만 받을 수 있어요.')}
${warn('쿠폰 뽑기는 <b>회원 1명당 1번</b>이에요. <b>관리자로 로그인한 브라우저에서는 발급이 안 돼요</b>("운영자는 쿠폰 발급이 불가능합니다"). 시험해 볼 때는 시크릿 창에서 회원으로 로그인해요.')}
`);

/* ============================== 4. 목록 · 게시판 · 가이드 ============================== */
page(4, 'banner', '상품 목록 위 큰 배너', `
<p class="lead">전체 상품 · 신선식품 · 간편식 · 베이커리/팬트리 목록과 검색, 게시판 맨 위의 큰 배너예요. <b>배너 8개를 한 글</b>에서 바꿔요. 막대의 <b>[상품 목록]</b>이나 편집 모드에서 메뉴를 누르면 돼요.</p>
${fig('cms-list', { box: [[58, 133, 223, 34]], m: [[1, 281, 150, 'r']], h: '92mm' })}
${tbl(['편집 화면 번호', '나오는 곳'], [
  ['1번 전체 상품 · 2번 신선식품 · 3번 간편식 · 4번 베이커리/팬트리', '그 분류 상품 목록과 검색 결과'],
  ['5번 리뷰 · 6번 공지사항 · 7번 자주묻는질문 · 8번 상품문의', '그 게시판 목록'],
], 'tbl-small')}
${tip('아무 목록에서나 [목록 위 큰 배너 고치기]를 눌러도 8개가 모두 열려요. 바꾸고 싶은 번호만 고치고 저장해요. 사진은 <b>가로 1600 × 세로 900</b>이 잘 맞아요.')}
`);

page(4, 'board', '게시판 페이지 (리뷰 · 공지 · 질문 · 문의)', `
<p class="lead">막대의 <b>[게시판]</b>이나 편집 모드에서 메뉴의 리뷰 · 커뮤니티를 누르면 게시판도 편집 모드로 열려요.</p>
${fig('cms-board', { box: [[58, 133, 223, 34]], m: [[1, 281, 150, 'r']], h: '96mm' })}
${steps([
  [1, '맨 위 배너는 <b>[목록 위 큰 배너 고치기]</b>로 바꿔요. (<a href="#banner">큰 배너</a>)'],
])}
${tbl(['바꾸고 싶은 것', '바꾸는 곳'], [
  ['게시판 위 이동 탭 (공지사항 · 자주묻는질문 · 상품문의)', 'store-content.js 의 <code>community.items</code> — 이름과 주소, 순서'],
  ['게시판 글 (공지, 자주 묻는 질문의 답 등)', '카페24 관리자 › 게시판 › <b>게시물 관리</b>'],
  ['리뷰', '손님이 쓴 사용후기가 자동으로 나와요. 사진 후기는 메인 <b>포토리뷰</b>와 상품 카드 <b>★ 리뷰 N</b> 에도 붙어요.'],
], 'tbl-small')}
${note('처음 들어 있는 리뷰 30개는 제목에 <b>[연출 예시]</b>가 붙은 예시 후기예요. 실제 후기가 쌓이면 관리자 › 게시물 관리에서 지워 주세요.')}
`);

page(4, 'guide', '가이드 페이지', `
<p class="lead">메뉴 · 메인의 "푸드 노트"에서 들어가는 <b>장보기 · 보관 가이드</b> 페이지예요. 편집 모드에서 아래 막대의 <b>[가이드]</b>를 누르면 편집 모드로 열려요.</p>
${fig('cms-guide', { box: [[58, 108, 212, 33]], m: [[1, 270, 125, 'r']], h: '100mm' })}
${tbl(['영역', '바꿀 수 있는 것'], [
  ['가이드 머리글', '큰 제목, 설명, 목차(한 줄에 「이름 #위치」)'],
  ['가이드 본문', '1번~4번 글(일주일 장보기 · 신선식품 보관 · 밀키트 요리 · 빵/팬트리 보관): 번호 글, 제목, 안내 목록(한 줄에 하나), 맨 아래 안내'],
])}
`);

/* ============================== 5. 도움말 ============================== */
page(5, 'phone', '휴대폰으로도 고칠 수 있어요', `
${two(fig('cms-mobile', { crop: [0, 0, 780, 1300] }), `
<p class="lead">휴대폰 인터넷에서도 주소 뒤에 <code>?edit=1</code> 을 붙이면 똑같이 [고치기]가 나와요.</p>
${steps([
  ['1', '검은 막대가 화면을 가리면 <b>[접기]</b>를 눌러요.'],
  ['2', '사진은 휴대폰 앨범에서 바로 골라 올릴 수 있어요.'],
  ['3', '상품 점은 손가락으로 눌러 찍고, 끌어서 옮겨요.'],
])}
${warn('휴대폰도 <b>카페24 관리자에 로그인</b>되어 있어야 저장할 수 있어요.')}`, '72mm 1fr')}
`);

page(5, 'faq', '안 될 때 확인하세요', `
${tbl(['이럴 때', '이렇게 해 보세요'], [
  ['저장했는데 화면이 그대로예요', '쇼핑몰 창을 <b>새로고침</b>(F5)해요. 손님 화면은 10~30분 뒤에 바뀌어요. ?edit=1 로 열면 바로 보여요.'],
  ['[고치기] 버튼이 안 보여요', '주소에 <code>?edit=1</code> 이 붙었는지 봐요. 주소에 ? 가 이미 있으면 <code>&edit=1</code> 로 붙여요.'],
  ['막대에 "게시판을 쓸 수 없는 상태예요"', '<a href="#ready">처음 한 번만</a>의 게시판 설정(사용 · 표시 · 관리자 쓰기)을 확인해요.'],
  ['저장하기를 누르면 로그인하래요', '같은 브라우저에서 <b>카페24 관리자</b>에 먼저 로그인해요.'],
  ['"사람인지 확인" 화면이 떠요', '카페24 보안 확인이에요. 화면 안내대로 확인을 마치면 원래 페이지로 돌아가요. 짧은 시간에 너무 많이 누르면 떠요.'],
  ['사진에 빨간 테두리가 생겼어요', '권장 크기와 비율이 달라요. 편집 모드 막대의 ⚠ 목록에서 어느 사진인지 보여 줘요.'],
  ['사진을 못 올렸어요', '10MB 이하 jpg · png · webp 인지 확인하고 다시 해요.'],
  ['쿠폰 뽑기를 눌렀는데 발급이 안 돼요', '관리자로 로그인한 상태예요. 시크릿 창에서 <b>회원</b>으로 로그인해 시험해요.'],
  ['엉뚱한 곳이 바뀌었어요 / 안 바뀌어요', '글 <b>제목</b>을 바꾸지 않았는지 봐요. 제목의 영역 이름이 정확히 같아야 해요.'],
  ['예전 모습으로 돌리고 싶어요', '[고치기] → <b>[이전 저장본 불러오기]</b> 또는 [처음 상태로] → [저장하기]'],
  ['화면이 이상해졌어요', '관리자 › 게시판 › 게시물 관리에서 그 영역 글을 지우면 <b>처음 디자인</b>으로 돌아가요.'],
], 'tbl-small')}
`);

page(5, 'end', '10분 체크리스트', `
<p class="lead">내 쇼핑몰로 바꾸는 가장 빠른 순서예요. 하나씩 체크해 보세요.</p>
${tbl(['', '할 일', '쪽'], [
  ['☐', '게시판(뉴스/이벤트 2번 · FAQ 3번) 설정 확인', '<a href="#ready">준비</a>'],
  ['☐', '첫 화면 영상·사진·제목을 내 가게 것으로', '<a href="#first">첫 화면</a>'],
  ['☐', '카테고리 이름·사진·링크를 내 분류로', '<a href="#items">칸 늘리기</a>'],
  ['☐', '이벤트 팝업 내용 바꾸기 (안 쓰면 숨기기)', '<a href="#popup">팝업</a>'],
  ['☐', '장면 속 상품 점에 내 상품번호 넣기', '<a href="#spots">상품 점</a>'],
  ['☐', '카카오톡 상담 버튼을 내 채널로 연결', '<a href="#kakao">카카오톡</a>'],
  ['☐', '안 쓰는 영역 숨기기, 순서 정리', '<a href="#hide">숨기기</a> · <a href="#order">순서</a>'],
  ['☐', '맨 아래 브랜드 문장을 내 가게 소개로', '<a href="#map">메인 지도</a>'],
  ['☐', '목록 위 큰 배너 8개 확인', '<a href="#banner">큰 배너</a>'],
  ['☐', '세일 페이지 타이머·문구, 쿠폰 확인 (세일할 때)', '<a href="#sale">세일</a> · <a href="#timer">쿠폰</a>'],
  ['☐', '[연출 예시] 리뷰는 실제 후기가 쌓이면 지우기', '<a href="#board">게시판</a>'],
  ['☐', '휴대폰으로 한 번 둘러보기', '<a href="#phone">휴대폰</a>'],
])}
<div class="endcard">🎉 여기까지 하면 <b>내 쇼핑몰</b>이 완성돼요!<br><small>궁금한 점은 구매한 곳의 문의하기로 남겨 주세요.</small></div>
`);

/* ============================== 조립 ============================== */
const total = P.length + 1;
P.forEach((p, i) => { p.no = i + 2; });
const chLab = k => CH[k].name;
const tocGroups = Object.keys(CH).map(k => `<div class="toc-ch"><div class="toc-chname" style="--c:${CH[k].color}"><span>${k}장</span>${chLab(k)}</div>
  ${P.filter(p => p.ch == k).map(p => `<a class="toc-item" href="#${p.id}"><span>${p.title}</span><i></i><b>${p.no}</b></a>`).join('')}</div>`).join('');
const tocPage = `<section class="page toc" id="toc">
  <header class="cover">
    <div class="cover-badge">${NAME} 스킨 · 카페24</div>
    <h1>10분이면 <span>내 쇼핑몰로</span><br>바꾸는 쉬운 설명서</h1>
    <p>주소 뒤에 <b>?edit=1</b> → <b>[고치기]</b> → <b>칸에 적기</b> → <b>[저장하기]</b>. 아래 제목을 누르면 그 쪽으로 바로 가요.</p>
  </header>
  <div class="toc-grid">${tocGroups}</div>
  <footer class="pg-foot"><span>${NAME} 10분 설명서</span><span>1 / ${total}</span></footer>
</section>`;
const pages = P.map(p => `<section class="page" id="${p.id}" style="--c:${CH[p.ch].color}">
  <div class="pg-top"><span class="chip">${p.ch}장 · ${CH[p.ch].name}</span><a href="#toc" class="to-toc">목차로 ↑</a></div>
  <h2 class="pg-title">${p.title}</h2>
  <div class="pg-body">${p.body}</div>
  <footer class="pg-foot"><span>${NAME} 10분 설명서</span><span>${p.no} / ${total}</span></footer>
</section>`).join('\n');
const css = fs.readFileSync(path.join(__dirname, 'manual.css'), 'utf8') + `
.ui{display:inline-block;padding:.2mm 2mm;border:1px solid #c9ced6;border-radius:5px;background:#fff;font-weight:700;font-size:.92em;white-space:nowrap}
.addr{display:flex;align-items:center;gap:2mm;padding:2.2mm 4mm;border:1.5px solid #c9ced6;border-radius:99px;background:#f5f7fa;font-size:12pt}
.addr b{color:#b3261e;font-size:13pt}
.ba{display:grid;grid-template-columns:1fr 6mm 1fr;align-items:center;gap:2mm}.ba>b{text-align:center;font-size:16pt;color:var(--c)}
.toc-grid{column-count:2}.toc-item span{max-width:70mm}
.bigstep{font-size:11pt}
.cover{background:linear-gradient(135deg,#2f3a28,#a9542e)}`;
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${NAME} 10분 설명서</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${css}</style></head><body>${tocPage}\n${pages}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('pages', total, missing.length ? 'missing shots: ' + missing.join(', ') : 'all shots ok');

if (process.argv.includes('--pdf') || process.argv.includes('--png')) (async () => {
  const puppeteer = require(process.env.PPTR || 'puppeteer-core');
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage();
  await pg.goto('file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 120000 });
  await pg.evaluate(() => document.fonts.ready);
  const over = await pg.evaluate(() => Array.from(document.querySelectorAll('.page')).map((s, i) => { const b = s.querySelector('.pg-body') || s.querySelector('.toc-grid'); return b && b.scrollHeight > b.clientHeight + 2 ? (i + 1) + ':' + s.id + ' +' + (b.scrollHeight - b.clientHeight) : null; }).filter(Boolean));
  console.log('overflow', over.join(' | ') || 'none');
  if (process.argv.includes('--png')) {
    const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
    await pg.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.2 });
    const ids = await pg.evaluate(() => Array.from(document.querySelectorAll('.page')).map(s => s.id));
    fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true });
    for (let i = 0; i < ids.length; i++) {
      if (only && !only.includes(ids[i])) continue;
      await (await pg.$('#' + ids[i])).screenshot({ path: path.join(__dirname, 'preview', String(i + 1).padStart(2, '0') + '-' + ids[i] + '.png') });
    }
  }
  if (process.argv.includes('--pdf')) {
    await pg.pdf({ path: path.join(__dirname, NAME + '-10분-설명서.pdf'), preferCSSPageSize: true, printBackground: true });
    console.log('pdf ok');
  }
  await b.close();
})();
