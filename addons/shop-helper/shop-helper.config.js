/* 쇼핑 도우미 설정 — 이 파일만 고치면 됩니다 (카페24 › 디자인 › 코드 편집 › /addons/shop-helper/shop-helper.config.js)
   layout.html 에서 shop-helper.js 보다 먼저 불러와야 합니다.
     <script src="/addons/shop-helper/shop-helper.config.js?v=1"></script>
     <script src="/addons/shop-helper/shop-helper.js?v=1"></script>
   비워 둔 항목('' 또는 지운 줄)은 기본값을 씁니다. 고친 뒤 화면에 안 보이면 ?v= 숫자를 하나 올리세요. */
window.SHOP_HELPER_CONFIG = {
	enabled: true,                 // false 면 상담 버튼을 숨깁니다
	brand: '',                     // 머리글 맨 위 영문 브랜드 (비우면 쇼핑몰 이름)
	label: 'Concierge',            // 브랜드 옆 작은 글자
	kicker: 'How can we help?',    // 머리글 기울임 글씨
	name: '쇼핑 도우미',             // 머리글 큰 제목
	greeting: '안녕하세요! {brand} 쇼핑 도우미예요.\n궁금한 내용을 골라 주세요.',
	hours: '평일 10:00 – 17:00 (점심 12:00 – 13:00, 주말 · 공휴일 휴무)',   // 「지금 상담 가능」 표시에 씁니다

	contact: '',                   // 상담원 연결(실시간) 주소 — 카카오톡 채널 1:1 채팅 (예: https://pf.kakao.com/_xxxx/chat)
	askLink: '/board/product/write.html?board_no=6',   // 문의 남기기 (상품 Q&A 글쓰기)
	faqBoard: 3,                   // 자주묻는질문 게시판 번호 — 글을 「자주 묻는 질문」 메뉴로 자동으로 배웁니다 (0 = 끔)
	settingsBoard: 0,              // (선택) 「[모든 페이지] 쇼핑 도우미」 설정 글을 둘 게시판 번호 (0 = 이 파일만 씀)

	freeShipping: 50000,           // 무료배송 기준 금액 (「배송비는 얼마예요?」 답)
	couponLink: '',                // [쿠폰 받으러 가기] 버튼 주소 (비우면 버튼 없음)
	sizeGuide: '',                 // [사이즈 가이드 보기] 버튼 주소
	guideLink: '',                 // [관리 가이드] 버튼 주소

	colors: { ink: '#111111', onInk: '#ffffff', soft: '#f5f5f5', line: '#ededed' },   // 머리글 · 버튼 색 / 그 위 글자 / 말풍선 바탕 / 선
	fonts: true,                   // 페이지에 없는 글꼴(Pretendard · Jost · Fraunces)을 불러옵니다
	hint: true,                    // 처음 온 손님에게 한 번 「무엇을 도와드릴까요?」

	// 첫 화면 메뉴 : 「이름 | 설명」. 아래 질문과 답의 cat 이 메뉴 이름과 같으면 그 메뉴 안에 들어갑니다
	menu: [
		'배송 안내 | 출고 일정 · 배송비 · 배송 조회',
		'교환 · 반품 · 환불 | 신청 방법 · 기간 · 환불 시점',
		'상품 상담 | 사이즈 · 옵션 · 재입고 · 상품 문의',
		'쿠폰 · 이벤트 | 쿠폰 받기 · 쓰는 법',
		'주문 · 결제 | 주문 조회 · 취소 · 결제 수단',
		'회원 · 적립금 | 가입 혜택 · 적립금 · 아이디 찾기',
		'상담원 연결 | 카카오톡 실시간 상담 · 문의 남기기'
	],

	// 기본 질문과 답(배송 · 교환 · 환불 · 쿠폰 · 주문 · 회원 · 상담 20개)에 더할 것.
	// 같은 질문(q)을 쓰면 기본 답을 바꾸고, a 를 '' 로 쓰면 그 기본 질문을 끕니다.
	// buttons : 한 줄에 「이름 주소」, {상담} = 상담원 연결 주소, {문의} = 문의 남기기 주소 / next : 이어서 보여 줄 질문 (/ 로 구분)
	addQna: [
		{ cat: '배송 안내', q: '오늘 주문하면 언제 와요?', keywords: '오늘 주문, 당일 출고', a: '평일 오후 2시 전 주문은 오늘 출고돼요.\n보통 다음 날 받아 보실 수 있어요.', buttons: '주문 조회 /myshop/order/list.html', next: '배송비는 얼마예요?' }
	],

	// 손님이 직접 입력할 때 같은 뜻으로 알아들을 말 (한 줄에 「대표 말 = 같은 말 = …」)
	synonyms: [
		'환불 = 반품 = 돌려받 = 돈 돌려',
		'배송 = 택배 = 도착 = 출고 = 발송 = 언제 와',
		'상담 = 상담원 = 문의 = 연락 = 전화 = 카톡'
	]
};
