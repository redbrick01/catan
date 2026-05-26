# Bot 02 턴 실행기 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/implementation_plans/2026-05-26_bot-00-basic-bot-roadmap.md
docs/implementation_plans/2026-05-26_bot-01-player-model-lobby-plan.md
docs/implementation_plans/2026-05-26_bot-02-turn-runner-plan.md
catan_bot_development_process_guideline.md
catan_playbot_reference_guideline.md
```

## 목표

현재 actor가 봇일 때 서버가 안전하게 bot runner를 예약하고, 사람 command와 같은 검증 경로를 통해 최소 행동을 실행하는 기반을 만든다.

bot-02의 목표는 똑똑한 행동이 아니라 다음 안정성 기반이다.

```text
봇 actor 감지
room 단위 runner 상태 관리
중복 예약/중복 command 방지
stale 예약 무효화
play phase 최소 rollDice/endTurn 실행
setup/pending/trade actor는 감지만 하고 자동 처리하지 않음
runner/timer 내부 상태 public state 미노출
```

## 변경 파일

```text
server.js
```

UI 변경은 bot-02 범위에서 최소화했고, 봇 턴 중 사람이 누른 command는 기존 서버 검증과 “내 차례 아님” 흐름을 따른다.

## 구현 요약

### 봇 actor 감지

- `isBotPlayer(player)` helper로 봇 player를 판정한다.
- `currentBotActor(room)`에서 현재 room/matchState 기준 봇 actor를 감지한다.
- bot-02의 기본 범위에서는 다음을 구분했다.
  - play phase active player가 봇
  - setup phase setup actor가 봇
  - pending actor가 봇
  - player trade responder가 봇
- bot-02에서는 setup/pending/trade를 자동 처리하지 않고 감지 기반만 마련했다.

### room 단위 botRunner 상태

`room.botRunner`는 public state에 포함하지 않는 내부 상태다.

관리 항목:

```text
timerId
runId
step
scheduledRevision
scheduledRoomStatus
scheduledActorSeatIndex
scheduledPhase
scheduledPendingKind
commandInFlight
lastCommandRevision
```

현재 통합 구현에서는 이후 단계에서 필요한 다음 내부 상태도 같은 runner에 추가되었다.

```text
turnActionState
completedPendingSignatures
failedPendingSignatures
completedTradeResponseSignatures
```

이 값들도 public state에 노출되지 않는다.

bot-02 baseline과 후속 단계 확장 상태의 구분:

| 구분 | 상태/역할 | bot-02에서의 의미 |
| --- | --- | --- |
| baseline | `timerId`, `runId`, `step` | room 단위 예약과 실행 단계를 추적 |
| baseline | `scheduledRevision`, `scheduledRoomStatus`, `scheduledActorSeatIndex`, `scheduledPhase`, `scheduledPendingKind` | 실행 직전 stale 예약을 무효화하기 위한 signature |
| baseline | `commandInFlight` | 같은 순간에 봇 command가 중복 실행되지 않도록 하는 lock |
| baseline 보조 | `lastCommandRevision` | command 성공 후 관측/진단용으로 최신 revision을 기록하는 보조 상태. 중복 방지의 핵심 조건은 `runId`, scheduled signature, `commandInFlight`다. |
| 후속 단계 확장 | `turnActionState` | bot-04 이후 일반 턴 행동 제한과 실패 반복 방지에 사용 |
| 후속 단계 확장 | `completedPendingSignatures`, `failedPendingSignatures` | bot-05 이후 pending action 중복 처리 방지에 사용 |
| 후속 단계 확장 | `completedTradeResponseSignatures` | bot-07 이후 player trade 중복 응답 방지에 사용 |

### 예약 및 무효화

- `scheduleBotRunner(room)`는 한 곳에서 runner 예약을 담당한다.
- `broadcastState(room)` 이후 hook으로 runner 예약을 연결했다.
- 기존 timer가 있으면 새 예약 전에 clear한다.
- `commandInFlight` 중에는 새 bot command를 실행하지 않는다.
- `runId`, scheduled revision/status/actor/phase/pending kind를 저장하고, 실행 직전 `isBotRunnerScheduleCurrent(room, runner)`로 stale 예약을 무효화한다.
- room이 삭제/종료되거나 더 이상 playing 상태가 아니면 timer를 정리한다.

runner 예약/실행 sequence:

```text
1. command handler가 state를 변경한다.
2. `broadcastState(room)`가 viewer별 state를 보낸다.
3. `broadcastState(room)` 마지막에서 `scheduleBotRunner(room)`를 한 번 호출한다.
4. `scheduleBotRunner(room)`가 현재 actor와 revision/phase/pending kind를 저장한다.
5. 같은 signature의 timer가 이미 있으면 새 예약을 만들지 않는다.
6. timer 실행 시 `runScheduledBotStep(room, runId)`가 실행된다.
7. 실행 직전 `isBotRunnerScheduleCurrent(room, runner)`가 room/status/revision/actor/phase/pending kind/`commandInFlight`를 재검증한다.
8. 검증을 통과한 경우에만 `runBotCommand`로 기존 command handler를 호출한다.
9. `finally`에서 `commandInFlight`를 해제하고, room이 아직 playing이면 최신 state 기준으로 다음 runner를 예약한다.
```

### command 실행 경로

- `runBotCommand(room, botPlayer, payload)`는 봇 전용 내부 command adapter다.
- 봇은 state를 직접 수정하지 않고 기존 command handler를 호출한다.
- `botCommandToken`으로 봇 player 인증만 내부적으로 통과시키고, 실제 게임 규칙 검증은 사람 command와 같은 handler를 사용한다.
- bot-02 기준 지원 최소 command:
  - `rollDice`
  - `endTurn`

이후 단계에서 같은 adapter를 통해 build, trade, pending, dev card command가 확장되었다.

### play phase 최소 행동

bot-02의 play phase 최소 동작:

```text
active player가 봇
game.phase === "play"
blocking/pending 상태 없음
rolled === false 이면 rollDice
rolled === true 이고 pending/blocking 상태가 없으면 endTurn
```

중요 안전 조건:

```text
rollDice 결과 7 또는 pendingAction이 생기면 endTurn을 시도하지 않음
pendingPlayerTrade가 있으면 일반 행동/endTurn을 시도하지 않음
pendingFreeRoads, pendingDiscards, pendingRobberVictims 등이 있으면 중단
winner가 있으면 실행하지 않음
```

## 제외 범위 준수

bot-02에서는 다음을 구현하지 않았다.

```text
봇 초기 배치 자동화
봇 건설/교역/개발 카드 판단
7/강도/pending 자동 처리
플레이어 거래 자동 응답
UI/로그 고도화
MCTS/RL/복잡한 전략
```

해당 기능들은 bot-03~bot-08 단계에서 별도 범위로 구현되었다.

## 안정성 설계 반영

### 중복 실행 방지

- 같은 room에 runner timer를 하나만 유지한다.
- 새 예약 시 기존 timer를 clear한다.
- `commandInFlight` 중에는 예약/실행을 막는다.
- 실행 직전 `runId`와 scheduled state가 현재 상태와 일치하는지 확인한다.
- command 성공 후 최신 state를 기준으로 다음 runner를 다시 예약한다.

### stale 예약 방지

실행 직전 확인 항목:

```text
room 존재 여부
room.status
room.revision
game.phase
active/setup actor
pending kind
commandInFlight
```

### 예외 처리

- runner 내부 예외는 `console.warn` 수준으로 기록하고 서버를 죽이지 않는다.
- `finally`에서 `commandInFlight`를 false로 되돌린다.
- room이 아직 존재하고 playing이면 다음 runner 예약을 시도한다.

### 종료 정리

- `cancelBotRunner(room)`와 `clearBotRunnerTimer(room)`로 timer와 runner 내부 상태를 정리한다.
- room 삭제/종료/leave/endRoom 경로에서 runner를 정리한다.

## 검증 결과

bot-09 안정화 단계에서 bot-02 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\bot-09-stabilization-regression-test.js
```

관련 회귀 테스트:

```powershell
node scripts\online-08-basic-building-ws-test.js
node scripts\online-09-bank-trade-ws-test.js
node scripts\online-10-player-trade-ws-test.js
node scripts\online-11-development-cards-ws-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
```

bot-02 관련 확인:

```text
사람 1 + 봇 2 게임에서 play phase 진입 후 봇 턴 자동 진행
연속 봇 턴 이후 사람 턴으로 정상 복귀
public state에 botRunner/timerId/runId/turnActionState 미노출
서버 stderr에 fatal-looking output 없음
사람 전용 3인 온라인 회귀 smoke 통과
```

구체적인 bot-09 확인 근거:

- `testRunnerTurnsAndTrade()`에서 사람이 `endTurn`한 뒤 두 봇이 연속 턴을 마치고 `active === 0`으로 돌아오는지 `waitFor(..., "two bots finish consecutive turns")`로 확인했다.
- 같은 검사에서 `game.round < 2`이면 실패 처리해, 사람이 다시 턴을 받는 최소 순환을 검증했다.
- `assertNoPublicLeak(host.state, "state after bot runner turns")`로 runner 내부 상태가 public state에 노출되지 않는지 확인했다.
- 서버 stderr에 fatal-looking output이 없는지 bot-09 실행 결과에서 확인했다.
- 단, 같은 revision에서 `scheduleBotRunner`를 여러 번 직접 호출하는 단독 테스트와 room 종료 후 `timerId`를 직접 검사하는 assertion은 아직 별도 테스트로 분리되어 있지 않다. 현재 근거는 통합 smoke와 코드 구조 확인이다.

## 비공개 정보 및 public state 점검

노출 금지 항목:

```text
botRunner
timerId
runId
turnActionState
commandInFlight
lastCommandRevision
internal pending/trade signature set
```

결과: bot-09 public state smoke에서 노출 없음.

## 남은 위험

- bot-02 단독 시점에서는 setup phase 봇 actor를 자동 처리하지 않으므로, 봇 포함 게임의 setup 완료는 bot-03 이후 단계에 의존한다.
- pending 처리는 bot-05 이후 단계에 의존한다.
- 같은 revision에서 runner 예약 함수를 반복 호출하는 단독 회귀 테스트는 아직 없다. 현재 중복 방지는 `sameSchedule`, 기존 timer clear, `runId`, `commandInFlight`, scheduled signature 검증에 의존한다.
- room 종료/삭제 후 timer cleanup을 직접 assert하는 전용 테스트는 아직 없다. 현재 정리는 `cancelBotRunner(room)`, `clearBotRunnerTimer(room)`와 종료/leave 경로의 코드 구조 및 bot-09 통합 smoke로 확인했다.
- 장시간 운영/부하 테스트는 bot-09 제외 범위라 수행하지 않았다.

## 최종 판정

완료.

bot-02의 핵심 계약인 “봇 actor를 감지하고, room 단위 runner가 stale/중복 실행 없이 사람 command와 같은 검증 경로로 최소 roll/endTurn을 수행한다”는 구현 및 통합 회귀 검증을 통과했다.

## 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- bot-02 baseline runner state와 bot-03 이후 확장 state를 표로 분리했다.
- `broadcastState -> scheduleBotRunner -> runScheduledBotStep -> runBotCommand` sequence를 추가해 runner hook 위치와 stale 검증 흐름을 명시했다.
- `lastCommandRevision`은 중복 방지 핵심 조건이 아니라 command 성공 후 관측/진단용 보조 상태라고 명시했다.
- bot-09의 `testRunnerTurnsAndTrade()`가 확인한 연속 봇 턴 후 사람 턴 복귀, public leak 검사 근거를 검증 섹션에 연결했다.
- 같은 revision 반복 예약 단독 테스트와 room 종료 후 timer cleanup 직접 assertion은 아직 부족한 근거로 남은 위험에 명시했다.
