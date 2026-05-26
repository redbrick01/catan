# Bot 09 Gate Summary

작성일: 2026-05-26

| Gate | Result | Evidence Type | Evidence |
| --- | --- | --- | --- |
| bot-01 player model/lobby | Pass | 직접 WebSocket | `bot-09-stabilization-regression-test`: add/remove bot, max 4 rejection, 사람 1 + 봇 1 시작 거절, `isBot`/`botDifficulty` public 확인 |
| bot-02 turn runner | Pass | 직접 WebSocket | `bot-09-stabilization-regression-test`: 연속 봇 턴 이후 사람 턴 복귀, `game.round >= 2`, 서버 fatal stderr 없음 |
| bot-03 initial placement | Pass | 직접 WebSocket | `bot-09-stabilization-regression-test`: 봇 setup 완료 후 play phase 진입, `setupPlacement` public leak 없음 |
| bot-04 basic actions | Pass | 직접 WebSocket + 기존 online 회귀 | `bot-09-stabilization-regression-test`, `online-08`, `online-09`: roll/end/build/trade blocking smoke |
| bot-05 robber/seven pending | Pass | 직접 WebSocket + 기존 online 회귀 | `bot-09-stabilization-regression-test`, `online-12`: 봇 discard, robber privacy, 피해자 0/1/2명 fixture |
| bot-06 dev cards | Pass | 직접 WebSocket + 기존 online 회귀 | `bot-09-stabilization-regression-test`, `online-11`: victory play 금지, 구매 턴 제한, yearPlenty, knight pending |
| bot-07 trade response | Pass | 직접 WebSocket + 기존 online 회귀 | `bot-09-stabilization-regression-test`, `online-10`: counter 없음, trade round update, accept가 즉시 체결되지 않음 |
| bot-08 UI/logging | Pass with viewport limitation | 정적 회귀 + 브라우저 smoke | `bot-08-ui-logging-regression-test`, 1280x720 browser smoke, screenshot 저장 |

## P0/P1 판정

- P0: 없음
- P1: 없음

## 제한 사항

- 320px/375px/780px 실제 viewport는 자동화 API 제한으로 시각 캡처하지 못했다.
- Chrome 시크릿, Edge, 다른 기기 Chrome은 수행하지 못했다.
- 오프라인 3/4 전체 브라우저 플레이는 이번 자동화 범위에서 수행하지 못했다.
- 실제 브라우저에서는 여러 턴 진행이 아니라 로비와 게임 시작 직후 smoke까지만 확인했다.

## 후속 권장

- viewport resize 가능한 브라우저 자동화 또는 Chrome DevTools로 좁은 화면을 재검증한다.
- 실제 Chrome 시크릿/Edge/다른 기기 Chrome에서 로비, pending, trade UI smoke를 반복한다.
- 실제 Chrome 또는 Playwright 제어 환경에서 사람 1 + 봇 2, 사람 2 + 봇 2 조합을 여러 턴 진행한다.
- 장시간 봇 포함 게임 운영은 별도 soak test로 분리한다.
