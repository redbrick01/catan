# Bot 04 일반 턴 기본 행동 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/plans/2026-05-26_bot-02-turn-runner-plan.md
docs/plans/2026-05-26_bot-03-initial-placement-plan.md
docs/plans/2026-05-26_bot-04-basic-actions-plan.md
docs/guides/bot-development-process-guideline.md
docs/reference/playbot-reference-guideline.md
```

## 목표

play phase에서 봇이 주사위를 굴린 뒤 기본적인 일반 턴 행동을 수행하고, 더 할 수 없으면 안전하게 턴을 종료하게 한다.

목표는 강한 전략이 아니라 “멈추지 않는 기본 행동”이다.

지원 행동:

```text
buildCity
buildSettlement
buildRoad
buyDevCard
bankTrade 1회
endTurn fallback
```

## 변경 파일

```text
server.js
```

UI 변경은 bot-04 범위에서 추가하지 않았다. 봇 행동 결과는 기존 state broadcast로 반영된다.

## 구현 요약

### 일반 턴 진입 조건

`executeBotMainTurn(room, actor, runner)`에서 play phase 봇 턴을 처리한다.

진입 조건:

```text
game.phase === "play"
active player가 봇
winner 없음
rolled === true
blocking 상태 없음
```

`rolled === false`인 경우는 bot runner가 먼저 `rollDice`를 실행한다. rollDice 후 7 또는 pending/blocking 상태가 생기면 일반 행동 루프는 중단된다.

현재 통합 코드에서의 주의점:

```text
bot-04 baseline: rollDice 이후 buildCity/buildSettlement/buildRoad/buyDevCard/bankTrade/endTurn fallback
bot-06 확장: `executeBotMainTurn` 앞단에서 `executeBotDevCard`가 먼저 실행될 수 있음
```

따라서 이 보고서의 bot-04 범위는 개발 카드 “구매”까지이며, 개발 카드 “사용” 판단은 bot-06 보고서에서 별도 범위로 다룬다.

### blocking 상태

`hasBotBlockingState(room)`에서 일반 행동을 멈춰야 하는 상태를 공통으로 판정한다.

blocking 항목:

```text
room.pendingPlayerTrade 존재
game.pendingAction 존재
game.pendingDiscards 미완료 존재
game.pendingRobberVictims 존재
game.pendingFreeRoads > 0
winner 존재
```

이 상태에서는 build/buy/bankTrade/endTurn fallback을 시도하지 않는다.

### turnActionState

현재 봇 턴 한정 상태를 `room.botRunner.turnActionState`에 저장한다.

관리 항목:

```text
seatIndex
round
turnStartedRevision
majorActionsUsed
bankTradesUsed
attemptedGoals
attemptedCommands
```

폐기 조건:

```text
seatIndex 변경
round 변경
game.active 변경
game.rolled 변경
```

public state에는 노출하지 않는다.

### 행동 제한

상수:

```text
botMajorActionLimit = 2
botBankTradeLimit = 1
```

적용:

```text
주요 행동(buildCity/buildSettlement/buildRoad/buyDevCard) 최대 2회
bankTrade 최대 1회
같은 goal type 실패 재시도 최대 1회
같은 command name + target id 실패 반복 금지
```

### 목표 우선순위

봇은 매 command 후 최신 matchState를 다시 읽고 목표를 재계산한다.

우선순위:

```text
1. 즉시 승리 가능한 도시/정착지
2. 도시 건설
3. 정착지 건설
4. 좋은 정착지 후보로 향하는 도로
5. 개발 카드 구매
6. bankTrade 1회로 위 목표 달성
7. endTurn
```

### helper

추가/정리된 주요 helper:

```text
canAfford
costDistance
chooseBotBuildCity
chooseBotBuildSettlement
chooseBotBuildRoad
chooseBotBuyDevCard
chooseBotBankTradeForGoal
executeBotMainTurn
```

### 도시 선택

조건:

```text
cities > 0
업그레이드 가능한 내 settlement 존재
비용 지불 가능하거나 bankTrade 1회로 가능
```

선호:

```text
생산 기대값 높은 정착지
6/8 타일
부족 자원 생산
robber가 막지 않는 타일
```

### 정착지 선택

조건:

```text
settlements > 0
합법 정착지 후보
현재 도로와 연결된 후보
비용 지불 가능하거나 bankTrade 1회로 가능
```

bot-03 초기 배치 평가 함수를 재사용 가능한 방향으로 활용하고, 항구/자원 다양성 가산을 반영한다.

### 도로 선택

조건:

```text
roads > 0
합법 도로 후보
내 기존 도로/정착지와 연결
```

선호:

```text
좋은 정착지 후보에 가까워지는 edge
탐색 깊이 기본 2 edge 이내
정착지 평가 점수
낮은 edgeId deterministic tie-break
```

최장 교역로 전체 계산은 목표 점수로 사용하지 않는다.

### 개발 카드 구매

조건:

```text
devDeck이 비어 있지 않음
비용 지불 가능
blocking 상태 없음
```

bot-04에서는 개발 카드 구매만 수행한다.

제외:

```text
구매한 카드 즉시 사용
개발 카드 사용 판단
dev deck 맨 위 카드 타입 기반 판단
```

개발 카드 사용은 bot-06 범위다.

### bankTrade

조건:

```text
선택 목표를 즉시 가능하게 만들 때만 사용
부족 자원이 정확히 1장일 때 우선 고려
받을 자원은 부족 자원
내줄 자원은 목표 비용에 쓰이지 않는 초과 자원
기존 항구/은행 ratio 규칙 사용
은행에 받을 자원이 1장 이상 존재
봇이 내줄 자원을 ratio 이상 보유
```

bankTrade 후 같은 목표를 최신 state에서 다시 검증한다. 교역 후 목표가 불가능하면 추가 교역 없이 다른 행동 또는 endTurn으로 넘어간다.

bot-04의 bankTrade 실행 경로는 1차 범위에 맞춰 부족 자원이 정확히 1장일 때만 교역 후보를 만든다. 다른 helper에서 비용 거리 계산은 더 넓은 정보를 제공하지만, 실제 `chooseBotBankTradeForGoal` 실행 조건은 `missingTotal === 1`이다.

### command 결과 처리

`runBotCommandSafely`와 action loop에서 command 결과를 분류한다.

분류:

```text
success
validationFailure
blockingState
fatal
```

처리:

```text
validationFailure: attemptedCommands에 기록하고 다음 후보로 진행
blockingState: 일반 행동 루프 즉시 중단
fatal: runner 로그 후 중단
```

봇은 resources/buildings/edges/vertices를 직접 수정하지 않는다.

### 후속 단계 통합 상태

bot-04 이후 단계가 합쳐진 현재 코드에서는 `executeBotMainTurn` 안에서 bot-06의 `executeBotDevCard`가 주요 행동 루프보다 먼저 호출된다. 이 확장은 다음 원칙을 따른다.

```text
개발 카드 사용은 `majorActionsUsed`에 포함하지 않음
blocking 상태에서는 개발 카드 사용도 건너뜀
knight/yearPlenty 사용 후 pending이 생기면 bot-04 일반 행동 루프를 중단
victory/monopoly/roadBuilding 자동 사용은 bot-06 정책에 따름
```

bot-04 baseline 검토 시에는 이 부분을 “후속 단계 확장”으로 구분해서 본다.

## 제외 범위 준수

bot-04에서는 다음을 구현하지 않았다.

```text
플레이어 거래 제안
7/강도/pending 처리
개발 카드 사용
구매한 개발 카드 즉시 사용
Monopoly/Road Building/Knight/Year of Plenty 사용
복잡한 최장 교역로 전략
MCTS/RL
UI/로그 고도화
```

## 안정성 설계 반영

### 최신 state 재계산

각 command 후 최신 `room.matchState`를 다시 읽고 다음 행동을 선택한다. stale 후보를 다음 command에 재사용하지 않는다.

### pending 안전성

rollDice, build, buyDevCard, bankTrade 이후 pending/blocking 상태가 생기면 일반 행동 루프를 중단한다. pending 상태에서 endTurn fallback을 강제로 호출하지 않는다.

### 반복 실패 방지

같은 턴에서 다음 key를 반복하지 않는다.

```text
buildCity:vertexId
buildSettlement:vertexId
buildRoad:edgeId
bankTrade:give:get
buyDevCard
endTurn
```

### public state 보호

다음 내부 정보는 public state에 노출하지 않는다.

```text
turnActionState
attemptedGoals
attemptedCommands
평가 점수
후보 목록
runner timer/runId
```

## 검증 결과

bot-09 안정화 단계에서 bot-04 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\online-08-basic-building-ws-test.js
node scripts\online-09-bank-trade-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
```

bot-04 관련 확인:

```text
봇이 rolled false 상태에서 rollDice 실행
연속 봇 턴 후 사람 턴으로 복귀
pendingPlayerTrade 중 일반 행동/endTurn 시도 없음
pending/blocking state public leak 없음
사람 전용 3인 온라인 회귀 smoke 통과
basic building/bank trade 기존 WebSocket 회귀 통과
```

bot-09 통합 테스트에서 직접 확인한 항목:

```text
bot runner action/trade gate 통과
public state에 turnActionState 미노출
서버 fatal-looking stderr 없음
```

구체적인 bot-09 확인 근거:

- `testRunnerTurnsAndTrade()`에서 사람이 `rollDice` 후 `endTurn`을 실행하면 봇 2명이 연속으로 턴을 처리하고 다시 사람 active seat로 돌아오는지 확인했다.
- `game.round < 2`이면 실패 처리해, 봇 턴이 최소 한 바퀴 진행됐는지 확인했다.
- `assertNoPublicLeak(host.state, "state after bot runner turns")`로 `turnActionState` 등 runner 내부 상태 미노출을 확인했다.
- player trade pending 중에는 bot-04 일반 행동이 아니라 bot-07 trade response 경로가 우선되는 것을 같은 테스트에서 확인했다.
- 기존 `online-08-basic-building-ws-test.js`와 `online-09-bank-trade-ws-test.js`는 사람 command 기준의 build/bankTrade 서버 검증 회귀를 담당한다.

직접 검증되지 않은 항목:

- 봇이 도시, 정착지, 도로, 개발 카드 구매를 각각 수행하도록 강제한 bot-04 전용 fixture는 아직 없다.
- 승점 9점 상태에서 winningCity 또는 winningSettlement가 우선되는지 확인하는 fixture는 아직 없다.
- pending 상태에서 build/buy/bankTrade/endTurn command가 호출되지 않았음을 command count로 직접 세는 테스트는 아직 없다. 현재 근거는 blocking guard와 통합 smoke다.

## 비공개 정보 점검

bot-04 판단은 봇 자신의 자원과 공개 board/player state만 사용한다.

노출 금지 항목:

```text
turnActionState
attempted command set
goal evaluation score
candidate list
상대 숨은 dev card type
상대 정확한 resource 종류
```

결과: bot-09 public state smoke에서 노출 없음.

## 남은 위험

- 봇 판단 품질은 기본 heuristic 수준이다.
- 도시/정착지/도로/개발 카드 구매/bankTrade 후 행동 실행을 각각 강제하는 bot-04 전용 fixture는 아직 없다.
- 즉시 승리 가능한 도시/정착지 우선순위는 구현되어 있지만, 승점 9점 전용 자동 테스트는 아직 없다.
- pending 상태에서 command 미호출을 command count로 세는 테스트는 아직 없다.
- 실제 특정 자원 fixture별 도시/정착지/도로/개발 카드 구매를 모두 시각적으로 재확인하는 브라우저 테스트는 bot-09에서 수행하지 않았다.
- 장시간 봇 게임 soak test는 제외 범위라 수행하지 않았다.

## 최종 판정

완료.

bot-04의 핵심 계약인 “play phase에서 봇이 blocking 상태를 존중하며 기본 건설/구매/은행 교역/턴 종료를 shared command 검증 경로로 수행하고, 한 턴 제한과 반복 실패 방지를 지킨다”는 구현 및 통합 회귀 검증을 통과했다.

## 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- bot-04 baseline과 bot-06 이후 통합 main turn 흐름을 `일반 턴 진입 조건` 및 `후속 단계 통합 상태` 섹션으로 분리해 명시했다.
- bankTrade 실행 경로는 실제로 `missingTotal === 1`일 때만 후보를 만든다고 보강했다.
- bot-09의 `testRunnerTurnsAndTrade()`와 기존 online-08/09 회귀가 각각 어떤 근거를 제공하는지 검증 섹션에 연결했다.
- 도시/정착지/도로/개발 카드 구매/bankTrade 직접 fixture, 승점 9점 우선순위 fixture, pending 상태 command count 테스트가 아직 없다는 점을 `직접 검증되지 않은 항목`과 `남은 위험`에 명시했다.
