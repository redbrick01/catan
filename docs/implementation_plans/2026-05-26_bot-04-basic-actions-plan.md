# 봇 04 일반 턴 기본 행동 계획

작성일: 2026-05-26

## 목적

봇이 play phase에서 주사위를 굴린 뒤 기본적인 건설/구매/교역 행동을 하고 턴을 종료하게 한다. 목표는 강한 전략이 아니라 게임을 그럴듯하게 굴리는 기본 행동이다.

## 2차 꼼꼼 피드백 요약

```text
1. 일반 행동 루프가 pendingPlayerTrade, pendingFreeRoads, 강도 pending과 같은 blocking 상태를 모두 같은 방식으로 멈춰야 한다.
2. bankTrade가 목표 선택보다 앞서 독립 행동처럼 실행되면 루프가 길어지거나 불필요한 자원 교환이 생길 수 있다.
3. 도로 후보 탐색은 전체 최장 교역로 계산이 아니라 "다음 정착지 후보로 1칸 가까워지는 후보" 수준으로 제한해야 한다.
4. 개발 카드 구매는 victory point 카드 가능성 때문에 updateWinner를 통과하지만, 봇이 카드 종류를 미리 아는 판단을 하면 안 된다.
5. command 성공/실패 판정이 WebSocket 응답 중심으로 남아 있으면 서버 내부 봇 실행에서 재사용하기 어렵다.
6. action counter와 실패 기록은 room 전체 영구 상태가 아니라 active seat의 현재 턴 예약 상태로 한정해야 한다.
7. 자동 테스트는 "행동함"뿐 아니라 "하지 않아야 할 행동을 하지 않음"을 더 많이 검증해야 한다.
```

## 범위

포함:

```text
도시 건설 선택
정착지 건설 선택
도로 건설 선택
개발 카드 구매 선택
은행/항구 교역 1회
한 턴 행동 수 제한
턴 종료 fallback
```

제외:

```text
봇의 플레이어 거래 제안
복잡한 최장 교역로 계획
개발 카드 사용 세부 처리
7/강도 처리
구매한 개발 카드의 즉시 사용
```

## 기본 우선순위

```text
1. 즉시 승리 가능한 행동
2. 도시 건설
3. 정착지 건설
4. 정착지 후보로 향하는 도로 건설
5. 개발 카드 구매
6. 은행/항구 교역으로 위 행동 달성
7. 턴 종료
```

한 턴 권장 제한:

```text
주요 행동 최대 2개
목표 달성을 위한 은행/항구 교역 최대 1회
각 goal type별 실패 재시도 최대 1회
판단 실패 시 즉시 턴 종료
```

주요 행동 정의:

```text
buildCity
buildSettlement
buildRoad
buyDevCard
```

bankTrade는 주요 행동을 가능하게 만드는 보조 행동으로만 1회 허용한다.

blocking 상태 정의:

```text
pendingPlayerTrade가 있다.
game.pendingAction이 있다.
game.pendingDiscards 중 미완료 항목이 있다.
game.pendingRobberVictims가 남아 있다.
game.pendingFreeRoads > 0이다.
winner가 이미 있다.
```

위 상태에서는 bot-04 일반 행동 루프가 새 건설/구매/교역/endTurn을 시도하지 않는다. 단, rollDice 직후 7이 나와 blocking 상태가 생긴 경우도 같은 규칙으로 멈춘다.

한 턴 실행 사이클:

```text
1. rollDice가 필요하면 rollDice
2. blocking 상태가 생기면 즉시 중단
3. 목표를 하나 선택
4. 필요하면 bankTrade 1회
5. 선택한 목표 행동을 실행
6. 주요 행동 카운터가 남아 있으면 목표를 다시 계산
7. 더 할 행동이 없거나 제한에 도달하면 endTurn
```

각 command 이후에는 최신 matchState를 다시 읽고 목표를 재계산한다. command 실행 전 계산한 후보를 다음 command에 그대로 재사용하지 않는다.

실행 상태는 다음처럼 현재 턴에만 유효하다.

```text
botRunner.turnActionState = {
  seatIndex,
  round,
  turnStartedRevision,
  majorActionsUsed,
  bankTradesUsed,
  attemptedGoals,
  attemptedCommands
}
```

`seatIndex`, `round`, `game.active`, `game.rolled`가 바뀌면 이 상태를 폐기한다. 방 전체 영구 데이터나 공개 matchState에 넣지 않는다.

## 행동 선택 기준

### 도시

```text
생산 기대값이 높은 정착지
6/8이 붙은 정착지
부족 자원을 생산하는 정착지
강도가 막고 있는 타일만 붙은 정착지는 감점
```

### 정착지

```text
초기 배치와 같은 정착지 평가 함수를 재사용
현재 도로와 연결된 합법 위치만 선택
항구와 자원 조합이 좋으면 가산점
```

### 도로

```text
좋은 정착지 후보에 가까워지는 edge 선택
내 기존 도로/정착지와 연결된 합법 도로만 선택
상대 건물로 막힌 방향 감점
```

도로 후보 탐색 제한:

```text
합법 도로 후보 전체를 만든다.
각 후보 edge의 양 끝 vertex에서 아직 비어 있고 거리 규칙을 만족할 가능성이 있는 정착지 후보까지의 최단 edge 거리만 본다.
최장 교역로 전체 재계산을 목표 점수로 사용하지 않는다.
탐색 깊이는 기본 2 edge 이내로 제한한다.
동점이면 더 높은 정착지 평가 점수, 그다음 낮은 edgeId를 선택한다.
```

### 개발 카드

```text
도시/정착지/도로를 당장 못 할 때 후보
양/밀/광석이 남는 상황에서 선호
기사 보너스 경쟁 가능성이 있으면 가산점
```

이 단계에서는 개발 카드 구매만 다룬다.

```text
구매한 개발 카드는 같은 턴에 사용하지 않는다.
개발 카드 사용 판단은 bot-06에서 처리한다.
dev deck 또는 은행 상태가 비어 있으면 구매 후보에서 제외한다.
```

정확히는 개발 카드 구매 후보는 다음을 모두 만족해야 한다.

```text
devDeck이 비어 있지 않다.
봇이 개발 카드 비용을 지불할 수 있다.
이번 턴에 구매한 카드를 즉시 사용할 계획이 아니다.
pending action이 없다.
pendingPlayerTrade가 없다.
```

개발 카드 구매 판단은 더미 맨 위 카드 타입을 보지 않는다. 구매 후 서버는 기존 `buyDevCard` 처리처럼 카드를 지급하고 `updateWinner`를 호출할 수 있지만, 봇의 사전 판단은 "devDeckCount > 0"과 비용만 사용한다.

## 교역

봇은 1차 범위에서 은행/항구 교역만 능동적으로 사용한다.

```text
목표 행동을 하나 정한다.
부족 자원을 계산한다.
보유 자원 중 교역 비율을 만족하는 자원을 찾는다.
교역 후 목표 행동이 가능하면 bankTrade 실행을 고려한다.
```

교역 제한:

```text
bankTrade는 선택한 목표를 즉시 가능하게 할 때만 실행한다.
bankTrade 후에는 반드시 같은 목표를 다시 검증하고 실행한다.
bankTrade 후 목표가 불가능해졌으면 추가 교역 없이 다른 행동 또는 endTurn으로 넘어간다.
사람 플레이어와의 거래 제안은 이 단계에서 하지 않는다.
```

교역 비율은 기존 항구 계산 함수를 사용한다.

```text
기본 4:1
generic harbor 3:1
resource harbor 2:1
```

은행/자원 재고 조건:

```text
은행에 받을 자원이 1장 이상 있어야 한다.
봇이 내줄 자원을 trade ratio 이상 보유해야 한다.
교역 후 선택한 목표 비용을 지불할 수 있어야 한다.
은행 재고 부족으로 목표 행동이 실패할 상황이면 교역하지 않는다.
```

교역 후보 선택 계약:

```text
1. 목표 행동의 부족 자원이 정확히 1장일 때만 1차 구현에서 bankTrade를 고려한다.
2. 받을 자원은 그 부족 자원 1개로 고정한다.
3. 내줄 자원은 목표 비용에 쓰이지 않는 초과 자원 중 가장 좋은 비율을 가진 자원으로 고른다.
4. 같은 비율이면 보유량이 가장 많은 자원, 그다음 고정 resourceTypes 순서로 고른다.
5. 교역 후 같은 목표가 즉시 가능하지 않으면 bankTrade 후보를 버린다.
```

부족 자원이 2장 이상인 목표는 이 단계에서 여러 번 교역으로 맞추지 않는다. 이 제약은 기본 봇이 길게 고민하다 턴을 지연시키는 상황을 막기 위한 1차 정책이다.

## 구현 순서

```text
1. canAfford/costDistance helper 정리
2. chooseBotBuildCity 추가
3. chooseBotBuildSettlement 추가
4. chooseBotBuildRoad 추가
5. chooseBotBuyDevCard 추가
6. chooseBotBankTradeForGoal 추가
7. attemptedGoals/attemptedCommands로 같은 턴 반복 실패 방지
8. executeBotMainTurn에서 실행 사이클 적용
9. command마다 최신 matchState 재조회
10. 행동 횟수 제한과 endTurn fallback 적용
11. 개발 카드 구매와 개발 카드 사용 경계 확인
12. blocking 상태 공통 helper를 봇 판단에도 재사용
13. 내부 command 결과 객체를 기준으로 성공/실패/pending 전환을 판정
```

## 수정 대상 파일

```text
server.js
- 비용/목표 거리 helper
- 봇 일반 턴 행동 선택 함수
- 은행/항구 교역 목표 계산
- runner의 play phase 처리 확장
- 내부 command 결과를 반환하는 shared command adapter

scripts/
- 봇 일반 행동 WebSocket 테스트
```

## 목표 선택 모델

봇은 매 턴 하나의 우선 목표를 계산한다.

```text
goal = city | settlement | road | devCard | none
```

목표 후보 생성 전 공통 필터:

```text
현재 phase가 play여야 한다.
현재 active player가 봇이어야 한다.
blocking 상태가 없어야 한다.
rolled 상태가 true여야 한다.
winner가 없어야 한다.
```

목표별 필요한 자원:

```text
city: field 2, mountain 3
settlement: forest 1, hill 1, pasture 1, field 1
road: forest 1, hill 1
devCard: pasture 1, field 1, mountain 1
```

`costDistance`는 부족한 자원 수와 교역 가능성을 함께 고려한다.

`costDistance` 1차 정의:

```text
0: 현재 자원으로 즉시 가능
1: bankTrade 1회로 즉시 가능
2 이상: 부족 자원 수 또는 1회 교역으로 해결 불가
Infinity: 재고/후보/phase/blocking 상태 때문에 불가능
```

목표 우선순위는 기본 우선순위가 먼저이고, 같은 goal type 안에서만 점수와 costDistance로 후보를 정렬한다. 예를 들어 도시가 가능하면 도로 후보 점수가 더 높아도 도시를 우선한다.

건물/카드 재고 필터:

```text
city: 봇 cities > 0, 업그레이드 가능한 내 settlement 존재
settlement: 봇 settlements > 0, 합법 정착지 후보 존재
road: 봇 roads > 0, 합법 도로 후보 존재
devCard: devDeck 남아 있음
```

즉시 승리 가능 행동은 다음으로 제한한다.

```text
도시 건설 후 10점 이상
정착지 건설 후 10점 이상
개발 카드 구매가 아니라 이미 보유한 승점 카드는 점수 계산에만 반영
최장 교역로/최대 기사 보너스 획득은 이 단계에서 적극 목표로 삼지 않음
```

즉시 승리 후보도 기존 command 검증과 `updateWinner` 흐름을 통과해야 한다.

최장 교역로로 인한 우발적 승리는 허용한다. 다만 이 단계의 봇은 최장 교역로 획득을 계산해서 적극적으로 road를 고르지는 않는다.

개발 카드 구매로 승점 카드가 나와 10점에 도달하는 경우는 서버 규칙상 승리로 인정될 수 있다. 하지만 봇은 구매 전 카드 타입을 알 수 없으므로 "즉시 승리 행동" 후보에는 넣지 않는다.

## command 실패 처리

```text
선택한 행동 command가 실패하면 같은 턴에서 같은 행동을 반복하지 않는다.
다음 우선순위 행동을 1회 시도한다.
모든 행동이 실패하면 endTurn을 시도한다.
endTurn도 실패하면 runner를 멈추고 서버 로그에 이유를 남긴다.
```

실패 기록:

```text
attemptedGoals: city/settlement/road/devCard/bankTrade goal 단위 기록
attemptedCommands: command name + target id 조합 기록
같은 턴에서 같은 target command가 두 번 실패하지 않게 한다.
```

command 결과 분류:

```text
success: revision 증가 또는 accepted type 수신
validationFailure: INVALID_ACTION, NOT_ENOUGH_RESOURCES, INVALID_PLACEMENT 등 규칙 실패
blockingState: PENDING/TRADE/ROLL_REQUIRED처럼 현재 루프를 멈춰야 하는 실패
fatal: room 없음, player 없음, runner 내부 예외
```

`validationFailure`는 attemptedCommands에 기록하고 다음 후보로 넘어간다. `blockingState`는 일반 행동 루프를 즉시 중단한다. `fatal`은 runner를 멈추고 서버 로그에 남긴다.

pending 발생 시 처리:

```text
rollDice, build, buyDevCard, bankTrade 이후 pending action이 생기면 즉시 일반 행동 루프를 중단한다.
pending 처리는 bot-05 또는 bot-06 이후 단계에 맡긴다.
pending 상태에서 endTurn을 강제로 호출하지 않는다.
pendingPlayerTrade가 생긴 경우도 같은 방식으로 중단한다.
```

`endTurn` fallback은 다음 조건을 모두 만족할 때만 호출한다.

```text
phase가 play다.
active seat가 여전히 해당 봇이다.
rolled가 true다.
blocking 상태가 없다.
winner가 없다.
이번 루프에서 endTurn을 아직 실패하지 않았다.
```

## 상세 구현 체크리스트

```text
[ ] rolled 상태가 아니면 먼저 rollDice를 실행한다.
[ ] 7/pending이 발생하면 일반 행동으로 넘어가지 않는다.
[ ] 행동 횟수 카운터를 room runner local state에 둔다.
[ ] attemptedGoals/attemptedCommands를 한 턴 local state에 둔다.
[ ] command 성공 후 최신 matchState로 목표를 재계산한다.
[ ] 은행 재고가 부족한 자원은 목표에서 제외하거나 감점한다.
[ ] 봇 보유 건물 수가 0이면 해당 건설을 후보에서 제외한다.
[ ] 도로/정착지 후보가 없으면 해당 목표를 건너뛴다.
[ ] devDeck이 비어 있으면 buyDevCard를 후보에서 제외한다.
[ ] 항구/은행 교역 비율은 기존 trade ratio 함수를 사용한다.
[ ] 같은 target command 실패를 같은 턴에 반복하지 않는다.
[ ] 승리 가능 행동은 updateWinner 검증을 통과해야 한다.
[ ] bankTrade 후 같은 목표가 여전히 가능한지 재검증한다.
[ ] buyDevCard 후 같은 턴 개발 카드 사용은 시도하지 않는다.
[ ] pending 상태에서는 endTurn fallback을 시도하지 않는다.
[ ] pendingPlayerTrade 상태에서는 일반 행동과 endTurn fallback을 모두 멈춘다.
[ ] 도로 후보 탐색은 깊이 2 이내로 제한한다.
[ ] 개발 카드 구매 판단은 실제 카드 타입을 보지 않는다.
[ ] costDistance가 1회 bankTrade 가능성과 불가능을 구분한다.
[ ] command 실패를 validationFailure/blockingState/fatal로 분류한다.
[ ] turnActionState는 턴 변경 시 폐기하고 public state에 노출하지 않는다.
```

## 검증 계획

자동:

```text
도시 자원이 있으면 도시를 건설한다.
정착지 자원이 있고 합법 위치가 있으면 정착지를 건설한다.
도로 자원이 있고 확장 후보가 있으면 도로를 건설한다.
개발 카드 구매 조건이 맞으면 구매한다.
은행 교역 후 건설 가능한 경우 교역을 실행한다.
은행 교역 후 같은 목표 행동을 실행한다.
은행 교역 후 목표가 불가능하면 추가 교역을 반복하지 않는다.
개발 카드를 구매해도 같은 턴 사용하지 않는다.
개발 카드 구매 전 더미 맨 위 카드 타입을 참조하지 않는다.
rollDice 후 7 pending이 생기면 일반 행동과 endTurn을 시도하지 않는다.
pendingPlayerTrade가 있으면 일반 행동과 endTurn을 시도하지 않는다.
devDeck이 비어 있으면 개발 카드를 구매하지 않는다.
건물 재고가 0이면 해당 건설을 시도하지 않는다.
같은 target command가 실패하면 같은 턴에 반복하지 않는다.
validationFailure 후 다음 후보로 넘어가고 blockingState 후 루프를 멈춘다.
행동할 수 없으면 턴 종료한다.
한 턴 행동 제한을 넘지 않는다.
도로 후보 탐색이 깊이 제한을 지킨다.
```

## 위험 요소

```text
교역과 건설을 반복하며 긴 루프가 생길 수 있다.
도로 후보 평가가 비싸면 턴 지연이 길어질 수 있다.
목표 행동 계산이 현재 phase와 맞지 않을 수 있다.
bankTrade 후 오래된 후보를 사용해 잘못된 command를 보낼 수 있다.
pending 상태에서 endTurn fallback을 호출해 오류가 반복될 수 있다.
개발 카드 구매와 사용 단계가 섞여 공식 타이밍을 위반할 수 있다.
devDeck 또는 건물 재고를 확인하지 않아 불가능한 command를 반복할 수 있다.
항구 비율 계산을 중복 구현하다가 기존 규칙과 어긋날 수 있다.
실패한 target을 반복 선택해 한 턴이 길어질 수 있다.
개발 카드 더미의 실제 타입을 참조하면 봇이 숨은 정보를 아는 문제가 생길 수 있다.
blocking 상태를 일부만 확인하면 pendingPlayerTrade 중에도 봇이 행동을 시도할 수 있다.
도로 후보 탐색이 넓어지면 4인 후반부에서 서버 턴 지연이 커질 수 있다.
```

## 롤백/복구 방법

```text
행동 평가가 불안정하면 bot-02 수준의 rollDice/endTurn fallback으로 되돌린다.
은행 교역만 별도 feature flag처럼 끌 수 있게 분리한다.
각 chooseBot* 함수는 독립적으로 제거 가능하게 작성한다.
목표 평가가 불안정하면 우선순위 기반 canAfford 행동만 남기고 costDistance/교역 보정은 끈다.
도로 후보 평가가 느리면 "첫 합법 도로" fallback으로 낮춘다.
command 결과 분류가 불안정하면 validationFailure는 즉시 endTurn 후보로 넘기는 보수 정책을 사용한다.
```

## 테스트 산출물

```text
docs/test_plans/2026-05-26_bot-04-basic-actions-test-plan.md
docs/final_reports/2026-05-26_bot-04-basic-actions-final-report.md
```

## 완료 기준

```text
봇이 일반 턴에서 최소한 하나 이상의 합리적 행동을 시도한다.
행동 불가 상황에서도 턴 종료까지 도달한다.
봇 행동이 기존 규칙 검증을 우회하지 않는다.
한 턴 주요 행동 2회, bankTrade 1회 제한을 지킨다.
pending 발생 시 일반 행동 루프를 안전하게 중단한다.
개발 카드 구매와 사용 책임이 bot-04/bot-06 사이에서 분리된다.
devDeck/건물 재고/은행 재고/교역 비율을 기존 서버 규칙과 일치하게 확인한다.
같은 실패 command를 같은 턴에 반복하지 않는다.
pendingPlayerTrade/freeRoad/pendingAction이 있는 동안 bot-04가 새 일반 행동을 만들지 않는다.
봇 판단이 개발 카드 타입, 훔친 자원 등 숨은 정보를 사용하지 않는다.
도로 탐색과 행동 횟수 제한으로 한 턴 실행 시간이 예측 가능하다.
```
