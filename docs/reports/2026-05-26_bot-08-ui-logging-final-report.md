# Bot 08 UI 및 로그 정리 최종 보고서

## 1. 참조 문서

- `docs/plans/2026-05-26_bot-08-ui-logging-plan.md`
- `docs/plans/2026-05-26_bot-01-player-model-lobby-plan.md`
- `docs/plans/2026-05-26_bot-07-trade-response-plan.md`
- `docs/guides/bot-development-process-guideline.md`
- `docs/reference/playbot-reference-guideline.md`

## 2. 목표

bot-08 단계의 목표는 bot-01~bot-07에서 구현된 봇 기능을 사람 플레이어가 로비와 게임 화면에서 명확히 인식할 수 있게 정리하는 것이다. 새 게임 로직이나 봇 전략은 추가하지 않고, public state에 이미 제공되는 `isBot`, `botDifficulty`만 사용해 표시, 버튼 비활성 사유, 로그, pending/trade UI 우선순위를 정리했다.

## 3. 변경 요약

### 3.1 서버 public state 점검

- `publicPlayer`와 `makePlayerView` 경로에서 `isBot`, `botDifficulty`가 포함되는 계약을 확인했다.
- public state에는 다음 내부 정보가 노출되지 않는 구조를 유지했다.
  - `token`
  - `botRunner`
  - `timerId`
  - `runId`
  - 평가 점수와 후보 목록
  - `setupPlacement`
  - 비소유자에게 숨겨져야 하는 개발 카드 타입
  - 허용되지 않은 viewer에게 훔친 자원 종류
- bot-08 단계에서 서버의 봇 행동 판단, runner, 거래 정책은 변경하지 않았다.
- public state 필터링 경로는 다음 기준으로 재점검했다.
  - `makeRoomState`: viewer별 room state를 만들며 `publicPlayer`, `makePlayerView`, `makeMatchStateView`를 통해 공개 가능한 필드만 조립한다.
  - `publicPlayer`: 로비/방 player에는 `isBot`, `botDifficulty`만 추가 공개하고 `token`은 포함하지 않는다.
  - `makePlayerView`: 게임 player view에는 봇 식별 필드를 포함하되 viewer별 resource/dev card 공개 정책을 유지한다.
  - `makeMatchStateView`: `setupPlacement` 같은 서버 내부 진행 상태를 제거하고, pending/trade/dev card view는 viewer별 projection을 사용한다.
- `scripts/bot-08-ui-logging-regression-test.js`에서 클라이언트 코드가 `botRunner`, `setupPlacement`를 참조하지 않는지 정적으로 확인했다.

### 3.2 로비 UI

- 로비 player row에서 `player.isBot`을 인식해 봇 배지를 표시하도록 정리했다.
- 봇 row는 사람 연결 상태인 `연결됨/끊김` 대신 `봇 · 준비됨` 계열 문구로 표시된다.
- 봇 제거 버튼은 방장, lobby 상태, 해당 row가 봇인 경우에만 표시된다.
- 봇 추가 버튼은 방장과 lobby 상태에서만 사용할 수 있게 유지했다.
- playing 상태에서는 봇 추가/제거 조작이 노출되지 않거나 비활성화된다.
- 로비 인원 수는 사람과 봇을 합산한 총 플레이어 수를 기준으로 표시된다.

### 3.3 게임 player card 및 좌석 표시

- 좌석 이름과 player card에 봇 배지를 표시한다.
- 현재 active player가 봇이면 `봇 처리 중` 상태가 player card에 표시된다.
- 봇은 사람과 동일한 카드 구조를 사용하되, private resource/dev card view 정책은 기존 서버 view 정책을 따른다.
- active player가 봇인 경우 안내 문구는 `봇 차례`와 행동 처리 중 상태를 보여준다.

### 3.4 버튼 상태와 disabled reason

- 봇 턴에는 사람이 누를 수 있는 주요 게임 액션 버튼이 비활성화된다.
- 비활성 사유는 기존의 단순한 `내 차례가 아닙니다.` 흐름보다 봇 상황을 먼저 설명하도록 정리했다.
  - `봇 차례입니다.`
  - `봇이 행동을 처리하는 중입니다.`
  - `응답이 필요한 거래/버리기가 있습니다.`
- 새 게임, 방 나가기 같은 비게임 명령은 기존 정책을 유지했다.

### 3.5 pending/trade UI 우선순위

- 사람이 직접 응답해야 하는 pending modal과 player trade UI가 봇 턴 대기 안내보다 우선하도록 정리했다.
- 봇 처리 중 안내가 사람 discard, robber victim 선택, player trade 응답 UI를 덮어쓰지 않게 했다.
- 다른 플레이어나 봇이 처리 중인 pending은 대기 안내로 표현하되, 사람이 응답해야 하는 UI를 막지 않는다.
- 실제 표시 흐름은 `showOnlinePendingActionModal(game.pendingActionView)`를 먼저 확인하고, 그 다음 `showPendingPlayerTradeModal()`을 호출하는 순서다.
- `viewerMustAnswerPending`, `viewerMustAnswerTrade`는 사람 viewer가 지금 응답해야 하는지를 판단하는 guard로 사용되며, 이 조건이 참일 때 봇 턴 대기 문구가 필수 응답 UI보다 앞서지 않게 한다.
- 다만 이번 보고서의 확인은 코드 점검, 정적 회귀 테스트, 브라우저 smoke 중심이며, 봇 차례 중 사람 discard/trade 모달이 동시에 필요한 상황을 만드는 동적 fixture는 별도 자동 테스트로 고정하지 못했다.

### 3.6 로그 표시

- 봇 행동 로그는 public action 결과만 짧게 표시한다.
- 허용 로그 예:
  - 봇 주사위 굴림
  - 봇 강도 이동
  - 봇 거래 응답
  - 봇 개발 카드 사용
  - 봇 카드 버림
- 전역 로그에는 다음 정보를 표시하지 않는다.
  - 훔친 자원 종류
  - 봇이 보유한 숨은 개발 카드 타입
  - 봇 내부 평가 점수
  - 후보 목록
  - 상대 비공개 정보를 근거로 한 판단 이유
- `logOnlineStateDelta(previousState, state)`는 public state 변화에서 봇 행동 결과를 짧게 표시하는 경로로 확인했다.
- 정적 테스트와 수동 smoke에서 내부 runner/setup 문자열 노출은 발견되지 않았다.
- 단, 각 state delta별 로그 문구를 snapshot으로 고정하는 자동 테스트는 아직 없다.

### 3.7 스타일

- `.bot-badge`와 `.bot-turn-status` 스타일을 추가/정리했다.
- 봇 구분은 색상만이 아니라 텍스트 배지를 함께 사용한다.
- 로비 row와 player row에서 긴 이름, 봇 배지, 제거 버튼이 함께 있어도 줄바꿈이 자연스럽게 일어나도록 정리했다.
- 320px급 모바일 폭에서 버튼, 배지, 이름 영역이 서로 겹치지 않도록 responsive rule을 보강했다.
- 로그 영역은 항목이 쌓여도 control panel 스크롤 흐름을 유지하도록 기존 패턴 안에서 정리했다.

## 4. 주요 구현 위치

- `server.js`
  - public player/view의 봇 식별 필드 및 내부 상태 비노출 점검
- `index.html`
  - 로비 봇 추가 컨트롤 위치와 기존 구조 확인
- `script.js`
  - `botBadgeHtml`
  - `playerDisplayName`
  - `activePlayerIsBot`
  - `viewerMustAnswerPending`
  - `viewerMustAnswerTrade`
  - `logOnlineStateDelta`
  - `renderLobby`
  - `renderSeats`
  - `renderPlayers`
  - 온라인 액션 버튼 disabled reason 처리
- `styles.css`
  - `.bot-badge`
  - `.bot-turn-status`
  - 로비/player row responsive layout

## 5. 제외 범위 준수

- 봇 자동 행동 로직은 변경하지 않았다.
- 봇 전략, 평가 함수, runner scheduling은 변경하지 않았다.
- addBot/removeBot 서버 정책은 변경하지 않았다.
- 봇 설정 화면, 아바타, 난이도 선택 UI는 만들지 않았다.
- 상세 전략 설명 UI, MCTS/RL, 고급 로그 UI는 추가하지 않았다.

## 6. 검증

### 6.1 정적 검증

실행 및 통과:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
```

### 6.2 자동 회귀 검증

실행 및 통과:

```powershell
node scripts\bot-08-ui-logging-regression-test.js
node scripts\bot-09-stabilization-regression-test.js
```

bot-09 안정화 중 함께 확인한 기존 온라인 회귀 테스트:

```powershell
node scripts\online-08-basic-building-ws-test.js
node scripts\online-09-bank-trade-ws-test.js
node scripts\online-10-1-player-trade-ui-static-test.js
node scripts\online-10-player-trade-ws-test.js
node scripts\online-11-development-cards-ws-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
```

`scripts/bot-08-ui-logging-regression-test.js`는 다음 항목을 확인한다.

- `botBadgeHtml`, `player.isBot`, `봇 차례` 또는 `봇 처리 중` 문구 존재
- `viewerMustAnswerPending`, `viewerMustAnswerTrade` helper 존재
- `logOnlineStateDelta` 존재
- `pendingPlayerTrade`, `game.pendingActionView` 흐름 존재
- 클라이언트 코드에 `botRunner`, `setupPlacement` 문자열이 없는지 확인
- `.bot-badge`, `.bot-turn-status`, `@media (max-width: 780px)`, `overflow-wrap: anywhere` CSS 존재
- `lobbyAddBotButton`, `lobbyBotControls` DOM 구조 존재

### 6.3 브라우저 스모크 검증

- URL: `http://127.0.0.1:4173/`
- 브라우저: Codex in-app browser
- 확인 viewport: `1280x720`
- 확인 결과:
  - 봇 배지 표시 확인
  - 게임 시작 화면 표시 확인
  - horizontal overflow 없음
  - 브라우저 console error 없음
  - 온라인 게임 시작 로그 표시 확인
- 320px/375px/780px 조합은 정적 CSS 규칙 확인까지만 수행했고, 실제 DOM 렌더링 스크린샷 검증은 bot-09 안정화 단계에서 추가 확인 대상으로 남겼다.

브라우저 산출물:

- `docs/tests/artifacts/2026-05-26_bot-09-browser-lobby.png`
- `docs/tests/artifacts/2026-05-26_bot-09-browser-game-start.png`
- `docs/tests/artifacts/2026-05-26_bot-09-browser-console.json`

### 6.4 문서 diff 검증

```powershell
git diff --check -- docs\reports\2026-05-26_bot-08-ui-logging-final-report.md
```

## 7. 미수행 및 남은 위험

- 실제 기기 Chrome, Edge, Chrome 시크릿 창 검증은 수행하지 못했다.
- 320px, 375px, 780px viewport는 CSS와 자동/정적 회귀 중심으로 확인했으며, 모든 viewport의 실제 브라우저 스크린샷을 남기지는 못했다.
- 사람 discard/trade modal이 떠 있는 동안 active player가 봇인 복합 상황은 동적 fixture로 고정하지 못했다.
- state delta별 로그 snapshot 테스트는 아직 없으므로, 향후 로그 문구가 늘어날 때 비공개 정보 노출 회귀를 잡는 테스트를 추가할 수 있다.
- 긴 이름 + 봇 배지 + 제거 버튼 조합의 실제 DOM overflow 검증은 정적 CSS 확인 수준이며, 320px 렌더링 fixture는 남은 위험으로 기록한다.
- bot-08 범위에서 P0/P1로 분류할 비공개 정보 노출, 사람 pending/trade UI 차단, 기존 사람 전용 게임 회귀는 확인되지 않았다.
- 남은 항목은 주로 P2/P3 수준의 추가 기기/viewport 시각 검증이다.

## 8. 최종 판정

bot-08 UI 및 로그 정리 구현은 계획된 범위 안에서 완료되었다. 봇은 로비와 게임 화면에서 사람과 구분되어 표시되고, 봇 턴 중 버튼 비활성 사유와 pending/trade 우선순위가 정리되었으며, 전역 로그는 공개 가능한 봇 행동 결과만 표시한다. public state와 UI에는 runner, timer, 평가 점수, 후보 목록, `setupPlacement`, 비공개 카드/자원 정보가 노출되지 않는 것을 확인했다.

## 9. 피드백 반영 내역

- public state 비공개 정보 점검을 `makeRoomState`, `publicPlayer`, `makePlayerView`, `makeMatchStateView` 경로별로 보강했다.
- pending/trade UI 우선순위가 `showOnlinePendingActionModal`, `showPendingPlayerTradeModal`, `viewerMustAnswerPending`, `viewerMustAnswerTrade`를 통해 유지되는 구조를 본문에 추가했다.
- `bot-08-ui-logging-regression-test.js`가 정적 검사 중심이라는 점과 실제로 확인하는 항목을 명시했다.
- 1280x720 브라우저 smoke와 320px/375px/780px 미수행 범위를 분리해 적었다.
- 로그 snapshot, 사람 modal과 봇 턴 대기 안내 동시 상황, 긴 이름 모바일 DOM overflow 검증을 남은 위험으로 유지했다.
