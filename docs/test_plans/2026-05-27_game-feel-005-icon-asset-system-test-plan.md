# FEEL-005 아이콘 자산 시스템 테스트 계획

작성일: 2026-05-27

## 범위

Verify that resource, action, and status icon tokens are consistent, accessible, asset-safe, and private-state safe without widening the FEEL-005 scope into a full UI redesign.

## 정적 점검

- `node --check script.js`
- `node --check server.js`
- 기존 game-feel 정적 테스트를 다시 실행한다:
  - `node scripts/game-feel-cue-dedupe-static-test.js`
  - `node scripts/game-feel-settings-static-test.js`
  - `node scripts/game-feel-sound-static-test.js`
  - `node scripts/game-feel-turn-state-static-test.js`
  - `node scripts/game-feel-dice-seed-static-test.js`
  - `node scripts/game-feel-robber-pending-static-test.js`
  - `node scripts/game-feel-action-result-static-test.js`
- 다음 항목을 위해 `node scripts/game-feel-icon-asset-static-test.js`를 추가하고 실행한다:
  - `ICON_TOKENS` taxonomy coverage.
  - shared `resourceIconToken`, `actionIconToken`, and `statusIconToken` helpers.
  - decorative icon `aria-hidden="true"` use.
  - action button accessible labels.
  - private cue sanitizer guardrails for dev-card purchases and robber results.
  - no external icon library references.
  - no `assets/icons` references and no unnecessary `docs/assets_manifest.md`.

## 브라우저 스모크

- `http://localhost:4173/`. 열기.
- the cost reference uses action tokens plus text. 확인.
- resource rows use resource tokens plus text/count. 확인.
- action buttons use action tokens plus text and retain `aria-label`. 확인.
- no icon-only controls were introduced. 확인.
- no external icon/script/image references for the icon system. 확인.

## Manual/Visual Review

- 데스크톱: cost row, player seat, action control, player list, bank/resource summary의 겹침을 확인한다.
- 모바일 밀도: CSS 제약과 고정 token 크기를 검토하고, viewport resizing이 가능하면 브라우저 viewport 스모크를 실행한다.
- 비공개 상태: 상대 resource summary가 generic으로 유지되고 resource type을 노출하지 않는지 확인한다.
- 자산 라이선스: 새 외부 또는 파일 자산이 추가되지 않았는지 확인한다.

## 통과 기준

- 모든 정적 테스트가 통과한다.
- 브라우저 스모크에서 기본 데스크톱 board view의 icon/text 겹침이 보이지 않는다.
- icon은 control 또는 status의 유일한 의미 label이 되지 않는다.
- non-viewer에게 비공개 상태는 generic으로 유지된다.
- unmanifested file asset is introduced. 없음.

## 알려진 제약

- Browser 보안 정책이 file URL 경로를 차단하므로 브라우저 스모크는 로컬 서버 URL을 사용해야 한다.
- 인앱 브라우저가 viewport resizing을 지원하지 않으면 모바일 viewport 스모크는 미실행으로 남을 수 있으며, 최종 보고서에 기록한다.
