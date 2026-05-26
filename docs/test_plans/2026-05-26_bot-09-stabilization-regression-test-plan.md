# Bot 09 안정화 및 회귀 테스트 계획서

작성일: 2026-05-26

## 1. 목표

bot-01~bot-08 통합 상태에서 봇 포함 온라인 게임이 멈추지 않고, 사람 전용 온라인/오프라인 흐름과 비공개 정보 정책이 회귀하지 않는지 확인한다.

## 2. 환경

- `NODE_ENV=test`
- WebSocket test ports: `4873`~`4877`, `4899`
- Browser server port: `4173`
- Browser: Codex in-app browser
- Browser URL: `http://127.0.0.1:4173/`
- Observed viewport: `1280x720`
- Bot runner delay: test mode에서 `0ms`

## 3. Fixture

- Forced dice:
  - WebSocket bot runner 기본: `BOT_TEST_ROLL_TOTAL=2`
  - 7/강도 fixture: command payload `testTotal: 7`
- Fixed dev deck:
  - `["victory"]`
  - `["yearPlenty"]`
  - `["victory", "knight", "yearPlenty"]`
- Bot dev hand:
  - `["yearPlenty", "victory", "knight"]`
- Trade round fixture:
  - `openPlayerTrade`
  - `updatePlayerTradeOffer`로 `round + 1`
  - old round `respondPlayerTrade` rejection 확인
- Robber/victim fixture:
  - forced dice 7
  - 피해자 0명/1명/2명 이상 경로

## 4. 자동 테스트 명령

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

## 5. 신규 테스트 스크립트 범위

- `scripts/bot-08-ui-logging-regression-test.js`
  - 봇 배지 helper
  - 봇 턴 문구
  - pending/trade 우선순위 helper
  - 모바일 CSS 보호
  - 내부 상태 문자열 노출 여부
- `scripts/bot-09-stabilization-regression-test.js`
  - 사람 1 + 봇 2/3 로비와 시작 조건
  - 봇 setup 자동 진행
  - 연속 봇 턴 이후 사람 턴 복귀
  - 봇 대상 player trade 응답
  - 봇 discardForSeven
  - dev card privacy
  - 사람 3명 온라인 회귀 smoke
  - public state leak smoke

## 6. 브라우저 검증 계획

- Browser: Codex in-app browser
- URL: `http://127.0.0.1:4173/`
- Viewport observed: `1280x720`
- Screenshots:
  - `docs/test_plans/2026-05-26_bot-09-browser-lobby.png`
  - `docs/test_plans/2026-05-26_bot-09-browser-game-start.png`
- Console/metric log:
  - `docs/test_plans/2026-05-26_bot-09-browser-console.json`

확인 항목:

- 로비 봇 배지
- 봇 row 준비 표시
- 방장 전용 봇 제거 버튼
- 사람 1 + 봇 2 게임 시작 가능
- 게임 화면 봇 player card 표시
- console error 없음
- horizontal overflow 없음

## 7. 통합 게이트

- bot-01: public player model, lobby add/remove/max/start condition
- bot-02: runner duplicate/stale protection smoke, consecutive bot turns
- bot-03: setup automation to play phase, `setupPlacement` non-public
- bot-04: blocking state and action limit smoke through bot turn progression
- bot-05: discard/robber pending smoke through forced 7 and existing online-12 fixtures
- bot-06: victory privacy, bought-turn restriction, yearPlenty/knight fixtures
- bot-07: trade round/update, no counter, no immediate resource movement
- bot-08: lobby/player UI bot badge, bot turn copy, no internal state UI references

## 8. 미수행 또는 부분 수행 예정 항목

- Chrome 시크릿, Edge, 다른 기기 Chrome:
  - 현재 자동화 가능한 브라우저 표면이 Codex in-app browser로 제한되어 미수행 가능성이 있다.
- 320px/375px/780px 실제 viewport 시각 검증:
  - Browser API에서 viewport resize 기능이 제공되지 않으면 CSS 정적 회귀와 1280px 실제 화면으로 대체한다.
- 오프라인 3/4 실제 브라우저 전체 플레이:
  - 이번 테스트는 온라인 WebSocket 회귀와 봇 통합 smoke 중심으로 수행한다.

## 9. 완료 기준

- 자동/WebSocket 테스트 통과
- public state leak 없음
- bot-01~bot-08 gate pass/fail 기록
- P0/P1 없음
- 수행하지 못한 테스트와 남은 위험을 최종 보고서와 known issues에 기록
