# Bot 06 개발 카드 사용 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/implementation_plans/2026-05-26_bot-04-basic-actions-plan.md
docs/implementation_plans/2026-05-26_bot-05-robber-seven-pending-plan.md
docs/implementation_plans/2026-05-26_bot-06-dev-cards-plan.md
catan_bot_development_process_guideline.md
catan_playbot_reference_guideline.md
```

## 목표

봇이 개발 카드를 사기만 하고 방치하지 않도록, 1차 범위에서 안전하게 사용할 수 있는 개발 카드 자동 사용 흐름을 만든다.

bot-06 자동 사용 대상:

```text
knight
yearPlenty
```

bot-06 자동 사용 제외:

```text
victory
monopoly
roadBuilding
```

victory는 playDevCard 대상이 아니라 점수/승리 조건에만 반영한다.

## 변경 파일

```text
server.js
```

UI 변경은 bot-06 범위에서 추가하지 않았다. 개발 카드 사용 결과와 pending 흐름은 기존 state broadcast와 modal/view 정책을 따른다.

## 구현 요약

### 개발 카드 선택 helper

추가 helper:

```text
chooseBotDevCardToPlay
chooseBotYearOfPlentyResources
executeBotDevCard
```

bot-04 일반 턴 흐름에서 개발 카드 사용 판단을 추가했다. 개발 카드 사용은 `majorActionsUsed`에 포함하지 않고, 서버 규칙인 `game.usedDevThisTurn`과 turn-local `attemptedDevCards`로 제한한다.

### 사용 전 공통 조건

개발 카드 사용 판단은 다음 조건을 모두 만족할 때만 수행한다.

```text
game.phase === "play"
active player가 봇
winner 없음
blocking 상태 없음
game.usedDevThisTurn === false
카드가 실제로 봇 손에 있음
이번 턴에 구매한 카드가 아님
카드 type이 1차 허용 범위(knight/yearPlenty)
```

blocking 상태:

```text
room.pendingPlayerTrade 존재
game.pendingAction 존재
game.pendingDiscards 미완료 존재
game.pendingRobberVictims 존재
game.pendingFreeRoads > 0
winner 존재
```

### 구매 턴 사용 금지

구매 턴 카드는 사용하지 않는다.

기준:

```text
card.boughtRound === game.round
card.boughtTurnSeat === game.active
```

구형 `boughtTurn` 단독 기준에 의존하지 않는다.

### victory 처리

victory 카드는 절대 `playDevCard` command를 보내지 않는다.

정책:

```text
victory는 점수/승리 조건에서만 반영
상대 view/log에 숨은 victory card type 미노출
winner summary에서는 victoryDevCount만 공개
```

### yearPlenty 처리

`chooseBotYearOfPlentyResources(matchState, seatIndex)`가 길이 2의 resource 배열을 만든다.

payload 계약:

```text
resources.length === 2
각 항목은 resourceTypes 중 하나
같은 자원 2개 선택 허용
같은 자원 2개면 은행에 해당 자원 2장 이상 필요
서로 다른 자원이면 각각 은행에 1장 이상 필요
선택 결과가 즉시 목표 행동을 가능하게 해야 함
```

목표 우선순위:

```text
1. 도시 목표 부족분
2. 정착지 목표 부족분
3. 도로 목표 부족분
4. 개발 카드 구매 부족분
5. 그래도 없으면 은행 재고가 있는 field/mountain 우선 fallback
```

주의:

```text
1~4번은 선택 결과가 즉시 목표 행동을 가능하게 하는 경로다.
5번 fallback은 즉시 목표 행동을 보장하지 않는 보수적 기본 자원 보강 경로다.
계획의 "즉시 목표 행동 가능" 조건을 더 엄격히 적용하려면 fallback 사용을 끄거나 별도 옵션으로 분리하는 후속 보강이 필요하다.
```

yearPlenty 사용 후에는 직접 건설/구매 command를 이어 붙이지 않는다. 최신 state를 다시 읽고 bot-04 일반 행동 루프가 다음 행동을 판단한다.

### knight 처리

knight 사용 조건:

```text
현재 robberTile과 다른 합법 tile 존재
bot-05 기준으로 강도 이동 이득이 있음
또는 knight 사용 후 largestArmy 경쟁 이득이 명확함
```

knight 사용 흐름:

```text
1. playDevCard(knight)
2. 서버가 moveRobber pending 생성
3. bot-05 pending runner가 moveRobber/chooseRobberVictim 처리
```

knight 사용 후 moveRobber/chooseRobberVictim을 같은 오래된 state로 직접 호출하지 않는다. pending이 생기면 bot-04 일반 행동 루프는 즉시 멈춘다.

knight no-benefit 보류 정책:

```text
botHasRobberMoveBenefit(matchState, seatIndex)
botCanGainLargestArmy(matchState, seatIndex)
```

위 두 조건 중 하나가 참일 때만 knight를 선택한다. no-benefit 상황에서 knight를 실제로 아끼는지에 대한 전용 봇 fixture는 아직 없다.

### 자동 선택 제외 카드

서버가 지원하더라도 봇 선택기에서는 다음을 제외한다.

```text
monopoly
roadBuilding
victory play command
```

`online-11` 기존 회귀 테스트에서 서버 자체의 monopoly/roadBuilding 처리 정책은 검증하지만, bot-06 자동 선택 대상에는 넣지 않는다.

### 시도/실패 관리

`turnActionState.attemptedDevCards`를 사용한다.

signature:

```text
cardId + card.type + payload
```

현재 signature는 `JSON.stringify(payload)` 기반이다. 현재 payload 생성 위치에서는 key 순서가 안정적이지만, 향후 payload 생성 경로가 늘어나면 같은 의미의 payload가 다른 문자열이 될 수 있다. canonical payload 직렬화 helper는 후속 안정화 항목으로 남긴다.

정책:

```text
같은 턴에서 같은 카드/같은 payload validation 실패 반복 금지
성공한 개발 카드는 서버가 손패에서 제거하므로 같은 cardId 재참조 없음
성공 후 card list, usedDevThisTurn, pendingAction은 최신 state 기준으로 판단
```

다음 실패는 최신 state를 다시 읽고 해당 턴의 개발 카드 판단을 종료한다.

```text
DEV_CARD_BOUGHT_THIS_TURN
DEV_CARD_ALREADY_USED
INVALID_ACTION
BANK_RESOURCE_EMPTY
```

## command 실행 경로

봇 개발 카드 사용은 `runBotCommand`를 통해 기존 `playDevCard` handler로 실행된다.

따라서 다음 검증은 사람 command와 같은 경로를 통과한다.

```text
카드 소유 여부
usedDevThisTurn
구매 턴 사용 금지
victory play 금지
yearPlenty 은행 재고
knight robber flow 생성
pending/blocking 상태
winner update
private dev card view
```

## 제외 범위 준수

bot-06에서는 다음을 구현하지 않았다.

```text
monopoly 자동 사용
roadBuilding 자동 사용
victory playDevCard command
구매한 카드 즉시 사용
고급 기사 타이밍
상대 개발 카드 추론
상대 손패 정밀 추정
고급 독점 자원 추정
최장 교역로 목적의 roadBuilding 전략
MCTS/RL
UI/로그 고도화
```

## 안정성 설계 반영

### blocking 존중

pendingPlayerTrade, pendingAction, pendingFreeRoads 등 blocking 상태에서는 개발 카드를 사용하지 않는다.

### pending 연결

knight 사용으로 pending이 생기면 bot-05 pending runner가 처리한다. bot-06은 pending command를 직접 이어 붙이지 않는다.

### 직접 상태 수정 금지

봇은 dev/resources/bank/pending을 직접 수정하지 않는다. 모든 변경은 `playDevCard` command 검증 경로로 수행된다.

### 비공개 정보 보호

봇 선택기는 다음 정보를 사용하지 않는다.

```text
상대 숨은 개발 카드 종류
상대 정확한 손패 자원 종류
devDeck 맨 위 카드 타입
서버 내부 random 결과
```

public/log에 숨은 개발 카드 type이 노출되지 않도록 기존 player view 정책을 유지한다.

## 검증 결과

bot-09 안정화 단계에서 bot-06 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\online-11-development-cards-ws-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
```

기존 WebSocket 회귀에서 확인:

```text
victory card cannot be played: DEV_CARD_NOT_PLAYABLE
구매 턴 play rejected: DEV_CARD_BOUGHT_THIS_TURN
one dev card per turn: DEV_CARD_ALREADY_USED
yearPlenty grants resources
knight increments knights and creates robber flow
largestArmy update
winner summary victoryDevCount 공개 정책
opponent에게 private dev detail 미노출
roadBuilding/monopoly 서버 기존 기능 회귀 없음
```

bot-09 통합 테스트에서 확인:

```text
봇 dev card decision smoke 통과
human viewer가 bot hidden dev card detail을 보지 않음
public state에 internal dev decision/attemptedDevCards 미노출
서버 fatal-looking stderr 없음
```

구체적인 bot-09 확인 근거:

- `testPendingAndDevCards()`에서 봇 seat 1에 `["yearPlenty", "victory", "knight"]`를 주입했다.
- `testSetDevDeck`으로 `["victory", "knight", "yearPlenty"]`를 고정했다.
- 봇 턴으로 전환한 뒤 `devCount < 3 || usedDevThisTurn` 조건을 기다려 봇 개발 카드 판단이 진행되는지 smoke 확인했다.
- human viewer 관점에서 `botView.dev`가 노출되지 않는지 확인했다.
- `assertNoPublicLeak(host.state, "state after bot dev cards")`로 `attemptedDevCards` 등 내부 상태 미노출을 확인했다.

직접 검증되지 않은 항목:

- 봇이 yearPlenty로 선택한 두 자원이 실제 목표 행동을 가능하게 했는지, 이후 bot-04가 그 최신 state로 행동했는지는 전용 assertion이 아직 없다.
- 은행 재고 부족 또는 목표 달성 불가 상황에서 봇이 yearPlenty를 사용하지 않는지 직접 확인하는 fixture는 아직 없다.
- 봇 손에 `victory`/`monopoly`/`roadBuilding`만 있을 때 `playDevCard`가 호출되지 않는지 command spy 또는 상태 변화 기반으로 직접 확인하는 테스트는 아직 없다.
- knight 사용 후 bot-04 일반 행동 루프가 멈추고 bot-05 pending runner가 처리하는 흐름은 기존 online-12/online-11 사람 command 회귀와 bot-09 smoke로 간접 확인했으며, 봇 command count 기반 직접 검증은 아직 없다.

## 비공개 정보 점검

노출 금지 항목:

```text
상대 숨은 개발 카드 type
봇 손의 숨은 개발 카드 type을 non-owner에게 노출
attemptedDevCards
dev card 평가 점수
후보 목록
상대 손패 추론 정보
```

결과: `online-11`과 bot-09 public state smoke에서 노출 없음.

## 남은 위험

- knight/yearPlenty 사용 타이밍은 기본 heuristic 수준이다.
- yearPlenty fallback은 즉시 목표 행동 가능 조건보다 느슨한 기본 자원 보강 경로다. 정책을 더 엄격히 하려면 fallback을 끄는 후속 수정이 필요하다.
- 봇 yearPlenty 사용 후 목표 행동 실행, 목표 달성 불가 시 미사용, victory/monopoly/roadBuilding 자동 미선택에 대한 직접 봇 fixture는 아직 없다.
- `botDevCardSignature`는 현재 `JSON.stringify(payload)` 기반이므로, 향후 payload 생성 경로가 늘어나면 canonical 직렬화 보강을 검토해야 한다.
- knight no-benefit 상황에서 카드를 아끼는지 직접 검증하는 봇 fixture는 아직 없다.
- monopoly/roadBuilding은 서버 지원이 있어도 봇 자동 선택 대상에서 제외되어 있으며, 후속 단계가 필요하다.
- 실제 브라우저에서 모든 개발 카드 조합을 시각적으로 반복 검증하지는 않았다.

## 최종 판정

완료.

bot-06의 핵심 계약인 “봇이 victory는 play하지 않고, boughtRound/boughtTurnSeat와 usedDevThisTurn/blocking 규칙을 지키며, yearPlenty/knight만 기존 playDevCard 검증 경로로 안전하게 사용한다”는 구현 및 통합 회귀 검증을 통과했다.

## 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- yearPlenty의 1~4순위는 즉시 목표 행동 가능 경로이고, 5순위 fallback은 더 느슨한 기본 자원 보강 경로임을 명시했다.
- knight 사용 조건을 `botHasRobberMoveBenefit`/`botCanGainLargestArmy` 기준으로 구체화하고, no-benefit 보류 직접 테스트는 아직 없다고 남겼다.
- `botDevCardSignature`가 `JSON.stringify(payload)` 기반이며 canonical payload 직렬화는 후속 안정화 항목이라고 명시했다.
- bot-09의 `testPendingAndDevCards()`가 제공하는 봇 dev card decision smoke 근거를 구체적으로 연결했다.
- yearPlenty 후 목표 행동, 목표 달성 불가 시 미사용, victory/monopoly/roadBuilding 자동 미선택, knight pending command count 검증은 아직 직접 fixture가 없다는 점을 남은 위험에 반영했다.
