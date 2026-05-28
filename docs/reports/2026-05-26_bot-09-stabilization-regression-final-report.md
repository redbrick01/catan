# Bot 09 안정화 및 회귀 테스트 최종 보고서

작성일: 2026-05-26

## 1. 목표

bot-01~bot-08이 통합된 상태에서 봇 포함 온라인 게임이 멈추지 않는지 확인하고, 기존 사람 전용 온라인/오프라인 흐름과 비공개 정보 정책이 회귀하지 않는지 검증했다. 자동 WebSocket 테스트, 정적 검사, UI/logging 회귀 테스트, 실제 브라우저 smoke를 조합해 확인했다.

## 2. 변경 및 산출물

이번 단계에서 정리하거나 추가한 산출물은 다음과 같다.

- `scripts/bot-08-ui-logging-regression-test.js`
- `scripts/bot-09-stabilization-regression-test.js`
- `docs/tests/2026-05-26_bot-09-stabilization-regression-test-plan.md`
- `docs/reports/2026-05-26_bot-09-stabilization-regression-final-report.md`
- `docs/reports/2026-05-26_bot-09-gate-summary.md`
- `docs/issues/2026-05-26_bot-known-issues.md`
- `docs/tests/artifacts/2026-05-26_bot-09-browser-lobby.png`
- `docs/tests/artifacts/2026-05-26_bot-09-browser-game-start.png`
- `docs/tests/artifacts/2026-05-26_bot-09-browser-console.json`

## 3. 실행 환경

- `NODE_ENV=test`
- WebSocket test ports:
  - 기존 온라인 회귀 테스트: `4873`~`4877`
  - bot-09 통합 테스트: `4899`
- Browser server port: `4173`
- Browser: Codex in-app browser
- Browser URL: `http://127.0.0.1:4173/`
- Browser viewport observed: `1280x720`
- Test mode bot runner delay: `0ms`

## 4. 실행 명령 및 결과

다음 명령을 실행했고 모두 통과했다.

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\online-08-basic-building-ws-test.js
node scripts\online-09-bank-trade-ws-test.js
node scripts\online-10-1-player-trade-ui-static-test.js
node scripts\online-10-player-trade-ws-test.js
node scripts\online-11-development-cards-ws-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-08-ui-logging-regression-test.js
node scripts\bot-09-stabilization-regression-test.js
```

결과: PASS.

## 5. Fixture 및 재현 정보

### 5.1 Forced dice

- 봇 runner 기본 진행: `BOT_TEST_ROLL_TOTAL=2`
- 7/강도 fixture: `rollDice({ testTotal: 7 })`

### 5.2 Fixed dev deck

테스트에서 사용한 고정 dev deck 또는 봇 dev hand는 다음 조합을 포함한다.

- `["victory"]`
- `["yearPlenty"]`
- `["victory", "knight", "yearPlenty"]`
- 봇 손패 fixture: `["yearPlenty", "victory", "knight"]`

### 5.3 Trade round/update

- `openPlayerTrade`로 봇 responder 대상 거래 pending 생성
- `updatePlayerTradeOffer`로 `round + 1` 변경
- 이전 round 응답은 `TRADE_ROUND_CHANGED` 또는 stale 응답 방지 경로로 거부되는지 확인
- 봇 accept는 즉시 자원 이동이 아니라 requester의 최종 선택 대기 상태임을 확인

### 5.4 Robber/victim

- forced dice 7로 discard pending 생성
- 기존 `online-12` 테스트의 피해자 0명, 1명, 2명 이상 fixture를 함께 사용
- 피해자 0명/1명 경로에서는 불필요한 `chooseRobberVictim` command를 보내지 않는 흐름 확인

## 6. 자동/WebSocket 검증 요약

- 사람 1 + 봇 2 시작 조건 확인
- 사람 1 + 봇 3 시작 조건과 max players 제한 확인
- 봇 setup 자동 진행 후 play phase 진입 확인
- 연속 봇 턴 이후 사람에게 턴이 돌아오는지 확인
  - WebSocket fixture에서 봇 seat 1/2가 연속으로 처리된 뒤 active seat 0으로 복귀
  - `game.round >= 2` 조건으로 사람 플레이어가 최소 1회 다시 턴을 받은 것을 확인
- 봇 discardForSeven, moveRobber, chooseRobberVictim 관련 smoke 확인
- 봇 개발 카드 관련 smoke 확인
  - victory에 `playDevCard`를 보내지 않음
  - 구매 턴 카드 사용 금지
  - `usedDevThisTurn` 제한
  - yearPlenty 은행 재고 조건
  - knight 후 pending은 bot-05 경로가 처리
- 봇 player trade response 확인
  - botGives = `trade.request`
  - botReceives = `trade.offer`
  - counter response 없음
  - trade round 변경 후 오래된 timer 응답 없음
- 사람 3명 온라인 회귀 smoke 확인
- 기존 건설, 은행/항구 교역, 플레이어 거래, 개발 카드, 7/강도 WebSocket 테스트 통과
- 여러 턴 진행 완료 기준은 WebSocket 자동 테스트에서 확인했다.
- 실제 브라우저 검증은 로비 생성, 봇 추가, 게임 시작 직후 화면 확인 중심의 smoke이며, 브라우저에서 여러 턴을 직접 진행하는 검증은 미수행으로 분리했다.

## 7. 브라우저 검증 요약

브라우저 smoke는 Codex in-app browser에서 수행했다.

- URL: `http://127.0.0.1:4173/`
- Viewport observed: `1280x720`
- Lobby screenshot: `docs/tests/artifacts/2026-05-26_bot-09-browser-lobby.png`
- Game-start screenshot: `docs/tests/artifacts/2026-05-26_bot-09-browser-game-start.png`
- Console/metric log: `docs/tests/artifacts/2026-05-26_bot-09-browser-console.json`

확인 결과:

- 로비에서 봇 배지 표시
- 봇 row의 `봇 · 준비됨` 계열 표시
- 방장용 봇 제거 버튼 표시
- 사람 1 + 봇 2 상태에서 게임 시작 버튼 활성화
- 게임 시작 직후 봇 player card와 봇 배지 표시
- 브라우저 console error count: `0`
- 관측 viewport horizontal overflow: `false`
- 온라인 게임 시작 로그 표시

## 8. 비공개 정보 노출 검사

다음 위치를 대상으로 public leak smoke를 수행했다.

- public room state
- matchState view
- pending action view
- player trade view
- winner/dev card view
- UI/logging static regression

검사 경로는 다음과 같이 정리했다.

- `room.state.players`: `isBot`, `botDifficulty`는 공개되지만 `token`은 노출되지 않음
- `matchState.game.players`: viewer별 resource/dev card 정책 유지, 봇 내부 runner 상태 없음
- `matchState.game.pendingActionView`: viewer에게 필요한 pending 정보만 포함
- `pendingPlayerTrade`: 거래 public response 상태만 포함, 봇 내부 평가와 timer 상태 없음
- `winnerSummary`와 dev card view: 비소유자에게 숨은 개발 카드 타입이 노출되지 않음
- UI/logging static regression: `botRunner`, `setupPlacement` 등 내부 상태 문자열 참조 없음

노출 금지 키워드와 상태:

- `token`: 노출 없음
- `botRunner`: 노출 없음
- `timerId`: 노출 없음
- `runId`: 노출 없음
- `turnActionState`: 노출 없음
- `setupPlacement`: 노출 없음
- `candidate`: 노출 없음
- `evaluation`: 노출 없음

추가 확인:

- 비소유자 view에 숨은 개발 카드 타입이 노출되지 않음
- victory 카드는 winner summary에서 count 중심으로만 공개
- 훔친 자원 종류는 허용되지 않은 viewer에게 노출되지 않음
- 봇 내부 판단 이유, 점수, 후보 목록은 전역 로그에 노출되지 않음

## 9. bot-01~bot-08 통합 게이트

| Gate | Result | Evidence Type | Evidence |
| --- | --- | --- | --- |
| bot-01 player model/lobby | Pass | 직접 WebSocket | add/remove bot, max 4 rejection, 1 human + 1 bot start rejection, `isBot`/`botDifficulty` public |
| bot-02 turn runner | Pass | 직접 WebSocket | consecutive bot turns 후 사람 턴 복귀, fatal stderr 없음 |
| bot-03 initial placement | Pass | 직접 WebSocket | 봇 setup 완료 후 play phase 진입, `setupPlacement` 비노출 |
| bot-04 basic actions | Pass | 직접 WebSocket + 기존 online 회귀 | roll/end/build/trade blocking smoke, 기존 online-08/09 통과 |
| bot-05 robber/seven pending | Pass | 직접 WebSocket + 기존 online 회귀 | bot discard, robber privacy, 0/1/2 victim fixtures |
| bot-06 dev cards | Pass | 직접 WebSocket + 기존 online 회귀 | victory play 금지, 구매 턴 제한, yearPlenty/knight smoke |
| bot-07 trade response | Pass | 직접 WebSocket + 기존 online 회귀 | no counter, trade round update, accept is not immediate settlement |
| bot-08 UI/logging | Pass with viewport limitation | 정적 회귀 + 브라우저 smoke | UI/logging static regression, browser smoke at 1280x720 |

## 10. 수행하지 못한 테스트

### Chrome 시크릿 창

- 미수행 이유: 현재 자동화 가능한 브라우저 표면이 Codex in-app browser로 제한됨
- 대체 확인: WebSocket 자동 테스트와 in-app browser smoke
- 남은 위험: sessionStorage/localStorage 격리 차이에 따른 UI 표시 차이는 수동 확인 필요
- 후속 수행 조건: 로컬 Chrome 또는 Playwright 제어 가능한 환경

### Edge 또는 다른 기기 Chrome

- 미수행 이유: 추가 브라우저 표면 미제공
- 대체 확인: standards 기반 DOM/CSS 정적 테스트와 in-app browser smoke
- 남은 위험: 브라우저별 CSS 차이
- 후속 수행 조건: 실제 브라우저/기기 수동 테스트

### 320px/375px/780px 실제 viewport 캡처

- 미수행 이유: 현재 Browser API에서 viewport resize 기능 미제공
- 대체 확인: CSS responsive rule 정적 회귀와 1280px 실제 화면 smoke
- 남은 위험: 실제 좁은 viewport overflow는 수동 확인 필요
- 후속 수행 조건: viewport resize 가능한 브라우저 자동화 또는 Chrome DevTools 수동 확인

### 브라우저 여러 턴 진행

- 미수행 이유: 이번 브라우저 검증은 in-app browser smoke와 screenshot/console 확인 중심으로 제한됨
- 대체 확인: WebSocket 자동 테스트에서 연속 봇 턴 후 사람 턴 복귀와 `game.round >= 2` 확인
- 남은 위험: 실제 브라우저 클릭 흐름에서 여러 턴 동안 버튼 상태와 modal 우선순위가 유지되는지는 수동 확인 필요
- 후속 수행 조건: 실제 Chrome 또는 Playwright 제어 가능한 브라우저에서 사람 1 + 봇 2, 사람 2 + 봇 2 조합을 여러 턴 진행

### 오프라인 3/4 전체 브라우저 플레이

- 미수행 이유: 이번 자동화는 온라인 WebSocket 회귀와 봇 통합 smoke 중심
- 대체 확인: 오프라인 코드를 직접 수정하지 않았고, shared `script.js` 문법/정적 UI 검사를 통과
- 남은 위험: 오프라인 UI 전체 플로우의 실제 클릭 기반 회귀는 별도 수동 테스트 필요

## 11. 실패 분류 결과

- P0: 없음
- P1: 없음
- P2/P3: 모바일 실제 viewport, 다중 브라우저, 장시간 운영 테스트는 후속 확인 항목

P0/P1에 해당하는 서버 크래시, 게임 진행 불가, 비공개 정보 노출, 중복 runner command, 오래된 trade round 응답, 사람 pending/trade UI 차단은 자동 테스트와 smoke 기준으로 발견되지 않았다.

bot-01~bot-08 피드백에서 이어지는 후속 안정화 backlog는 P2/P3로 분리한다.

- 320px/375px/780px 실제 viewport에서 로비, player card, discard/victim modal, trade modal, 로그 패널 확인
- 사람 pending/trade modal이 봇 턴 대기 안내보다 우선되는 동적 UI fixture 추가
- state delta별 봇 로그 snapshot 추가
- 긴 이름 + 봇 배지 + 제거 버튼 조합의 DOM overflow 테스트 추가
- dev card, robber, trade 일부 edge case의 직접 fixture 보강

## 12. 최종 판정

부분 완료.

자동/WebSocket 통합 게이트와 1280px 실제 브라우저 smoke는 통과했다. bot-01~bot-08 통합 기능 기준으로 남은 P0/P1은 없다. 여러 턴 진행 완료 기준은 WebSocket 자동 테스트에서 확인했고, 실제 브라우저에서는 로비와 게임 시작 직후 smoke까지만 확인했다. 따라서 요청된 모든 브라우저, viewport, 실제 브라우저 여러 턴 조합은 현재 자동화 환경에서 수행하지 못했으므로, 배포 전에는 320px/375px/780px 실제 화면과 Chrome 시크릿/Edge/다른 기기 Chrome 수동 확인을 권장한다.

## 13. 피드백 반영 내역

- WebSocket 자동 테스트에서 확인한 여러 턴 기준을 구체화했다.
  - 봇 seat 1/2가 연속 처리된 뒤 active seat 0으로 복귀
  - `game.round >= 2`로 사람 플레이어가 최소 1회 다시 턴을 받은 상태 확인
- 실제 브라우저 검증은 여러 턴 진행이 아니라 로비, 봇 추가, 게임 시작 직후 smoke였다는 차이를 최종 판정과 미수행 항목에 명시했다.
- bot-01~bot-08 gate table에 `Evidence Type` 열을 추가해 직접 WebSocket, 기존 online 회귀, 정적 회귀, 브라우저 smoke 근거를 구분했다.
- public leak smoke를 `room.state.players`, `matchState.game.players`, `pendingActionView`, `pendingPlayerTrade`, `winnerSummary`, UI/logging static regression 경로별로 보강했다.
- bot-01~bot-08 피드백에서 이어지는 후속 안정화 backlog를 P2/P3 항목으로 묶었다.
- known issues와 gate summary 문서도 같은 기준에 맞춰 함께 보강했다.
