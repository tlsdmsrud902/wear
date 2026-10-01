# wear902 (여성 의류) 리뉴얼 작업 기록 — 2026-10-01

`신규 스킨 작업.md` 절차(A. 내 PC 코드 1 ~ 8)에 따라 food902(식품) 스킨을 여성 의류 쇼핑몰 **wear902** 로 바꾼 기록.
브랜드 이름은 **임시로 `wear902`** 다. 정식 이름이 정해지면 화면 글자(`wear902`)와 로고 이미지만 다시 바꾼다.

| 항목 | 값 |
|---|---|
| 카페24 계정 (mall_id) | `wear902` (`https://wear902.cafe24.com`) |
| GitHub 저장소 | `tlsdmsrud902/wear` |
| 스킨 폴더 | `wear902_s2_260925195134_d_skin1_E/skin1` |
| 디자인 코드 · 번호 | `base` · `1` (`ez/ez-settings.json`) — 새 계정 기본값. 다르면 고친다 |
| 이미지 서버 번호 | **아직 모름** → 코드에는 `PG_NUMBER` 그대로. `docs/pack.py` 가 복구 파일을 만들 때 넣어 준다 |
| 이미지 폴더 | `SkinImg/wear/` (파일업로더 폴더도 `wear` 로 만든다) |
| 코드 이름 | 클래스 `wear-*`, 전역 변수 `WEAR902_*`, 페이지 `/wear/guide.html`, 게시판 편집 이벤트 `wear902:cms` |

## 1. 이름 · 경로 바꾸기
- `git mv` : `food902_…` → `wear902_…`, `food/` → `wear/`, `SkinImg/food/` → `SkinImg/wear/`, `food-*.css/js` → `wear-*`, `food902-designcenter-*` → `wear902-designcenter-*`, `designcenter/food902` → `designcenter/wear902`
- 일괄 치환 : `node docs/tools/rebrand-wear.js` (이미 실행함)
  - food902 → wear902, `FOOD902_` → `WEAR902_`, food → wear, 옛 이미지 이름 → 새 이미지 이름
  - 분류 키 : `fresh` → `outer`, `meal` → `tops`, `bakery` → `dress` (HTML · CSS · JS · 가이드 앵커 `#outer` `#tops` `#dress`)
  - ⚠ `meals` 를 `looks` 로 바꾸면 원래 있던 "장면 속 상품"(`#cz-looks`)과 이름이 겹친다 → 메인 3번 섹션은 `cz-styles` 로 바꿨다 (스크립트도 `styles` 로 고쳐 둠)
- 스타일 찾기 선택지 값 : `morning/light/dinner` → `office/weekend/special` (출근길 · 주말 나들이 · 특별한 약속)

## 2. 이미지 (`node docs/tools/wear-images.js`, ffmpeg · playwright 필요)
**받은 패션 사진이 없어서** 옷 일러스트(옷걸이 · 행거 · 아치 벽 · 화분)를 그려 자리를 채웠다. 사람 · 상표 없음.
- 가로 장면 1672×941 `scene-*` 14개 + 히어로 포스터 1920×1080, 정사각 1254 `sq-*` 12개, 세로 카드 1086×1448 `card-*` 2개, 세로 1122×1402 `portrait-*` 2개
- 글자 로고 `logo-wear902.webp`(560×200) · 하단 큰 글자 `wordmark-wear902.webp`(2146×724), 배경 투명
- 상품 이미지 `cafe24-assets/products/p01~p30.jpg` (800×800) — `products.json` 의 `draw` (옷 종류 · 색)로 그린다
- **실제 사진으로 바꾸기** : 저장소 루트 `photos/` 에 만들 이름 그대로 넣고(예: `photos/scene-coat.jpg`, `photos/p01.jpg`) 다시 실행 → 그 이름만 사진으로 바뀐다 (가운데 기준으로 크기에 맞춰 자름).
  `photos/` 는 `.gitignore` 에 있다 (jsDelivr 50MB 제한)
- 부분만 : `node docs/tools/wear-images.js skin|products|logo`
- 식품 영상(`video/hero-food902.mp4`)은 지웠다. 메인 1번 장면은 `<video>` 에 주소 없이 포스터(사진)만 나온다. 영상이 생기면 `?edit=1` → 첫 화면 [고치기] → "영상 주소"

## 3. 분류 · 메뉴
| 번호 | 분류 | 목록 배너 키 |
|---|---|---|
| 28 | 전체 상품 | all |
| 24 | 아우터 (코트 · 트렌치 · 재킷 · 가디건 · 베스트) | outer |
| 25 | 상의 (셔츠 · 블라우스 · 니트 · 티셔츠) | tops |
| 26 | 원피스/스커트 (원피스 · 스커트 · 팬츠 · 가방 · 머플러) | dress |
| 27 | SALE | (세일 전용 화면) |

새 카페24 계정의 기본 샘플 분류(24 Outerwear · 25 Tops · 26 Dresses · 27 Bottoms · 28 Accessories)와 번호가 같다 → **이름만 바꾸면 된다.**

## 4. 문구 · 화면에서 바뀐 것
- 메인(`index.html`) : 히어로 3장면(새 시즌 · 아우터 · 데일리 상의), 스타일 고르기(아우터 · 상의), 카테고리 8개(니트 · 코트 · 스커트 · 셔츠/블라우스 · 데님/팬츠 · 원피스 · 액세서리 · 가디건), 스타일 찾기, **사이즈 가이드**(재킷 그림 + 어깨너비 · 가슴단면 · 총장), 장면 속 상품 4장면, 기획전(선물 · 세일), 옷장 체크리스트, 스타일 노트, FAQ(배송 · 사이즈 · 선물 · 교환/반품), 하단 브랜드, 이벤트 팝업
- `wear/guide.html` : 가이드 4장 — 옷장 정리 · 아우터 고르기 · 니트/셔츠 관리 · 원피스/스커트 코디
- `wear/submenu-hero.html` : 목록 배너 문구 · 사진, 검색어 → 배너 연결(코트 → 아우터 등)
- `store-content.js` : 세일 페이지 문구 · 타일 · 사진 설명, 저널, 리뷰 안내
- `product/list.html` : 세일 화면 기본 글자, 쿠폰 카드 사진 설명
- `layout.html` `<title>`, `header.html` 띠배너 · 메뉴, 디자인센터 상세페이지 3개 + `designcenter/wear902/detail-source.html`, `manual-cms/build.js`(다시 빌드)
- 색 : 올리브 · 테라코타 → 차콜 · 로즈우드 (`--cz-ink:#2c2926`, `--cz-accent:#a5584f`, 배경 `#f8f5f1`)
- **기능은 그대로** : 편집 모드(`data-cms*`), 쿠폰 뽑기, 타임세일, 가로 스크롤, 장면 속 상품 레이어, 포토리뷰

## 5. 샘플 상품 · 리뷰
- `cafe24-assets/products/products.json` : 30개 (24 · 25 · 26 각 10개, `retail` 이 있는 10개는 SALE(27)에도). `group` rec/new/best 각 10개
- `product_no_temp` 는 임시 번호(p01 = 12 …). food902 · 샘플몰에서는 실제 번호가 **임시 − 1**(p01 = 11) 이었으므로
  메인 "장면 속 상품" `data-prd` · `#cz-looks-data` 는 처음부터 **p01 = 11 … p30 = 40** 으로 넣었다. 등록 후 다르면 한 패스로 바꾼다
- `cafe24-assets/reviews.json` : 상품마다 1개, 30개. 올릴 때 제목 앞에 **[연출 예시]**

## 6. 로컬 미리보기
`node docs/tools/serve.js` → http://localhost:8765 (`/`, `/product/list.html?cate_no=24`, `?cate_no=27`, `/wear/guide.html`)
확인 결과 : PC · 모바일 메인, 아우터 목록, 세일, 가이드 모두 깨진 이미지 0, 옛 단어(식품 · 식탁 · 신선 · 밀키트 …) 0. (jQuery 오류는 카페24 서버에서만 채워지는 스크립트라 정상)

## 7. 남은 일 (카페24 관리자 — wear902 계정)
1. 파일업로더에 `wear` 폴더 만들고 `SkinImg/wear/*.webp` 33개 + `SkinImg/wear/designcenter/*.svg` 올리기 → **이미지 주소의 `pg…` 번호 확인**
2. 디자인 백업 → `python3 docs/pack.py <백업.tar.gz> <pg번호>` → 디자인 복구 (처음 한 번만)
   (`pack.py` 는 wear902 · `SkinImg/wear/` 기준으로 고쳐 둠)
3. 분류 이름 변경 : 24 아우터 · 25 상의 · 26 원피스/스커트 · 27 SALE · 28 전체 상품 (하위 29 ~ 41 미진열)
4. 상품 30개 등록 · 사진 **파일 업로드** · 메인 진열(2 추천 · 3 신상품 · 4 추가카테고리1)
5. 실제 상품번호가 11 ~ 40 이 아니면 `data-prd` · `#cz-looks-data` 교체
6. 리뷰 30개 [연출 예시] 등록, 게시판 2번 · 3번 `is_using_board` · `use_board` 켜기
7. **세일 쿠폰** : `store-content.js` 의 `coupons[].no` 4개는 **food902 쿠폰 번호** 그대로다 → wear902 에서 쿠폰 4종(발급일로부터 7일, 상품상세 노출안함)을 만들고 번호 교체, `layout.html` 의 `store-content.js?v=` 올리기
8. Easy 편집기 확인, 카카오 채널 주소
9. 디자인센터 상세 이미지(`designcenter/wear902/detail-*.jpg`) · 설명서 캡처(`manual-cms/shots`)는 식품 화면이라 지웠다 → 실제 쇼핑몰이 열린 뒤 `docs/tools/designcenter/*` · `manual-cms` 도구로 다시 찍는다
10. 실제 옷 사진을 받으면 `photos/` 에 넣고 `node docs/tools/wear-images.js` → 파일업로더에는 **새 파일 이름**으로 (CDN 캐시)

## 8. 도구
| 도구 | 하는 일 |
|---|---|
| `docs/tools/rebrand-wear.js` | food902 → wear902 일괄 치환 (이미 실행함) |
| `docs/tools/wear-images.js` | 일러스트 / `photos/` 사진 → 스킨 webp · 상품 jpg · 글자 로고 |
| `docs/tools/serve.js` | 로컬 미리보기 |
| `docs/pack.py` | 디자인 복구 파일 |
| `docs/tools/rebrand-food.js`, `docs/food902 작업 기록.md` | 바로 전 프로젝트(food902) 기록 — 참고용 |

## 9. 카페24 관리자 작업 (2026-10-02 실제 진행)
| 항목 | 결과 |
|---|---|
| 사진 교체 | 루트 모델 사진 25장 → 스킨 이미지 32개(`docs/tools/wear-photos.sh`) · 상품 이미지 30개(`docs/tools/wear-product-photos.js`). 일러스트는 로고 · 큰 글자만 남음. alt 도 사진 내용으로(`wear-photo-alts.js`) |
| 색 | 베이지 · 올리브 → 화이트 바탕 · 잉크 `#17131a` · 마젠타 `#d81b60` · 코발트 · 라일락/핑크 파스텔 (`docs/tools/wear-colors.js`) |
| 이미지 서버 번호 | **`pg3434b74016291004`** → 파일업로더 `wear/` 에 webp 33개 (주소 모두 열림). `designcenter/*.svg` 는 아직 안 올림 (디자인센터 상세용) |
| 분류 | 24 아우터 · 25 상의 · 26 원피스/스커트 · 27 SALE · 28 전체 상품 (하위 29 ~ 41 은 그대로) |
| 상품 | 30개, **11 ~ 40번** (p01 = 11). 사진 파일 업로드까지 한 번에, 진열 2/3/4 각 10 |
| 디자인 복구 | 백업 `wear902_s2_261002002303_d_base_E.tar.gz` → `pack.py` (링크 51 · 교체 496 · 추가 38) → `deploy` 브랜치 → 복구. 다음 수정은 코드 편집기로 |
| 리뷰 | 30개 [연출 예시] · 별점 5 · 그 상품 사진, 상품마다 1개 연결 (글 2 ~ 31, 글 n = 상품 n+9). 메인 카드 30개 "리뷰 1", 포토리뷰 8 |
| 게시판 | 2번 뉴스/이벤트 · 3번 FAQ `is_using_board` · `use_board` 켬 |
| 쿠폰 | **50% 쿠폰 1개만 생성** (발급일로부터 7일 · 상품상세 노출안함 · 선착순 10). 20% · 10% · 5% 는 권한 검사에서 막혀 사람이 만든다 |

### 리뷰가 상품에 안 붙었던 문제
- **기본 스킨 상태**에서 글쓰기 화면에 `product_no` 를 넣고 올리면 상품 연결 없이 저장됐다 (목록의 상품 링크가 `/`).
- 우리 스킨 적용 뒤 **수정 화면** `/board/product/modify.html?board_act=edit&no=글&board_no=4&product_no=상품` 에서 `product_no` · 본문을 다시 넣고 [수정] → 연결됨.
- → 다음부터는 **디자인 복구(스킨 적용)를 먼저 하고 리뷰를 올린다.**

### 남은 일
1. 쿠폰 20% · 10% · 5% 만들기 → 쿠폰 4개 번호를 코드 편집기에서 `store-content.js` 의 `coupons[].no` 에 넣고 `layout.html` 의 `store-content.js?v=` 올리기 (로컬도 같이)
2. 회원 계정으로 세일 페이지 쿠폰 뽑기 테스트
3. Easy 편집기 열리는지 확인, 분류 29 ~ 41 미진열(선택)
4. "장면 속 상품" 핫스팟(+) 위치는 일러스트 기준이라 사진 속 옷과 안 맞을 수 있다 → `?edit=1` 이나 `#cz-looks-data` 로 조정

## 10. 톤 정리 · 쿠폰 · 샘플 사이트 처리 (2026-10-02)
- 색 : 화이트 바탕 + 블랙 · 그레이 모노톤, 포인트 색 없음 (`docs/tools/wear-clean.js`, seraphin `--st-bg` 웜 아이보리 → `#ffffff`). 카카오 버튼만 노랑
- 하단 큰 글자 : `wordmark-wear902-v2.webp` (연회색 #d4d4d4, 파일업로더에도 새 이름으로)
- 쿠폰 4종 생성 완료 → `store-content.js` 번호 반영, `?v=20261002a`
  | 쿠폰 | 번호 |
  |---|---|
  | 50% | 6086396893100006746 |
  | 20% | 6086397023800006748 |
  | 10% | 6086397026400006750 |
  | 5% | 6086397028300006751 |
- 샘플 사이트라 푸터 고객센터 전화 · 이메일과 회사소개 전화에 `.wear-blur`(blur 5px). 실제 판매용이면 `wear-cozy-global.css` 맨 아래 줄과 `footer.html` · `shopinfo/company.html` 의 `wear-blur` 를 지운다
- 반영 : 2차 디자인 복구(새 백업 이름 `…261002005038…`, 원본은 1차 백업 재사용) + 코드 편집기(index.html · seraphin.css · st-world.css · seraphin.js · layout.html)

## 11. 히어로 1번 영상 (2026-10-02, Google Flow)
- Flow 에이전트에 Veo 3.1 Lite 8초 영상 5개 요청 (50 크레딧 = 하루 무료분 전부). 카메라 워크를 모두 다르게 :
  1 파리 돌길 트렌치 — 트래킹 · 2 화이트 스튜디오 실크 슬립 — 오빗 · 3 카페 창가 니트 — 돌리 인 · 4 유리 빌딩 블랙 수트 — 틸트 업 · 5 바닷가 데크 화이트 린넨 — 크레인 다운
- 원본 : `_deploy/flow/wear/1-paris … 5-beach.mp4` (720p). 파리 컷은 5초에 장면이 튀어서 0 ~ 4.5초만, 해변은 4.4초까지만
- 편집 : 파리 → 카페 → 스튜디오 → 빌딩 → 해변, 각 4.4 ~ 4.5초, 0.6초 디졸브(`xfade fade`) 4번 → **정확히 20초**. 가운데 94% 로 잘라 Veo 워터마크 제거, 1280×720 · H.264 CRF 23 · faststart · 소리 없음 → 4.5MB
- 넣기 : `video/hero-wear902.mp4` → `https://cdn.jsdelivr.net/gh/tlsdmsrud902/wear@d6f4d7e/video/hero-wear902.mp4`, 포스터는 첫 프레임 `hero-wear902-poster-v2.webp` (파일업로더에도). 실제 쇼핑몰은 코드 편집기로 index.html 만 고침

## 12. 디자인센터 샘플몰 · 상세페이지 (2026-10-02, `2. 샘플쇼핑몰 등록 및 디자인 상품등록 방법.md` 순서)
| 항목 | 결과 |
|---|---|
| 샘플몰 | **`ecudemo409091`** (파트너 계정 `wear902`, 2026-10-02 생성 · 90일) |
| 파일업로더 | `wear/` 폴더에 webp 34개 → `https://ecudemo409091.cafe24.com/wear/<파일>` (모두 열림) |
| 디자인 복구 | 백업 `ecudemo409091_s2_261002013003_d_base_H.tar.gz` → `pack.py <백업> https://ecudemo409091.cafe24.com/wear/ ecudemo409091` (링크 51 · 교체 402 · 그대로 51 · 추가 132). **GitHub `deploy-demo` 대신 Chrome 확장의 파일 넣기로 바로 올림** — 이때 파일 형식이 `application/octet-stream` 이라 "파일 압축 형식이 다릅니다" → `application/x-gzip` 으로 다시 감싸서 넣으니 복구됨 |
| 분류 · 상품 | 24 아우터 · 25 상의 · 26 원피스/스커트 · 27 SALE · 28 전체 상품 / 상품 30개 **11 ~ 40번** (이름 · 사진 30/30 확인) |
| 리뷰 | 30개 [연출 예시] · 별점 5 · 사진, 상품마다 1개 (스킨 복구 뒤에 올려서 상품 연결 정상) |
| 게시판 | 2 · 3번 켬 |
| 쿠폰 | 50% `6086397401300000088` · 20% `…089` · 10% `…090` · 5% `…091` (발급일로부터 7일 · 상품상세 노출안함 · 10/30/100/300장) → 샘플몰 `store-content.js` 만 교체, `?v=20261002s` |
| 확인 | 메인 깨진 이미지 0 (빈 `cz-qv__img` 하나는 빠른보기 자리), 영상 재생, 카드 30 · "리뷰 1" 30, 장면 속 상품 10/10, Easy `mall_id` 샘플몰 · base · 1 |
| 남은 일 (사람) | 샘플몰 **대표 전화** 넣고 쇼핑몰명 `wear902` (지금 탭 제목 "쇼핑몰 이름") |

### 고친 것 (로컬 · 샘플몰 둘 다)
- **[고치기] 버튼 글자가 안 보임** : `wear-modern.css` 의 `#lw-home button{color:inherit}` 가 `.cms-btn{color:#fff}` 를 이겨서 검은 버튼에 검은 글자 → `wear-cms.js` 에 `#lw-home .cms-btn{color:#fff}` 추가, 편집 막대 안내 "주황 버튼" → "[고치기] 버튼". `wear-cms.js?v=20261002c`
- 사이즈 가이드 칸 이름 `바르는 법`(화장품 스킨에서 온 이름) → `재는 법` (`index.html`)
- ⚠ 실제 쇼핑몰(wear902.cafe24.com)에는 아직 반영 안 함 → 코드 편집기로 `wear-cms.js` · `layout.html` · `index.html` 같은 수정

### 상세페이지 만들기 — 이번에 바뀐 방법
- 편집 창 HTML 을 콘솔 결과로 돌려받는 방법(10-2)은 **Chrome 확장이 막았다** ("Cookie/query string data"). 그래서
  1. 칸 이름만 받아 `_deploy/dc/labels.json` → `walk.js` 가 화면 쪽만 찍는다 (editors.json 이 없으면 자동으로 이 방식)
  2. 편집 창은 로그인한 탭에서 글쓰기 화면을 열고 편집 창만 남긴 뒤(배지 · 아래 칸 숨김) `zoom` 캡처를 780×863 조각으로 저장 → `docs/tools/designcenter/stitch-editor.js` 로 이어 붙임 (`_deploy/dc/edit-pieces.txt` 에 조각 · 스크롤 위치)
- `walk.js` : 첫 화면 다음부터 고정 머리글을 숨김 (섹션 제목을 덮던 문제)
- `docs/tools/designcenter/wear-detail.js` : 식품 문구 정리 + 상세페이지 색을 흑백으로 (빨간 번호 배지만 남김) → `_deploy/dc/detail.html`
- 조각 30장 · 등록 이미지 3장 → `designcenter/wear902/` (커밋 `331a510`), 상세소개 HTML `designcenter/wear902/product-content.html`
- 주문서 접수 폼 주소는 **food902 때 것 그대로** — wear902 용 폼이 따로 있으면 `content-html.js` 의 `FORM` 과 상세 HTML 을 바꾼다

### 파트너센터 등록 (임시저장) — 상품코드 **PTMD879076**
| 칸 | 값 |
|---|---|
| 카테고리 · 상품명 | 236 패션의류 · **WEAR902** |
| 구분 · 유형 · 레이아웃 | 반응형(R) · 단일상품 `KR\|1` [PC]쇼핑몰 기본디자인 · LO1W |
| 스타일 · 색 | 심플 · 모던 / 흰색 · 회색 · 검정색 |
| 태그 10 | 패션 · 여성의류 · 아우터 · 원피스 · 니트 · 모노톤 · 반응형 · 쿠폰뽑기 · 타임세일 · 패션영상 |
| 옵션 | 단순복사 1일 250,000 / 원본제공 판매 안 함 / 커스터마이징 5일 430,000 (상단 메뉴 추가 · 메인 페이지 텍스트 수정 · 로고 변경 · 메인 롤링 이미지 변경 · 팝업기능 수정 각 1회) |
| 상세 · 이미지 | `product-content.html`(조각 30, jsDelivr @331a510) · 대표 · 진열 · 썸네일 → `dcenter-img.cafe24.com` 에 저장 확인 |
- 주문서 폼은 기존(food902) 폼 그대로 쓰기로 함 (사용자 확인)
- ⚠ 태그 칸 : Chrome 창이 **숨김 상태**면 페이지 타이머가 느려져 Enter 처리 · 스크립트가 겹친다. 태그는 `input.js-tag` 마다 하나씩, Enter(keydown keyCode 13)를 보내면 새 칸이 비동기로 생긴다 → 새 칸이 생길 때까지 기다린 뒤 값 넣기
- 심사요청은 안 함 (사람 확인 후)

### 샘플몰 쇼핑몰 정보 (미완료)
- `/admin/php/shop1/m/company_info_f.php` 는 주소창으로 열면 쇼핑몰로 돌아간다 → 관리자 화면에서 iframe 으로 연다
- 저장에 필요한 칸이 많다 : 수신전용 · 발신전용 · 상담/주문 이메일, 개인정보보호 책임자(이름 · 연락처 · 이메일), 사업장 주소, **인증번호 · 대표 휴대전화 · 대표 이메일**(본인 인증) → 사람이 직접

### 같은 첫 화면이 반복되던 문제 (2026-10-02 수정, 임시저장 다시)
- 메인 첫 화면(트렌치 모델) 캡처가 등록 이미지 3장 + 상세 위쪽 예시 3장에 되풀이돼 있었다
- 등록 이미지 : 대표 = PC 첫 화면 + 휴대폰 아우터 목록, 진열 = 휴대폰 SALE, 썸네일 = 휴대폰 「스타일 고르기」 (`dcshot.js` · `listing-images.py`)
- 상세 「먼저 딱 한 번 해 볼까요?」 예시 → **SALE 큰 화면** (`manual-shoot.js` 의 `sale-edit` · `sale-after`, 편집 창 `shots/sale-editor.jpg`). 첫 화면은 01번 섹션 설명에만 남김
- 조각 · 이미지 커밋 `db9fc6b`, 상세 HTML `b80ef5c` → PTMD879076 에 다시 임시저장 (상세 · 이미지 3장 교체 확인)
- 파트너센터 등록 화면은 주소를 직접 만들면 sampleCode 가 달라 대시보드로 튕긴다 → 샘플사이트 목록의 상품명 링크로 연다
