# 온라인 12 7/강도/pending action 구현 계획

작성일: 2026-05-26

## 목적

온라인 모드에서 주사위 7, 카드 버리기, 강도 이동, 피해자 선택, 무작위 자원 약탈을 서버 권위 방식으로 구현한다.

12단계의 목표는 “강도와 관련된 모든 중간 상태”를 서버 pending action으로 관리해, 여러 브라우저가 같은 진행 상태를 보고 같은 순서로만 행동하게 만드는 것이다.

11단계 개발 카드에서 제한 처리한 기사 카드의 강도 이동/약탈 효과도 12단계에서 완성한다.

## 전제

```text
1~5-2단계가 완료되어 온라인 방 생성/참가/재접속/방 종료 정책이 동작한다.
6단계가 완료되어 초기 배치가 서버 기준으로 끝나고 play phase로 진입한다.
7단계가 완료되어 rollDice/endTurn이 서버 기준으로 동작한다.
8단계가 완료되어 기본 건설이 서버 기준으로 동작한다.
9단계가 완료되어 은행/항구 교환이 서버 기준으로 동작한다.
10단계가 완료되어 플레이어 간 교환 pending state가 동작한다.
11단계가 완료되어 개발 카드와 기사 카드 사용이 서버 기준으로 동작한다.
오프라인 7/강도 로직은 기존 동작을 유지한다.
```

## 범위

포함:

```text
주사위 7 처리
8장 이상 보유 플레이어 계산
discardForSeven command
모든 discard 완료 전 진행 차단
강도 이동 pending state
moveRobber command
피해자 후보 계산
chooseRobberVictim command
피해자 1명 자동 약탈
피해자 여러 명 선택 UI
피해자 없음 처리
서버 무작위 자원 약탈
기사 카드 사용 후 강도 이동/약탈 연결
pending action viewer별 state
재접속 후 pending UI 복구
비공개 자원 정보 보호
WebSocket 자동 테스트
최종 보고서 작성
```

제외:

```text
고급 애니메이션
강도 이동 힌트 고도화
채팅 협상
강도 이동 추천
약탈 자원 공개 로그
배포용 보안/계정/영구 저장
```

## 핵심 정책

```text
주사위 7과 기사 카드는 모두 같은 robber pending 흐름을 사용한다.
주사위 7이 나오면 먼저 discard pending을 해결한다.
discard 대상이 없거나 모든 discard가 완료되면 robber move pending으로 넘어간다.
기사 카드는 discard 없이 바로 robber move pending으로 넘어간다.
기사 카드 사용 시 8장 이상 보유 플레이어의 discard는 절대 발생하지 않는다.
강도는 현재 robberTile이 아닌 타일로만 이동할 수 있다.
강도 이동 후 피해자 후보가 없으면 pending을 종료한다.
피해자 후보가 1명이면 서버가 자동으로 무작위 자원을 훔친다.
피해자 후보가 2명 이상이면 active player에게 피해자 선택 pending을 보낸다.
약탈 자원 종류는 훔친 플레이어와 약탈당한 플레이어에게 모달로 알려준다.
제3자에게는 상세 자원 종류를 노출하지 않는다.
```

## 11단계 피드백 이관 범위

11단계 개발 카드 보고서 피드백 중 12단계에서 처리해야 하는 항목은 아래로 확정한다.

```text
기사 카드의 공식 효과 완성
기사 카드 사용 후 강도 이동 pending 생성
기사 카드 사용 후 피해자 선택 또는 자동 약탈 처리
기사 카드 사용 후 서버 무작위 자원 약탈
기사 카드 사용 후 약탈 결과 모달 표시
기사 카드 source에서는 discardForSeven을 생성하지 않는 검증
기사 카드 pending 해결 전 다른 게임 진행 command 차단
주사위 7과 기사 카드가 같은 moveRobber/chooseRobberVictim/stealRandom helper를 쓰는지 검증
```

12단계로 이관하지 않는 11단계 피드백:

```text
roadBuilding pending deadlock 방지
roadBuilding으로 놓은 도로의 longestRoad 갱신
승점 카드 승리 시 reveal 표시
위 항목은 강도/7/pendingAction과 직접 연결되지 않으므로 별도 11-보강 또는 13단계 안정화 항목으로 처리한다.
단, 12단계에서 공통 pendingAction을 추가할 때 기존 pendingFreeRoads 차단 정책을 깨지 않도록 회귀 테스트는 유지한다.
```

## 서버 데이터 모델

현재 서버에는 다음 구조가 있다.

```text
matchState.robberTile
game.pendingDiscards
game.pendingRobberVictims
game.pendingFreeRoads
```

12단계에서는 pending 흐름을 더 명확히 하기 위해 `game.pendingAction` 도입을 확정한다.

`pendingAction`은 12단계 강도/7 흐름의 단일 기준 상태다.
기존 `pendingDiscards`와 `pendingRobberVictims`는 호환이 필요할 때만 보조 필드로 유지하고, command 검증과 클라이언트 UI 판단은 `pendingAction`을 우선한다.
기존 `pendingFreeRoads/freeRoadOwnerSeat`는 11단계 도로 건설 카드 전용 상태로 유지하며, 12단계에서 공통 `pendingAction`으로 통합하지 않는다.

discard pending:

```json
{
  "pendingAction": {
    "type": "discardForSeven",
    "source": "rollSeven",
    "actorSeatIndex": 0,
    "discardSeatIndexes": [1, 2],
    "createdAt": 1760000000000
  }
}
```

강도 이동 pending:

```json
{
  "pendingAction": {
    "type": "moveRobber",
    "source": "rollSeven",
    "actorSeatIndex": 0,
    "fromTileId": 4,
    "createdAt": 1760000001000
  }
}
```

피해자 선택 pending:

```json
{
  "pendingAction": {
    "type": "chooseRobberVictim",
    "source": "knight",
    "actorSeatIndex": 0,
    "tileId": 9,
    "victimSeatIndexes": [1, 2],
    "createdAt": 1760000002000
  }
}
```

기존 필드와 호환:

```text
pendingAction 없이 기존 필드만 확장하는 구현은 허용하지 않는다.
기존 pendingDiscards/pendingRobberVictims를 유지하더라도 pendingAction과 항상 같은 의미를 가져야 한다.
pendingAction이 있으면 viewer별 state에서 "내가 지금 해야 할 행동"이 명확해야 한다.
pendingFreeRoads가 진행 중일 때는 12단계 pendingAction을 새로 만들지 않는다.
12단계 pendingAction이 진행 중일 때도 pendingFreeRoads를 덮어쓰지 않는다.
```

discard entry 예:

```json
{
  "seatIndex": 1,
  "onlinePlayerId": "p_guest",
  "needed": 4,
  "discarded": false
}
```

## State View 설계

본인 discard 대상:

```json
{
  "pendingActionView": {
    "type": "discardForSeven",
    "role": "discarder",
    "needed": 4
  }
}
```

discard 대상이 아닌 플레이어:

```json
{
  "pendingActionView": {
    "type": "discardForSeven",
    "role": "waiting",
    "remainingCount": 2
  }
}
```

강도 이동 actor:

```json
{
  "pendingActionView": {
    "type": "moveRobber",
    "role": "actor",
    "fromTileId": 4
  }
}
```

피해자 선택 actor:

```json
{
  "pendingActionView": {
    "type": "chooseRobberVictim",
    "role": "actor",
    "tileId": 9,
    "victims": [
      { "seatIndex": 1, "name": "Guest A", "resourceCount": 3 },
      { "seatIndex": 2, "name": "Guest B", "resourceCount": 5 }
    ]
  }
}
```

비공개 원칙:

```text
discard 대상 본인에게만 resources 상세가 보인다.
다른 유저에게는 누가 몇 장 버려야 하는지까지는 공개 가능하다.
어떤 자원을 버렸는지는 공개하지 않는다.
약탈 자원 종류는 훔친 플레이어와 약탈당한 플레이어에게만 표시한다.
제3자에게는 약탈된 자원 종류를 숨긴다.
```

## Command 규격

### discardForSeven

```json
{
  "type": "command",
  "requestId": "r1",
  "roomId": "abc123",
  "playerId": "p_guest",
  "playerToken": "secret",
  "payload": {
    "name": "discardForSeven",
    "resources": {
      "forest": 2,
      "hill": 1,
      "field": 1
    }
  }
}
```

검증:

```text
현재 pendingAction이 discardForSeven이어야 한다.
요청자가 discard 대상이어야 한다.
이미 discard 완료한 플레이어면 거부한다.
resources key가 유효해야 한다.
버릴 총량이 needed와 정확히 같아야 한다.
보유 수량보다 많이 버릴 수 없다.
```

### moveRobber

```json
{
  "type": "command",
  "requestId": "r2",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "moveRobber",
    "tileId": 5
  }
}
```

검증:

```text
현재 pendingAction이 moveRobber이어야 한다.
요청자가 actor여야 한다.
tileId가 유효해야 한다.
tileId가 현재 robberTile과 달라야 한다.
```

### chooseRobberVictim

```json
{
  "type": "command",
  "requestId": "r3",
  "roomId": "abc123",
  "playerId": "p_host",
  "playerToken": "secret",
  "payload": {
    "name": "chooseRobberVictim",
    "victimSeatIndex": 1
  }
}
```

검증:

```text
현재 pendingAction이 chooseRobberVictim이어야 한다.
요청자가 actor여야 한다.
victimSeatIndex가 후보 목록에 있어야 한다.
victim이 resourceCount > 0이어야 한다.
```

## 서버 구현 계획

### 1. rollDice에서 7 처리

현재 7단계에서는 7이 나와도 자원 지급 없음 정도로 처리했을 수 있다. 12단계에서는 아래 흐름으로 바꾼다.

```text
1. rollDice 성공
2. dice.total === 7이면 distributeResourcesForRoll을 호출하지 않는다.
3. resourceCount > 7인 플레이어를 계산한다.
4. 각 플레이어의 needed = floor(resourceCount / 2)
5. discard 대상이 있으면 game.pendingDiscards 생성
6. pendingAction.type = discardForSeven 설정
7. discard 대상이 없으면 pendingAction.type = moveRobber 설정
8. room.revision += 1
9. broadcastState(room)
```

주의:

```text
7이 나온 턴에는 rolled=true 상태여야 한다.
pending 해결 전에는 endTurn이 불가능해야 한다.
```

### 2. discardForSeven 처리

```text
1. discardForSeven 검증을 통과한다.
2. 요청자의 resources에서 선택한 자원을 차감한다.
3. 차감한 자원을 bank에 반납한다.
4. 해당 discard entry를 완료 처리하거나 pendingDiscards에서 제거한다.
5. 아직 남은 discard가 있으면 broadcastState(room)
6. 모두 완료되면 pendingAction을 moveRobber로 전환한다.
7. room.revision += 1
8. broadcastState(room)
```

동시 응답:

```text
여러 discard 대상이 동시에 제출할 수 있다.
서버는 각 플레이어별 완료 여부를 idempotent하게 검증한다.
이미 완료한 플레이어의 중복 제출은 DISCARD_ALREADY_DONE으로 거부한다.
```

### 3. moveRobber 처리

```text
1. moveRobber 검증을 통과한다.
2. matchState.robberTile을 tileId로 변경한다.
3. 해당 타일 인접 vertex의 소유자를 기준으로 피해자 후보를 계산한다.
4. actor 자신은 피해자 후보에서 제외한다.
5. resourceCount === 0인 플레이어는 후보에서 제외한다.
6. 후보가 없으면 lastRobberResult에 victimSeatIndex=null, resource=null, reason="NO_VICTIM"을 기록하고 pendingAction을 종료한다.
7. 후보가 1명이면 서버가 즉시 stealRandom을 수행하고 pendingAction을 종료한다.
8. 후보가 2명 이상이면 pendingAction을 chooseRobberVictim으로 전환한다.
9. room.revision += 1
10. broadcastState(room)
```

강도 생산 차단:

```text
matchState.robberTile로 지정된 타일은 이후 주사위 생산에서 제외되어야 한다.
rollDice의 resource distribution helper는 tile.id === matchState.robberTile인 타일을 건너뛴다.
강도 이동 직후뿐 아니라 이후 턴의 모든 생산에도 같은 규칙이 적용된다.
```

### 4. chooseRobberVictim 처리

```text
1. chooseRobberVictim 검증을 통과한다.
2. victim의 현재 resourceCount를 다시 확인한다.
3. 서버가 victim.resources를 카드 단위 pool로 펼친 뒤 무작위 자원 1장을 선택한다.
4. victim.resources[type] -= 1
5. actor.resources[type] += 1
6. pendingAction 종료
7. lastRobberResult 이벤트 기록
8. room.revision += 1
9. broadcastState(room)
```

무작위 약탈 기준:

```text
자원 타입별 균등 랜덤이 아니라 실제 카드 1장 무작위여야 한다.
예: victim이 forest 5장, mountain 1장을 가지고 있으면 forest가 뽑힐 확률이 mountain보다 높아야 한다.
구현은 victim.resources를 ["forest", "forest", ...] 형태의 카드 pool로 펼친 뒤 1개를 선택한다.
pool이 비어 있으면 VICTIM_HAS_NO_RESOURCES로 거부하거나 NO_VICTIM 결과로 종료한다.
```

### 5. stealRandom 비공개 처리

결과 이벤트:

```json
{
  "lastRobberResult": {
    "id": "rob_abc123",
    "actorSeatIndex": 0,
    "victimSeatIndex": 1,
    "resource": "forest",
    "reason": null,
    "createdAt": 1760000003000
  }
}
```

viewer별 정책:

```text
actor view: resource 표시
victim view: resource 표시
others view: resource null
```

UI 메시지:

```text
actor: Guest A에게서 나무 1장을 가져왔습니다.
victim: Host가 내 나무 1장을 가져갔습니다.
others: Host가 Guest A에게서 자원 1장을 가져갔습니다.
```

피해자 없음 결과:

```json
{
  "lastRobberResult": {
    "id": "rob_abc124",
    "actorSeatIndex": 0,
    "victimSeatIndex": null,
    "resource": null,
    "reason": "NO_VICTIM",
    "createdAt": 1760000003001
  }
}
```

피해자 없음 UI 메시지:

```text
actor: 훔칠 수 있는 상대 자원이 없습니다.
others: 강도가 이동했지만 훔칠 수 있는 자원이 없었습니다.
```

결과 모달 반복 표시 방지:

```text
lastRobberResult는 새로고침/재접속 복구를 위해 state에 남길 수 있다.
클라이언트는 마지막으로 표시한 lastRobberResult.id를 기억하고 같은 id의 모달을 반복 표시하지 않는다.
새로운 약탈 결과가 발생하면 id를 새로 발급한다.
room 종료 또는 새 게임 시작 시 표시 완료 id를 초기화한다.
```

## 기사 카드와 연결

11단계에서 기사 카드 사용 시 강도 이동/약탈을 제한 처리했다면, 12단계에서 다음으로 완성한다.

기사 카드 사용 흐름:

```text
1. playDevCard knight 검증 통과
2. 카드 제거
3. player.knights += 1
4. largestArmy 갱신
5. game.usedDevThisTurn = true
6. pendingAction.type = moveRobber
7. pendingAction.source = knight
8. actorSeatIndex = 현재 active
9. broadcastState(room)
```

주의:

```text
기사 카드는 주사위 전에도 사용할 수 있다.
기사 카드는 주사위 후에도 사용할 수 있다.
기사 카드는 한 턴 개발 카드 1장 제한을 그대로 따른다.
기사 카드는 이번 턴에 구매한 카드라면 사용할 수 없다.
기사 카드는 7이 나온 것이 아니므로 discardForSeven을 생성하지 않는다.
기사 사용 후 강도 pending을 해결하기 전까지 rollDice/endTurn/build/trade/buyDevCard/playDevCard를 막는다.
기사 pending이 끝난 뒤에는 원래 턴 상태로 돌아간다.
주사위 전 기사 카드를 쓴 경우 강도 pending 해결 후 rollDice가 가능해야 한다.
주사위 후 기사 카드를 쓴 경우 강도 pending 해결 후 build/trade/endTurn이 가능해야 한다.
기사 카드로 강도를 이동해도 robberTile은 반드시 현재 위치와 다른 타일이어야 한다.
기사 카드 약탈도 주사위 7 약탈과 동일하게 서버가 무작위로 자원을 고른다.
```

## 다른 command와의 상호작용

pendingAction이 있을 때 막을 command:

```text
rollDice
endTurn
buildRoad
buildSettlement
buildCity
bankTrade
openPlayerTrade
buyDevCard
playDevCard
placeFreeRoad
```

허용할 command:

```text
discardForSeven
moveRobber
chooseRobberVictim
leaveRoom
reconnect
```

예외:

```text
pendingAction.type이 discardForSeven이면 discardForSeven만 허용
pendingAction.type이 moveRobber이면 actor의 moveRobber만 허용
pendingAction.type이 chooseRobberVictim이면 actor의 chooseRobberVictim만 허용
```

pending 중 접속 끊김/나가기 정책:

```text
discard 대상자, robber actor, victim 선택 actor가 disconnect되면 기존 5-2 정책에 따라 reconnect-waiting 상태를 우선 표시한다.
disconnect 중에는 pendingAction을 자동으로 진행하거나 건너뛰지 않는다.
해당 유저가 reconnect하면 같은 pendingActionView를 복구한다.
다른 유저는 "재접속 대기 중" 모달을 보고 추가 game command를 실행할 수 없다.
유저가 leaveRoom을 확정해 방이 종료되면 pendingAction, pendingDiscards, pendingRobberVictims, lastRobberResult 표시 대기 상태도 함께 종료한다.
leaveRoom은 pendingAction 중에도 허용하되, 기존 5-2 정책처럼 방 종료로 이어진다.
```

## 클라이언트 구현 계획

### 1. pending UI 우선순위

```text
room-ended 모달
reconnect-waiting 모달
discardForSeven 모달
moveRobber board action
chooseRobberVictim 모달
player-trade pending 모달
일반 action 모달
```

### 2. discard UI

본인이 discard 대상이면:

```text
버릴 자원 선택 모달 표시
자원별 - / 수량 / + 버튼
needed와 선택 총량 표시
선택 총량이 needed와 같을 때 제출 버튼 활성화
제출 후 대기 상태 표시
```

대상이 아니면:

```text
"다른 플레이어가 카드를 버리는 중입니다" 대기 표시
remainingCount 표시
```

### 3. moveRobber UI

actor이면:

```text
강도 이동 안내 표시
현재 robberTile이 아닌 타일을 클릭 가능 상태로 표시
타일 클릭 또는 드래그 종료 -> moveRobber command
서버 응답 전까지 중복 클릭 방지
```

actor가 아니면:

```text
"강도 이동을 기다리는 중입니다" 표시
```

### 4. chooseRobberVictim UI

actor이면:

```text
피해자 후보 모달 표시
후보 이름과 resourceCount 표시
후보 선택 -> chooseRobberVictim command
```

actor가 아니면:

```text
"약탈 대상 선택을 기다리는 중입니다" 표시
```

### 5. 결과 알림

```text
actor에게 훔친 자원 종류를 모달로 표시
victim에게 빼앗긴 자원 종류를 모달로 표시
others에게는 자원 종류 숨김
피해자가 없거나 훔칠 자원이 없으면 actor/others에게 결과 모달 또는 짧은 알림 표시
lastRobberResult.id 기준으로 같은 결과 모달 반복 표시 방지
discard 완료 후 공개 메시지에는 어떤 자원을 버렸는지 표시하지 않음
```

## 오류 코드

권장:

```text
NO_PENDING_ACTION
INVALID_PENDING_ACTION
DISCARD_NOT_REQUIRED
DISCARD_ALREADY_DONE
INVALID_DISCARD
INVALID_ROBBER_TILE
ROBBER_SAME_TILE
INVALID_ROBBER_VICTIM
VICTIM_HAS_NO_RESOURCES
ROOM_NOT_READY
ROOM_ENDED
INVALID_ACTION
```

## 테스트 계획

### 자동 검증

필수:

```text
node --check server.js
node --check script.js
```

WebSocket 자동 테스트:

```text
game.pendingAction 기준으로 discard/moveRobber/chooseRobberVictim 상태 생성
pendingAction 없이 기존 pendingDiscards/pendingRobberVictims만 남는 상태가 없음
주사위 7에서 8장 이상 플레이어 discard pending 생성
7장 이하 플레이어 discard 대상 제외
needed = floor(resourceCount / 2)
discard 대상만 discardForSeven 가능
needed보다 적거나 많게 버리면 거부
보유량보다 많이 버리면 거부
모든 discard 완료 전 moveRobber 거부
모든 discard 완료 후 moveRobber pending 생성
discard 대상이 없으면 바로 moveRobber pending 생성
현재 robberTile로 moveRobber 거부
유효하지 않은 tileId 거부
피해자 후보 없음이면 pending 종료
피해자 후보 없음이면 lastRobberResult.reason = NO_VICTIM 기록
피해자 1명이면 자동 약탈
피해자 여러 명이면 chooseRobberVictim pending 생성
chooseRobberVictim은 victimSeatIndex를 사용
후보가 아닌 victimSeatIndex 선택 거부
자원 없는 victim 후보 제외
chooseRobberVictim 성공 시 서버 무작위 약탈
무작위 약탈은 자원 타입 균등이 아니라 카드 단위 pool 기준
actor에게 훔친 resource 표시
victim에게 빼앗긴 resource 표시
others에게 resource 상세 미노출
lastRobberResult.id 중복 수신 시 모달 반복 표시 방지
robberTile에 있는 타일은 이후 주사위 생산에서 제외
pending 중 endTurn/build/trade/buyDevCard/playDevCard 거부
기사 카드 사용 후 moveRobber pending 생성
기사 카드 사용 후 discardForSeven이 생성되지 않음
기사 카드 사용 후 강도 pending 해결 전 rollDice/endTurn/build/trade/buyDevCard/playDevCard 거부
주사위 전 기사 카드 사용 -> 강도 pending 해결 -> rollDice 가능
주사위 후 기사 카드 사용 -> 강도 pending 해결 -> build/trade/endTurn 가능
기사 카드로 현재 robberTile 선택 시 거부
기사 카드 피해자 1명 자동 약탈
기사 카드 피해자 여러 명 chooseRobberVictim pending 생성
기사 카드 약탈 결과가 actor/victim에게만 resource 포함으로 전달
기사 카드 약탈 결과가 others에게는 resource null로 전달
기사 카드 사용 후 largestArmy/usedDevThisTurn 기존 11단계 동작 유지
재접속 후 pendingActionView 복구
기사 카드 강도 pending 중 새로고침 후 moveRobber/chooseRobberVictim UI 복구
기존 pendingFreeRoads 중 12단계 pendingAction command가 끼어들지 못함
pendingAction 생성 중 pendingFreeRoads를 덮어쓰지 않음
pending actor disconnect 시 reconnect-waiting 우선 표시
pending actor reconnect 시 같은 pendingActionView 복구
pending 중 leaveRoom 확정 시 방 종료와 함께 pendingAction 종료
ended/left/disconnected 상태 command 거부
```

### 수동 검증

```text
1. 서버를 완전히 재시작한다.
2. 브라우저를 강력 새로고침한다.
3. 새 방을 만들고 3명 이상 입장한다.
4. 게임 시작 후 초기 배치를 완료한다.
5. 테스트 fixture 또는 실제 플레이로 8장 이상 자원 보유 상황을 만든다.
6. 주사위 7을 굴린다.
7. discard 대상자에게만 버리기 모달이 뜨는지 확인한다.
8. 모든 discard 완료 전 턴 종료/건설/교환이 막히는지 확인한다.
9. discard 완료 후 active player에게 강도 이동 UI가 뜨는지 확인한다.
10. 현재 강도 위치로 이동이 거부되는지 확인한다.
11. 새 타일로 이동 후 피해자 후보 UI가 올바른지 확인한다.
12. 피해자 선택 후 actor에게 훔친 자원 종류 모달이 뜨는지 확인한다.
13. victim에게 빼앗긴 자원 종류 모달이 뜨는지 확인한다.
14. others에게는 훔친 자원 종류가 숨겨지는지 확인한다.
15. 기사 카드 사용 후 같은 강도 이동/약탈 흐름이 실행되는지 확인한다.
16. 기사 카드 사용 시 discardForSeven이 뜨지 않는지 확인한다.
17. 주사위 전 기사 카드 사용 후 강도 처리를 끝내면 주사위를 굴릴 수 있는지 확인한다.
18. 주사위 후 기사 카드 사용 후 강도 처리를 끝내면 건설/교환/턴 종료가 가능한지 확인한다.
19. pending 중 새로고침 후 UI가 복구되는지 확인한다.
20. 기존 roadBuilding pending 중 12단계 강도 command가 끼어들지 않는지 회귀 확인한다.
21. 강도 위치 타일의 숫자가 나온 뒤 해당 타일에서 자원이 생산되지 않는지 확인한다.
22. pending actor 브라우저를 닫으면 다른 유저에게 reconnect-waiting이 뜨고, 재접속 후 pending UI가 복구되는지 확인한다.
23. 약탈 결과 모달이 새로고침 후 같은 id로 반복 표시되지 않는지 확인한다.
24. 오프라인 7/강도 기능이 기존처럼 동작하는지 확인한다.
```

## 완료 기준

```text
주사위 7 흐름이 서버 pending action으로 관리된다.
pendingAction이 12단계 강도/7 흐름의 단일 기준 상태로 사용된다.
8장 이상 플레이어만 정확한 수량을 버린다.
모든 discard 완료 전 게임 진행 command가 막힌다.
강도 이동은 서버 command로만 처리된다.
강도는 현재 타일이 아닌 곳으로만 이동한다.
강도 위치 타일은 이후 주사위 생산에서 제외된다.
피해자 후보 계산이 서버 기준으로 처리된다.
약탈은 서버가 카드 단위 pool 기준으로 무작위 처리한다.
약탈 자원 종류는 actor와 victim에게만 보인다.
actor와 victim에게 약탈 결과 모달이 표시된다.
others에게 비공개 자원 정보가 노출되지 않는다.
피해자 없음/자원 없음 상황에서도 pending이 정상 종료되고 결과 알림이 표시된다.
lastRobberResult 모달이 같은 id로 반복 표시되지 않는다.
기사 카드가 강도 이동/약탈 흐름과 연결된다.
기사 카드로는 discardForSeven이 생성되지 않는다.
기사 카드 강도 pending 완료 후 주사위 전/후 턴 상태가 정상 복구된다.
12단계 pendingAction 추가 후에도 기존 pendingFreeRoads 차단 정책이 깨지지 않는다.
pending 중 disconnect/reconnect/leaveRoom 정책이 5-2 단계와 충돌하지 않는다.
pending 중 새로고침/재접속 후 UI가 복구된다.
오프라인 7/강도 기능은 기존처럼 유지된다.
자동 테스트와 수동 테스트 결과가 보고서에 기록된다.
```

## 위험 요소와 대응

```text
여러 discard 대상이 동시에 응답하면 pending 상태가 꼬일 수 있다.
대응: 플레이어별 discard 완료 여부를 서버에서 idempotent하게 관리한다.

강도 이동과 피해자 선택 사이에 상태가 어긋날 수 있다.
대응: pendingAction.type과 actorSeatIndex를 모든 command에서 검증한다.

약탈 랜덤이 자원 타입 균등으로 구현될 수 있다.
대응: victim.resources를 카드 단위 pool로 펼친 뒤 1장을 선택한다.

강도 위치가 생산 차단에 반영되지 않을 수 있다.
대응: distributeResourcesForRoll 계열 helper에서 matchState.robberTile과 같은 tile.id를 제외하고 자동 테스트를 추가한다.

훔친 자원 종류가 공개될 수 있다.
대응: lastRobberResult를 actor/victim/others viewer별로 필터링하고, others에는 resource를 null로 내려준다.

lastRobberResult를 state에 남기면 모달이 반복 표시될 수 있다.
대응: 클라이언트가 lastRobberResult.id 기준으로 이미 표시한 결과를 기억한다.

기사 카드와 7이 같은 강도 흐름을 공유하지 않으면 중복 로직이 생긴다.
대응: source만 다르고 moveRobber/chooseVictim 흐름은 같은 helper를 사용한다.

기사 카드 source에서 실수로 discardForSeven이 생성될 수 있다.
대응: source === "knight"인 pendingAction 생성 경로는 discard 계산을 건너뛰고 moveRobber로 바로 진입하도록 테스트한다.

기사 카드를 주사위 전 사용한 뒤 pending 완료 후에도 rollDice가 막힐 수 있다.
대응: pendingAction 종료 후 game.rolled 값을 변경하지 않고 기존 턴 상태를 유지한다.

12단계 pendingAction 도입이 기존 roadBuilding pendingFreeRoads와 충돌할 수 있다.
대응: pendingFreeRoads > 0이면 12단계 command도 거부하고, 12단계에서는 roadBuilding pending 모델을 임의로 통합하지 않는다.

pendingAction 진행자가 disconnect되면 게임이 멈춘 것처럼 보일 수 있다.
대응: 5-2 재접속 대기 정책을 우선 적용하고, reconnect 후 같은 pendingActionView를 복구한다.

pendingAction 중 leaveRoom이 들어오면 dangling pending이 남을 수 있다.
대응: leaveRoom 확정으로 방이 종료될 때 pendingAction 관련 상태도 함께 정리한다.

pending 중 다른 command가 실행되면 게임 상태가 깨질 수 있다.
대응: 모든 게임 진행 command의 공통 검증에서 pendingAction을 확인한다.
```

## 다음 단계 연결

12단계 완료 후에는 13단계 전체 회귀 테스트 및 안정화로 넘어간다.

```text
12단계: 7/강도/pending action
13단계: 전체 회귀 테스트 및 안정화
```
## 2026-05-26 구현 전 갱신

- 현재 서버는 `distributeResourcesForRoll()`에서 이미 `matchState.robberTile` 타일 생산을 제외한다.
- 12단계에서는 `game.pendingAction`을 온라인 7/강도 흐름의 기준 상태로 추가하고, 기존 `pendingDiscards/pendingRobberVictims`는 호환 보조 필드로만 유지한다.
- 기존 `pendingFreeRoads/freeRoadOwnerSeat`는 11단계 roadBuilding 전용 상태로 유지하며 12단계 `pendingAction`과 통합하지 않는다.
- 새 command는 `discardForSeven`, `moveRobber`, `chooseRobberVictim`만 추가한다.
- 기사 카드 `knight`는 discard 없이 `moveRobber` pending을 만든다. 강도 이동/약탈은 12단계에서 구현하되, 7 discard와 같은 pendingAction helper를 공유한다.
- 클라이언트는 서버 `pendingActionView`를 기준으로 discard 모달, 강도 이동 액션, 피해자 선택 모달, 약탈 결과 모달을 표시한다.
- 자동 테스트는 `scripts/online-12-robber-seven-pending-ws-test.js`를 새로 추가하고, 기존 11단계/10단계 회귀 테스트도 실행한다.
