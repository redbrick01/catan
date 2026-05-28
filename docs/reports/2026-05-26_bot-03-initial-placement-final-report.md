# Bot 03 초기 배치 자동화 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/plans/2026-05-26_bot-00-basic-bot-roadmap.md
docs/plans/2026-05-26_bot-02-turn-runner-plan.md
docs/plans/2026-05-26_bot-03-initial-placement-plan.md
docs/guides/bot-development-process-guideline.md
docs/reference/playbot-reference-guideline.md
```

## 목표

setup1/setup2에서 현재 초기 배치 actor가 봇이면 서버가 합법적인 초기 정착지와 도로를 자동으로 배치하게 한다.

봇 판단은 후보 선택까지만 수행하고, 실제 상태 변경은 기존 `placeInitialSettlement`/`placeInitialRoad` command 검증 경로를 통과한다.

## 변경 파일

```text
server.js
```

UI 변경은 bot-03 범위에서 추가하지 않았다. 봇 초기 배치 결과는 기존 state broadcast로 보드와 플레이어 상태에 반영된다.

## 구현 요약

### setup actor 감지

- bot-02 runner의 `currentBotActor(room)` 흐름에서 setup phase의 봇 actor를 감지한다.
- 현재 setup actor가 봇이고 `setupPlacement`가 없으면 정착지 배치 단계로 본다.
- 현재 setup actor가 봇이고 `setupPlacement`가 있으면 도로 배치 단계로 본다.

### 정착지 선택

`chooseBotInitialSettlement(matchState, botSeatIndex, phase, excludedVertexIds)`를 추가했다.

선택 기준:

```text
합법 vertex만 후보
거리 규칙 준수
생산 확률 점수 반영
자원 다양성 반영
wood/brick/wheat/sheep 초기 선호
setup2에서는 부족 자원 보완과 ore/wheat 가치 반영
desert/no production 감점
harbor 가산점
deterministic tie-break
```

후보가 없으면 runner는 상태를 직접 고치지 않고 서버 로그에 이유를 남기며 중단한다.

합법성 보장 경로:

```text
1. `getLegalInitialSettlementVertices(matchState)`가 현재 board 기준 합법 후보를 만든다.
2. `isLegalInitialSettlementVertex(matchState, vertexId)`가 점유 여부와 거리 규칙을 검사한다.
3. 봇은 후보 선택만 수행한다.
4. 실제 배치는 `placeInitialSettlement` command로 전송된다.
5. `validateInitialPlacementCommand`와 `handlePlaceInitialSettlement`가 phase, setupIndex actor, 중복 점유, 거리 규칙, 말 재고를 다시 검증한다.
```

### 도로 선택

`chooseBotInitialRoad(matchState, botSeatIndex, settlementVertexId, excludedEdgeIds)`를 추가했다.

`botSeatIndex` 인자는 현재 초기 도로 점수 계산에서는 직접 사용하지 않는다. 다만 helper signature를 정착지 선택 helper와 맞추고, 향후 player별 확장성 평가나 상대 차단 평가를 추가할 수 있도록 유지했다.

선택 기준:

```text
방금 놓은 settlementVertexId에 연결된 합법 edge만 후보
기존 봇 도로/정착지 전체가 아니라 방금 놓은 정착지를 기준으로 선택
확장성 좋은 방향 가산점
deterministic tie-break
```

도로 후보가 없거나 command가 실패하면 fallback 후보를 한 번 재계산한다. 그래도 실패하면 state를 직접 수정하지 않고 중단한다.

도로 합법성 보장 경로:

```text
1. `setupPlacement.settlementVertexId`를 기준으로 직접 연결된 빈 edge만 후보로 삼는다.
2. 봇은 edge 후보 선택만 수행한다.
3. 실제 배치는 `placeInitialRoad` command로 전송된다.
4. `validateInitialPlacementCommand`와 `handlePlaceInitialRoad`가 phase, setupIndex actor, pending settlement 존재, edge 점유, 도로 연결, 말 재고를 다시 검증한다.
```

### setupPlacement 내부 상태

정착지 command 성공 후 서버 내부 game state에 다음 값을 저장한다.

```js
matchState.game.setupPlacement = {
  seatIndex,
  settlementVertexId,
  phase
};
```

목적:

```text
정착지 command와 도로 command 사이에 broadcast/revision/timer 취소가 있어도 복구 가능
runner local state에만 의존하지 않음
도로는 반드시 방금 놓은 정착지를 기준으로 선택
```

도로 배치 성공 후 `setupPlacement`는 즉시 `null`로 clear된다.

`makeMatchStateView`에서는 `setupPlacement`를 제거해 public state에 노출하지 않는다.

### command 실행 경로

봇 초기 배치 command는 모두 `runBotCommand`를 통해 실행된다.

사용 command:

```text
placeInitialSettlement
placeInitialRoad
```

따라서 다음 검증은 기존 사람 command와 같은 경로를 통과한다.

```text
setup phase 여부
현재 setupIndex actor 여부
정착지 거리 규칙
도로 연결 규칙
중복 점유 여부
setup1/setup2 순서
setup2 초기 자원 지급
```

### setup 순서 유지

봇은 `setupIndex`를 직접 조작하지 않는다.

기존 서버 setup 진행 로직을 그대로 사용한다.

```text
3인 setup1: 0 -> 1 -> 2
3인 setup2: 2 -> 1 -> 0
4인 setup1: 0 -> 1 -> 2 -> 3
4인 setup2: 3 -> 2 -> 1 -> 0
```

## 제외 범위 준수

bot-03에서는 다음을 구현하지 않았다.

```text
play phase 일반 행동
일반 턴 건설/교역 판단
7/강도/pending 처리
개발 카드 처리
거래 응답 처리
고급 전략/MCTS/RL
UI/로그 고도화
```

## 안정성 설계 반영

### 최신 state 재읽기

정착지 배치 후 같은 오래된 후보 state를 이어 쓰지 않는다.

흐름:

```text
1. 최신 state 기준 `getLegalInitialSettlementVertices` 후보 생성
2. `chooseBotInitialSettlement`로 후보 선택
3. `placeInitialSettlement` 실행
4. 기존 command handler가 `setupPlacement` 저장
5. broadcast/revision 반영
6. 최신 state의 `setupPlacement` 확인
7. `setupPlacement.settlementVertexId` 기준 `chooseBotInitialRoad` 후보 선택
8. `placeInitialRoad` 실행
9. 기존 command handler가 setup2 초기 자원 지급 및 `setupPlacement` clear
```

### fallback

- 정착지 command 실패 시 excluded set에 넣고 최대 1회 재계산한다.
- 도로 command 실패 시 excluded set에 넣고 최대 1회 재계산한다.
- fallback도 실패하면 직접 상태 수정 없이 중단한다.
- 도로 배치가 실패해 `setupPlacement`가 남는 경우에도 runner는 상태를 임의로 고치지 않는다. 서버 로그에는 실패한 vertex/edge와 이유가 남도록 `console.warn`을 사용한다. 이 상태는 수동 진단이 가능하지만, 자동 복구나 강제 clear는 bot-03 범위에서 하지 않았다.

### public state 보호

`setupPlacement`는 internal game state에는 존재하지만 public view에서는 제거된다.

금지 노출 항목:

```text
setupPlacement
후보 목록
평가 점수
runner local state
timer/runId
```

## 검증 결과

bot-09 안정화 단계에서 bot-03 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\bot-09-stabilization-regression-test.js
```

bot-03 관련 확인:

```text
사람 1 + 봇 2/3 게임에서 setup1/setup2 자동 진행
봇 setup 이후 play phase 진입
게임 player의 isBot/botDifficulty 유지
setupPlacement public state 미노출
정착지/도로 command는 shared command 검증 경로 사용
사람 전용 3인 온라인 초기 배치 회귀 smoke 통과
```

구체적인 bot-09 확인 근거:

- `finishHumanSetupTurns(host)`는 사람이 seat 0의 setup1/setup2만 직접 배치하고, 봇 seat의 setup은 runner가 처리하도록 기다린다.
- `waitFor(..., "play phase after bot setup")`가 setup1/setup2 전체 완료와 play phase 진입을 확인한다.
- `game.phase !== "play"`이면 `bot setup did not advance to play`로 실패 처리한다.
- `game.pendingActionView`가 남아 있으면 `setup left pendingActionView`로 실패 처리한다.
- `game.players.filter((player) => player.isBot).length`로 game player의 봇 identity 유지도 함께 확인한다.
- `assertNoPublicLeak(host.state, "play state after setup")`가 `setupPlacement` public leak을 검사한다.

직접 검증되지 않은 항목:

- 봇 setup2 settlement 인접 자원이 실제로 증가했는지에 대한 전용 assertion은 아직 없다. play phase 진입은 setup2 road 완료와 `grantInitialResourcesForSettlement` 경로를 간접적으로 통과했다는 근거지만, 자원 지급 수량 자체는 후속 테스트 보강 대상이다.
- 같은 고정 board에서 `chooseBotInitialSettlement`/`chooseBotInitialRoad` 결과가 항상 같은지 확인하는 helper 단위 테스트는 아직 없다. 현재 deterministic 근거는 sort tie-break와 고정 입력에서의 순수 함수 구조다.

브라우저 smoke:

```text
URL: http://127.0.0.1:4173/
Browser: Codex in-app browser
Viewport observed: 1280x720
Screenshot: docs/tests/artifacts/2026-05-26_bot-09-browser-game-start.png
Console error count: 0
```

## 비공개 정보 점검

bot-09 public state smoke에서 다음 항목이 노출되지 않음을 확인했다.

```text
setupPlacement
botRunner
timerId
runId
turnActionState
candidate
evaluation
```

## 남은 위험

- 봇 초기 배치의 전략 품질은 기본 heuristic 수준이다.
- setup2 초기 자원 지급은 통합 setup 완료로 간접 확인했으며, 봇별 자원 증가를 직접 assert하는 테스트는 아직 없다.
- deterministic 선택 재현성은 tie-break 설계로 보장하려 했지만, helper 단위 반복 테스트는 아직 없다.
- 도로 배치 실패로 `setupPlacement`가 남는 비정상 상태는 서버 로그로 진단해야 하며, 강제 clear나 자동 복구는 하지 않는다.
- 실제 좁은 모바일 viewport에서 초기 배치 진행 중 보드 표시 시각 검증은 bot-09에서 자동화 제한으로 미수행이다.
- 장시간/다중 게임 반복 setup soak test는 제외 범위라 수행하지 않았다.

## 최종 판정

완료.

bot-03의 핵심 계약인 “setup1/setup2에서 봇 actor가 합법 정착지와 방금 놓은 정착지에 연결된 도로를 기존 command 검증 경로로 자동 배치하고, `setupPlacement`를 public state에 노출하지 않는다”는 구현 및 통합 회귀 검증을 통과했다.

## 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- `getLegalInitialSettlementVertices -> placeInitialSettlement validation -> setupPlacement -> placeInitialRoad validation` 흐름을 정착지/도로 합법성 보장 경로와 최신 state 재읽기 sequence로 보강했다.
- `chooseBotInitialRoad`의 `botSeatIndex` 인자가 현재 점수 계산에는 직접 쓰이지 않지만 향후 확장과 helper signature 일관성을 위해 유지된다는 점을 명시했다.
- bot-09의 `finishHumanSetupTurns()`와 `testLobbyAndSetup()`에서 확인한 play phase 진입, pending 잔류 없음, bot identity 유지, `setupPlacement` leak 없음 근거를 검증 섹션에 연결했다.
- setup2 초기 자원 지급 직접 assertion과 deterministic helper 단위 테스트가 아직 부족하다는 점을 남은 위험에 명시했다.
- 도로 실패로 `setupPlacement`가 남는 경우 직접 상태 수정 없이 중단하고 로그로 진단해야 한다는 운영상 한계를 명시했다.
