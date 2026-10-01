# eppum (K-뷰티) 리뉴얼 작업 기록 — 2026-09-29

`신규 스킨 작업.md` 절차(A. 내 PC 코드)에 따라 PETPIA(펫) 스킨을 K-뷰티 쇼핑몰 **eppum** 으로 바꾼 기록.

| 항목 | 값 |
|---|---|
| 카페24 계정 (mall_id) | `eppum902` (`https://eppum902.cafe24.com`) |
| 스킨 폴더 | `eppum902_s2_260925195134_d_skin1_E/skin1` |
| 디자인 코드 · 번호 | `base` · `1` (`ez/ez-settings.json`) |
| 이미지 서버 번호 | `pg3424b68273970037` (파일업로더 주소 `https://ecimg.cafe24img.com/pg3424b68273970037/eppum902/beauty/…`) |
| 이미지 폴더 | `SkinImg/beauty/` (파일업로더 폴더도 `beauty` 권장) |
| 코드 이름 | 클래스 `beauty-*`, 전역 변수 `EPPUM_*`, 페이지 `/beauty/guide.html` |

## 1. 이름 · 경로 바꾸기
- `git mv` : `adia902222_…` → `eppum902_…`, `pet/` → `beauty/`, `pet-*.css/js` → `beauty-*`, `petpia-designcenter-*` → `eppum-designcenter-*`
- 일괄 치환 : `node docs/tools/rebrand-eppum.js` (PETPIA_ → EPPUM_ 먼저, 그다음 PETPIA → eppum, pet → beauty, pets → routines, 옛 이미지 이름 → 새 이미지 이름)
- 상품분류 "전체 상품" 번호 : `42` → `28` (새 계정 기본 대분류 번호 사용)

## 2. 새 이미지 (`python3 docs/tools/eppum-images.py`, Pillow 필요)
저장소 루트의 새 사진으로 `SkinImg/beauty/*.webp` 와 상품 이미지 `cafe24-assets/products/p01~p30.jpg` 를 만든다.
- 가로 장면 1672×941 `scene-*`, 정사각 1254 `sq-*`, 세로 카드 1086×1448 `card-*`, 세로 1122×1402 `portrait-*`
- 글자 로고 `logo-eppum.webp`(560×200) · 하단 큰 글자 `wordmark-eppum.webp`(2146×724), 배경 투명
- **쓰지 않은 사진** : `Designer_perfume_bottle…`(실제 향수 브랜드 간판), `Beauty_store_shelf…`(실제 브랜드 제품 라벨), `Red_lipstick…` 은 로고가 없는 오른쪽 발색 부분만 사용

## 3. 분류 · 메뉴
| 번호 | 분류 | 목록 배너 키 |
|---|---|---|
| 28 | 전체 상품 | all |
| 24 | 스킨케어 | skincare |
| 25 | 메이크업 | makeup |
| 26 | 바디/헤어 | body |
| 27 | SALE | (세일 전용 화면) |

`store-content.js` 의 `menu.editorial: true` → `header.html` 의 고정 메뉴를 쓴다.

## 4. 메인 화면에서 바뀐 것
- 히어로 : 1번은 영상 자리 그대로(영상 주소가 비어 있으면 `scene-glow` 사진), 2 · 3번 `scene-botanical` · `scene-palette`
- "누구와 함께하나요(강아지·고양이)" → "어떤 루틴이 필요하세요(스킨케어·메이크업)"
- 취향 찾기 → 루틴 찾기 (루틴 × 보습/생기/지속력 → 검색어) : `beauty-cozy-home.js initFinder`
- 사이즈 가이드 → 3단계 루틴 가이드 (SVG 그림). 3D 보기 기능(initSize3D)은 그대로 두고, 모델 주소를 `data-size-3d-model` 로 넣게 바꿨다 (비어 있으면 SVG)
- 체크리스트 : 스킨케어 / 메이크업 (localStorage 키 `eppum-starter-v1`)
- 장면 속 상품 4장면 : `data-prd` 는 **임시 번호**(p01 = 12 … p30 = 41). 카페24 상품 등록 후 실제 번호로 교체
- `$count$count = 10` 오타 수정
- 색 : 로즈 · 누드 톤 (`--cz-accent:#a4505a`, 배경 `#fdf8f6`)

## 5. 샘플 상품 `cafe24-assets/products/products.json`
30개, `group` rec/new/best 각 10개, `cates` 에 27 이 있으면 SALE(정상가 `retail`). `product_no_temp` = 메인 장면 속 상품의 임시 번호.

## 6. 로컬 미리보기
`node docs/tools/serve.js` → http://localhost:8765 (`/`, `/product/list.html?cate_no=24`, `?cate_no=27`, `/beauty/guide.html`)

## 7. 남은 일
- ~~옛 펫 파일 삭제~~ : 완료 (`SkinImg/pet/`, `.recovery/`, 옛 메인 백업, `beauty-editorial.js`, `cafe24-assets` 의 펫 폴더, `manual/`, `manual-cms/`)
- 원하면 옛 기록 없이 새로 시작 (`신규 스킨 작업.md` 2-4)
- 카페24 관리자 작업 (B 단계 9 ~ 17) : 분류 이름 변경, 상품 30개 등록, 메인 진열, 파일업로더 `beauty` 폴더, 디자인 복구, `PG_NUMBER` 교체, 포토리뷰 [연출 예시]
- 디자인센터 상세페이지의 "구매 후 이렇게 바꿔요" 단계별 화면 캡처는 펫 화면이라 빼 두었다 → 실제 쇼핑몰 적용 후 새로 캡처해서 넣기

## 8. 디자인 복구 파일 (2026-09-29)
- 백업 : `eppum902_s2_260929203423_d_base_E.tar.gz` (카페24 기본디자인, 파일 496 · 폴더 77 · 바로가기 51)
- 만들기 : `python3 docs/pack.py <백업.tar.gz> pg3424b68273970037` → `_deploy/<백업과 같은 이름>.tar.gz` (git 제외)
- 결과 : 바로가기 51 그대로 · 교체 496 · 추가 38 · 0.62MB. 스킨 이미지는 빼고 파일업로더 주소로 바꿈
- 두 번째 복구부터는 새로 백업해서 **새 이름**으로 만든다 (같은 이름으로 복구하면 바뀌지 않음)

## 9. 도구 사용법 (다음 프로젝트에서 그대로 쓰기)
저장소 `tlsdmsrud902/k_eppum` 의 `docs/tools/` · `docs/pack.py`. 새 프로젝트에서는 브랜드 이름 · 폴더 이름 · 계정 아이디만 바꿔서 쓴다.

| 도구 | 하는 일 | 실행 |
|---|---|---|
| `docs/tools/rebrand-eppum.js` | 옛 브랜드 이름 · 아이디 · 경로 · 클래스 · 옛 이미지 이름 일괄 치환 | `node docs/tools/rebrand-eppum.js` |
| `docs/tools/eppum-images.py` | 새 사진 → 스킨 webp(가로 · 정사각 · 세로) + 상품 사진 p01~p30 + 글자 로고 | `pip install pillow` 후 `python3 docs/tools/eppum-images.py` |
| `docs/tools/serve.js` | 로컬 미리보기 (카페24 `{$…}` 변수는 예시 값으로 채움, 해외배송 창 숨김) | `node docs/tools/serve.js` → http://localhost:8765 |
| `docs/pack.py` | 디자인 복구 파일 (원본 바로가기 51개 유지, 이미지 주소 → 파일업로더) | `python3 docs/pack.py <백업.tar.gz> <pg번호>` |

## 10. 이번에 배운 점 (다음 프로젝트 체크리스트)
1. **기능은 지우지 않는다.** 사진 · 문구만 바꾼다. 이번에 3D 보기(`initSize3D`) · 첫 화면 영상 칸을 지웠다가 되살렸다. `?edit=1` 화면 편집 칸(`data-cms-*`)은 원본과 개수를 비교해 확인한다.
   ```bash
   c(){ grep -oE 'data-cms[a-z-]*' | sort | uniq -c; }
   diff <(git show <원본커밋>:<옛폴더>/skin1/index.html | c) <(c < <새폴더>/skin1/index.html)
   ```
2. **처음 요청할 때 "예전 파일 · 기록은 모두 지워도 된다"고 적는다.** 파일 삭제 · 기록 새로 시작(강제 푸시)은 확인 없이는 진행되지 않는다.
3. **실제 브랜드 이름이 보이는 사진은 쓰지 않는다.** (이번 : 향수 매장 간판, 매장 선반 라벨, 립스틱 로고)
4. **로컬 미리보기에 `{$…}` 가 보이는 건 정상** — 카페24 서버가 채우는 자리. 실제 쇼핑몰에서는 값으로 바뀐다. (최신 `serve.js` 는 예시 값으로 채움)
5. **WORLD SHIPPING 창** 은 카페24 해외배송 선택 기능. 실제 쇼핑몰에서는 버튼을 눌렀을 때만 뜬다. 로컬에서만 숨긴다.
6. **클라우드(웹) 세션은 카페24 접속이 막혀 있다.** 코드 · 이미지 · 복구 파일은 클라우드에서, 관리자 작업(분류 · 상품 · 리뷰 · 게시판 설정)은 PC 의 Claude 앱 세션(내장 브라우저)에서 한다.
7. **카페24 가입 직후 받을 것 두 가지** : 파일업로더 이미지 주소(`pg…` 번호) · 디자인 백업 파일(`…_d_base_E.tar.gz`). 이미지는 파일업로더 새 폴더(`beauty` 등)에 먼저 올린다.
8. **예시 리뷰는 제목에 [연출 예시]** 를 붙인다. 실제 후기처럼 보이게 만들지 않는다.

## 11. 진행 순서 요약 (eppum 기준, 실제로 걸린 순서)
1. 첨부 문서 + 새 사진 → 클라우드 세션에서 스킨 변경 · 이미지 생성 · 미리보기 (커밋 · 푸시)
2. 예전 파일 삭제 → 기록 새로 시작 (main 에 커밋 1개)
3. 카페24 가입 → 파일업로더 `beauty` 폴더에 이미지 41개 업로드 → 이미지 주소 전달
4. 디자인 백업 파일 전달 → `pack.py` 로 복구 파일 → 관리자 "디자인 복구" 로 적용
5. PC Claude 세션 : 분류 이름 변경(24~28) → 상품 30개 등록 · 사진 파일 업로드 → 메인 진열 → [연출 예시] 리뷰 → `?edit=1` 게시판(2번) 켜기
6. 실제 상품번호로 메인 "장면 속 그 상품" `data-prd` 교체 (코드 편집기)

## 12. 카페24 관리자 작업 — 상품 30개 · 리뷰 30개 등록 (2026-09-29, eppum902 실제 작업)

### 결과

| 항목 | 내용 |
|---|---|
| 상품 | 30개 등록 (상품번호 **11 ~ 40**). `products.json` 의 `product_no_temp`(12~41) 보다 **1 작다** |
| 상품 이미지 | 30개 모두 파일 업로드로 저장. 목록·상세 이미지 60개 주소 전수 확인 (60/60 열림) |
| 메인 진열 | 추천상품(2) 10 · 신상품(3) 10 · 추가카테고리1(4) 10 |
| 기본 샘플상품 | 9 · 10 번 진열 해제 (`is_display` = F) |
| 리뷰 | 상품 사용후기(board_no=4) **글 2 ~ 31**, 30개. 상품 11~40 에 1개씩 연결, 별점 5, 사진 = 그 상품 이미지(jsDelivr) |
| 리뷰 원고 | `cafe24-assets/reviews.json` (상품번호 · 제목 · 본문) |

### 상품번호 매핑 (실제)

`p01` = 11 · `p02` = 12 … `p30` = 40 (기존 샘플상품 9 · 10 다음 번호가 11 부터 시작)

### 등록 방법 (baby앙보다 빨라진 부분)

1. **상품 등록** : 상품 등록 화면에서 `p01` 한 개만 메뉴얼 스크립트로 저장한 뒤,
   그때 만들어진 **FormData 를 본으로 삼아** 이름 · 판매가 · 소비자가 · 분류 · 메인진열 · 상세설명만 바꿔 `fetch` 로 POST 했다.
   화면을 다시 열 필요가 없어 29개를 한 번에 등록했다. 분류는 폼에 이렇게 들어간다.
   ```
   addCategoryNum[]=  /  addCategoryNum[]=24  /  addCategoryNum[]=28
   category_product[group1][24]=T  /  category_product[group1][28]=T
   ```
   (`category_product[group1][#NUM#]` 은 템플릿 칸이라 그대로 남긴다. 일회용 토큰은 없다.)
2. **상품 이미지 · 리뷰** : 화면 기능(`IMAGE` · Froala)이 필요해서 **숨긴 iframe** 에 화면을 띄우고
   그 안에서 파일 넣기 · 저장을 돌렸다. 관리자 · 게시판 화면 모두 iframe 으로 열린다. (1건당 약 6초)
3. 오래 걸리는 작업은 `window.__prog` 같은 전역에 진행 상황을 쌓고 **바로 반환** 한 뒤 나중에 확인한다.
   (브라우저 콘솔 도구는 45초에서 끊긴다)

### 검증 방법

- 상품 : 관리자 상품 목록 "총 32개"(기존 2 + 30), 상품마다 `display_group[1][]` · `is_display` 확인 → 2/3/4 각 10개
- 이미지 : 분류 5개의 목록 화면 HTML 에서 `web/product/…jpg` 주소 60개를 뽑아 모두 `fetch` → 60/60 200
- 리뷰 : 게시판 목록 4쪽에서 글 30개 · 상품 연결 30개 · 제목 `[연출 예시]` 30개,
  글마다 `/exec/front/board/product/4?no=…&board_no=4&pass_check=F` 로 `point_count` = 5 · 본문에 `<img` 확인

### 아직 남은 일

1. **분류 이름** : 24~28 이 아직 카페24 기본 샘플 이름(`(대분류) Outerwear` 등)이다.
   → 관리자 → 상품 → 상품 분류 관리에서 24 스킨케어 · 25 메이크업 · 26 바디/헤어 · 27 SALE · 28 전체 상품 으로 바꾼다.
   (트리는 **사람이 직접 클릭** 해야 선택된다)
2. **메인 "장면 속 상품"** : `index.html` 의 `data-prd` 가 임시 번호 12 · 13 · 18 · 20 · 21 · 23 · 29 · 37 · 39 다.
   실제 번호는 **모두 1 작다** (11 · 12 · 17 · 19 · 20 · 22 · 28 · 36 · 38). `#cz-looks-data` 도 같이 바꾼다.
3. 스킨 반영 후 메인 "포토리뷰" 칸에서 사진이 보이는지 확인 (기본 스킨 상태에서는 칸 자체가 없다)

## 13. 분류 이름 · 게시판 켜기 (2026-09-30, eppum902)

### 상품 분류 이름 바꾸기 — 스크립트로 되는 방법

메뉴얼에는 "트리는 사람이 직접 클릭해야 한다"고 적혀 있었지만, **dynatree API 로 선택하면 스크립트로 된다.**

```js
// 상품 분류 관리 화면 (/disp/admin/shop1/product/categorymanage)
const tree = $.ui.dynatree.getNode(document.querySelector('.dynatree-contents')).tree;
tree.activateKey('24');                       // key = 분류번호. 이러면 오른쪽 폼이 채워진다
await sleep(1800);
const f = document.getElementById('eCategoryInfoForm');
f.category_name.value = '스킨케어';
['input','change','keyup','blur'].forEach(t => f.category_name.dispatchEvent(new Event(t,{bubbles:true})));
f.querySelector('[name="is_display[1]"][value=T]').checked = true;   // 진열함
document.getElementById('eSubmitBtn').click();                        // alert "분류정보가 저장되었습니다."
```

| 번호 | 바꾼 이름 | 진열 |
|---|---|---|
| 24 | 스킨케어 | O |
| 25 | 메이크업 | O |
| 26 | 바디/헤어 | O |
| 27 | SALE | O |
| 28 | 전체 상품 | O |
| 29 ~ 41 | (이름 그대로) 옛 패션 중·소·상세분류 | **X (미진열)** |

- 중·소분류 13개는 지우지 않고 **미진열**로만 바꿨다. 목록 화면 위의 `(중분류) Jackets …` 링크가 사라진다.
- 프론트 `/exec/front/Product/SubCategory` 는 **캐시가 남아 옛 이름이 한동안 보인다.** 확인은 관리자 트리나 실제 목록 화면(`/product/list.html?cate_no=24`)의 제목으로 한다.

### 게시판 — 이미 다 있고, "사용"만 꺼져 있었다

새 계정에는 게시판 13개가 **처음부터 다 만들어져 있다.** 없는 게 아니라 꺼져 있는 것이므로 **새로 만들면 안 된다.**
(새로 만들면 `board_no` 가 101 · 1001 · 3001 처럼 엉뚱한 번호로 붙어 스킨 링크와 안 맞는다)

관리자 화면 주소 : **게시판 관리 목록** `/admin/php/shop1/b/board_admin_l.php` · **게시판 설정** `/admin/php/shop1/b/board_admin_c.php?mode=modify&board_no=<번호>`
(`/disp/admin/shop1/board/boardmanage` 는 빈 화면이 나온다. 옛 `/admin/php/…` 주소를 써야 한다)

> ⚠ **값이 두 개다.** 목록의 "표시/표시 안함"(`use_board`) 만 켜면 화면에서 `선택하신 게시판은 사용할 수 없습니다.` 가 뜬다.
> **`is_using_board` = T** 도 같이 켜야 한다. (정상 게시판 1번과 폼 값을 통째로 비교해서 찾았다)

```js
// 게시판 설정 화면을 숨긴 iframe 에 띄우고
for (const n of ['is_using_board','use_board']) {
  const t = f.querySelector('input[name='+n+'][value=T]'); t.click(); t.checked = true;
  f.querySelector('input[name='+n+'][value=F]').checked = false;
}
if (!f.max_file_size.value || f.max_file_size.value === '0') f.max_file_size.value = '3';   // 첨부 용량이 0이면 저장이 막힌다
// 저장 버튼 : img[onclick*=check_submit] → 제출 데이터를 가로채 fetch 로 POST
```

이번에 켠 것 : **3 이용안내 FAQ**(커뮤니티 → 자주묻는질문) · **2 뉴스/이벤트**(`store-content.js` 의 `cms.boardNo` = 2, `?edit=1` 화면 편집이 쓰는 게시판)

### 새 계정 게시판 번호 (eppum902 실제)

| 번호 | 이름 | 상태 | 쓰는 곳 |
|---|---|---|---|
| 1 | 공지사항 | 사용 | 커뮤니티 → 공지사항 |
| 2 | 뉴스/이벤트 | **이번에 켬** | `?edit=1` 화면 편집 (`cms.boardNo`) |
| 3 | 이용안내 FAQ | **이번에 켬** | 커뮤니티 → 자주묻는질문 |
| 4 | 상품 사용후기 | 사용 | 리뷰 메뉴 · 메인 포토리뷰 · 상품 카드 |
| 5 | 자유게시판 | 사용 | 저널 섹션 더보기 |
| 6 | 상품 Q&A | 사용 | 커뮤니티 → 상품문의 |
| 7 | 자료실 | 꺼짐 | 기본 게시판 메인(`board/index.html`)에만 있음 — 안 써도 된다 |
| 8 | 갤러리 | 사용 | 기본 게시판 메인 |
| 9 · 101 · 1001 · 1002 · 3001 | 1:1 맞춤상담 · 상품자유 · 한줄메모 · 자유2 · 자유3 | 꺼짐 | 안 씀 |

### 확인

상단 메뉴의 분류 · 게시판 링크 16개를 모두 열어 `<title>` 확인 — 전부 정상
(전체 상품 · 스킨케어 · 메이크업 · 바디/헤어 · SALE · 리뷰 · 공지사항 · 자주묻는질문 · 상품문의)

## 14. 메인 "장면 속 상품" 번호 교체 · 남은 점검 (2026-09-30)

### data-prd 교체 (빠른 적용 순서 16번 앞단계)

`index.html` 의 `data-prd` 18곳과 `#cz-looks-data` 키 9개가 임시 번호였다. **실제 번호는 모두 1 작다.**

| 임시 | 실제 | 상품 |
|---|---|---|
| 12 | 11 | 로즈 & 알로에 보태니컬 세럼 |
| 13 | 12 | 비타C 울트라 글로우 세럼 |
| 18 | 17 | 래디언스 페이셜 오일 |
| 20 | 19 | 로즈 페탈 토너 |
| 21 | 20 | 알로에 수딩 젤 |
| 23 | 22 | 뉴트럴 에센셜 아이섀도 팔레트 |
| 29 | 28 | 소프트 메이크업 브러시 세트 |
| 37 | 36 | 세라믹 브러시 홀더 |
| 39 | 38 | 내추럴 페이셜 솝 |

- 로컬 · 실제 쇼핑몰(코드 편집기) 둘 다 고쳤다. 바꾼 줄은 28줄, **번호만** 바뀐 것을 줄 단위로 대조해 확인했다.
- 치환은 `12 → 11`, `13 → 12` 처럼 **번호가 서로 겹치므로** `sed` 로 순서대로 바꾸면 안 된다.
  매핑 표를 만들어 `data-prd="(\d+)"` 와 `"(\d+)":\{` 를 **한 번에 한 패스로** 바꿔야 한다.
- 확인 : 메인 HTML 을 다시 받아 9개 번호를 뽑고, 번호마다 관리자 상품 정보의 `product_name` 과 대조했다. (9/9 일치)

### 16. `?edit=1` 화면 편집 — 정상

- 실제 쇼핑몰 메인에 `beauty-cms.js` 가 올라가 있고 `data-cms*` 속성 320여 개가 살아 있다.
- `https://eppum902.cafe24.com/?edit=1` 에서 **[고치기] 버튼 18개** 확인 (첫 화면 · 장면 속 상품 · 체크리스트 · 이벤트 팝업 등).
- 저장이 들어가는 게시판은 `STORE_CONTENT.cms.boardNo` = **2 (뉴스/이벤트)**. 13장에서 켰고 화면도 열린다.

### 17. 스마트디자인 Easy — 정상

- 주소 : `/disp/admin/editor/ezstframe?skin_no=1&skin_code=base&shop_no=1`
  (관리자 → 쇼핑몰 디자인 설정 `/disp/admin/shop1/Manage/Index` → **디자인 편집**)
- "초기 설정 중 오류" 없이 열렸다. 서버의 `ez/ez-settings.json` 이 `mall_id: eppum902· skin_code: base· skin_no: 1` 로 맞고,
  `ez-product-display-setting.data.json` 의 이미지 서버 번호도 이 계정 것(`pg3424b68273970037`, 34곳)이다.
- 코드 편집기 주소도 정상 : `/disp/admin/editor/main?skin_no=1&skin_code=base&shop_no=1&editorFile=/index.html`

### 남은 것 — 세일 쿠폰 (9장 표의 7번)

`store-content.js` 의 `sale.coupon.coupons[].no` 4개가 **옛 쇼핑몰 쿠폰 번호** 그대로다.

```
6086342005700000318  50% 쿠폰 (10장)
6086342015600000319  20% 쿠폰 (30장)
6086342019800000320  10% 쿠폰 (100장)
6086342024200000321   5% 쿠폰 (300장)
```

- 이 계정(eppum902)에는 **쿠폰이 0개**다. (관리자 → 프로모션 → 쿠폰 발급/조회 `/disp/admin/shop1/newcoupon/onlineIssueInquiry` : "검색된 결과가 존재하지 않습니다")
- 세일 페이지(`?cate_no=27`)의 "랜덤 쿠폰 뽑기" 화면은 정상으로 뜨지만, **뽑으면 발급이 실패한다.**
- 쿠폰 만들기 : `/disp/admin/shop1/Newcoupon/onlineCreate`
- 쿠폰은 실제로 고객에게 나가는 할인 혜택이라 **할인율 · 발급 수량 · 사용기간 · 최소 주문금액을 운영자가 정해야 한다.**
  정하고 나면 만든 쿠폰 번호를 `store-content.js` 의 `coupons[].no` · `total` · `remain` 에 넣는다.
  (쿠폰을 안 쓸 거면 `sale.coupon.enabled = false` 로 두면 화면에서 통째로 숨겨진다)

## 15. 세일 쿠폰 4종 만들기 (2026-09-30, eppum902)

옛 쇼핑몰 쿠폰 번호를 이 계정에서 새로 만든 쿠폰 번호로 바꿨다. (9장 표의 7번 — 마지막 남은 항목)

| 쿠폰 | 쿠폰번호 | 혜택 | 선착순 |
|---|---|---|---|
| 50% 쿠폰 | 6086379801100002973 | 할인율 50% | 10매 |
| 20% 쿠폰 | 6086379802000002974 | 할인율 20% | 30매 |
| 10% 쿠폰 | 6086379802000002975 | 할인율 10% | 100매 |
| 5% 쿠폰 | 6086379802100002976 | 할인율 5% | 300매 |

공통 : 발급구분 **고객 다운로드 발급** · 주문서 쿠폰 · 사용조건 제한없음 · 상태 발급중

### 만드는 방법

관리자 → 프로모션 → **쿠폰 만들기** `/disp/admin/shop1/Newcoupon/onlineCreate` (목록은 `…/newcoupon/onlineIssueInquiry`)
폼은 `coupon_create_form`, 필드가 207개나 되지만 **아래 5개만 채우면 나머지는 기본값으로 저장된다.**

```js
const f = document.coupon_create_form;
f.fcoupon_name.value = '50% 쿠폰';
f.fbenefit_parent_type.value = 'B';          // A 할인금액 · B 할인율 · C 적립금액 …  (change 를 쏘면 fbenefit_type 도 B 가 된다)
f.fbenefit_percent.value = '50';
f.fissue_type.value = 'D';                    // M 대상자지정 · A 조건부자동 · D 고객 다운로드 · R 정기자동
f.querySelector('[name=is_max_issue_count][value=limit]').click();
f.fmax_issue_count.value = '10';              // 선착순 수량
// 저장 : .btnSubmit.btnSave 클릭 → 제출 데이터를 가로채 fetch 로 POST → "쿠폰이 생성되었습니다."
```

첫 쿠폰의 FormData 를 본으로 두고 **이름 · 할인율 · 수량 3개만 바꿔** 나머지 3개를 한 번에 만들었다. (상품 등록과 같은 방식)

### ⚠ 사용기간이 기본값 3일이다

만들 때 건드리지 않으면 `favailable_period_type` = 기간 설정, **오늘 ~ 3일 뒤**로 잡힌다. (이번 : 2026-09-30 00:00 ~ 2026-10-03 23:00)
세일 이벤트 기간에 맞춰 쿠폰 설정에서 **사용기간을 다시 잡아야 한다.**
(`favailable_period_type` 을 `R` 로 두면 "발급일로부터 N일", `M` 이면 "발급 당월 말일까지")

### ⚠ JS 를 고치면 `?v=` 버전도 같이 올린다

`store-content.js` 를 코드 편집기로 고쳐도 **방문자에게는 안 보였다.** `layout/basic/layout.html` 이
`store-content.js?v=20260928c` 로 부르고 있어서 CDN 이 옛 파일을 계속 내려 준다.
→ `layout.html` 68번째 줄의 `?v=` 값을 올린다. (`20260928c` → `20260930a`)
확인 : 실제 페이지 HTML 에서 `src` 를 뽑아 **그 주소로 파일을 받아** 내용이 바뀌었는지 본다.
(9-2 의 8 "이미지는 새 이름으로" 와 같은 문제다 — 이미지뿐 아니라 **css · js 도** 버전을 올려야 한다)

### 확인

- 관리자 쿠폰 목록 : 4개 모두 "발급중"
- 실제 페이지가 부르는 `store-content.js?v=20260930a` 안의 `coupons[].no` 4개가 새 번호
- 발급 자체는 **관리자 계정으로는 못 해 본다.** (`운영자는 쿠폰 발급이 불가능합니다`) → 회원 계정으로 세일 페이지에서 한 번 뽑아 확인할 것

## 16. 빠른 적용 순서 — 전체 완료 상태 (2026-09-30)

`신규 스킨 작업.md` 의 체크리스트 1 ~ 18 을 모두 마쳤다.

| 항목 | 상태 |
|---|---|
| 9 분류 이름 | 완료 (24 스킨케어 … 28 전체 상품, 하위 13개 미진열) |
| 10 상품 등록 · 이미지 | 완료 (30개, 번호 11~40, 이미지 60개 전수 확인) |
| 11 메인 진열 | 완료 (2/3/4 각 10개) |
| 12 파일업로더 | 완료 (앞선 작업) |
| 13 디자인 복구 | 완료 (앞선 작업) |
| 14 코드 편집기 수정 | 완료 (`data-prd`, `store-content.js`, `layout.html`) |
| 15 리뷰 | 완료 (30개, 글 2~31, 메인 포토리뷰 8개 노출) |
| 16 `?edit=1` · 게시판 2번 | 완료 |
| 17 Easy 편집기 | 완료 (정상 열림) |
| 18 문서 갱신 | 이 문서 |

**남은 확인거리 2개 (운영자 몫)**
1. 쿠폰 사용기간이 2026-10-03 까지다 → 이벤트 기간에 맞춰 다시 설정
2. 회원 계정으로 세일 페이지에서 쿠폰 뽑기 1회 테스트

## 17. 편집 모드에서 "수정 전 사진 → 수정한 사진" 이 차례로 보이던 문제 (2026-09-30)

### 증상
`?edit=1` 로 세일 페이지 사진을 바꾸고 저장 → 새로고침하면, **스킨에 원래 들어 있던 사진이 몇 초 보였다가** 저장한 사진으로 바뀌었다.

### 원인
`layout/basic/js/<브랜드>-cms.js` 맨 아래의 "가림막(`cms-wait`)" 조건에 `!EDIT` 가 들어 있어서 **편집 모드에서는 가림막이 아예 걸리지 않았다.**
편집 모드는 기억해 둔 내용(localStorage)을 쓰지 않고 매번 게시판을 새로 읽는데, 그동안 원래 사진이 그대로 보였다.
또 가림막이 걸리는 경우에도 **1.2초 뒤 무조건** 걷혀서, 게시판을 늦게 읽으면 같은 일이 생길 수 있었다.

### 재현 · 확인 방법 (다른 사이트에서도 그대로)
같은 쇼핑몰 페이지(콘솔)에서 아래를 실행한다. 세일 페이지를 보이지 않는 iframe 에 띄우고 30ms 마다 큰 화면 사진 상태를 기록한다.
`SAVED` 는 저장한 사진 파일 이름 일부, `.sl-hero__img` 는 확인할 사진의 선택자.

```js
async function probe(url, clearCache, SAVED, SEL) {
  if (clearCache) Object.keys(localStorage).filter(k => /-cms-v\d+-/.test(k)).forEach(k => localStorage.removeItem(k));
  const ifr = document.createElement('iframe');
  ifr.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:900px;opacity:0;pointer-events:none;z-index:-1';
  document.body.appendChild(ifr);
  const log = [], t0 = performance.now(); let last = '';
  ifr.src = url;
  await new Promise(res => { (function tick() {
    try {
      const d = ifr.contentDocument, img = d && d.querySelector(SEL);
      if (img) {
        const cs = ifr.contentWindow.getComputedStyle(img), src = img.currentSrc || img.getAttribute('src') || '';
        const shown = cs.visibility !== 'hidden' && img.complete && img.naturalWidth > 0;
        const s = (src.includes(SAVED) ? 'NEW' : 'OLD') + '|' + (shown ? '보임' : '가림');
        if (s !== last) { log.push(Math.round(performance.now() - t0) + 'ms ' + s); last = s; }
      }
    } catch (e) {}
    performance.now() - t0 < 7000 ? setTimeout(tick, 30) : res();
  })(); });
  ifr.remove();
  return { 수정전사진보임: log.some(x => x.includes('OLD|보임')), log };
}
await probe('/product/list.html?cate_no=27&edit=1', true, '저장한사진이름일부', '.sl-hero__img');
```

`수정전사진보임: false` 가 나와야 정상. 고치기 전 eppum 은 편집 모드에서 `1130ms OLD|보임 → 4087ms NEW|보임` 이었다.

### 고친 곳 — `layout/basic/js/<브랜드>-cms.js` 5곳 + `layout.html` 1곳

pet · baby · beauty 스킨의 cms 스크립트는 같은 코드라 **아래 "찾을 글자" 로 찾아 똑같이 바꾸면 된다.** (줄 번호는 사이트마다 다름)
커밋 : `0da302e` · `64ee851` · `eaf38ae` (최종본 기준 `git diff 0697f30 eaf38ae`)

| # | 찾을 글자 | 하는 일 | 필수 |
|---|---|---|---|
| ① | `var state = { map: null, applied: false, waiters: [], orderMoved: false };` | `smooth` · `hold` 추가 + `unwait()` 함수 | 필수 |
| ② | `applyAll(map) {` 안의 `html.classList.remove('cms-wait');` | `unwait();` 로 (읽는 중이면 안 걷음) | 필수 |
| ③ | `boot()` 안의 `}).catch(function () { html.classList.remove('cms-wait'); });` | 다 읽으면 `hold` 해제, 실패·안 읽는 경우에도 반드시 걷음 | 필수 |
| ④ | `if (BOARD && !EDIT && (/^\/(index\.html)?$/` | **`!EDIT` 제거** + 게시판을 읽을 예정이면 다 읽을 때까지 붙잡음 (최대 6초) | **핵심** |
| ⑤ | `setSrc` 안의 `el.setAttribute('src', url);` | 이미 사진이 보이는 상태에서 다시 바꿀 때는 새 사진을 미리 받아 두고 교체 | 선택 |
| ⑥ | `layout.html` 의 `<브랜드>-cms.js?v=` | 버전 올리기 (안 올리면 브라우저·CDN 이 옛 파일을 줌) | 필수 |

①~④ 는 서로 이어져 있어서 **한 묶음으로** 바꾼다. ⑤ 는 없어도 이번 문제는 고쳐진다.

## 18. inter 인수인계(2026-09-30) 반영 — 서버 적용 완료

`../3.inter/docs/handoff/2026-09-30-inter-cms-fixes.patch` 를 eppum 이름(beauty-cms.js · `EPPUM_CMS` · `eppum:cms` · `beauty-menu-hero` · `eppum-cms-kakao`)으로 바꿔 적용했다.
서버는 스마트디자인 편집기에서 찾아 바꾸기(dry → 저장)로 올렸다. `beauty-cms.js?v=20260930o`, 편집기 `beauty-cms-editor.js?v=20260930b`.

| inter 장 | 내용 | eppum |
|---|---|---|
| 1~3 | 목록·검색·게시판 위 큰 배너 : 옛 글자·사진 안 보임, 배경색 바로, 기억 공유(`eppum-cms-v2-2-sub`) | 적용 (가이드 페이지 가림도 유지) |
| 4 | 편집 모드도 기억한 내용 바로 보이기 | 적용 |
| 5 | 이벤트 팝업 자동 넘김 (카드에 올렸을 때만 멈춤, 움직임 줄이기에서도 넘김) | 적용 |
| 6 | 팝업 최대 5장 · 예전 글에 안내 보충 | 적용 |
| 7 | 카카오톡 상담 연결 창 (편집 막대 + 노란 버튼) | 적용 — **채널 주소는 아직 안 넣음** |
| 8 | 세일 쿠폰 카드 사진 3장 교체 | 적용 |
| 9 | 섹션 순서 저장 — 새 창 없이 | 적용 |
| 10 | 탭 제목 중복 제거 (스킨 스크립트) | 적용. 관리자 SEO 설정(상품분류 Title)은 **아직 안 바꿈** |
| 11 | 닫은 띠배너가 잠깐 보이던 문제 | 적용 (`eppum-topbanner-hide` → `beauty-topbanner-off`) |

확인(2026-09-30) : 분류 이동 시 배너 0.8초(옛 내용 안 보임), 기억 없을 때 1.8초(옛 내용 안 보임), 탭 제목 `스킨케어 - eppum902`, 편집 모드 카카오 창 열림, 콘솔 오류 없음, 세일 쿠폰 카드 3장 정상.

## 19. 상품 카드에 가격이 2~3개 보이던 문제 (2026-09-30)

- 원인 ① : 세일 뽑기 쿠폰 4종(50·20·10·5%)이 「상품상세페이지 쿠폰 노출 : 노출함」이라, 카페24가 50% 쿠폰가를 **최적할인가**로 카드에 붙였다. 상품 상세에서 [전체쿠폰다운받기]로 50% 쿠폰을 뽑기 없이 받을 수도 있었다.
  → 관리자 › 프로모션 › 쿠폰 발급/조회 › 각 쿠폰 [수정] › 상품상세페이지 쿠폰 노출 설정 **노출안함** (4종 모두). 쿠폰 번호·수량·사용기간은 그대로, 생성일자·노출시점만 저장 시각으로 바뀐다.
- 원인 ② : 소비자가 = 판매가인 상품도 취소선 소비자가를 그려 같은 가격이 두 번 보였다.
  → `layout.html` `<head>` 스크립트 : 카드의 최적할인가 줄은 항상, 소비자가 줄은 판매가보다 높지 않을 때 숨긴다 (`seraphin.js` 는 DO NOT EDIT 라 따로 둠).
- 확인 : 상품 상세에 쿠폰 다운로드·최적할인가 없음, 카드에 최적할인가 없음, 세일 뽑기 화면 정상. **뽑기 발급은 회원 계정으로 한 번 확인할 것** (관리자 계정은 발급 불가).
