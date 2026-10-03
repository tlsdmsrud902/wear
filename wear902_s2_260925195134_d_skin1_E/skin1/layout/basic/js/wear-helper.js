/* wear902 쇼핑 도우미 — AI 없이, 사장님이 적어 둔 질문과 답으로 대답하는 채팅 도우미           BUYER EDITABLE(설정만)
   ----------------------------------------------------------------------------------------------
   · 오른쪽 아래 말풍선 버튼 → 채팅 창. 버튼으로 고르거나 직접 물어보면 가장 가까운 답을 찾아 보여 준다.
   · 외부 서비스 · 월 이용료 없음. 답은 아래 네 곳에서 모아 쓴다 (사장님이 카페24 안에서 가르친다)
       1) 화면 관리 게시판의 「[모든 페이지] 쇼핑 도우미」 글 — 메인 주소 ?edit=1 → [쇼핑 도우미 고치기]
          이름 · 인사말 · 첫 화면 버튼 · 운영 시간 · 상담 연결 · 같은 말 · 「질문과 답」(키워드 · 답변 · 버튼 · 이어서)
       2) 자주묻는질문 게시판 글 (제목 = 질문, 본문 = 답). 본문에 「키워드: …」 · 「버튼: 이름 주소」 줄을 쓰면 더 잘 찾는다
       3) 메인 「자주 묻는 질문」 영역의 질문 · 답
       4) 상품 분류 메뉴 · 상품 검색 (답이 없으면 「○○ 상품 찾아보기」로 연결)
   · 편집 모드(?edit=1)에서 열면 「교육 모드」 : 답마다 어디서 온 답인지 보여 주고, 못 찾은 질문은 [이 질문 가르치기]
   · 기본 설정(글이 없을 때) : store-content.js 의 helper. 디자인은 이 파일 맨 아래 CSS. */
(function () {
  'use strict';
  var SC = window.STORE_CONTENT || {}, CMS = window.WEAR902_CMS;
  var NAME = '쇼핑 도우미';                                   // 화면 관리 게시판 글 이름 : [모든 페이지] 쇼핑 도우미
  var CFG_KEY = (CMS && CMS.helperKey) || 'wear902-helper-cfg', KB_KEY = 'wear902-helper-kb', CHAT_KEY = 'wear902-helper-chat', TEACH_KEY = 'wear902-helper-teach';
  var EDIT = /[?&]edit=1\b/.test(location.search);
  var CFG_TTL = 30 * 60000, KB_TTL = 60 * 60000;
  var html = document.documentElement;

  function trim(s) { return String(s == null ? '' : s).replace(/[ \t ​]+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function store(k) { try { return window[k]; } catch (e) { return null; } }
  function get(k, s) { try { return JSON.parse((store(s || 'localStorage')).getItem(k)); } catch (e) { return null; } }
  function put(k, v, s) { try { (store(s || 'localStorage')).setItem(k, JSON.stringify(v)); } catch (e) {} }
  function list(v) { return Array.isArray(v) ? v.slice() : String(v == null ? '' : v).split(/\n/).map(trim).filter(Boolean); }
  function won(n) { return Number(n || 0).toLocaleString('ko-KR'); }

  /* ---------- 1. 기본 설정 · 기본 답 (게시판 글이 없을 때) ---------- */
  var SALE = (SC.sale && SC.sale.categoryNo) || 27;
  var FREE = (SC.shipping && SC.shipping.freeOver) || 0;
  var BASE = {
    enabled: true,
    name: '쇼핑 도우미',
    greeting: '안녕하세요! {brand} 쇼핑 도우미예요.\n궁금한 내용을 골라 주세요.',
    // 첫 화면 메뉴 : 「이름 | 설명」. 질문과 답의 「분류」가 이 이름과 같으면 그 메뉴 안에 들어간다
    menu: ['배송 안내 | 출고 일정 · 배송비 · 배송 조회', '교환 · 반품 · 환불 | 신청 방법 · 기간 · 환불 시점', '상품 상담 | 사이즈 · 소재 · 세탁 · 재입고',
      '쿠폰 · 이벤트 | 쿠폰 받기 · 쓰는 법', '주문 · 결제 | 주문 조회 · 취소 · 결제 수단', '회원 · 적립금 | 가입 혜택 · 적립금 · 아이디 찾기', '상담원 연결 | 카카오톡 실시간 상담 · 문의 남기기'],
    fallback: '딱 맞는 답을 찾지 못했어요. 아래에서 골라 보시거나 상담원에게 물어봐 주세요.',
    hours: '평일 10:00 – 17:00 (점심 12:00 – 13:00, 주말 · 공휴일 휴무)',
    contact: '',                                              // 비우면 카카오톡 상담 버튼 주소
    askLink: '/board/product/write.html?board_no=6',          // 문의 남기기 (상품 Q&A 글쓰기)
    faqBoard: 3,                                              // 자동으로 배울 자주묻는질문 게시판 (0 = 끔)
    synonyms: ['환불 = 반품 = 돌려받 = 돈 돌려', '배송 = 택배 = 도착 = 출고 = 발송 = 언제 와 = 언제와 = 받아볼', '교환 = 바꾸 = 바꿔',
      '사이즈 = 치수 = 크기 = 핏 = 실측 = 작아 = 커요 = 커서 = 작아서', '쿠폰 = 할인 = 세일 = 이벤트 = 프로모션', '적립금 = 포인트 = 마일리지',
      '결제 = 카드 = 무통장 = 입금 = 계좌 = 페이', '주문 = 구매 = 샀', '취소 = 철회', '회원 = 가입 = 로그인 = 아이디 = 비밀번호 = 비번',
      '상담 = 상담원 = 문의 = 연락 = 전화 = 카톡 = 카카오 = 사람', '운영시간 = 영업시간 = 몇 시 = 몇시 = 근무'],
    qna: [
      { cat: '배송 안내', q: '배송은 언제 와요?', keywords: '배송, 도착, 출고, 언제', a: '평일 오후 2시 전 주문은 당일 출고해 1~2일 안에 받아 보실 수 있어요.\n주문 제작 상품은 상세페이지의 출고 일정을 확인해 주세요.', buttons: '주문 · 배송 조회 /myshop/order/list.html' },
      { cat: '배송 안내', q: '배송비는 얼마예요?', keywords: '배송비, 무료배송, 택배비', a: FREE ? won(FREE) + '원 이상 구매하시면 무료배송이에요. 장바구니에서 무료배송까지 남은 금액을 볼 수 있어요.' : '배송비는 주문서에서 확인할 수 있어요.', buttons: '장바구니 /order/basket.html' },
      { cat: '배송 안내', q: '배송 조회는 어디서 해요?', keywords: '배송 조회, 송장, 운송장, 어디쯤', a: '주문 조회에서 주문을 누르면 송장 번호와 배송 상태를 볼 수 있어요.\n출고 당일에는 택배사 조회가 늦게 뜰 수 있어요.', buttons: '주문 · 배송 조회 /myshop/order/list.html' },
      { cat: '교환 · 반품 · 환불', q: '교환 · 반품은 어떻게 해요?', keywords: '교환, 반품, 반송', a: '받으신 날부터 7일 안에, 착용 흔적이나 택 제거가 없는 상품이면 교환 · 반품할 수 있어요.\n주문 조회에서 신청하신 뒤 안내에 따라 보내 주세요.', buttons: '교환 · 반품 신청 (주문 조회) /myshop/order/list.html' },
      { cat: '교환 · 반품 · 환불', q: '환불은 언제 돼요?', keywords: '환불, 환불 언제, 돈 언제', a: '반품 상품이 도착해 확인되면 결제하신 수단으로 환불해 드려요.\n카드는 카드사에 따라 3~7영업일 정도 걸릴 수 있어요.' },
      { cat: '교환 · 반품 · 환불', q: '불량 · 오배송이에요', keywords: '불량, 오배송, 잘못 왔, 하자, 찢어', a: '불편을 드려 죄송해요. 상품 사진과 함께 문의를 남겨 주시면 확인 후 다시 보내 드리거나 환불해 드려요. 왕복 배송비는 저희가 부담해요.', buttons: '문의 남기기 {문의}\n카카오톡 상담 {상담}' },
      { cat: '교환 · 반품 · 환불', q: '사이즈가 안 맞아요', keywords: '안 맞, 작아요, 커요, 사이즈 교환', a: '받으신 날부터 7일 안에 착용 흔적이 없으면 다른 사이즈로 교환할 수 있어요.', buttons: '교환 신청 (주문 조회) /myshop/order/list.html' },
      { cat: '상품 상담', q: '사이즈는 어떻게 골라요?', keywords: '사이즈, 어깨, 가슴, 총장, 키, 몸무게, 추천', a: '상품 상세페이지의 실측 사이즈(어깨 · 가슴단면 · 총장)를 가지고 계신 옷과 비교해 보세요.\n모델 키와 착용 사이즈도 함께 적어 두었어요.', buttons: '사이즈 재는 법 보기 /#cz-size' },
      { cat: '상품 상담', q: '세탁 · 관리는 어떻게 해요?', keywords: '세탁, 빨래, 드라이, 관리, 보풀', a: '상품마다 세탁 방법이 달라요. 상세페이지의 세탁 안내를 먼저 확인해 주세요.\n니트는 찬물 손세탁 후 눕혀 말리면 오래 입을 수 있어요.', buttons: '옷 관리 가이드 /wear/guide.html' },
      { cat: '상품 상담', q: '품절 상품은 다시 들어와요?', keywords: '품절, 재입고, 재고', a: '재입고 일정은 상품마다 달라요. 상품 문의로 남겨 주시면 확인해 알려 드릴게요.', buttons: '문의 남기기 {문의}' },
      { cat: '상품 상담', q: '상품에 대해 물어보고 싶어요', keywords: '상품 문의, 소재, 색상, 두께, 비침', a: '상품 상세페이지 아래 「상품 문의」에 남겨 주시면 꼼꼼히 확인해 답해 드려요.\n바로 이야기하고 싶으시면 카카오톡 상담을 이용해 주세요.', buttons: '상품 문의 남기기 {문의}\n카카오톡 상담 {상담}' },
      { cat: '쿠폰 · 이벤트', q: '쿠폰은 어디서 받아요?', keywords: '쿠폰, 할인, 세일, 이벤트', a: '세일 페이지에서 회원이면 랜덤 쿠폰(최대 50%)을 직접 뽑을 수 있어요.\n받은 쿠폰은 마이쿠폰에서 확인해요.', buttons: '쿠폰 뽑으러 가기 /product/list.html?cate_no=' + SALE + '\n내 쿠폰함 /myshop/coupon/coupon.html' },
      { cat: '쿠폰 · 이벤트', q: '쿠폰은 어떻게 써요?', keywords: '쿠폰 사용, 쿠폰 적용, 쿠폰 쓰', a: '주문서의 「할인 · 쿠폰」에서 쿠폰을 골라 적용하면 돼요. 쿠폰마다 사용 기간과 최소 금액이 달라요.', buttons: '내 쿠폰함 /myshop/coupon/coupon.html' },
      { cat: '주문 · 결제', q: '주문 내역을 보고 싶어요', keywords: '주문 조회, 주문 내역, 주문 확인', a: '로그인하시면 주문 조회에서 결제 · 배송 상태를 볼 수 있어요.\n비회원 주문은 주문번호로 조회해요.', buttons: '주문 조회 /myshop/order/list.html' },
      { cat: '주문 · 결제', q: '주문을 취소하고 싶어요', keywords: '취소, 주문 취소', a: '배송 준비 전이라면 주문 조회에서 직접 취소할 수 있어요.\n이미 출고된 주문은 받으신 뒤 반품으로 진행해 주세요.', buttons: '주문 조회 /myshop/order/list.html' },
      { cat: '주문 · 결제', q: '결제는 어떻게 해요?', keywords: '결제, 카드, 무통장, 입금, 계좌', a: '신용카드 · 무통장 입금 등 주문서에 나오는 결제 수단으로 결제할 수 있어요.\n무통장 입금은 주문 후 안내된 계좌로 기한 안에 입금해 주세요.' },
      { cat: '회원 · 적립금', q: '회원 가입 혜택이 있나요?', keywords: '회원가입, 가입, 혜택, 신규', a: '회원이 되시면 세일 페이지 쿠폰 뽑기에 참여할 수 있고, 구매 금액에 따라 적립금이 쌓여요.', buttons: '회원 가입 /member/agreement.html\n로그인 /member/login.html' },
      { cat: '회원 · 적립금', q: '적립금은 어떻게 써요?', keywords: '적립금, 포인트', a: '쌓인 적립금은 주문서에서 사용할 수 있어요. 적립 내역은 마이페이지에서 확인해요.', buttons: '적립금 내역 /myshop/mileage/historyList.html' },
      { cat: '회원 · 적립금', q: '아이디 · 비밀번호를 잊었어요', keywords: '아이디, 비밀번호, 비번, 로그인 안', a: '아래에서 가입하신 정보로 아이디와 비밀번호를 찾을 수 있어요.', buttons: '아이디 찾기 /member/id/find_id.html\n비밀번호 찾기 /member/passwd/find_passwd_info.html' },
      { cat: '상담원 연결', q: '상담원과 이야기하고 싶어요', keywords: '상담, 상담원, 문의, 연락, 전화, 카톡, 사람', a: '카카오톡으로 실시간 상담하실 수 있어요. 운영 시간이 아니면 문의를 남겨 주시면 순서대로 답해 드려요.\n운영 시간 : {운영시간}', buttons: '카카오톡 실시간 상담 {상담}\n문의 남기기 {문의}' }
    ]
  };

  /* 설정 : 기본값 ← store-content.js 의 helper ← 화면 관리 게시판 글(이 브라우저가 기억한 것) */
  var boardCfg = (get(CFG_KEY) || {}).cfg || null;
  function config() {
    var c = {}, k, sc = SC.helper || {};
    for (k in BASE) c[k] = BASE[k];
    for (k in sc) if (sc[k] != null && sc[k] !== '') c[k] = sc[k];
    if (boardCfg) for (k in boardCfg) if (k !== 'qna' && boardCfg[k] != null && boardCfg[k] !== '') c[k] = boardCfg[k];
    if (typeof c.faqBoard === 'string') c.faqBoard = parseInt(c.faqBoard, 10) || 0;
    // 질문과 답 : 사장님이 쓴 것 + (같은 질문이 없는) 기본 답. 답변을 비운 칸은 그 질문을 끄는 표시
    var base = (sc.qna && sc.qna.length ? sc.qna : BASE.qna), own = (boardCfg && boardCfg.qna) || [], have = {};
    own.forEach(function (q) { have[flat(q.q)] = 1; });
    c.qnaAll = own.map(function (q) { return copy(q, 'board'); }).concat(base.filter(function (q) { return !have[flat(q.q)]; }).map(function (q) { return copy(q, 'base'); }));
    c.qnaAll.forEach(function (q, i) { q.idx = i; });
    c.qna = c.qnaAll.filter(function (q) { return trim(q.a); });
    return c;
  }
  function copy(q, src) { var o = {}; for (var k in q) if (k.charAt(0) !== '_') o[k] = q[k]; o.src = src; return o; }
  function fill(s) {
    var c = config();
    return String(s || '').replace(/\{brand\}/g, (SC.brand && SC.brand.name) || '').replace(/\{운영시간\}/g, c.hours || '')
      .replace(/\{무료배송\}/g, FREE ? won(FREE) + '원' : '');
  }
  function contactUrl() {
    var c = config();
    if (/^https?:\/\//.test(c.contact || '')) return c.contact;
    var kk = document.querySelector('[data-s9="kakao"]');
    return (kk && /^https?:/.test(kk.href) && kk.href) || (SC.floating && SC.floating.kakao) || 'https://pf.kakao.com/';
  }
  function linkOf(u) {
    u = trim(u);
    if (/^\{?(상담|카카오|카톡)\}?$/.test(u)) return contactUrl();
    if (/^\{?문의\}?$/.test(u)) return config().askLink || '/board/product/write.html?board_no=6';
    if (/^www\./i.test(u)) u = 'https://' + u;
    return /^(https?:\/\/|\/|#|\?|tel:|mailto:)/i.test(u) ? u : '';
  }
  // 「이름 주소」 한 줄 → { label, href } (주소는 마지막 칸)
  function buttons(v) {
    return list(v).map(function (l) {
      var m = l.match(/^(.*\S)\s+(\S+)$/);
      if (!m) return null;
      var href = linkOf(m[2]);
      return href ? { label: m[1], href: href } : null;
    }).filter(Boolean);
  }

  /* ---------- 2. 알아듣기 (AI 없이 : 같은 말 → 키워드 → 낱말 → 글자 쌍) ---------- */
  function flat(s) { return String(s || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, ''); }
  function words(s) { return String(s || '').toLowerCase().replace(/[^0-9a-z가-힣\s]/g, ' ').split(/\s+/).filter(Boolean); }
  var TAIL = /(에서는|에서|으로는|으로|까지|부터|에게|한테|이랑|이나|하고|은요|는요|이요|인가요|있나요|되나요|하나요|할까요|나요|까요|어요|아요|해요|예요|이에요|에요|주세요|해줘|알려줘|은|는|을|를|이|가|에|로|와|과|도|만|요)$/;
  function stem(w) { var p; do { p = w; if (w.length > 2 || (w.length === 2 && !/^[가-힣]{2}$/.test(w))) w = w.replace(TAIL, ''); } while (w !== p && w.length > 1); return w; }
  var STOP = { '저': 1, '제가': 1, '좀': 1, '혹시': 1, '그': 1, '이거': 1, '어떻게': 1, '언제': 0, '뭐': 1, '무엇': 1, '하는': 1, '싶어': 1, '싶어요': 1, '궁금': 1, '알고': 1, '방법': 1, '있': 1, '없': 1, '수': 1, '것': 1, '거': 1 };
  var synMap = null, synKey = '';
  function synonyms() {
    var c = config(), key = JSON.stringify(c.synonyms || '');
    if (synMap && key === synKey) return synMap;
    synKey = key; synMap = [];
    list(c.synonyms).forEach(function (line) {
      var g = line.split(/[=,]/).map(flat).filter(Boolean);
      if (g.length > 1) synMap.push({ head: g[0], all: g });
    });
    return synMap;
  }
  // 문장에 들어 있는 「같은 말 묶음」의 대표 말들
  function concepts(text) {
    var f = flat(text), out = {};
    synonyms().forEach(function (g) { if (g.all.some(function (w) { return f.indexOf(w) > -1; })) out[g.head] = 1; });
    return out;
  }
  function grams(s) { var f = flat(s), g = {}; for (var i = 0; i < f.length - 1; i++) g[f.substr(i, 2)] = 1; return g; }
  function dice(a, b) { var n = 0, x = 0, y = 0, k; for (k in a) { x++; if (b[k]) n++; } for (k in b) y++; return x + y ? 2 * n / (x + y) : 0; }
  function prep(item) {
    if (item._p) return item._p;
    var kws = String(item.keywords || '').split(/[,\n/]/).map(flat).filter(function (k) { return k.length > 0; });
    var c = concepts(item.q + ' ' + (item.keywords || ''));
    return (item._p = { q: flat(item.q), kws: kws, words: words(item.q).map(stem).filter(function (w) { return w && !STOP[w]; }), c: c, g: grams(item.q) });
  }
  function score(item, Q) {
    var p = prep(item), s = 0, k;
    if (p.q && p.q === Q.f) return 100;
    p.kws.forEach(function (kw) { if (kw.length > 1 && Q.f.indexOf(kw) > -1) s += 2.5 + Math.min(kw.length, 6) * 0.25; });
    for (k in Q.c) if (p.c[k]) s += 2;
    Q.w.forEach(function (w) {
      if (w.length < 2) return;
      p.words.forEach(function (x) { if (x === w) s += 1.5; else if (x.length > 1 && (x.indexOf(w) > -1 || w.indexOf(x) > -1)) s += 0.7; });
    });
    s += 3 * dice(Q.g, p.g);
    return s * (item.boost || 1);
  }
  function query(text) { return { f: flat(text), w: words(text).map(stem).filter(function (w) { return w && !STOP[w]; }), c: concepts(text), g: grams(text) }; }

  /* ---------- 3. 지식 모으기 ---------- */
  var KB = { faq: [], main: [], cats: [] }, kbLoading = null;
  function textOf(htmlStr) {
    var d = document.createElement('div');
    d.innerHTML = String(htmlStr || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n');
    return d.textContent.split('\n').map(trim).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  // 자주묻는질문 게시판 글 본문 : 「키워드:」 · 「버튼:」 · 「이어서:」 줄을 따로 떼고 나머지가 답
  function fromPost(subject, content, no) {
    var kw = [], btn = [], next = '', rest = [];
    textOf(content).split('\n').forEach(function (l) {
      var m = l.match(/^(키워드|버튼|이어서)\s*[:：]\s*(.*)$/);
      if (m) { if (m[1] === '키워드') kw.push(m[2]); else if (m[1] === '버튼') btn.push(m[2]); else next = m[2]; }
      else if (!/^※/.test(l)) rest.push(l);
    });
    return { q: subject.replace(/^\s*\[[^\]]*\]\s*/, ''), keywords: kw.join(', '), a: rest.join('\n').trim(), buttons: btn.join('\n'), next: next, src: 'faq', no: no };
  }
  function loadFaq() {
    var c = config(), board = c.faqBoard;
    var cached = get(KB_KEY);
    if (cached && cached.board === board && Date.now() - cached.t < KB_TTL && !EDIT) { KB.faq = cached.items || []; return Promise.resolve(); }
    if (!board || !CMS || !CMS.listBoard) { KB.faq = []; return Promise.resolve(); }
    return CMS.listBoard(board).then(function (posts) {
      posts = posts.slice(0, 80);
      var old = {}, items = [], i = 0;
      ((cached && cached.items) || []).forEach(function (x) { old[x.no] = x; });
      function worker() {
        if (i >= posts.length) return Promise.resolve();
        var p = posts[i++];
        if (old[p.no] && old[p.no].q === p.subject.replace(/^\s*\[[^\]]*\]\s*/, '') && !EDIT) { items.push(old[p.no]); return worker(); }
        return CMS.readPost(p, board).then(function (b) { if (b && b.content) items.push(fromPost(p.subject, b.content, p.no)); return worker(); });
      }
      return Promise.all([worker(), worker()]).then(function () {
        KB.faq = items.filter(function (x) { return x.q && x.a; });
        put(KB_KEY, { t: Date.now(), board: board, items: KB.faq });
      });
    }).catch(function () { KB.faq = (cached && cached.items) || []; });
  }
  // 메인 「자주 묻는 질문」 : 메인이면 화면에서, 아니면 메인 화면 관리 기억(wear902-cms-v2-…-/)에서
  function loadMain() {
    var box = document.querySelector('[data-cms="자주 묻는 질문"]');
    if (box) {
      KB.main = Array.from(box.querySelectorAll('details')).map(function (d) {
        var s = d.querySelector('summary'), a = d.querySelector('[data-cms-text="답변"]') || d.querySelector('p');
        var link = a && a.querySelector('a[href]');
        return s && a ? { q: trim(s.textContent), a: textOf(a.innerHTML), buttons: link ? trim(link.textContent) + ' ' + link.getAttribute('href') : '', src: 'main' } : null;
      }).filter(Boolean);
      put(KB_KEY + '-main', KB.main);
    } else KB.main = get(KB_KEY + '-main') || [];
  }
  // 상품 분류 : 머리글 메뉴의 분류 링크 (이름 → 주소)
  function loadCats() {
    var seen = {};
    KB.cats = Array.from(document.querySelectorAll('header a[href*="cate_no="], #header a[href*="cate_no="], .xans-layout-category a[href*="cate_no="]')).map(function (a) {
      var t = trim(a.textContent).replace(/\s*(new|best|sale)?\s*$/i, ''), f = flat(t);
      if (!f || f.length > 12 || seen[f]) return null;
      seen[f] = 1;
      return { label: t, f: f, href: a.getAttribute('href') };
    }).filter(Boolean);
  }
  function loadAll() {
    if (!kbLoading) {
      loadMain(); loadCats();
      kbLoading = Promise.all([loadFaq(), refreshCfg()]).catch(function () {});
    }
    return kbLoading;
  }
  // 화면 관리 영역이 없는 페이지(상품 상세 등)에서 처음 열면 게시판 설정 글을 읽어 온다
  function refreshCfg() {
    var c = get(CFG_KEY);
    if ((c && Date.now() - c.t < CFG_TTL && !EDIT) || !CMS || !CMS.fetchData || document.querySelector('[data-cms="' + NAME + '"]')) return Promise.resolve();
    return CMS.fetchData(NAME, CMS.helperLabels()).then(function (data) {
      if (data) CMS.applyHelper(data); else put(CFG_KEY, { t: Date.now(), cfg: null });
    });
  }
  var itemsCache = null, itemsKey = '';
  function allItems() {
    var c = config(), key = JSON.stringify([c.qna, KB.faq.length, KB.main.length, c.synonyms]);
    if (itemsCache && key === itemsKey) return itemsCache;   // prep() 결과(_p)를 다시 쓰도록 같은 내용이면 그대로
    itemsKey = key;
    return (itemsCache = c.qna.concat(KB.faq.map(function (x) { x.boost = 1.05; return x; }), KB.main));
  }

  /* ---------- 4. 답 고르기 ---------- */
  var SEARCH = /(찾아|찾고|찾는|있나요|있어요|있을까|파나요|팔아요|보여|추천|사고\s*싶|사려|살래|구해|구매하려|어딨|어디\s*있)/;
  // 상품 검색어에서 뺄 말 (동사 · 묻는 말)
  var VERB = /(싶|하고|해요|했|하려|받고|받을|드려|주세요|줘|있|없|되|돼|나요|까요|어요|아요|인가|이에요|예요|얼마|어떻게|언제|왜|뭐|무슨)/;
  function answer(text) {
    var Q = query(text), items = allItems(), ranked = items.map(function (it) { return { it: it, s: score(it, Q) }; })
      .filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; });
    var cats = KB.cats.filter(function (c) { return Q.f.indexOf(c.f) > -1; });
    var best = ranked[0], res = { q: text };
    if (best && best.s >= 3) {
      res.item = best.it;
      res.also = ranked.slice(1, 4).filter(function (r) { return r.s >= Math.max(3, best.s * 0.7) && flat(r.it.q) !== flat(best.it.q); }).map(function (r) { return r.it.q; }).slice(0, 2);
    } else {
      res.suggest = ranked.filter(function (r) { return r.s >= 1.2; }).slice(0, 3).map(function (r) { return r.it.q; });
    }
    // 분류 이름이 들어 있으면 그 분류로, 「찾아요 · 있나요」처럼 물건을 찾는 말이면 상품 검색으로 이어 준다
    res.links = cats.slice(0, 2).map(function (c) { return { label: c.label + ' 보러 가기', href: c.href }; });
    var kw = words(text).filter(function (w) { return w.length > 1 && !SEARCH.test(w) && !VERB.test(w) && !STOP[w]; }).map(stem).slice(0, 2).join(' ');
    // 물건을 찾는 말(「코트 있나요」 · 「니트 추천」)이거나, 답이 없는 짧은 낱말(「트렌치코트」)일 때만 상품 검색으로 잇는다
    var short = words(text).length <= 2 && !VERB.test(text);
    if (kw && !cats.length && (SEARCH.test(text) || (!res.item && short))) res.links.push({ label: '「' + kw + '」 상품 찾아보기', href: '/product/search.html?keyword=' + encodeURIComponent(kw) });
    return res;
  }

  /* ---------- 5. 화면 ---------- */
  var root, log, input, opened = false, history = get(CHAT_KEY, 'sessionStorage') || [];
  function icon(name) {
    var p = {
      chat: '<path d="M4.5 5.5h15v10.5h-9.5l-5.5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      home: '<path d="M4 11.5 12 5l8 6.5M6.5 10v8.5h11V10"/>',
      send: '<path d="M4.5 12h14M13 6l6 6-6 6"/>',
      truck: '<path d="M3 7.5h10.5v8.5H3zM13.5 10.5h4l3 3v2.5h-7z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
      'return': '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1M19.5 12a7.5 7.5 0 0 1-13 5.1"/><path d="M17.8 3.6v3.6h-3.6M6.2 20.4v-3.6h3.6"/>',
      tag: '<path d="M8.5 4.5 12 7l3.5-2.5 4 3-2 3.5-1.5-1v10h-8v-10l-1.5 1-2-3.5z"/>',
      gift: '<path d="M4.5 9.5h15v3h-15zM6 12.5v7h12v-7M12 9.5v10M12 9.5c-1.5-3.5-5-3.5-5-1.5S12 9.5 12 9.5zM12 9.5c1.5-3.5 5-3.5 5-1.5s-5 1.5-5 1.5z"/>',
      card: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h4"/>',
      user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1-3.5 3.8-5 7-5s6 1.5 7 5"/>',
      help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.5a2.3 2.3 0 1 1 3.2 2.1c-.7.3-1 .8-1 1.5v.4"/><circle cx="12" cy="16.6" r=".4"/>',
      dot: '<circle cx="12" cy="12" r="2.5"/>'
    }[name];
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  function rich(s) {
    return esc(fill(s)).replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
  }
  function save() { put(CHAT_KEY, history.slice(-40), 'sessionStorage'); }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function chips(arr, cls) {
    if (!arr || !arr.length) return '';
    return '<div class="wh-chips ' + (cls || '') + '">' + arr.map(function (t) { return '<button type="button" class="wh-chip" data-ask="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
  }
  function linkBtns(arr) {
    if (!arr || !arr.length) return '';
    return '<div class="wh-links">' + arr.map(function (b) {
      var ext = /^https?:\/\//.test(b.href) && b.href.indexOf(location.host) < 0;
      return '<a class="wh-link" href="' + esc(b.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(b.label) + '<span aria-hidden="true">→</span></a>';
    }).join('') + '</div>';
  }
  function srcLabel(it) {
    if (!it) return '';
    if (it.src === 'faq') return '자주묻는질문 게시판 글';
    if (it.src === 'main') return '메인 「자주 묻는 질문」';
    if (it.src === 'board') return '쇼핑 도우미 글 · 질문과 답 ' + (it.idx + 1) + '번';
    return '기본 답 (아직 가르치지 않음) · 질문과 답 ' + (it.idx + 1) + '번';
  }
  /* 메뉴 : 「이름 | 설명」 줄 → [{ name, desc, items }]. 질문과 답의 분류가 메뉴 이름과 같으면 그 안에 들어간다.
     게시판 · 메인 자주 묻는 질문은 「자주 묻는 질문」, 분류가 없거나 메뉴에 없는 질문은 「그 밖의 질문」으로 모은다 */
  var MENU_ICON = [[/배송|택배|출고/, 'truck'], [/교환|반품|환불/, 'return'], [/상품|사이즈|소재|세탁/, 'tag'], [/쿠폰|이벤트|할인|세일/, 'gift'],
    [/주문|결제/, 'card'], [/회원|적립|로그인/, 'user'], [/상담|문의|연결/, 'chat'], [/자주|질문/, 'help']];
  function menus() {
    var c = config(), out = [], by = {};
    list(c.menu).forEach(function (l) {
      var m = l.split('|'), name = trim(m[0]), key = flat(name);
      if (!key || by[key]) return;
      by[key] = { name: name, desc: trim(m.slice(1).join('|')), items: [] };
      out.push(by[key]);
    });
    var etc = [], faq = KB.faq.concat(KB.main);
    c.qna.forEach(function (q) { var g = by[flat(q.cat)]; if (g) g.items.push(q); else etc.push(q); });
    var contact = out.filter(function (g) { return /상담원|연결/.test(g.name); })[0], at = contact ? out.indexOf(contact) : out.length;
    if (faq.length) out.splice(at++, 0, { name: '자주 묻는 질문', desc: '사장님이 정리한 질문 모음', items: faq });
    if (etc.length) out.splice(at, 0, { name: '그 밖의 질문', desc: '', items: etc });
    return out.filter(function (g) { return g.items.length; });
  }
  function menuIcon(name) { for (var i = 0; i < MENU_ICON.length; i++) if (MENU_ICON[i][0].test(name)) return MENU_ICON[i][1]; return 'dot'; }
  function render(m) {
    var el = document.createElement('div');
    el.className = 'wh-msg wh-msg--' + m.who;
    if (m.who === 'me') el.innerHTML = '<p class="wh-bubble">' + esc(m.text) + '</p>';
    else {
      var h = m.text ? '<div class="wh-bubble">' + rich(m.text) + '</div>' : '';
      if (m.menu) h += '<div class="wh-menu">' + m.menu.map(function (g) {
        return '<button type="button" class="wh-card" data-cat="' + esc(g.name) + '"><span class="wh-card__ic">' + icon(menuIcon(g.name)) + '</span>'
          + '<span class="wh-card__t"><b>' + esc(g.name) + '</b>' + (g.desc ? '<small>' + esc(g.desc) + '</small>' : '') + '</span><span class="wh-card__go" aria-hidden="true">›</span></button>';
      }).join('') + '</div>';
      if (m.qs) h += '<div class="wh-qs">' + m.qs.map(function (q) { return '<button type="button" class="wh-q" data-ask="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
      h += linkBtns(m.links) + chips(m.chips, m.chipsCls);
      if (EDIT && m.teach != null) {
        h += '<div class="wh-teach">' + (m.src ? '<span>답 출처 : ' + esc(m.src) + '</span>' : '<span>이 질문은 아직 몰라요</span>')
          + '<button type="button" data-teach="' + esc(m.teach) + '">' + (m.src ? '이 답 고치기' : '이 질문 가르치기') + '</button></div>';
      }
      el.innerHTML = h;
    }
    log.appendChild(el);
  }
  // 새 답은 처음부터 보이게 : 답이 창보다 길면 답의 맨 위(바로 앞 내 질문 포함)로, 짧으면 맨 아래로
  function push(m) {
    history.push(m); save(); render(m);
    var el = log.lastChild, prev = el && el.previousSibling, top = (prev && prev.classList.contains('wh-msg--me') ? prev : el).offsetTop - 12;
    log.scrollTop = m.who === 'bot' && el.offsetTop + el.offsetHeight - top > log.clientHeight ? top : log.scrollHeight;
  }
  var HOME = '처음 메뉴';
  function menuMsg(text) {
    return { who: 'bot', text: text, menu: menus().map(function (g) { return { name: g.name, desc: g.desc }; }) };
  }
  function greet() { var c = config(); push(menuMsg(c.greeting || BASE.greeting)); }
  // 메뉴 하나를 골랐을 때 : 질문이 하나뿐이면 바로 답, 여럿이면 질문 목록
  function openCat(name) {
    push({ who: 'me', text: name });
    var g = menus().filter(function (x) { return x.name === name; })[0];
    if (!g) { push(menuMsg('메뉴가 바뀌었어요. 다시 골라 주세요.')); return; }
    if (g.items.length === 1) { push(reply(g.items[0].q, true)); return; }
    push({ who: 'bot', text: '「' + g.name + '」 에서 무엇이 궁금하세요?', qs: g.items.map(function (q) { return q.q; }), chips: [HOME], chipsCls: 'is-home' });
  }
  function catOf(item) {
    var gs = menus();
    for (var i = 0; i < gs.length; i++) if (gs[i].items.indexOf(item) > -1 || gs[i].items.some(function (x) { return flat(x.q) === flat(item.q); })) return gs[i];
    return null;
  }
  function reply(text, quiet) {
    var r = answer(text), c = config(), m = { who: 'bot', teach: text };
    if (r.item) {
      m.text = r.item.a;
      m.links = buttons(r.item.buttons).concat(r.links || []);
      // 이어서 : 사장님이 적은 「이어서」 → 같은 메뉴의 다른 질문 → 처음 메뉴
      var g = catOf(r.item), same = g ? g.items.map(function (x) { return x.q; }) : [];
      m.chips = String(r.item.next || '').split('/').map(trim).filter(Boolean).concat(r.also || [], same)
        .filter(function (t, i, a) { return a.indexOf(t) === i && flat(t) !== flat(r.item.q); }).slice(0, 4).concat([HOME]);
      m.chipsCls = 'is-next';
      m.src = srcLabel(r.item);
      if (r.item.src === 'base' || r.item.src === 'board') m.teach = r.item.q;
    } else {
      m.text = r.suggest && r.suggest.length ? '이걸 찾으셨나요?' : (c.fallback || BASE.fallback);
      m.qs = r.suggest && r.suggest.length ? r.suggest : null;
      m.chips = ['상담원과 이야기하고 싶어요', HOME];
      m.links = (r.links || []).concat(r.suggest && r.suggest.length ? [] : buttons('카카오톡 실시간 상담 {상담}\n문의 남기기 {문의}'));
    }
    return m;
  }
  function typingThen(fn) {
    var typing = document.createElement('div');
    typing.className = 'wh-msg wh-msg--bot'; typing.innerHTML = '<div class="wh-bubble wh-typing" aria-label="답을 찾는 중"><i></i><i></i><i></i></div>';
    log.appendChild(typing); scroll();
    var wait = new Promise(function (r) { setTimeout(r, 320); });
    Promise.all([loadAll(), wait]).then(function () { typing.remove(); fn(); });
  }
  function ask(text) {
    text = trim(text);
    if (!text) return;
    if (text === HOME) { push({ who: 'me', text: HOME }); push(menuMsg('다른 궁금한 내용을 골라 주세요.')); return; }
    push({ who: 'me', text: text });
    typingThen(function () { push(reply(text)); });
  }
  function teach(q) {
    put(TEACH_KEY, q, 'sessionStorage');
    var b = document.querySelector('[data-cms="' + NAME + '"]'), btn = b && b.__cmsBtn;
    if (btn) btn.click();
    else location.href = '/?edit=1#helper';
  }
  function build() {
    var c = config();
    root = document.createElement('div');
    root.className = 'wh'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', c.name || BASE.name);
    root.innerHTML = '<div class="wh-head"><div class="wh-title"><b>' + esc(c.name || BASE.name) + '</b><small>' + esc(c.hours ? '상담 ' + c.hours : '') + '</small></div>'
      + '<button type="button" class="wh-icon" data-act="home" aria-label="처음으로">' + icon('home') + '</button>'
      + '<button type="button" class="wh-icon" data-act="close" aria-label="닫기">' + icon('close') + '</button></div>'
      + (EDIT ? '<div class="wh-edu"><b>교육 모드</b> · 사장님 화면에만 보여요. 물어보고, 모르는 질문은 바로 가르치세요. <button type="button" data-act="teach">설정 · 질문과 답 고치기</button></div>' : '')
      + '<div class="wh-log" aria-live="polite"></div>'
      + '<form class="wh-form"><label class="wh-sr" for="wh-in">질문 입력</label><input id="wh-in" type="text" autocomplete="off" maxlength="120" placeholder="메뉴에 없으면 직접 물어보세요">'
      + '<button type="submit" aria-label="보내기">' + icon('send') + '</button></form>';
    document.body.appendChild(root);
    log = root.querySelector('.wh-log'); input = root.querySelector('input');
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-ask],[data-act],[data-teach],[data-cat]');
      if (!a) return;
      if (a.hasAttribute('data-cat')) openCat(a.getAttribute('data-cat'));
      else if (a.hasAttribute('data-ask')) ask(a.getAttribute('data-ask'));
      else if (a.hasAttribute('data-teach')) teach(a.getAttribute('data-teach'));
      else if (a.getAttribute('data-act') === 'close') toggle(false);
      else if (a.getAttribute('data-act') === 'teach') teach('');
      else if (a.getAttribute('data-act') === 'home') { history = []; save(); log.innerHTML = ''; typingThen(greet); }
    });
    root.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    if (history.length) history.forEach(render); else typingThen(greet);   // 게시판 자주 묻는 질문까지 읽고 메뉴를 그린다
  }
  var fab;
  function toggle(on) {
    if (on == null) on = !opened;
    if (on && !root) build();
    if (!root) return;
    opened = on;
    root.hidden = !on;
    html.classList.toggle('wh-open', on);
    if (fab) fab.setAttribute('aria-expanded', String(on));
    if (on) { loadAll(); setTimeout(function () { if (window.innerWidth > 640) input.focus(); }, 50); }
    else if (fab) fab.focus();
  }

  /* ---------- 6. 버튼 달기 ---------- */
  function mount() {
    var c = config(), f = document.getElementById('s9Float');
    if (c.enabled === false && !EDIT) return;
    fab = document.createElement('button');
    fab.type = 'button'; fab.className = 's9-float__btn s9-float__btn--helper'; fab.setAttribute('data-s9', 'helper');
    fab.setAttribute('aria-label', c.name || BASE.name); fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = icon('chat') + '<span class="displaynone">' + esc(c.name || BASE.name) + '</span>';
    fab.addEventListener('click', function (e) { if (html.classList.contains('cms-edit') && e.target.closest('.cms-btn')) return; toggle(); });
    if (f) f.insertBefore(fab, f.firstChild); else { fab.classList.add('wh-fab-solo'); document.body.appendChild(fab); }
    // 화면 관리 영역이 있는 페이지 : 편집 모드에서 [쇼핑 도우미 고치기]가 막대에 나오도록 (카카오톡 버튼과 같은 방식)
    if (CMS && CMS.board && document.querySelector('[data-cms]')) {
      fab.setAttribute('data-cms', NAME); fab.setAttribute('data-cms-adapter', 'helper'); fab.setAttribute('data-cms-page', '모든 페이지'); fab.setAttribute('data-cms-bar', '');
    }
    if (EDIT && /#helper$/.test(location.hash)) setTimeout(function () { var b = fab.__cmsBtn; if (b) b.click(); }, 1500);
    css();
  }

  /* ---------- 7. 바깥에서 쓰는 것 (wear-cms.js 의 helper 어댑터) ---------- */
  window.WEAR902_HELPER = {
    config: config,
    // 화면 관리 게시판 글을 읽었을 때 : 설정을 바꾸고 이름 · 버튼 글자도 새로
    setBoardConfig: function (o) {
      boardCfg = o; synMap = null;
      var c = config();
      if (fab) fab.setAttribute('aria-label', c.name || BASE.name);
      if (root) { root.querySelector('.wh-title b').textContent = c.name || BASE.name; root.querySelector('.wh-title small').textContent = c.hours ? '상담 ' + c.hours : ''; }
    },
    // [이 질문 가르치기] 로 넘긴 질문 (편집 창 초안 끝에 새 칸으로 붙는다)
    takeTeach: function () { var q = get(TEACH_KEY, 'sessionStorage'); try { store('sessionStorage').removeItem(TEACH_KEY); } catch (e) {} return q; },
    open: function () { toggle(true); },
    ask: function (t) { toggle(true); ask(t); },
    answer: function (t) { return loadAll().then(function () { return answer(t); }); }
  };

  /* ---------- 8. 디자인 (흑백 · Pretendard, 사이트 톤) ---------- */
  function css() {
    if (document.getElementById('wh-css')) return;
    var s = document.createElement('style'); s.id = 'wh-css';
    s.textContent = [
      '.s9-float__btn--helper{background:#111;border-color:#111;color:#fff;cursor:pointer;padding:0}',
      '.wh-open .s9-float__btn--helper{background:#fff;color:#111;border-color:#ededed}',
      '.wh-fab-solo{position:fixed;right:16px;bottom:16px;z-index:990;width:52px;height:52px;border-radius:50%}',
      '.wh{position:fixed;right:clamp(12px,1.6vw,24px);bottom:calc(clamp(16px,2vw,32px) + 62px);z-index:1001;width:376px;height:min(620px,calc(100vh - 140px));display:flex;flex-direction:column;',
      'background:#fff;color:#111;border:1px solid #ededed;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.18);overflow:hidden;font:14px/1.6 Pretendard,"Pretendard Variable",system-ui,sans-serif;letter-spacing:-.01em}',
      '.wh[hidden]{display:none}',
      '.wh-head{display:flex;align-items:center;gap:4px;padding:16px 12px 14px 20px;border-bottom:1px solid #ededed}',
      '.wh-title{flex:1;min-width:0}.wh-title b{display:block;font-size:16px;font-weight:700}.wh-title small{display:block;font-size:12px;color:#707070;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.wh-icon{width:36px;height:36px;border:0;border-radius:50%;background:none;color:#111;display:flex;align-items:center;justify-content:center;cursor:pointer}.wh-icon:hover{background:#f5f5f5}',
      '.wh-edu{padding:10px 16px;background:#111;color:#fff;font-size:12px;line-height:1.5}.wh-edu button{margin-left:6px;padding:3px 10px;border:1px solid #fff;border-radius:999px;background:#fff;color:#111;font:600 12px/1.4 inherit;cursor:pointer}',
      '.wh-log{position:relative;flex:1;overflow-y:auto;padding:16px 16px 8px;overscroll-behavior:contain;background:#fff}',
      '.wh-msg{display:flex;flex-direction:column;align-items:flex-start;margin:0 0 12px;animation:wh-in .25s cubic-bezier(.16,1,.3,1)}',
      '@keyframes wh-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
      '.wh-msg--me{align-items:flex-end}',
      '.wh-bubble{max-width:86%;margin:0;padding:10px 14px;border-radius:16px 16px 16px 4px;background:#f5f5f5;word-break:keep-all;overflow-wrap:anywhere}',
      '.wh-msg--me .wh-bubble{border-radius:16px 16px 4px 16px;background:#111;color:#fff}',
      '.wh-bubble a{color:inherit;text-decoration:underline}',
      '.wh-links{display:flex;flex-direction:column;gap:6px;width:86%;margin-top:8px}',
      '.wh-link{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid #111;border-radius:12px;color:#111;text-decoration:none;font-weight:600;font-size:13px}.wh-link:hover{background:#111;color:#fff}',
      '.wh-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-width:100%}',
      '.wh-menu{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:10px}',
      '.wh-card{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:1px solid #ededed;border-radius:14px;background:#fff;color:#111;text-align:left;font:inherit;cursor:pointer;transition:border-color .2s,background .2s}',
      '.wh-card:hover{border-color:#111}.wh-card:active{background:#f5f5f5}',
      '.wh-card__ic{flex:none;width:38px;height:38px;border-radius:50%;background:#f5f5f5;display:flex;align-items:center;justify-content:center}',
      '.wh-card__t{flex:1;min-width:0}.wh-card__t b{display:block;font-size:14px;font-weight:700}.wh-card__t small{display:block;font-size:12px;color:#707070;line-height:1.45}',
      '.wh-card__go{flex:none;font-size:20px;color:#9a9a9a}',
      '.wh-qs{display:flex;flex-direction:column;width:100%;margin-top:10px;border:1px solid #ededed;border-radius:14px;overflow:hidden}',
      '.wh-q{display:block;width:100%;padding:12px 16px;border:0;border-top:1px solid #ededed;background:#fff;color:#111;text-align:left;font:500 14px/1.45 inherit;cursor:pointer}.wh-q:first-child{border-top:0}.wh-q:hover{background:#f5f5f5}',
      '.wh-q::before{content:"Q";margin-right:8px;font-weight:700;color:#9a9a9a}',
      '.wh-chips.is-next .wh-chip:last-child,.wh-chips.is-home .wh-chip:last-child{border-color:#111;background:#111;color:#fff}',
      '.wh-chip{padding:7px 12px;border:1px solid #d6d6d6;border-radius:999px;background:#fff;color:#111;font:500 13px/1.3 inherit;cursor:pointer}.wh-chip:hover{border-color:#111}',
      '.wh-chips.is-start .wh-chip{font-weight:600}',
      '.wh-typing{display:flex;gap:4px;padding:14px}.wh-typing i{width:6px;height:6px;border-radius:50%;background:#9a9a9a;animation:wh-dot 1s infinite}.wh-typing i:nth-child(2){animation-delay:.15s}.wh-typing i:nth-child(3){animation-delay:.3s}',
      '@keyframes wh-dot{0%,80%,100%{opacity:.3;transform:none}40%{opacity:1;transform:translateY(-3px)}}',
      '.wh-teach{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px;font-size:11px;color:#707070}.wh-teach button{padding:3px 10px;border:1px dashed #111;border-radius:999px;background:#fff;color:#111;font:600 11px/1.4 inherit;cursor:pointer}',
      '.wh-form{display:flex;gap:8px;padding:12px;border-top:1px solid #ededed}',
      '.wh .wh-form #wh-in{flex:1;min-width:0;width:auto;height:44px!important;margin:0;padding:0 16px!important;border:1px solid #ededed!important;border-radius:999px!important;background:#f5f5f5!important;box-shadow:none!important;outline:none!important;-webkit-appearance:none;appearance:none;font:16px/1.4 inherit;color:#111}.wh .wh-form #wh-in:focus{border-color:#111!important;background:#fff!important;box-shadow:none!important}',
      '.wh-form button{flex:none;width:44px;height:44px;border:0;border-radius:50%;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}',
      '.wh-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
      '@media (max-width:640px){.wh{inset:0;width:auto;height:auto;border-radius:0;border:0}.wh-open body{overflow:hidden}.wh-head{padding-top:max(14px,env(safe-area-inset-top))}.wh-form{padding-bottom:max(12px,env(safe-area-inset-bottom))}}',
      '@media (prefers-reduced-motion:reduce){.wh-msg{animation:none}.wh-typing i{animation:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  // 본문 맨 끝(플로팅 버튼 다음)에서 불러오므로 바로 단다 — wear-cms.js 가 DOMContentLoaded 에 영역을 훑기 전에 버튼이 있어야 한다
  if (document.getElementById('s9Float') || document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
}());
