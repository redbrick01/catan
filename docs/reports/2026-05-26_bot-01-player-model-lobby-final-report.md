# Bot 01 플레이어 모델 및 로비 최종 보고서

작성일: 2026-05-26

## 1. 참조 문서

- `docs/plans/2026-05-26_bot-00-basic-bot-roadmap.md`
- `docs/plans/2026-05-26_bot-01-player-model-lobby-plan.md`
- `docs/guides/bot-development-process-guideline.md`
- `docs/reference/playbot-reference-guideline.md`

## 2. 목표

bot-01 단계의 목표는 봇을 온라인 방의 일반 좌석 플레이어로 추가/제거할 수 있게 하고, 게임 시작 시 `matchState.game.players`까지 `isBot`, `botDifficulty`가 전달되는 기반을 만드는 것이다.

이번 단계는 봇 행동 구현이 아니라 플레이어 모델, 로비 조작, 시작 조건, public state 계약을 정리하는 범위다.

## 3. 변경 파일

- `server.js`
- `index.html`
- `script.js`
- `styles.css`

## 4. 구현 요약

### 4.1 서버

- room player와 game player에 `isBot`, `botDifficulty` 계약을 추가했다.
- `createBotPlayer`, `nextBotName`, `isBotPlayer` 계열 helper를 추가했다.
- WebSocket command dispatch에 `addBot`, `removeBot`을 연결했다.
- `addBot` 정책:
  - 방장만 가능
  - `room.status === "lobby"`에서만 가능
  - 사람+봇 합산 총 플레이어 수가 `maxPlayers` 이상이면 `ROOM_FULL`
  - 봇 이름은 `봇 1`, `봇 2` 계열로 생성
  - 이름 생성 정책은 현재 로비에 남아 있는 봇 이름과 충돌하지 않는 가장 낮은 번호를 deterministic하게 선택하는 방식이다. 따라서 봇을 제거한 뒤 다시 추가하면 비어 있는 번호가 재사용될 수 있다.
  - `botDifficulty`는 `"basic"`
- `removeBot` 정책:
  - 방장만 가능
  - lobby 상태에서만 가능
  - payload `playerId`로 지정된 `isBot` player만 제거 가능
  - 사람 player 제거 요청은 거절
- `joinRoom`은 사람+봇 합산 총 플레이어 수가 `maxPlayers` 이상이면 거절한다.
- 사람이 들어올 때 봇을 자동 대체하지 않는다.
- `leaveRoom`/host transfer에서 봇이 host가 되지 않도록 사람 플레이어 기준으로 host를 이전한다.
- 남은 사람이 없고 봇만 남으면 room을 정리한다.
- `startGame` 조건을 다음 기준으로 분리했다.
  - `minHumanPlayers = 1`
  - `minTotalPlayers = 3`
  - `maxPlayers = 4`
  - 사람 플레이어는 connected 필요
  - 봇은 ready로 간주
- `publicPlayer`와 `makePlayerView`에 `isBot`, `botDifficulty`를 포함했다.
- public state에는 `token`, runner, timer, 내부 평가 정보, 후보 목록, `setupPlacement`가 노출되지 않도록 유지했다. 구체적으로 `publicPlayer`는 로비 player 공개 모델을 만들고, `makePlayerView`는 게임 player view를 만들며, `makeMatchStateView`는 `setupPlacement` 같은 내부 game field를 제거한다.
- `createInitialMatchState`/`createGamePlayer` 경로로 `isBot`, `botDifficulty`가 전달된다.

### 4.2 로비 UI

- 온라인 로비에 방장 전용 `봇 추가` 버튼을 추가했다.
- 봇 row에 봇 배지와 제거 버튼을 표시하는 구조를 추가했다.
- 방장 + lobby 상태에서만 봇 추가/제거 컨트롤을 표시하거나 활성화한다.
- playing 상태에서는 봇 추가/제거 UI를 숨기거나 비활성화한다.
- 봇 row는 사람 연결 상태인 `연결됨/끊김` 대신 `봇 · 준비됨` 계열 상태로 표시한다.
- `lobbyStartButton` 활성화 조건을 서버 조건과 맞췄다.
  - 사람 1명 이상
  - 사람+봇 합산 3명 이상
  - 사람은 모두 connected

### 4.3 스타일

- `.bot-badge` 스타일을 추가했다.
- 로비 row에서 긴 이름, 봇 배지, 제거 버튼 조합이 모바일에서 자연스럽게 줄바꿈되도록 보강했다.
- disabled 버튼 상태가 기존 디자인과 어울리도록 유지했다.

## 5. 제외 범위 준수

다음 항목은 bot-01 범위에서 구현하지 않았다.

- 봇 자동 턴 실행
- 봇 초기 배치 판단
- 봇 일반 행동 판단
- 오프라인 봇 UI
- 게임 시작 후 봇 제거/대체
- 봇 난이도 선택 UI
- runner 구현

## 6. 검증 결과

bot-09 안정화 단계에서 `scripts/bot-09-stabilization-regression-test.js`의 `testLobbyAndSetup()` 흐름으로 bot-01 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\bot-09-stabilization-regression-test.js
```

bot-01 관련 확인 항목과 근거:

- 방장 `addBot` 성공: `createBotRoom(2)`가 `addBot`을 2회 호출하고, `bots.length === 2`를 assert한다.
- 봇 공개 모델: 추가된 봇이 모두 `botDifficulty === "basic"`인지 assert한다.
- 봇 이름 안정성: 두 봇의 이름이 비어 있지 않고 서로 다른지 assert한다. 정책은 현재 로비 내 최소 미사용 번호 재사용이다.
- `removeBot` 성공 및 사람 1 + 봇 1 시작 거절: 봇 1명을 제거한 뒤 `startGame`이 `ROOM_NOT_READY`로 거절되는지 확인한다.
- 사람 1 + 봇 2 시작 가능: 봇을 다시 추가하고 `startGame` 이후 setup/play 진행까지 확인한다.
- 사람+봇 합산 4명에서 `addBot` 거절: 4명 상태에서 추가 `addBot`이 `ROOM_FULL`로 거절되는지 확인한다.
- public state 비노출: `assertNoPublicLeak(host.state, "lobby state")`, `assertNoPublicLeak(host.state, "play state after setup")`로 lobby state와 play state를 검사한다.
- 게임 시작 후 `matchState.game.players`에 `isBot`/`botDifficulty` 유지: play phase 진입 후 `game.players.filter((player) => player.isBot).length === 3`을 assert한다.
- 봇 host 방지: host transfer/leaveRoom 구현은 사람 플레이어 목록 기준으로 `hostPlayerId`를 이전한다. bot-09 gate에서는 방장이 유지된 로비 흐름으로 회귀가 없는지 smoke 확인했다.
- 사람 전용 3명 온라인 회귀 smoke 통과: bot-09의 별도 사람 전용 온라인 smoke와 기존 online WebSocket 회귀 테스트가 통과했다.

브라우저 확인:

```text
URL: http://127.0.0.1:4173/
Browser: Codex in-app browser
Viewport observed: 1280x720
Screenshot: docs/tests/artifacts/2026-05-26_bot-09-browser-lobby.png
Console error count: 0
```

## 7. 비공개 정보 점검

노출 금지 항목:

- `token`
- `botRunner`
- `timerId`
- `runId`
- `turnActionState`
- `setupPlacement`
- `candidate`
- `evaluation`
- 비소유자에게 숨겨져야 하는 개발 카드 타입

검사 근거:

- `scripts/bot-09-stabilization-regression-test.js`의 `forbiddenPublicKeys`:
  - `token`
  - `botRunner`
  - `timerId`
  - `runId`
  - `turnActionState`
  - `setupPlacement`
  - `candidate`
  - `evaluation`
- `assertNoPublicLeak` 검사 지점:
  - lobby state
  - play state after setup
  - state after bot runner turns
  - state after bot trade response
  - state after bot pending action
  - state after bot dev cards

결과: bot-09 public state smoke에서 노출 없음.

## 8. 남은 위험

- 320px/375px/780px 실제 viewport 시각 검증은 bot-09에서 자동화 API 제한으로 미수행이다.
- Chrome 시크릿, Edge, 다른 기기 Chrome 검증은 bot-09에서 미수행이다.
- 위 항목은 P0/P1이 아니라 수동 UI 확인이 필요한 P2/P3 잔여 항목으로 기록했다.

## 9. 최종 판정

완료.

bot-01의 핵심 계약인 봇을 온라인 로비의 일반 좌석으로 추가/제거하고, 게임 시작 시 player model까지 `isBot`/`botDifficulty`를 전달한다는 구현 및 회귀 검증을 통과했다.

## 10. 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- bot-09 통합 테스트 중 bot-01에 해당하는 `testLobbyAndSetup()`의 assertion 근거를 `검증 결과` 섹션에 구체적으로 연결했다.
- 봇 이름 생성 정책을 “현재 로비에 남아 있는 봇 이름과 충돌하지 않는 가장 낮은 번호를 deterministic하게 선택하며, 제거된 번호는 재사용될 수 있음”으로 명시했다.
- public state 비노출 근거를 `forbiddenPublicKeys`와 `assertNoPublicLeak` 검사 지점 기준으로 보강했다.
- 남은 위험은 실제 좁은 viewport와 다중 브라우저 수동 확인으로 좁혔다.
