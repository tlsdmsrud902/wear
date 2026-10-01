// 디자인센터 상세페이지 만들기 (PETPIA 상세페이지와 같은 구성)
//   node docs/tools/designcenter-detail.js        → _deploy/dc/detail.html (미리보기 · 이미지로 굽기용)
// 재료 : _deploy/dc/detail.css (PETPIA 상세 CSS), _deploy/dc/img/*.webp (스킨 사진), _deploy/dc/shots/walk-NN-page|edit.jpg (섹션 캡처),
//        _deploy/dc/walk-meta.json (섹션마다 번호 붙인 칸 이름)
const fs = require('fs');
const path = require('path');
const DC = path.join(__dirname, '../../_deploy/dc');
const CSS = fs.readFileSync(path.join(DC, 'detail.css'), 'utf8');
const META = JSON.parse(fs.readFileSync(path.join(DC, 'walk-meta.json'), 'utf8'));
const ORDER_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSf26MVAAFBO6btjz97kuKnjw6jvWKNdJ21ET3jIUsov0NTR_g/viewform?usp=header';
const SAMPLE = 'https://ecudemo408987.cafe24.com/';
const I = n => 'img/' + n + '.webp';
const S = n => 'shots/' + n + '.jpg';

// 섹션 머리글 · 버튼 이름 · 덧붙임 안내
const SEC = {
  '첫 화면': ['Good food, every day', '메인 첫 화면 (영상 · 사진)', '첫 화면 고치기', ['<b>영상 바꾸기</b> : 1번의 <em>영상 주소</em> 칸에 mp4 주소를 넣으면 그 영상이, 비우면 사진이 나와요.', '스크롤하면 나오는 2번 · 3번 장면도 아래쪽 칸에서 똑같이 바꿔요.']],
  '이용 안내': ['Shop info', '이용 안내 (배송 · 교환 · 후기 · 문의)', '이용 안내 고치기', ['안내 칸을 늘리려면 [복사해서 추가], 줄이려면 [삭제]를 눌러요.']],
  '식탁 고르기': ['Fresh table · Easy meal', '오늘은 어떤 식탁을 차릴까요?', '식탁 고르기 고치기', ['신선식품 · 간편식 카드마다 사진, 제목, 바로가기를 바꿔요. 바로가기는 한 줄에 「이름 주소」로 써요.']],
  '카테고리': ['Shop by category', '오늘은 무엇이 필요하세요?', '카테고리 고치기', ['동그라미 하나가 칸 하나예요. 분류를 늘리려면 [복사해서 추가]를 눌러요.']],
  '추천 상품 제목': ['Curated · New · Best · Reviews', '상품 섹션 4곳 (추천 · 신상 · 인기 · 포토리뷰)', '추천 상품 제목 고치기', ['상품은 카페24 관리자 › 메인 진열에서 고르면 자동으로 나와요. 섹션 제목과 버튼 글자만 [고치기]로 바꿔요.', '포토리뷰는 상품 사용후기 게시판의 사진 후기가 자동으로 모여요.']],
  '메뉴 찾기': ['Find your favourites', '오늘 우리 집 메뉴는 무엇일까요?', '메뉴 찾기 고치기', ['선택지 사진과 안내 글을 바꿔요.']],
  '장보기 가이드': ['Fresh, made easy', '신선하게 보관하는 법', '장보기 가이드 고치기', ['보관법 1 · 2 · 3번 글도 아래 칸에서 바꿔요.']],
  '장면 속 상품': ['Shop the look', '장면 속 그 상품', '장면 속 상품 고치기', ['사진 위 + 점은 편집 창에서 사진을 눌러 찍고, 상품번호만 적으면 상품 이름 · 가격이 자동으로 나와요.']],
  '기획전': ['A gift of taste', '소중한 사람에게, 맛있는 마음을', '기획전 고치기', ['왼쪽 · 오른쪽 배너의 사진, 글, 링크를 바꿔요.']],
  '체크리스트': ['Your weekly list', '이번 주 장보기, 하나씩 채워요', '체크리스트 고치기', ['준비물은 한 줄에 하나씩 쓰면 그대로 체크 항목이 돼요.']],
  '푸드 노트': ['Food notes', '더 맛있어지는 작은 습관', '푸드 노트 고치기', ['카드를 늘리거나 줄일 수 있어요.']],
  '회원 안내': ['Your everyday, in one place', '다음 쇼핑도, 조금 더 편하게', '회원 안내 고치기', []],
  '자주 묻는 질문': ['A little help', '자주 묻는 질문', '자주 묻는 질문 고치기', ['질문을 늘리려면 [복사해서 추가]를 눌러요.']],
  '맨 아래 브랜드': ['food902', '맨 아래 브랜드', '맨 아래 브랜드 고치기', ['큰 로고 사진과 문장을 우리 가게 것으로 바꿔요.']],
  '이벤트 팝업': ['Event popup', '메인 이벤트 팝업', '이 팝업 고치기', ['팝업 <em>사진</em> → [사진 바꾸기]를 누르고 내 컴퓨터 사진 고르기', '<em>제목 · 설명 · 버튼 · 링크</em> 칸 → 지우고 새로 쓰기', '<em>마감 시각</em>에 2026-10-31 23:59 처럼 쓰면 남은 시간 타이머가 붙어요.', '팝업은 최대 5장까지 저절로 넘어가요. [복사해서 추가]로 늘려요.']],
};
const isPhoto = l => /사진/.test(l) && !/스티커|글/.test(l);
const mapItem = (l, i) => isPhoto(l)
  ? `<li><b>${i + 1}</b><span><em>${l}</em> → [사진 바꾸기]를 누르고 내 컴퓨터 사진 고르기</span></li>`
  : `<li><b>${i + 1}</b><span><em>${l}</em> 칸 → 지우고 새로 쓰기</span></li>`;

const ezSecs = META.map(m => {
  const [kick, title, btn, notes] = SEC[m.name];
  return `
    <div class="ez-sec">
      <header><span class="ez-no">${m.id}</span><div><small>${kick}</small><h3>${title}</h3></div></header>
      <p class="ez-lead">이 섹션의 <b>[${btn}]</b>를 누르면 아래 창이 열려요. <b>화면의 번호 = 창의 번호</b>예요.</p>
      <figure class="ez-page"><img src="${S('walk-' + m.id + '-page')}" alt="${title} 화면"></figure>
      <p class="ez-arrow">▼ [고치기]를 누르면 열리는 창</p>
      <figure class="ez-edit"><img src="${S('walk-' + m.id + '-edit')}" alt="${title} 편집 창"></figure>
      <ul class="ez-map">${m.found.map(mapItem).join('')}${notes.map(n => `<li class="ez-note"><b>+</b><span>${n}</span></li>`).join('')}</ul>
    </div>`;
}).join('');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>food902 | 디자인센터 상세페이지</title>
<meta name="description" content="신선식품 · 간편식 · 베이커리를 한곳에서. 이벤트와 타임세일, 쿠폰 뽑기까지 갖춘 food902 카페24 쇼핑몰 디자인 상세페이지입니다.">
<style>${CSS}
.hero{background-image:url('${I('scene-bakery')}')}
.sale-photo{background-image:url('${I('scene-fruit')}')}
.closing{background-image:url('${I('scene-giftbox')}')}
.hero-brand img{width:150px}
</style>
</head>
<body>
<main class="sheet">
  <section class="hero" id="top">
    <div class="hero-brand"><img src="${I('logo-food902')}" alt="food902"></div>
    <div class="hero-stamp">DESIGNED<br>FOR EVERY<br><b>TABLE</b></div>
    <div class="hero-copy">
      <span class="eyebrow">A Cafe24 shop skin for everyday meals</span>
      <h1 class="serif">Good food.<br><i>Good day.</i></h1>
      <p>좋은 재료를 고르는 즐거움부터, 매일 차리는 식탁의 편안함까지.<br>food902는 신선식품과 간편식, 베이커리를 한곳에서 연결합니다.</p>
      <div class="label-row"><span>첫 화면 10초 음식 영상</span><span>SALE 전용 이벤트 페이지</span><span>랜덤 쿠폰 뽑기 · 마감 카운트다운</span><span>상품별 타임세일</span><span>신선식품 · 간편식 맞춤 탐색</span><span>무료배송 진행바 · 재고 임박 안내</span><span>후기 작성 유도 · 포토리뷰 이벤트</span><span>장보기 체크리스트 · 보관 가이드</span></div>
    </div>
  </section>
  <section class="easy" id="easy">
    <div class="easy-head"><span class="eyebrow">After purchase · no code</span><h2>구매 후, 이렇게 쉽게 바꿔요</h2><p>코드를 몰라도 돼요.<br><b>바꾸고 싶은 곳의 주황 버튼 → 글 고쳐 쓰기 → 저장</b>, 이게 전부예요.</p></div>
    <div class="ez-try">
      <h3>먼저 딱 한 번 해 볼까요? <span>메인 문구를 우리 가게 문구로</span></h3>
      <div class="ez-step"><p class="t"><b>1</b><span>구매 후 알려 드리는 <em>관리자 전용 주소</em>로 쇼핑몰을 열면, 모든 섹션에 주황색 <em>[고치기]</em> 버튼이 생겨요.</span></p><img src="${S('cms-home')}" alt="고치기 버튼이 생긴 메인 첫 화면"></div>
      <div class="ez-step"><p class="t"><b>2</b><span>[고치기]를 누르면 이 창이 열려요. <em>화면에 있던 글이 칸에 그대로</em> 들어 있으니 지우고 새로 쓰면 돼요.</span></p><img src="${S('walk-01-edit')}" alt="첫 화면 편집 창" class="narrow" style="max-height:760px;object-fit:cover;object-position:top"></div>
      <div class="ez-step"><p class="t"><b>3</b><span><em>[저장하기]</em>를 누르면 끝! 쇼핑몰을 새로고침하면 바로 바뀌어 있어요.</span></p><img src="${S('cms-after')}" alt="새 문구로 바뀐 메인 첫 화면"></div>
      <div class="ez-step"><p class="t"><b>+</b><span>사진도 똑같아요. <em>[사진 바꾸기]</em>를 누르고 내 컴퓨터 사진을 고르면 바로 바뀌어요.</span></p><p class="s">권장 크기와 다르면 바로 알려 줘서, 잘린 사진이 올라가지 않아요.</p></div>
    </div>
    <div class="ez-list-head"><span class="eyebrow">From top to bottom</span><h3>메인 화면, 위에서부터 하나씩</h3><p>모든 섹션이 같은 방법이에요. 화면에 붙은 번호와 창의 번호를 맞춰 보세요.</p></div>
    ${ezSecs}
    <div class="ez-end"><b>세일 페이지 · 상품 목록 위 배너 · 게시판 · 가이드 페이지</b>도 똑같이 [고치기]가 나와요.<br>섹션 숨기기 · 순서 바꾸기도 버튼 하나로, 실수해도 [실행 취소]와 [이전 저장본]으로 되돌려요.<br>카카오톡 상담 버튼도 편집 모드에서 채널 주소만 붙여 넣으면 연결돼요.</div>
  </section>
  <section class="process" id="process">
    <div class="process-head"><span class="eyebrow">After purchase · what happens next?</span><h2>작업 진행 절차 안내</h2><p>주문부터 디자인 적용과 완료 안내까지, 진행 순서를 먼저 확인해 주세요.</p></div>
    <div class="process-grid">
      <article class="process-card"><b><span>01</span> 디자인 선택 및 결제</b><p>디자인과 필요한 구매 옵션을 확인한 뒤 주문·결제를 진행합니다.</p></article>
      <article class="process-card"><b><span>02</span> 주문 접수</b><p>결제 확인 후 안내되는 접수 방법에 따라 쇼핑몰 정보와 요청사항을 전달합니다.</p><a class="process-cta" href="${ORDER_FORM}" target="_blank" rel="noopener">주문서 접수하기</a></article>
      <article class="process-card"><b><span>03</span> 디자인 복사 및 세팅</b><p>접수 내용 확인 후 선택한 상품에 포함된 디자인 복사와 세팅 작업을 진행합니다.</p></article>
      <article class="process-card"><b><span>04</span> 완료 확인 및 매뉴얼 전달</b><p>작업 결과를 확인하고, 디자인 사용에 필요한 매뉴얼과 안내를 전달받습니다.</p></article>
    </div>
    <p class="process-foot">세팅 범위와 준비 정보는 구매 옵션 및 주문 후 안내 내용을 확인해 주세요.</p>
  </section>
  <nav class="quick" aria-label="상세페이지 바로가기">
    <a href="#sale"><span>01 / EVENT</span>행사와 카운트다운</a><a href="#coupon"><span>02 / COUPON</span>쿠폰 뽑기</a><a href="#timesale"><span>03 / TIME SALE</span>상품별 마감 표시</a><a href="#shop"><span>04 / SHOPPING</span>쉬운 상품 찾기</a>
  </nav>
  <section class="intro">
    <div class="brandmark">F</div><span class="eyebrow">Good food, every day</span>
    <h2>쇼핑몰의 첫인상부터<br>구매를 돕는 작은 기능까지</h2>
    <p class="lead">식욕을 돋우는 음식 영상과 사진, 원하는 먹거리를 빠르게 찾는 탐색 구조, 다시 방문하게 만드는 프로모션. 보기 좋은 화면 안에 운영과 구매에 꼭 필요한 흐름을 담았습니다.</p>
  </section>
  <section class="event-hero" id="sale">
    <div class="event-top"><span class="eyebrow">Season sale · a little something for you</span><h2 class="serif">좋은 발견은<br>기다릴 때 더 설레니까</h2><p>SALE 전용 페이지에서 이벤트와 상품 혜택을 한눈에 안내합니다.</p>
      <div class="timer" aria-label="이벤트 종료까지 남은 시간을 보여주는 카운트다운 예시"><div class="timebox"><strong>30</strong><small>DAYS</small></div><div class="timebox"><strong>21</strong><small>HOURS</small></div><div class="timebox"><strong>49</strong><small>MIN</small></div><div class="timebox"><strong>00</strong><small>SEC</small></div></div>
      <p class="micro" style="margin-top:12px;color:#c9bdb1">이벤트 종료 시각에 맞춰 남은 시간이 자동으로 줄어드는 구성</p>
    </div>
    <div class="sale-photo"><div class="sale-caption"><span class="eyebrow">FOOD ESSENTIALS EDIT</span><h3>Good finds.<br>Tasty days.</h3><p>매일의 식탁을 위한 반가운 발견</p><span class="offer">UP TO 50% · LIMITED TIME ONLY</span></div></div>
    <div class="event-strip">FRESH PICKS &nbsp; · &nbsp; SEASONAL TABLE &nbsp; · &nbsp; GOOD FOOD, GOOD DAY</div>
  </section>
  <section class="section center">
    <span class="eyebrow">One page, more reasons to shop</span><h2>이벤트 안내와 혜택을<br>한 화면에 모아</h2><p class="lead">메인 팝업과 SALE 페이지가 방문자의 시선을 혜택으로 안내하고, 바로 상품을 살펴볼 수 있도록 이어집니다.</p>
    <div class="feature-pair">
      <article class="feature-card"><img src="${I('scene-fruit')}" alt="SALE 이벤트 배너 이미지"><div class="copy"><small>SALE EVENT</small><strong>마감 시간을 보여주는 기획전</strong><p>큰 비주얼과 종료 카운트다운으로 이벤트 기간과 시즌 혜택을 명확하게 전달합니다.</p></div></article>
      <article class="feature-card"><img src="${I('scene-cake')}" alt="포토리뷰 이벤트 이미지"><div class="copy"><small>REVIEW EVENT</small><strong>포토리뷰 참여 안내</strong><p>메인 팝업에서 리뷰 혜택을 소개하고 리뷰 작성 페이지로 연결합니다. 현재 샘플 안내는 포토리뷰 3,000P입니다.</p></div></article>
    </div>
  </section>
  <section class="section coupon-section" id="coupon">
    <div class="coupon-grid">
      <div class="coupon-art"><img src="${I('sq-gift')}" alt="food902 선물 세트 이미지"><span class="coupon-sticker">RANDOM COUPON · MAX 50%</span></div>
      <div class="coupon-copy"><span class="eyebrow">A little gift for you</span><h2>쿠폰 뽑기의 설렘</h2><p class="lead">SALE 페이지에서 회원이 쿠폰을 직접 뽑고, 받은 혜택을 마이쿠폰에서 확인한 뒤 주문서에 적용합니다.</p>
        <div class="coupon-cards"><div class="coupon-card"><span>LUCKY COUPON</span><strong>5%</strong></div><div class="coupon-card"><span>LUCKY COUPON</span><strong>10%</strong></div><div class="coupon-card"><span>LUCKY COUPON</span><strong>20%</strong></div><div class="coupon-card"><span>LUCKY COUPON</span><strong>50%</strong></div></div>
        <h3>참여는 간단하게, 적용은 편리하게</h3><div class="steps"><div class="step"><b>STEP 01</b><span>로그인</span></div><div class="step"><b>STEP 02</b><span>쿠폰 뽑기</span></div><div class="step"><b>STEP 03</b><span>마이쿠폰 확인</span></div><div class="step"><b>STEP 04</b><span>주문서에 적용</span></div></div>
        <div class="note-box"><strong>운영 안내</strong><br>회원 전용 · 1인 1회 참여 · 발급 쿠폰은 마이쿠폰에서 확인 · 사용기간과 적용 조건은 쿠폰별 설정에 따릅니다.</div>
      </div>
    </div>
  </section>
  <section class="section timesale" id="timesale">
    <span class="eyebrow">A moment worth catching</span><h2>타임세일 혜택,<br>상품에서도 바로 확인</h2><p class="lead">타임세일 상품은 상품 카드와 상세 화면에서 할인 배지와 남은 시간을 보여줘 혜택과 기간을 놓치지 않게 돕습니다.</p>
    <div class="timesale-layout">
      <div class="product-shot"><img src="${I('sq-bowl')}" alt="샐러드 상품 이미지"><span class="sale-badge">TIME SALE</span><div class="floating-timer"><span>혜택 종료까지</span><strong>08 : 24 : 16</strong></div></div>
      <div><div class="mini-window"><div class="mini-head"><b>PRODUCT DETAIL</b><span>혜택 확인이 쉬운 상품 화면</span></div><div class="mini-product"><img src="${I('sq-bowl')}" alt="그릴드 치킨 샐러드 미리보기"><div><h3>그릴드 치킨 샐러드</h3><div class="price"><del>11,000원</del> 8,900원</div><span class="discount">TIME SALE · 19% OFF</span></div></div><div class="bar"><i></i></div><div class="floating-timer" style="position:static;margin-top:14px;background:#f4eee7;color:#3d342d"><span>남은 시간</span><strong style="color:#8d4e3d">08 : 24 : 16</strong></div></div>
        <div class="timesale-copy"><h3>목록에서 보고, 상세에서 다시 확인</h3><ul class="check-list"><li>상품 목록에 SALE 배지와 할인 정보 표시</li><li>상품 상세에 종료 카운트다운 배너 안내</li><li>상품별 종료 시각과 배너 색상을 설정해 운영</li></ul><p class="micro" style="margin-top:14px">표시 예시는 이해를 돕기 위한 샘플이며, 실제 할인율·종료 시각은 상품과 운영 설정에 따라 달라집니다.</p></div>
      </div>
    </div>
  </section>
  <section class="section merchant-tools">
    <div class="merchant-head"><div><span class="eyebrow">More comfort for the shop owner</span><h2>운영에 필요한 편의 기능도<br>꼼꼼하게</h2><p class="lead">고객의 구매 결정을 돕는 안내를 장바구니와 상품 상세의 필요한 위치에 보여줍니다.</p></div></div>
    <div class="merchant-grid">
      <article class="merchant-card"><span class="tiny-label">01 / SHIPPING</span><h3>무료배송 진행바</h3><p>장바구니 상단에서 무료배송 기준까지 남은 금액과 진행 상태를 안내합니다.</p><div class="mock-ui"><small>CART · FREE SHIPPING GOAL</small><strong>15,000원 더 담으면 무료배송</strong><div class="mock-bar"><i></i></div><small style="margin:8px 0 0">무료배송까지 남은 금액을 한눈에 확인</small></div></article>
      <article class="merchant-card"><span class="tiny-label">02 / LOW STOCK</span><h3>재고 임박 표시</h3><p>재고가 얼마 남지 않은 상품은 상세 가격 아래에 남은 수량을 보여줍니다.</p><div class="mock-ui"><small>PRODUCT DETAIL · PRICE</small><div class="mock-price">8,900원 <em>재고 3개 남음 · 품절 임박</em></div></div></article>
      <article class="merchant-card"><span class="tiny-label">03 / REVIEW PROMO</span><h3>후기 작성 유도 배너</h3><p>상품 상세의 후기 영역 위에 참여 문구와 후기 작성 버튼을 배치합니다.</p><div class="mock-ui"><small>JUST ABOVE PRODUCT REVIEWS</small><div class="mock-prompt"><b>구매하신 상품의 후기를 남겨 주세요<br><span style="font-weight:500;color:#8a7867">리뷰 혜택 안내</span></b><span>후기 쓰기 →</span></div></div></article>
    </div>
  </section>
  <section class="section flow">
    <div class="center"><span class="eyebrow">What's on your table?</span><h2>오늘 우리 집 식탁에 맞는 길을<br>먼저 보여주세요</h2><p class="lead">신선식품 · 간편식 · 베이커리와 먹는 순간을 고르면 어울리는 상품으로 연결되는 간단한 추천 도구를 제공합니다.</p></div>
    <div class="flow-grid"><article class="flow-card"><div class="photo"><img src="${I('card-fresh')}" alt="신선식품 카테고리"></div><div class="copy"><small>01 / FRESH</small><h3>직접 차리는 식탁</h3><p>채소 · 과일 · 주스 · 샐러드 카테고리로 바로 이동</p></div></article><article class="flow-card"><div class="photo"><img src="${I('card-meal')}" alt="간편식 카테고리"></div><div class="copy"><small>02 / EASY MEAL</small><h3>간편하게 차리는 한 끼</h3><p>밀키트 · 브런치 · 아침 메뉴로 바로 이동</p></div></article><article class="flow-card"><div class="photo"><img src="${I('portrait-bakery')}" alt="베이커리"></div><div class="copy"><small>03 / MOMENT</small><h3>지금 필요한 순간</h3><p>아침 · 가벼운 한 끼 · 저녁 중 골라 관련 상품을 확인</p></div></article></div>
  </section>
  <section class="section shopping" id="shop">
    <div class="center"><span class="eyebrow">A clear path to the right product</span><h2>찾기 쉽고, 비교하기 편한<br>상품 탐색</h2><p class="lead">종류별 바로가기부터 추천 상품, 신규 입고, 인기 상품까지. 장보기 목적에 따라 필요한 상품을 빠르게 만날 수 있습니다.</p></div>
    <div class="shop-demo"><div class="shop-top"><b>SHOP BY CATEGORY</b><span>카테고리를 눌러 상품 둘러보기</span></div><div class="category-pills"><span>전체</span><span>채소</span><span>샐러드</span><span>케이크 · 디저트</span><span>음료</span><span>과일</span><span>브런치</span><span>베이커리</span></div><div class="product-row"><div class="product-card"><img src="${I('sq-veg')}" alt="채소 추천 상품"><div><b>제철 채소</b><small>신선식품</small><div class="icons">♡　＋</div></div></div><div class="product-card"><img src="${I('sq-salmon')}" alt="밀키트 상품"><div><b>오늘의 밀키트</b><small>간편식</small><div class="icons">♡　＋</div></div></div><div class="product-card"><img src="${I('sq-toast')}" alt="브런치 상품"><div><b>주말 브런치</b><small>간편식 · 브런치</small><div class="icons">♡　＋</div></div></div><div class="product-card"><img src="${I('sq-cake')}" alt="디저트 상품"><div><b>달콤한 디저트</b><small>베이커리</small><div class="icons">♡　＋</div></div></div></div><div class="shop-benefits"><div><b>찜하기</b><span>마음에 든 상품을 저장</span></div><div><b>빠른 장바구니</b><span>상품 카드에서 담기</span></div><div><b>정렬해서 비교</b><span>신상품·가격·리뷰순 확인</span></div></div></div>
  </section>
  <section class="section convenience">
    <div class="center"><span class="eyebrow">Small helps for everyday decisions</span><h2>장보기 고민을 덜어주는<br>실용적인 안내</h2><p class="lead">이번 주 장보기부터 보관 방법, 배송 확인까지. 자주 묻는 내용을 필요한 자리에 배치했습니다.</p></div>
    <div class="convenience-grid"><div class="convenience-photo"><img src="${I('portrait-brunch')}" alt="브런치 식탁"></div><div class="tool-list"><div class="tool-row"><div class="tool-icon">01</div><div><b>이번 주 장보기 체크리스트</b><span>신선식품 · 간편식 목록을 체크하고 진행 상황 저장</span></div><em>CHECK</em></div><div class="tool-row"><div class="tool-icon">02</div><div><b>신선하게 보관하는 법</b><span>받은 날 정리 · 소분 · 기한 관리 3단계 안내</span></div><em>GUIDE</em></div><div class="tool-row"><div class="tool-icon">03</div><div><b>상품별 상세 문의</b><span>보관 방법이나 배송 문의를 게시판으로 연결</span></div><em>Q&amp;A</em></div><div class="tool-row"><div class="tool-icon">04</div><div><b>FAQ 아코디언</b><span>배송 · 알레르기 · 선물 · 교환 질문 빠르게 확인</span></div><em>HELP</em></div><div class="tool-row"><div class="tool-icon">05</div><div><b>마이페이지 한곳에서</b><span>관심상품 · 주문/배송 · 보유 쿠폰 조회</span></div><em>MY PAGE</em></div></div></div>
  </section>
  <section class="section proof">
    <span class="eyebrow">Stories from every table</span><h2>맛본 경험이 다음 선택으로<br>이어지도록</h2><p class="lead">상품에 연결된 구매 후기와 포토리뷰를 통해 실제 사용 경험을 확인하고, 리뷰 이벤트로 참여를 안내합니다.</p>
    <div class="review-banner"><img src="${I('scene-toast')}" alt="프렌치토스트 브런치"><div class="review-copy"><span class="star">★★★★★</span><h3>포토리뷰로 나누는<br>우리 집 식탁</h3><p>상품 사진과 후기를 살펴보고, 구매 후에는 나만의 경험을 남겨보세요. 상품 카드마다 평점과 리뷰 수가 붙고, 메인에는 최신 포토리뷰가 모여요.</p><span class="reward">샘플 이벤트 · 포토리뷰 3,000P</span></div></div>
  </section>
  <section class="section" style="background:#f2e9df">
    <div class="split"><div><span class="eyebrow">A design that feels like a brand</span><h2>싱그러운 색과<br>정돈된 구성</h2><p class="lead">올리브와 테라코타 톤, 식욕을 돋우는 음식 사진, 여백을 살린 타이포그래피로 먹거리를 편안하게 보여줍니다. PC와 모바일 화면에 맞춰 자연스럽게 정리됩니다.</p><div class="label-row"><span>음식 영상 · 사진 메인 비주얼</span><span>반응형 화면</span><span>브랜드 컬러 구성</span></div></div><div class="img-panel"><img src="${I('scene-market')}" alt="제철 채소 라이프스타일 이미지"></div></div>
  </section>
  <section class="closing"><span class="eyebrow">Your shop, ready for better everyday meals</span><h2 class="serif">필요한 기능을 갖춘<br>나만의 식품 쇼핑몰을 시작하세요</h2><p>food902로 이벤트를 알리고, 혜택을 전하고, 매일의 편리한 장보기를 만들어보세요.</p><a href="${SAMPLE}" target="_blank" rel="noopener">샘플 사이트 둘러보기 ↗</a></section>
  <footer class="footer"><b>FOOD902</b><p>Events · Time Sale · Lucky Coupon · Everyday Food Shopping</p><p>※ 이미지와 상품 예시는 food902 사이트 화면 구성을 소개하기 위한 샘플입니다. 이벤트 혜택·상품·재고·가격·기간은 운영 설정에 따라 변경될 수 있습니다.</p></footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(DC, 'detail.html'), html);
console.log('ok', html.length);
