# Design and asset record

## User-provided design references

- `prd_dark_spatial_os_portfolio_landing_page.md` — 사용자 첨부 PRD. 어두운 Spatial OS, 유리 창, 하단 magnification 도크, 초기화 오버레이, 모션 및 전체 화면 HLS 환경 요구를 반영했습니다. 사용자의 추가 지시를 우선해 홈에서는 개인 이름이나 대형 소개 제목을 표시하지 않습니다.
- `https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8` — PRD가 지정한 HLS 배경 스트림. manifest는 HTTP 200으로 응답합니다. `SpatialEnvironment.tsx`는 브라우저 지원 시 `hls.js`/네이티브 HLS를 사용하고, 재생 실패 또는 모션 감소 설정이면 정적 WebP 포스터로 되돌아갑니다.
- `https://ficstory.dev/` — 초기 디자인 참고처. 현재 Spatial OS 재설계는 별도로 구현했으며 해당 사이트의 소스·이미지를 사용하지 않았습니다.

## Original generated imagery

2026-09-28에 개인의 음악·파도 방향을 위한 오리지널 이미지로 생성하고 WebP 최적화했습니다. 공개 사이트의 정적 배경/소개 이미지와 HLS 실패 시 포스터로 씁니다. 현재 리디자인에서 새 스톡 이미지는 사용하지 않습니다.

- `assets/haeryu-wave-hero.webp` — 생성형 파도 이미지, WebP; 포스터 및 공개 홈 배경 대체
- `assets/haeryu-wave-detail.webp` — 생성형 파도 이미지, WebP; 프로필 아트 및 대체 컷

HLS 대체 결과는 `client/src/content.ts`의 `heroImage`, `aboutImage` 경로가 정합니다. 원본 PNG 마스터는 프로젝트 밖의 자산 폴더에 보존합니다.

## Search candidates not used

리디자인을 위해 어두운 파도·공간 이미지도 검색했지만, 반환된 후보는 스톡 플랫폼 미리보기 또는 워터마크가 있는 썸네일이어서 사이트나 ZIP에 복사하지 않았습니다.

## Separate private archive art direction

픽셀 RPG풍 아카이브 화면은 CSS로 이 프로젝트를 위해 새로 만들었습니다. Undertale의 아트, 캐릭터, 음악, 텍스트, UI 이미지는 포함하지 않습니다.

## Privacy

사용자가 첨부한 분석 자료의 원문과 사적인 관계/성향 내용은 사이트 소스나 다운로드 ZIP에 복사하지 않았습니다. 공개 프로필에는 이름과 창작 관심사만 사용했습니다.
