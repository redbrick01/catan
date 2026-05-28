# FEEL-001 턴 피드백 테스트 계획

작성일: 2026-05-27

## 테스트 대상

- 구현 계획: `docs/plans/2026-05-27_game-feel-001-turn-feedback-plan.md`
- 변경 파일:
  - `script.js`
  - `styles.css`
  - `scripts/game-feel-turn-state-static-test.js`

## 자동 테스트 항목

- `node --check script.js`
- `node --check server.js`
- `node scripts/game-feel-cue-dedupe-static-test.js`
- `node scripts/game-feel-settings-static-test.js`
- `node scripts/game-feel-sound-static-test.js`
- `node scripts/game-feel-turn-state-static-test.js`

## 수동 및 브라우저 테스트 항목

- an offline 3-4 player game. 시작.
- the active player card and player row are visually distinct. 확인.
- 턴을 넘기고 새 focus가 1회성 pulse를 한 번만 받는지 확인한다.
- online own-turn, opponent-turn, pending actor, and bot-turn states remain visually distinct. 확인.
- 모션 감소를 켰을 때 turn pulse는 제거되고 outline/badge 텍스트는 남는지 확인한다.
- mobile view does not overlap current-player label, dice panel, and action controls. 확인.

## 중복 방지 점검

- 같은 상태를 다시 렌더링해도 같은 `turnChanged` 또는 `pendingStarted` cue가 재생되지 않아야 한다.
- A changed active player or pending actor should produce a new cue key.

## 통과 기준

- 정적 테스트가 통과한다.
- 턴/pending 상태 class가 존재한다.
- 모션 감소 fallback이 존재한다.
- 시각 QA를 실행할 수 없으면 브라우저 제약을 문서화한다.
