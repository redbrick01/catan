# FEEL-000 피드백 기반 테스트 계획

작성일: 2026-05-27

## 테스트 대상

- 구현 계획: `docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md`
- 변경 파일:
  - `script.js`
  - `styles.css`
  - `scripts/game-feel-cue-dedupe-static-test.js`

## 테스트 환경

- Windows PowerShell
- Node.js 로컬 runtime
- 로컬 서버: `node server.js`로 `http://127.0.0.1:4173/` 실행

## 수동 테스트 항목

- an offline game and confirm the setup screen still progresses into the game. 시작.
- online lobby/game hydrate paths do not require cue playback during initial state restore. 확인.
- no visible UI change is expected from FEEL-000 alone except reduced-motion CSS guardrails. 확인.

## 자동 테스트 항목

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`

## 브라우저 검증 항목

- `http://127.0.0.1:4173/?test=1`. 열기.
- `window.__katanFeelTest` exists. 확인.
- no console errors on initial load. 확인.
- setup screen renders. 확인.

## 규칙 및 안전성 검증

- 중복 방지 key는 scope, revision, event type, entity id, detail key를 포함한다.
- 중복 cue key는 억제된다.
- hydrate/reconnect snapshot revision은 억제된다.
- 상대 생산 cue는 `resourceType`을 제거한다.
- 도둑 observer cue는 `resourceType`을 제거한다.
- 개발 카드 구매 cue는 구매한 카드 종류를 제거한다.
- sound off/default 설정은 visual/log 정보를 제거하지 않는다.

## 통과 기준

- 정적 점검 통과.
- 헬퍼 테스트 통과.
- game rule state is changed by cue helpers. 없음.
- 브라우저 검증은 통과하거나 환경 차단 사유를 최종 보고서에 기록한다.
