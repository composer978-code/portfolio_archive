# 박해류 — Spatial Desk / Private Archive

React + TypeScript 기반 개인 포트폴리오와 비밀 코드 잠금형 개인 미디어 아카이브입니다.

## 공개 페이지

- `/` — PRD 기반의 어두운 Spatial OS 데스크. 개인 이름이나 대형 소개 제목은 홈 화면에 표시하지 않고, 드래그 가능한 유리 창과 하단 도크로 관심 분야를 탐색합니다.
- `/about` — 실제로 제공된 프로필 정보·창작 관심사를 담은 터미널형 프로필 창
- `/work` — 확인된 완료 실적을 임의로 만들지 않고 관심 분야 4축을 디렉터리 카드로 표현
- `/contact` — 실제 이메일을 설정하지 않은 상태를 그대로 표시
- `/archive` — 기존 픽셀 RPG풍 비공개 아카이브. 별도 스타일과 기능을 유지

## 홈 화면 조작

- 중앙 창의 상단 바를 드래그해 움직입니다. 빨강은 닫기, 노랑은 최소화/복원, 초록은 확대/복원입니다.
- 하단 도크의 SOUND·CONTENT·EXPERIENCE·LANGUAGE 아이콘으로 네 관심 분야 창을 바꿉니다. 데스크톱에서는 마우스 휠이나 좌우 화살표/PageUp/PageDown으로도 전환할 수 있습니다.
- 창의 화살표 버튼으로 이전/다음 필드를 이동하고, 외부 화살표 버튼으로 `/work` 디렉터리를 엽니다.
- 배경에는 첨부 PRD가 지정한 HLS stream을 사용합니다. 브라우저 미지원·영상 오류·모션 감소 설정이면 기존 오리지널 파도 이미지로 자동 대체됩니다.

## 콘텐츠·디자인 직접 수정

### 글·프로필·이미지 경로

`client/src/content.ts`에서 `name`, `role`, `intro`, `aboutLead`, `aboutParagraphs`, `focusAreas`, `heroImage`, `aboutImage`, `creativeFields`를 바꿉니다. 홈은 의도적으로 `name`과 큰 `headline`을 노출하지 않습니다. 프로필 이름은 `/about`에만 나타납니다. 작업 페이지는 `creativeFields`를 사용합니다.

현재 실제 이메일은 제공되지 않았으므로 `email`은 비어 있습니다. 공개 주소를 추가하려면 `email` 필드에 본인 주소를 입력하세요. 실제 완료 프로젝트나 경력도 받은 자료에 없어 가상 실적으로 채우지 않았습니다.

### 색·타이포그래피·표면

`client/src/spatial.css` 상단에서 아래 변수를 조정합니다.

- `--sp-bg`: 기본 검정 배경
- `--sp-accent-a`, `--sp-accent-b`: 차가운 실버/블루 계열 포인트
- `--sp-body`, `--sp-display`: 본문과 디스플레이 폰트
- 유리창 투명도·테두리·블러·도크 크기는 같은 CSS의 `.spatial-window`, `.glass-surface`, `.spatial-dock` 규칙에 있습니다.

폰트 링크와 페이지 메타데이터는 `client/index.html`에서 편집합니다.

### 배경 영상과 대체 이미지

`client/src/components/SpatialEnvironment.tsx`의 `BACKGROUND_STREAM`이 PRD에서 제공된 Mux HLS 주소입니다. 다른 공개 HLS를 사용하려면 그 주소를 바꾸세요. 자가 호스팅·비공개 영상으로 교체할 때는 CORS와 브라우저 자동재생(음소거)을 확인해야 합니다. 영상 스트림이 재생되지 않아도 화면이 비지 않도록 `SITE_CONTENT.heroImage` 포스터가 유지됩니다.

이미지를 바꾸는 가장 간단한 방법은 `client/src/content.ts`의 `heroImage`와 `aboutImage` 경로를 수정하는 것입니다. 큰 원본 파일을 `client/public/`에 복사하지 마세요. WebDev에 새 파일을 쓸 때는 `manus-upload-file --webdev /path/to/image.png`로 업로드한 뒤 반환 경로(`/manus-storage/...`)를 사용하세요. 현재 WebP 사본은 다운로드 ZIP의 `assets/`에 있습니다.

## 비공개 아카이브

코드 잠금을 해제한 뒤 `자료 추가`를 눌러 다음 자료를 직접 저장할 수 있습니다.

- YouTube Shorts/일반 영상 링크와 공개 임베드 가능한 Instagram Reels
- JPG·PNG·WebP·GIF 사진, PDF 또는 UTF-8 TXT 자료(파일당 최대 8MB)
- 개인 메모

카드에는 썸네일·사용자가 입력한 짧은 요약·분류·태그가 표시됩니다. 검색·필터·태그 수정과 카드 안 재생을 지원합니다. 영상 링크는 사용자가 직접 붙여넣으며 서비스 계정에 접속해 자동 수집하지 않습니다. Instagram 재생은 게시물 공개/임베드 설정과 현행 서비스 정책에 따라 달라질 수 있습니다.

아카이브 UI는 Undertale에서 영감을 얻은 오리지널 픽셀 RPG풍이며 게임 원작 아트·캐릭터·음악을 사용하지 않습니다.

## 아카이브 보안·운영 경계

- 서버 비밀 설정의 `PORTFOLIO_ARCHIVE_CODE`로 잠급니다. 코드 원문은 브라우저 코드나 DB에 포함하지 않습니다. 코드를 아는 사람은 누구나 들어올 수 있으므로 길고 고유한 값을 비밀번호처럼 보관하세요.
- 기본 인증은 12시간 만료 HTTP-only 쿠키입니다. HTTPS 임베디드 미리보기에서 쿠키를 차단하는 브라우저를 위해 서명 토큰이 현재 탭의 `sessionStorage`에만 보조 보관됩니다. 탭을 닫으면 보조 세션은 사라지고, 코드 교체는 기존 세션을 무효화합니다.
- 메모·자료 메타데이터는 DB, 파일 바이트는 비공개 객체 저장소에 저장합니다. 다운로드는 임시 서명 URL입니다. 신규·레거시 업로드 모두 MIME과 파일 시그니처를 검사합니다.
- 객체 저장소 삭제 API가 연결되지 않아 파일 바이트를 지우는 삭제 UI는 제공하지 않습니다. 파일을 올리기 전에 보관 권한을 확인하세요.
- `.env`나 비밀값을 Git에 커밋하지 마세요. 다운로드 ZIP에는 비밀 코드가 포함되지 않습니다.

## 테스트와 로컬 실행

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

마지막 검증에서 TypeScript 검사, 20개 Vitest 테스트, 프로덕션 빌드가 통과했습니다. 별도 서버 사본에서는 DB·객체 저장소와 `PORTFOLIO_ARCHIVE_CODE`, 강한 `JWT_SECRET` 설정이 필요합니다. ZIP은 이 런타임 비밀값/DB를 복제하지 않습니다.

## 미게시 상태

현재 미리보기만 준비되어 있으며 사이트를 공개 게시하지 않았습니다. GitHub도 연결·푸시하지 않았습니다. 사용자가 명시적으로 승인하기 전에는 연결, 첫 커밋, 푸시, 게시를 하지 않습니다.
