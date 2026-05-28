# FEEL-004 도둑/Pending 피드백 테스트 계획

작성일: 2026-05-27

## 범위

Verify FEEL-004 robber, 7, discard, move-robber, victim selection, result privacy, reduced-motion, and reconnect/hydrate behavior.

## 변경 파일

- `script.js`
- `styles.css`
- `scripts/game-feel-robber-pending-static-test.js`
- `docs/plans/2026-05-27_game-feel-004-robber-pending-feedback-plan.md`
- `docs/tests/2026-05-27_game-feel-004-robber-pending-feedback-test-plan.md`
- `docs/reports/2026-05-27_game-feel-004-robber-pending-feedback-final-report.md`

## 자동 점검

| 점검 | 목적 |
| --- | --- |
| `node --check script.js` | 클라이언트 문법을 검증한다. |
| `node --check server.js` | 서버 문법을 검증한다. |
| `node scripts/game-feel-cue-dedupe-static-test.js` | FEEL-000 중복 방지와 private sanitizer hook을 재점검한다. |
| `node scripts/game-feel-settings-static-test.js` | 설정과 모션 감소 hook을 재점검한다. |
| `node scripts/game-feel-sound-static-test.js` | 안전한 사운드 기반을 재점검한다. |
| `node scripts/game-feel-turn-state-static-test.js` | pending actor 턴 focus를 재점검한다. |
| `node scripts/game-feel-dice-seed-static-test.js` | 주사위/7 cue 기반을 재점검한다. |
| `node scripts/game-feel-robber-pending-static-test.js` | FEEL-004 도둑/pending cue 연결, role matrix, privacy, tile class, focus-visible, 모션 감소 hook을 검증한다. |

## 수동/브라우저 점검

- 강제로 또는 자연스럽게 7을 굴리고 dice panel과 guide 영역이 짧은 alert cue를 받는지 확인한다.
- discard, move-robber, and choose-victim pending states show distinct guide/modals. 확인.
- actor sees actionable guidance and waiting players see non-actionable waiting guidance. 확인.
- current robber tile, legal target tiles, and waiting-view disabled target tiles are visually distinct. 확인.
- victim picker hover and keyboard focus are equally visible. 확인.
- actor/victim result can include a concrete resource while third-party observer result stays generic. 확인.
- pending robber 상태로 reconnect/hydrate하고 현재 blocking UI만 복구되며 과거 motion/sound/result modal은 재생되지 않는지 확인한다.
- 모션 감소를 켰을 때 움직임 애니메이션 없이 정적 outline/label 강조가 유지되는지 확인한다.

## 브라우저 제약

Local in-app browser QA remains blocked in this environment by the previously recorded `ERR_BLOCKED_BY_CLIENT` localhost/127.0.0.1 issue, and project Playwright is not installed. This risk is carried to the final report and FEEL-008.

## 완료 기준

- 자동 점검이 통과한다.
- 비공개 상태는 server view shaping과 FEEL cue sanitizer로 보호된다.
- 실행하지 못한 브라우저 점검과 남은 위험은 최종 보고서에 기록한다.
